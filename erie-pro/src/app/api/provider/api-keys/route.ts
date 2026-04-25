// ── API Key Management ────────────────────────────────────────────────
// GET:    List all API keys for authenticated provider
// POST:   Create new key — returns raw key ONCE
// DELETE: Revoke key by ID

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit-log";
import { logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import crypto from "crypto";

/** Hard cap on active API keys per provider. */
const MAX_ACTIVE_API_KEYS = 10;

/** Sentinel thrown inside the create transaction to signal cap exceeded. */
class ApiKeyCapExceeded extends Error {}

/** Resolve the authenticated user's provider ID */
async function getProviderId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { providerId: true },
  });
  return user?.providerId ?? null;
}

// ── GET: List API Keys ─────────────────────────────────────────────
export async function GET() {
  try {
    const providerId = await getProviderId();
    if (!providerId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const keys = await prisma.apiKey.findMany({
      where: { providerId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        label: true,
        keyHash: true,
        permissions: true,
        lastUsedAt: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Return last 4 chars of hash as identifier (never the full hash)
    const sanitized = keys.map((k) => ({
      id: k.id,
      label: k.label,
      last4: k.keyHash.slice(-4),
      permissions: k.permissions,
      lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
      isActive: k.isActive,
      createdAt: k.createdAt.toISOString(),
    }));

    return NextResponse.json({ success: true, keys: sanitized });
  } catch (err) {
    logger.error("api-keys", "Failed to list API keys:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ── POST: Create API Key ───────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Each POST generates cryptographic material, writes to the DB, and
  // triggers an audit-log write. Throttle before doing any of that so a
  // compromised session cannot be used to create keys in a tight loop.
  const limited = await checkRateLimit(req, "api-keys");
  if (limited) return limited;

  try {
    const providerId = await getProviderId();
    if (!providerId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    const label = (body?.label as string)?.trim();
    if (!label || label.length < 1 || label.length > 100) {
      return NextResponse.json(
        { success: false, error: "Label is required (1-100 characters)" },
        { status: 400 }
      );
    }

    // Generate raw key and hash it up front — we want the hash ready
    // to commit inside the atomic transaction window. The raw key is
    // only returned if the transaction actually succeeds.
    const rawKey = `ep_${crypto.randomBytes(32).toString("hex")}`;
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

    // Atomic count-then-create: the prior read-then-check-then-write
    // let a single session with N parallel POSTs all observe
    // `existingCount < 10` before any of them wrote, so the 10-key cap
    // was trivially bypassed (each loser only paid a rate-limit token).
    // Postgres Serializable isolation (SSI) tracks the read predicate
    // on `isActive = true` AND the subsequent insert into that same
    // predicate set — concurrent writers hit a serialization_failure
    // which Prisma surfaces as P2034 and we return as 429. One winner,
    // zero over-provisioning.
    let apiKey: Awaited<ReturnType<typeof prisma.apiKey.create>>;
    try {
      apiKey = await prisma.$transaction(
        async (tx) => {
          const existingCount = await tx.apiKey.count({
            where: { providerId, isActive: true },
          });
          if (existingCount >= MAX_ACTIVE_API_KEYS) {
            throw new ApiKeyCapExceeded();
          }
          return tx.apiKey.create({
            data: {
              keyHash,
              label,
              providerId,
              permissions: ["leads:write"],
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
    } catch (err) {
      if (err instanceof ApiKeyCapExceeded) {
        return NextResponse.json(
          { success: false, error: `Maximum of ${MAX_ACTIVE_API_KEYS} active API keys allowed` },
          { status: 400 }
        );
      }
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2034") {
        // Serialization conflict — another concurrent request was minting
        // a key for this provider. Ask the caller to retry.
        return NextResponse.json(
          { success: false, error: "Concurrent request conflict — retry." },
          { status: 429 }
        );
      }
      throw err;
    }

    // Audit
    audit({
      action: "admin.action",
      entityType: "provider",
      entityId: apiKey.id,
      providerId,
      metadata: { type: "api_key.created", label },
    }).catch(() => {});

    // Return the raw key ONCE — it cannot be retrieved again
    return NextResponse.json({
      success: true,
      key: {
        id: apiKey.id,
        label: apiKey.label,
        rawKey, // Only returned on creation
        last4: keyHash.slice(-4),
        createdAt: apiKey.createdAt.toISOString(),
      },
    });
  } catch (err) {
    logger.error("api-keys", "Failed to create API key:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ── DELETE: Revoke API Key ─────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  // Match POST: throttle revocation to blunt brute-force attempts to
  // churn keys (e.g. cycle through IDs from a leaked listing).
  const limited = await checkRateLimit(req, "api-keys");
  if (limited) return limited;

  try {
    const providerId = await getProviderId();
    if (!providerId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    const keyId = body?.id as string;
    if (!keyId) {
      return NextResponse.json(
        { success: false, error: "Key ID is required" },
        { status: 400 }
      );
    }

    // Verify the key belongs to this provider
    const existing = await prisma.apiKey.findFirst({
      where: { id: keyId, providerId },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "API key not found" },
        { status: 404 }
      );
    }

    await prisma.apiKey.update({
      where: { id: keyId },
      data: { isActive: false },
    });

    audit({
      action: "admin.action",
      entityType: "provider",
      entityId: keyId,
      providerId,
      metadata: { type: "api_key.revoked", label: existing.label },
    }).catch(() => {});

    return NextResponse.json({ success: true, message: "API key revoked" });
  } catch (err) {
    logger.error("api-keys", "Failed to revoke API key:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

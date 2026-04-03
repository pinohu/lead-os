// ── API Key Management ────────────────────────────────────────────────
// GET:    List all API keys for authenticated provider
// POST:   Create new key — returns raw key ONCE
// DELETE: Revoke key by ID

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit-log";
import { logger } from "@/lib/logger";
import crypto from "crypto";

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

    // Limit keys per provider to prevent abuse
    const existingCount = await prisma.apiKey.count({
      where: { providerId, isActive: true },
    });
    if (existingCount >= 10) {
      return NextResponse.json(
        { success: false, error: "Maximum of 10 active API keys allowed" },
        { status: 400 }
      );
    }

    // Generate raw key and hash it
    const rawKey = `ep_${crypto.randomBytes(32).toString("hex")}`;
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

    const apiKey = await prisma.apiKey.create({
      data: {
        keyHash,
        label,
        providerId,
        permissions: ["leads:write"],
      },
    });

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

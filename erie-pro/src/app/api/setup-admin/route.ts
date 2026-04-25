// ── Admin Bootstrap API ─────────────────────────────────────────────
// One-time endpoint to create the first admin user.
// Returns 403 if any admin user already exists.
// Gated by ALLOW_ADMIN_SETUP=true environment variable.

import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit-log";
import { logger } from "@/lib/logger";
import { getClientIp } from "@/lib/client-ip";

/** Thrown inside the bootstrap transaction when an admin already exists. */
class AdminAlreadyExists extends Error {}

const SetupSchema = z.object({
  email: z
    .string()
    .email("Invalid email format")
    .max(255, "Email too long")
    .transform((e) => e.toLowerCase().trim()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long"),
  name: z
    .string()
    .max(200, "Name too long")
    .optional(),
});

const setupAttempts = new Map<string, { count: number; resetAt: number }>();

function checkSetupRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = setupAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    setupAttempts.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  entry.count++;
  return entry.count <= 5;
}

export async function POST(request: Request) {
  try {
    // ── Gate: require explicit opt-in via environment variable ─────────
    if (process.env.ALLOW_ADMIN_SETUP !== "true") {
      return NextResponse.json(
        { error: "Admin setup is disabled. Set ALLOW_ADMIN_SETUP=true to enable." },
        { status: 403 }
      );
    }

    // ── Rate limit: 5 attempts per minute per IP ──────────────────────
    const ip = getClientIp(request);
    if (!checkSetupRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 }
      );
    }

    // ── Parse & validate input FIRST ─────────────────────────────────
    // We want zod to reject garbage bodies before paying the bcrypt /
    // DB cost, but we MUST do the admin-exists check inside the
    // transaction below (not up here) — otherwise two concurrent
    // bootstrap requests each pass the count check, each create a
    // Provider + User, and we end up with two admin accounts.
    const body = await request.json();
    const parsed = SetupSchema.safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.issues
        .map((e) => `${e.path.map(String).join(".")}: ${e.message}`)
        .join("; ");
      return NextResponse.json({ error: messages }, { status: 400 });
    }

    const { email, password, name } = parsed.data;
    const displayName = name || "Admin";

    // ── Hash password (bcrypt, 12 rounds — matches create-admin.ts) ──
    // Computed outside the transaction window so bcrypt's ~200ms cost
    // doesn't hold a SERIALIZABLE snapshot open.
    const passwordHash = await bcrypt.hash(password, 12);
    const adminSlug = `admin-${email.split("@")[0]}`;

    // ── Atomic bootstrap ──────────────────────────────────────────────
    // Wrap the count + Provider.create + User.upsert inside a single
    // Serializable transaction. SSI detects concurrent admin bootstrap
    // attempts by tracking the `role: "admin"` read predicate; only
    // one transaction can commit. The other hits P2034 and we return
    // 429 (retry into the now-closed 403 path).
    let provider: Awaited<ReturnType<typeof prisma.provider.create>>;
    let user: Awaited<ReturnType<typeof prisma.user.upsert>>;
    try {
      const result = await prisma.$transaction(
        async (tx) => {
          const adminCount = await tx.user.count({ where: { role: "admin" } });
          if (adminCount > 0) {
            throw new AdminAlreadyExists();
          }

          const createdProvider = await tx.provider.create({
            data: {
              slug: adminSlug,
              businessName: `${displayName} (Admin)`,
              niche: "admin",
              phone: "0000000000",
              email,
              passwordHash,
            },
          });

          const upsertedUser = await tx.user.upsert({
            where: { email },
            update: {
              role: "admin",
              providerId: createdProvider.id,
              name: displayName,
              emailVerified: new Date(),
            },
            create: {
              email,
              name: displayName,
              role: "admin",
              providerId: createdProvider.id,
              emailVerified: new Date(),
            },
          });

          return { provider: createdProvider, user: upsertedUser };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
      provider = result.provider;
      user = result.user;
    } catch (err) {
      if (err instanceof AdminAlreadyExists) {
        return NextResponse.json(
          { error: "Admin already configured. Setup is disabled." },
          { status: 403 }
        );
      }
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2034") {
        return NextResponse.json(
          { error: "Concurrent bootstrap in progress. Retry." },
          { status: 429 }
        );
      }
      throw err;
    }

    // ── Audit log ────────────────────────────────────────────────────
    await audit({
      action: "admin.action",
      entityType: "provider",
      entityId: provider.id,
      providerId: provider.id,
      metadata: {
        description: "First admin account created via bootstrap setup",
        userId: user.id,
        email,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Admin account created successfully.",
    });
  } catch (err) {
    logger.error("setup-admin", "Admin setup error:", err);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}

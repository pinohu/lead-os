// One-time admin bootstrap endpoint.

import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit-log";
import { logger } from "@/lib/logger";

const ADMIN_SETUP_LOCK_ID = 730017001;
const ADMIN_SETUP_TOKEN_HEADER = "x-admin-setup-token";

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
  token: z
    .string()
    .max(512, "Setup token too long")
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

function digestToken(value: string): Buffer {
  return crypto.createHash("sha256").update(value).digest();
}

function isValidAdminSetupToken(token: string | null | undefined): boolean {
  const expected = process.env.ADMIN_SETUP_TOKEN?.trim();
  const candidate = token?.trim();
  if (!expected || !candidate) return false;

  return crypto.timingSafeEqual(digestToken(candidate), digestToken(expected));
}

export async function POST(request: Request) {
  try {
    if (process.env.ALLOW_ADMIN_SETUP !== "true" || !process.env.ADMIN_SETUP_TOKEN?.trim()) {
      return NextResponse.json(
        { error: "Admin setup is disabled." },
        { status: 403 },
      );
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? request.headers.get("x-real-ip")
      ?? "unknown";
    if (!checkSetupRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const setupToken =
      request.headers.get(ADMIN_SETUP_TOKEN_HEADER) ??
      ("token" in body && typeof body.token === "string" ? body.token : null);
    if (!isValidAdminSetupToken(setupToken)) {
      return NextResponse.json(
        { error: "Invalid setup token." },
        { status: 403 },
      );
    }

    const parsed = SetupSchema.safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.issues
        .map((e) => `${e.path.map(String).join(".")}: ${e.message}`)
        .join("; ");
      return NextResponse.json({ error: messages }, { status: 400 });
    }

    const { email, password, name } = parsed.data;
    const displayName = name || "Admin";
    const passwordHash = await bcrypt.hash(password, 12);
    const adminSlug = `admin-${email.split("@")[0]}`;

    const setupResult = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${ADMIN_SETUP_LOCK_ID})`;

      const adminCount = await tx.user.count({
        where: { role: "admin" },
      });

      if (adminCount > 0) {
        return null;
      }

      const provider = await tx.provider.create({
        data: {
          slug: adminSlug,
          businessName: `${displayName} (Admin)`,
          niche: "admin",
          phone: "0000000000",
          email,
          passwordHash,
        },
      });

      const existingUser = await tx.user.findUnique({ where: { email } });
      const user = existingUser
        ? await tx.user.update({
          where: { email },
          data: {
            role: "admin",
            providerId: provider.id,
            name: displayName,
            emailVerified: new Date(),
          },
        })
        : await tx.user.create({
          data: {
            email,
            name: displayName,
            role: "admin",
            providerId: provider.id,
            emailVerified: new Date(),
          },
        });

      return { provider, user };
    });

    if (!setupResult) {
      return NextResponse.json(
        { error: "Admin already configured. Setup is disabled." },
        { status: 403 },
      );
    }

    await audit({
      action: "admin.action",
      entityType: "provider",
      entityId: setupResult.provider.id,
      providerId: setupResult.provider.id,
      ipAddress: ip,
      metadata: {
        description: "First admin account created via bootstrap setup",
        userId: setupResult.user.id,
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
      { status: 500 },
    );
  }
}

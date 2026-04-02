// ── Reset Password API ────────────────────────────────────────────────
// Validates the reset token (SHA-256 hashed), updates the provider's
// password hash, and deletes the consumed token.

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { MAX_BODY_SIZE } from "@/lib/validation";
import bcrypt from "bcryptjs";

const ResetPasswordSchema = z.object({
  email: z.string().email("Valid email is required").transform((e) => e.toLowerCase().trim()),
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(req: NextRequest) {
  // ── Rate limit: 5 reset attempts per minute per IP ──────────────
  const rateLimited = await checkRateLimit(req, "contact");
  if (rateLimited) return rateLimited;

  // ── Body size check ──────────────────────────────────────────────
  const contentLength = parseInt(req.headers.get("content-length") ?? "0", 10);
  if (contentLength > MAX_BODY_SIZE) {
    return NextResponse.json(
      { success: false, error: "Request body too large" },
      { status: 413 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }

  // ── Zod validation ───────────────────────────────────────────────
  const parsed = ResetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues.map((e) => e.message).join("; ") },
      { status: 400 }
    );
  }

  const { email, token: rawToken, password } = parsed.data;

  try {
    const hashedToken = hashToken(rawToken);

    // Look up valid (non-expired) token
    const record = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        token: hashedToken,
        expires: { gt: new Date() },
      },
    });

    if (!record) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired reset link. Please request a new one.",
        },
        { status: 400 }
      );
    }

    // Find user and provider
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.providerId) {
      return NextResponse.json(
        { success: false, error: "Account not found." },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update provider password
    await prisma.provider.update({
      where: { id: user.providerId },
      data: { passwordHash },
    });

    // Delete used token
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: email,
          token: hashedToken,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("/api/auth/reset-password", "Error:", err);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

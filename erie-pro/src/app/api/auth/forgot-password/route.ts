// ── Forgot Password API ───────────────────────────────────────────────
// Generates a secure reset token, stores a SHA-256 hash in the DB,
// and emails the raw token to the user. Returns 200 regardless of
// whether the email exists (prevents enumeration).

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { cityConfig } from "@/lib/city-config";
import { sendEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { MAX_BODY_SIZE } from "@/lib/validation";
import { hashVerificationToken } from "@/lib/verification-token";

const ForgotPasswordSchema = z.object({
  email: z.string().email("Valid email is required").transform((e) => e.toLowerCase().trim()),
});

export async function POST(req: NextRequest) {
  // Rate limit using the "contact" preset
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
  const parsed = ForgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues.map((e) => e.message).join("; ") },
      { status: 400 }
    );
  }

  const { email } = parsed.data;

  // Always return 200 to prevent email enumeration
  const successResponse = NextResponse.json({ success: true });

  try {
    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.providerId) return successResponse;

    // Find linked provider
    const provider = await prisma.provider.findUnique({
      where: { id: user.providerId },
    });
    if (!provider?.passwordHash) return successResponse;

    // Generate token
    const rawToken = randomUUID();
    const hashedToken = hashVerificationToken(rawToken);
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Delete any existing reset tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    // Store hashed token
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: hashedToken,
        expires,
      },
    });

    // Build reset URL
    const resetUrl = `https://${cityConfig.domain}/reset-password?token=${encodeURIComponent(rawToken)}&email=${encodeURIComponent(email)}`;

    // Send email
    await sendEmail({
      to: email,
      subject: `Reset your password — ${cityConfig.name} Pro`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px">
    <div style="background:#fff;border-radius:8px;border:1px solid #e5e7eb;padding:32px">
      <h2 style="margin:0 0 16px;color:#111827;font-size:20px">Password Reset Request</h2>
      <p style="color:#374151;margin:0 0 16px">We received a request to reset your password. Click the button below to choose a new password.</p>
      <a href="${resetUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600">Reset Password</a>
      <p style="margin:16px 0 0;font-size:13px;color:#9ca3af">This link expires in 1 hour. If you didn&apos;t request this, you can safely ignore this email.</p>
    </div>
    <div style="text-align:center;margin-top:24px;font-size:12px;color:#9ca3af">
      <p style="margin:0">${cityConfig.name} Pro &middot; <a href="https://${cityConfig.domain}" style="color:#9ca3af">${cityConfig.domain}</a></p>
      <p style="margin:4px 0 0">Erie, PA 16501</p>
      <p style="margin:8px 0 0"><a href="mailto:hello@${cityConfig.domain}" style="color:#9ca3af">hello@${cityConfig.domain}</a> &middot; <a href="https://${cityConfig.domain}/privacy" style="color:#9ca3af">Privacy Policy</a></p>
    </div>
  </div>
</body>
</html>`,
      replyTo: `hello@${cityConfig.domain}`,
    });

    return successResponse;
  } catch (err) {
    logger.error("/api/auth/forgot-password", "Error:", err);
    // Still return 200 to prevent enumeration on errors
    return successResponse;
  }
}

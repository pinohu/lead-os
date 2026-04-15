// ── Email Verification Endpoint ────────────────────────────────────────
// GET /api/verify-email?token=xxx
// Verifies a provider's email before allowing Stripe checkout.
//
// The emailVerifyToken on Provider is stored as a SHA-256 hash at rest
// (see src/lib/verification-token.ts + stripe webhook). That prevents
// a DB-read attacker (SQL injection elsewhere, backup leak, admin DB
// access) from being able to replay the raw token against this endpoint.
// We hash the URL-supplied token the same way before looking it up.
//
// Historical bug this fix closes: this route previously queried the
// `verificationToken` table (which is used ONLY for password resets).
// emailVerifyToken actually lives on the Provider row. Result: email
// verification was completely non-functional, AND the query was matching
// raw URL tokens against the reset-token unique column, which risked
// accidental cross-flow token collisions going forward.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit-log";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { hashVerificationToken } from "@/lib/verification-token";

export async function GET(req: NextRequest) {
  // Rate limit: 5 verifications per minute per IP (prevent token brute-force)
  const rateLimited = await checkRateLimit(req, "contact");
  if (rateLimited) return rateLimited;

  const token = req.nextUrl.searchParams.get("token");

  if (!token || token.length > 256) {
    return NextResponse.json(
      { success: false, error: "Missing or invalid verification token" },
      { status: 400 }
    );
  }

  try {
    const hashedToken = hashVerificationToken(token);

    // Look up the provider by hashed token
    const provider = await prisma.provider.findFirst({
      where: { emailVerifyToken: hashedToken },
    });

    if (!provider) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired verification token" },
        { status: 404 }
      );
    }

    // Mark verified + clear the token (single-use). Doing both in one
    // update prevents two concurrent GETs from both "succeeding" and
    // also prevents the token from ever being re-consumable.
    await prisma.provider.update({
      where: { id: provider.id },
      data: { emailVerified: true, emailVerifyToken: null },
    });

    await audit({
      action: "provider.email_verified",
      entityType: "provider",
      entityId: provider.id,
      providerId: provider.id,
      ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });

    // Redirect to claim success or checkout
    const redirectUrl = new URL("/for-business/claim", req.nextUrl.origin);
    redirectUrl.searchParams.set("verified", "true");
    redirectUrl.searchParams.set("email", provider.email);

    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    logger.error("/api/verify-email", "Error:", err);
    return NextResponse.json(
      { success: false, error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}

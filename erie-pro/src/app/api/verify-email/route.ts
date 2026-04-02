// ── Email Verification Endpoint ────────────────────────────────────────
// GET /api/verify-email?token=xxx
// Verifies a provider's email before allowing Stripe checkout.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit-log";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

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
    // Look up the verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired verification token" },
        { status: 404 }
      );
    }

    // Check expiry
    if (verificationToken.expires < new Date()) {
      // Clean up expired token
      await prisma.verificationToken.delete({
        where: { token },
      });
      return NextResponse.json(
        { success: false, error: "Verification token has expired. Please request a new one." },
        { status: 410 }
      );
    }

    // Mark the provider's email as verified
    const provider = await prisma.provider.findFirst({
      where: { email: verificationToken.identifier },
    });

    if (provider) {
      await prisma.provider.update({
        where: { id: provider.id },
        data: { emailVerified: true },
      });

      await audit({
        action: "provider.email_verified",
        entityType: "provider",
        entityId: provider.id,
        providerId: provider.id,
        ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      });
    }

    // Delete the used token
    await prisma.verificationToken.delete({
      where: { token },
    });

    // Redirect to claim success or checkout
    const redirectUrl = new URL("/for-business/claim", req.nextUrl.origin);
    redirectUrl.searchParams.set("verified", "true");
    redirectUrl.searchParams.set("email", verificationToken.identifier);

    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    logger.error("/api/verify-email", "Error:", err);
    return NextResponse.json(
      { success: false, error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}

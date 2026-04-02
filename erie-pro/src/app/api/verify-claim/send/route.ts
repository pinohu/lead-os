// ── Send Claim Verification Code ─────────────────────────────────────
// Sends a 6-digit code to the business email on the claimed listing.
// Called from the dashboard after payment when provider needs to verify.

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { sendClaimVerificationCode, sendAdminVerificationAlert } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user?.providerId) {
      return NextResponse.json({ success: false, error: "No provider linked" }, { status: 403 });
    }

    const provider = await prisma.provider.findUnique({ where: { id: user.providerId } });
    if (!provider) {
      return NextResponse.json({ success: false, error: "Provider not found" }, { status: 404 });
    }

    // Already verified — no need to send code
    if (["verified", "auto_verified", "admin_approved"].includes(provider.verificationStatus)) {
      return NextResponse.json({ success: true, status: "already_verified" });
    }

    // Rejected claims can't re-verify
    if (provider.verificationStatus === "rejected") {
      return NextResponse.json(
        { success: false, error: "This claim has been rejected. Contact support." },
        { status: 403 }
      );
    }

    // Rate limit: max 5 code sends per provider
    if (provider.verificationAttempts >= 10) {
      return NextResponse.json(
        { success: false, error: "Too many verification attempts. Contact support." },
        { status: 429 }
      );
    }

    // Find the claimed listing to get the business email
    if (!provider.claimedListingId) {
      // No listing to verify against — flag for admin review
      await prisma.provider.update({
        where: { id: provider.id },
        data: { verificationStatus: "pending" },
      });
      sendAdminVerificationAlert(
        provider.businessName,
        provider.email,
        provider.niche,
        "No listing linked — cannot send verification code"
      ).catch((err) => logger.error("verify-claim/send", "Admin alert failed", err));
      return NextResponse.json({
        success: true,
        status: "admin_review",
        message: "Your claim has been flagged for manual review. We'll verify within 24 hours.",
      });
    }

    const listing = await prisma.directoryListing.findUnique({
      where: { id: provider.claimedListingId },
      select: { email: true, phone: true, businessName: true },
    });

    if (!listing?.email) {
      // Listing has no email — flag for admin review
      await prisma.provider.update({
        where: { id: provider.id },
        data: { verificationStatus: "pending" },
      });
      sendAdminVerificationAlert(
        provider.businessName,
        provider.email,
        provider.niche,
        "Listing has no email on file — cannot send verification code"
      ).catch((err) => logger.error("verify-claim/send", "Admin alert failed", err));
      return NextResponse.json({
        success: true,
        status: "admin_review",
        message: "We couldn't find a contact email for this business. Your claim has been flagged for manual review.",
      });
    }

    // Generate 6-digit code
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.provider.update({
      where: { id: provider.id },
      data: {
        verificationCode: code,
        verificationCodeExp: expiresAt,
        verificationStatus: "pending",
        verificationAttempts: { increment: 1 },
      },
    });

    // Send code to the LISTING's email (not the claimant's)
    const sent = await sendClaimVerificationCode(
      listing.email,
      listing.businessName,
      code,
      provider.businessName
    );

    if (!sent) {
      logger.error("verify-claim/send", "Failed to send code to", listing.email);
      return NextResponse.json(
        { success: false, error: "Failed to send verification email. Try again." },
        { status: 500 }
      );
    }

    // Mask the email for the response (show first 2 chars + domain)
    const [localPart, domain] = listing.email.split("@");
    const maskedEmail = `${localPart.slice(0, 2)}***@${domain}`;

    logger.info("verify-claim/send", `Verification code sent for provider ${provider.id} to ${maskedEmail}`);

    return NextResponse.json({
      success: true,
      status: "code_sent",
      maskedEmail,
      expiresIn: 900, // 15 min in seconds
    });
  } catch (err) {
    logger.error("verify-claim/send", "Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ── Check Claim Verification Code ────────────────────────────────────
// Validates the 6-digit code entered by the provider against the stored code.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit-log";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { verifyVerificationCode } from "@/lib/verification-code";

const CheckSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits").regex(/^\d{6}$/, "Code must be numeric"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const parsed = CheckSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid code format. Enter the 6-digit code." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user?.providerId) {
      return NextResponse.json({ success: false, error: "No provider linked" }, { status: 403 });
    }

    const provider = await prisma.provider.findUnique({ where: { id: user.providerId } });
    if (!provider) {
      return NextResponse.json({ success: false, error: "Provider not found" }, { status: 404 });
    }

    // Already verified
    if (["verified", "auto_verified", "admin_approved"].includes(provider.verificationStatus)) {
      return NextResponse.json({ success: true, status: "already_verified" });
    }

    // Must have a pending code
    if (!provider.verificationCode || !provider.verificationCodeExp) {
      return NextResponse.json(
        { success: false, error: "No verification code pending. Request a new code first." },
        { status: 400 }
      );
    }

    // Check expiry
    if (new Date() > provider.verificationCodeExp) {
      return NextResponse.json(
        { success: false, error: "Code expired. Request a new one." },
        { status: 400 }
      );
    }

    // Brute-force protection: atomic "check-and-increment" collapsing
    // what used to be a (read attempts) → (compare < 10) → (increment)
    // sequence. With the old shape an attacker could fan out N
    // simultaneous requests at attempts=9 and all N would pass the
    // `< 10` check before any single request bumped the counter,
    // effectively multiplying the allowed attempts against a 6-digit
    // code. updateMany filtered on `verificationAttempts: { lt: 10 }`
    // makes the DB the gate: only attempts that flip the counter
    // below-10→N+1 get through, all concurrent losers see count === 0.
    const gated = await prisma.provider.updateMany({
      where: { id: provider.id, verificationAttempts: { lt: 10 } },
      data: { verificationAttempts: { increment: 1 } },
    });

    if (gated.count === 0) {
      return NextResponse.json(
        { success: false, error: "Too many attempts. Contact support for manual verification." },
        { status: 429 }
      );
    }

    // The stored value is an HMAC-SHA256 digest of the 6-digit code, so we
    // can't string-compare the user-supplied raw code against it directly.
    // verifyVerificationCode recomputes the digest and does a real constant-
    // time compare via crypto.timingSafeEqual. (Buffer.equals is memcmp and
    // short-circuits, which is what this route used to do despite the
    // "constant-time" comment — see src/lib/verification-code.ts.)
    if (!verifyVerificationCode(parsed.data.code, provider.verificationCode)) {
      const remaining = 10 - (provider.verificationAttempts + 1);
      return NextResponse.json(
        { success: false, error: `Incorrect code. ${remaining} attempts remaining.` },
        { status: 400 }
      );
    }

    // Code matches — verify the provider
    await prisma.provider.update({
      where: { id: provider.id },
      data: {
        verificationStatus: "verified",
        verificationCode: null,
        verificationCodeExp: null,
      },
    });

    await audit({
      action: "provider.ownership_verified",
      entityType: "provider",
      entityId: provider.id,
      providerId: provider.id,
      metadata: { method: "email_code", claimedListingId: provider.claimedListingId },
    });

    logger.info("verify-claim/check", `Provider ${provider.id} verified via email code`);

    return NextResponse.json({ success: true, status: "verified" });
  } catch (err) {
    logger.error("verify-claim/check", "Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

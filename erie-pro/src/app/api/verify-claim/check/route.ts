// ── Check Claim Verification Code ────────────────────────────────────
// Validates the 6-digit code entered by the provider against the stored code.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit-log";
import { logger } from "@/lib/logger";
import { z } from "zod";

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

    // Brute-force protection: max 10 total attempts
    if (provider.verificationAttempts >= 10) {
      return NextResponse.json(
        { success: false, error: "Too many attempts. Contact support for manual verification." },
        { status: 429 }
      );
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

    // Increment attempts
    await prisma.provider.update({
      where: { id: provider.id },
      data: { verificationAttempts: { increment: 1 } },
    });

    // Constant-time comparison to prevent timing attacks
    const codeBuffer = Buffer.from(parsed.data.code);
    const storedBuffer = Buffer.from(provider.verificationCode);
    if (codeBuffer.length !== storedBuffer.length || !codeBuffer.equals(storedBuffer)) {
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

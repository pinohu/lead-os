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
import { getClientIp } from "@/lib/client-ip";
import { cityConfig } from "@/lib/city-config";

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

    // Capture the provider identity BEFORE we consume the token so we
    // can audit + redirect deterministically. We can't read it back after
    // the update because the token (our only selector) has been cleared.
    const target = await prisma.provider.findFirst({
      where: { emailVerifyToken: hashedToken },
      select: { id: true, email: true },
    });

    if (!target) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired verification token" },
        { status: 404 }
      );
    }

    // ── Atomic single-use consumption ────────────────────────────
    // Previously: findFirst(emailVerifyToken) → update(by id). Two
    // concurrent GETs (user double-clicks, email-prefetch bot, etc.)
    // could both read the provider before either cleared the token and
    // both would then "succeed", each writing emailVerified:true. The
    // token is supposed to be single-use, so collapse consumption into
    // one atomic updateMany whose WHERE pins both id AND the token hash:
    // the DB guarantees exactly one caller flips the row from
    // hashedToken → null, and the loser sees count === 0.
    const consumed = await prisma.provider.updateMany({
      where: { id: target.id, emailVerifyToken: hashedToken },
      data: { emailVerified: true, emailVerifyToken: null },
    });

    if (consumed.count === 0) {
      // Lost the race — another concurrent GET already consumed the
      // token. Return the same generic error as a missing token so we
      // don't leak whether the link was valid-but-raced vs. bogus.
      return NextResponse.json(
        { success: false, error: "Invalid or expired verification token" },
        { status: 404 }
      );
    }

    await audit({
      action: "provider.email_verified",
      entityType: "provider",
      entityId: target.id,
      providerId: target.id,
      ipAddress: getClientIp(req),
    });

    // Redirect to claim success or checkout.
    // Use the server-configured canonical URL, NOT req.nextUrl.origin —
    // the latter reflects the Host header which is attacker-controlled
    // on misconfigured proxies. Reflecting it would let a crafted Host
    // redirect verified users to a phishing site while leaking their
    // email in the query string.
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${cityConfig.domain}`;
    const redirectUrl = new URL("/for-business/claim", siteUrl);
    redirectUrl.searchParams.set("verified", "true");
    redirectUrl.searchParams.set("email", target.email);

    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    logger.error("/api/verify-email", "Error:", err);
    return NextResponse.json(
      { success: false, error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getNicheBySlug } from "@/lib/niches";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const rateLimited = await checkRateLimit(req, "contact");
  if (rateLimited) return rateLimited;

  const sessionId = req.nextUrl.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json(
      { success: false, error: "Missing session_id" },
      { status: 400 }
    );
  }

  try {
    // Stripe checkout session IDs travel in URLs and therefore leak into
    // referer headers, browser history, server logs, and bookmarks.
    // Treating the ID as a permanent lookup token lets anyone who ever
    // sees the success-page URL learn the provider's email, niche, and
    // fee paid. Scope the endpoint to freshly-created sessions only —
    // the success page is a one-shot post-checkout landing, so a short
    // replay window is plenty.
    const MAX_AGE_MS = 2 * 60 * 60 * 1000; // 2 hours
    const freshSince = new Date(Date.now() - MAX_AGE_MS);

    const checkout = await prisma.checkoutSession.findFirst({
      where: {
        stripeSessionId: sessionId,
        createdAt: { gte: freshSince },
      },
    });

    if (!checkout) {
      // Return 404 whether the session never existed or is stale — do
      // not leak existence of expired sessions.
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }

    const niche = getNicheBySlug(checkout.niche);

    // Mask the email ("john@example.com" → "j***@example.com"): the
    // user owns this inbox and already knows it, but a replayer should
    // only get enough to confirm the redirect target, not harvest full
    // addresses.
    const maskEmail = (email: string): string => {
      const at = email.indexOf("@");
      if (at <= 1) return email; // too short to mask meaningfully
      return `${email[0]}***${email.slice(at)}`;
    };

    return NextResponse.json({
      success: true,
      session: {
        niche: checkout.niche,
        nicheLabel: niche?.label ?? checkout.niche,
        providerEmail: maskEmail(checkout.providerEmail),
        tier: "standard",
        monthlyFee: checkout.monthlyFee ?? 0,
        status: checkout.status,
      },
    });
  } catch (err) {
    logger.error("/api/checkout/validate", "Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

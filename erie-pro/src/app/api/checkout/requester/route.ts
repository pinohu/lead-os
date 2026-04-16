// ── POST /api/checkout/requester ──────────────────────────────────
// Creates a Stripe Checkout for a requester upgrade:
//   plan=concierge → $29/job one-time
//   plan=annual    → $199/yr subscription
//
// Body: { plan: "concierge"|"annual", email: string, context?: string }
// Response: { checkoutUrl, sessionId, plan, price }

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createConciergeCheckout,
  createAnnualMembershipCheckout,
} from "@/lib/stripe-integration";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { MAX_BODY_SIZE } from "@/lib/validation";

const BodySchema = z.object({
  plan: z.enum(["concierge", "annual"]),
  email: z.string().email(),
  context: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  // Each checkout creates a Stripe Checkout Session server-side, which
  // consumes Stripe API quota and leaves an abandoned session behind on
  // every attempt. Strict per-IP throttle prevents abuse.
  const limited = await checkRateLimit(req, "checkout-requester");
  if (limited) return limited;

  const contentLength = parseInt(req.headers.get("content-length") ?? "0", 10);
  if (contentLength > MAX_BODY_SIZE) {
    return NextResponse.json(
      { error: "Request body too large" },
      { status: 413 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result =
      parsed.data.plan === "concierge"
        ? await createConciergeCheckout(
            parsed.data.email,
            parsed.data.context ?? "Concierge match",
          )
        : await createAnnualMembershipCheckout(parsed.data.email);

    return NextResponse.json({
      plan: result.plan,
      email: result.email,
      price: result.price,
      checkoutUrl: result.checkoutUrl,
      sessionId: result.sessionId,
    });
  } catch (err) {
    logger.error("checkout/requester", err);
    return NextResponse.json(
      { error: "Checkout could not be started. Please try again." },
      { status: 500 },
    );
  }
}

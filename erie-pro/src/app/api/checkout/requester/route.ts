// ── POST /api/checkout/requester ──────────────────────────────────
// Creates a Stripe Checkout for a requester upgrade:
//   plan=concierge → $29/job one-time
//   plan=annual    → $199/yr subscription
//
// Body: { plan: "concierge"|"annual", email: string, context?: string }
// Response: { checkoutUrl, sessionId, plan, price }

import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createConciergeCheckout,
  createAnnualMembershipCheckout,
} from "@/lib/stripe-integration";
import { logger } from "@/lib/logger";

const BodySchema = z.object({
  plan: z.enum(["concierge", "annual"]),
  email: z.string().email(),
  context: z.string().max(500).optional(),
});

export async function POST(req: Request) {
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

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
import { recordRevenueActionPlan } from "@/lib/revenue-actions";

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
    const offerSlug = parsed.data.plan === "concierge" ? "concierge-match" : "annual-member";
    const actionPlanResult = await recordRevenueActionPlan({
      sourceSystem: "stripe",
      eventType: "stripe.checkout.started",
      offerSlug,
      offerTitle: parsed.data.plan === "concierge" ? "Concierge match" : "Annual member",
      customerEmail: parsed.data.email,
      serviceSlug: parsed.data.plan,
      serviceLabel: parsed.data.plan === "concierge" ? "Concierge match" : "Annual membership",
      serviceFamily: "requester-upgrade",
      sourcePage: "/",
      sourcePageType: "requester_upgrade_checkout",
      orderId: result.sessionId,
      amountCents: result.price * 100,
      metadata: {
        plan: parsed.data.plan,
        context: parsed.data.context ?? null,
        checkoutEngine: "stripe_legacy",
      },
    }).catch((error) => {
      logger.error("checkout/requester", "Failed to create revenue action plan for requester checkout", error);
      return null;
    });

    return NextResponse.json({
      plan: result.plan,
      email: result.email,
      price: result.price,
      checkoutUrl: result.checkoutUrl,
      sessionId: result.sessionId,
      actionPlan: actionPlanResult?.plan ?? null,
    });
  } catch (err) {
    logger.error("checkout/requester", err);
    return NextResponse.json(
      { error: "Checkout could not be started. Please try again." },
      { status: 500 },
    );
  }
}

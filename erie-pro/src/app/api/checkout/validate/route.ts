import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getNicheBySlug } from "@/lib/niches";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { buildProviderFulfillmentPlan } from "@/lib/provider-fulfillment";

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
    const checkout = await prisma.checkoutSession.findFirst({
      where: { stripeSessionId: sessionId },
    });

    if (!checkout) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }

    const niche = getNicheBySlug(checkout.niche);
    const fulfillmentPlan = buildProviderFulfillmentPlan({
      providerId: checkout.providerId ?? checkout.stripeSessionId ?? checkout.id,
      providerName: checkout.providerName ?? "Provider",
      providerEmail: checkout.providerEmail,
      niche: checkout.niche,
      city: checkout.city,
      serviceTier: "standard",
      monthlyFee: checkout.monthlyFee ?? undefined,
    });

    const territory = checkout.providerId
      ? await prisma.territory.findFirst({
          where: {
            providerId: checkout.providerId,
            niche: checkout.niche,
            city: checkout.city,
            deactivatedAt: null,
          },
          select: { id: true },
        })
      : null;

    const status = checkout.status === "completed" && !territory ? "pending" : checkout.status;

    return NextResponse.json({
      success: true,
      session: {
        niche: checkout.niche,
        nicheLabel: niche?.label ?? checkout.niche,
        providerEmail: checkout.providerEmail,
        tier: "standard",
        monthlyFee: checkout.monthlyFee ?? 0,
        status,
        fulfillmentPlanId: fulfillmentPlan.planId,
        fulfillmentPromiseCount: fulfillmentPlan.deliverables.length,
        fulfillmentPromises: fulfillmentPlan.deliverables.map((deliverable) => ({
          id: deliverable.id,
          label: deliverable.label,
          cadence: deliverable.cadence,
          status: deliverable.status,
        })),
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

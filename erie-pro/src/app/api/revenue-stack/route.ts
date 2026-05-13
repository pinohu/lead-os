import { NextResponse } from "next/server"
import { automatedOffers } from "@/lib/automated-offers"
import { prisma } from "@/lib/db"
import { revenueActionPlaybook } from "@/lib/revenue-actions"
import { getCoreEventPath, getRevenueToolStackSummary, revenueToolStack } from "@/lib/revenue-tool-stack"
import { getThriveCartReadiness } from "@/lib/thrivecart-readiness"

export const dynamic = "force-dynamic"

export async function GET() {
  let actionCounts: Array<{ eventType: string; count: number }> = []
  try {
    actionCounts = await Promise.all(revenueActionPlaybook.map(async (item) => ({
      eventType: `revenue_action.${item.outcome}`,
      count: await prisma.offerInteraction.count({ where: { eventType: `revenue_action.${item.outcome}` } }),
    })))
  } catch {
    actionCounts = []
  }

  return NextResponse.json({
    success: true,
    stack: revenueToolStack,
    summary: getRevenueToolStackSummary(),
    coreEventPath: getCoreEventPath(),
    revenueActionPlaybook,
    revenueActionCounts: actionCounts,
    thriveCartReadiness: getThriveCartReadiness(),
    thriveCartFunnels: automatedOffers
      .filter((offer) => offer.thriveCartFunnel)
      .map((offer) => ({
        offerSlug: offer.slug,
        title: offer.title,
        priceCents: offer.basePriceCents,
        checkoutProductId: offer.checkoutProductId,
        checkoutUrl: offer.checkoutUrl,
        thriveCartFunnel: offer.thriveCartFunnel,
        fulfillmentChannels: offer.fulfillmentChannels ?? [],
      })),
  })
}

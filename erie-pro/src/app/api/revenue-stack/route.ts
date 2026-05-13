import { NextResponse } from "next/server"
import type { RevenueAction } from "@/lib/revenue-actions"
import { automatedOffers } from "@/lib/automated-offers"
import { prisma } from "@/lib/db"
import { revenueActionPlaybook } from "@/lib/revenue-actions"
import { getCoreEventPath, getRevenueToolStackSummary, revenueToolStack } from "@/lib/revenue-tool-stack"
import { getThriveCartReadiness } from "@/lib/thrivecart-readiness"

export const dynamic = "force-dynamic"

export async function GET() {
  let actionCounts: Array<{ eventType: string; count: number }> = []
  let recentActions: Array<{
    id: string
    eventType: string
    outcome: string
    status: string
    priority: string
    title: string
    ownerTool: string
    targetTools: string[]
    serviceSlug: string | null
    serviceLabel: string | null
    sourcePageType: string | null
    sourceEventType: string | null
    createdAt: string
  }> = []
  try {
    const [counts, actions] = await Promise.all([
      Promise.all(revenueActionPlaybook.map(async (item) => ({
        eventType: `revenue_action.${item.outcome}`,
        count: await prisma.offerInteraction.count({ where: { eventType: `revenue_action.${item.outcome}` } }),
      }))),
      prisma.offerInteraction.findMany({
        where: { eventType: { startsWith: "revenue_action." } },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ])
    actionCounts = counts
    recentActions = actions.map((item) => {
      const metadata = (item.metadata ?? {}) as {
        status?: string
        sourceEventType?: string
        action?: RevenueAction
      }
      return {
        id: item.id,
        eventType: item.eventType,
        outcome: item.eventType.replace("revenue_action.", ""),
        status: metadata.status ?? "planned",
        priority: metadata.action?.priority ?? "normal",
        title: metadata.action?.title ?? "Planned revenue action",
        ownerTool: metadata.action?.ownerTool ?? "neon",
        targetTools: metadata.action?.targetTools ?? [],
        serviceSlug: item.serviceSlug,
        serviceLabel: item.serviceLabel,
        sourcePageType: item.sourcePageType,
        sourceEventType: metadata.sourceEventType ?? null,
        createdAt: item.createdAt.toISOString(),
      }
    })
  } catch {
    actionCounts = []
    recentActions = []
  }

  return NextResponse.json({
    success: true,
    stack: revenueToolStack,
    summary: getRevenueToolStackSummary(),
    coreEventPath: getCoreEventPath(),
    revenueActionPlaybook,
    revenueActionCounts: actionCounts,
    recentRevenueActions: recentActions,
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

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import type { Prisma } from "@/generated/prisma"
import { prisma } from "@/lib/db"
import { getOfferBySlug } from "@/lib/automated-offers"
import {
  choosePrimaryFunnel,
  getDigitalProductsLessons,
  getFunnelBySlug,
  getFunnelJourneyMap,
  getFunnelsForService,
  getOfferFunnelCoverage,
  getServiceFamilySummary,
  salesFunnels,
} from "@/lib/sales-funnels"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"

const FunnelEventSchema = z.object({
  eventType: z.string().min(2).max(120),
  funnelSlug: z.string().max(120).optional(),
  offerSlug: z.string().max(120).optional(),
  serviceSlug: z.string().max(120).optional(),
  serviceLabel: z.string().max(200).optional(),
  serviceFamily: z.string().max(120).optional(),
  sourcePage: z.string().max(1000).optional(),
  sourcePageType: z.string().max(100).optional(),
  visitorSegment: z.string().max(100).optional(),
  sessionId: z.string().max(300).optional(),
  visitorId: z.string().max(300).optional(),
  email: z.string().email().optional(),
  utmSource: z.string().max(200).optional().nullable(),
  utmMedium: z.string().max(200).optional().nullable(),
  utmCampaign: z.string().max(200).optional().nullable(),
  gclid: z.string().max(300).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export async function GET(request: NextRequest) {
  const serviceSlug = request.nextUrl.searchParams.get("service")
  const funnelSlug = request.nextUrl.searchParams.get("funnel")
  const mode = request.nextUrl.searchParams.get("mode")
  const visitorIntent = request.nextUrl.searchParams.get("visitorIntent") as Parameters<typeof choosePrimaryFunnel>[0]["visitorIntent"]
  const temperature = request.nextUrl.searchParams.get("temperature") as Parameters<typeof choosePrimaryFunnel>[0]["temperature"]

  try {
    if (funnelSlug) {
      const funnel = getFunnelBySlug(funnelSlug)
      if (!funnel) return NextResponse.json({ success: false, error: "Unknown funnel" }, { status: 404 })
      return NextResponse.json({
        success: true,
        funnel,
        offer: funnel.primaryOfferSlug ? getOfferBySlug(funnel.primaryOfferSlug) : null,
        orderBump: funnel.orderBumpSlug ? getOfferBySlug(funnel.orderBumpSlug) : null,
      })
    }

    if (serviceSlug) {
      return NextResponse.json({
        success: true,
        journey: getFunnelJourneyMap(serviceSlug),
        recommendations: getFunnelsForService(serviceSlug),
        primaryFunnel: choosePrimaryFunnel({ serviceSlug, visitorIntent, temperature }),
      })
    }

    return NextResponse.json({
      success: true,
      funnels: salesFunnels,
      digitalProductsLessons: mode === "productization" || mode === "all" ? getDigitalProductsLessons() : undefined,
      serviceFamilies: mode === "families" || mode === "all" ? getServiceFamilySummary() : undefined,
      offerCoverage: mode === "coverage" || mode === "all" ? getOfferFunnelCoverage() : undefined,
    })
  } catch (error) {
    logger.error("api/funnels", "Failed to load funnel data", error)
    return NextResponse.json({ success: false, error: "Could not load funnels" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = FunnelEventSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const funnel =
      getFunnelBySlug(parsed.data.funnelSlug) ??
      choosePrimaryFunnel({
        serviceSlug: parsed.data.serviceSlug,
        visitorIntent: parsed.data.visitorSegment === "requester" ? "requester" : parsed.data.visitorSegment === "provider" ? "provider" : "unknown",
        eventType: parsed.data.eventType,
      })
    const offerSlug = parsed.data.offerSlug ?? funnel?.primaryOfferSlug
    const offer = offerSlug ? await prisma.offer.findUnique({ where: { slug: offerSlug }, select: { id: true } }) : null
    const customer = parsed.data.email
      ? await prisma.offerCustomer.upsert({
          where: { email: parsed.data.email.toLowerCase().trim() },
          create: { email: parsed.data.email.toLowerCase().trim() },
          update: {},
          select: { id: true },
        })
      : null

    const interaction = await prisma.offerInteraction.create({
      data: {
        offerId: offer?.id ?? null,
        customerId: customer?.id ?? null,
        eventType: parsed.data.eventType,
        serviceSlug: parsed.data.serviceSlug,
        serviceLabel: parsed.data.serviceLabel,
        serviceFamily: parsed.data.serviceFamily,
        sourcePage: parsed.data.sourcePage,
        sourcePageType: parsed.data.sourcePageType,
        visitorSegment: parsed.data.visitorSegment,
        sessionId: parsed.data.sessionId,
        visitorId: parsed.data.visitorId,
        utmSource: parsed.data.utmSource,
        utmMedium: parsed.data.utmMedium,
        utmCampaign: parsed.data.utmCampaign,
        gclid: parsed.data.gclid,
        metadata: {
          ...(parsed.data.metadata ?? {}),
          funnelSlug: funnel?.slug ?? parsed.data.funnelSlug ?? null,
          funnelTitle: funnel?.title ?? null,
          funnelExitEvent: parsed.data.eventType,
        } as Prisma.InputJsonValue,
      },
    })

    return NextResponse.json({
      success: true,
      interactionId: interaction.id,
      funnelSlug: funnel?.slug ?? null,
      offerSlug: offerSlug ?? null,
    })
  } catch (error) {
    logger.error("api/funnels", "Failed to record funnel event", error)
    return NextResponse.json({ success: false, error: "Could not record funnel event" }, { status: 500 })
  }
}

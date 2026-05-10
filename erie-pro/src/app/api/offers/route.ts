import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import type { Prisma } from "@/generated/prisma"
import { prisma } from "@/lib/db"
import { automatedOffers, getServiceOfferRecommendations } from "@/lib/automated-offers"
import { getNicheBySlug, niches } from "@/lib/niches"
import { syncAutomatedOfferCatalog } from "@/lib/offer-catalog-sync"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"

const InteractionSchema = z.object({
  eventType: z.string().min(2).max(100),
  offerSlug: z.string().max(120).optional(),
  serviceSlug: z.string().max(120).optional(),
  serviceLabel: z.string().max(200).optional(),
  serviceFamily: z.string().max(120).optional(),
  sourcePage: z.string().max(1000).optional(),
  sourcePageType: z.string().max(100).optional(),
  visitorSegment: z.string().max(100).optional(),
  convertBoxId: z.union([z.string(), z.number()]).optional(),
  sessionId: z.string().max(300).optional(),
  visitorId: z.string().max(300).optional(),
  utmSource: z.string().max(200).optional().nullable(),
  utmMedium: z.string().max(200).optional().nullable(),
  utmCampaign: z.string().max(200).optional().nullable(),
  gclid: z.string().max(300).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  email: z.string().email().optional(),
})

export async function GET(request: NextRequest) {
  const serviceSlug = request.nextUrl.searchParams.get("service")
  const includeSync = request.nextUrl.searchParams.get("sync") === "1"

  try {
    if (includeSync) await syncAutomatedOfferCatalog()

    if (serviceSlug) {
      const niche = getNicheBySlug(serviceSlug)
      if (!niche) {
        return NextResponse.json({ success: false, error: "Unknown service" }, { status: 404 })
      }
      return NextResponse.json({
        success: true,
        service: niche,
        recommendations: getServiceOfferRecommendations(niche).map((recommendation) => ({
          ...recommendation,
          offer: automatedOffers.find((offer) => offer.slug === recommendation.offerSlug),
        })),
      })
    }

    return NextResponse.json({
      success: true,
      offers: automatedOffers,
      services: niches.length,
    })
  } catch (error) {
    logger.error("api/offers", "Failed to load offers", error)
    return NextResponse.json({ success: false, error: "Could not load offers" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = InteractionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const offer = parsed.data.offerSlug
      ? await prisma.offer.findUnique({ where: { slug: parsed.data.offerSlug }, select: { id: true } })
      : null
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
        convertBoxId: parsed.data.convertBoxId == null ? null : String(parsed.data.convertBoxId),
        sessionId: parsed.data.sessionId,
        visitorId: parsed.data.visitorId,
        utmSource: parsed.data.utmSource,
        utmMedium: parsed.data.utmMedium,
        utmCampaign: parsed.data.utmCampaign,
        gclid: parsed.data.gclid,
        metadata: (parsed.data.metadata ?? {}) as Prisma.InputJsonValue,
      },
    })

    return NextResponse.json({ success: true, interactionId: interaction.id })
  } catch (error) {
    logger.error("api/offers", "Failed to record offer interaction", error)
    return NextResponse.json({ success: false, error: "Could not record interaction" }, { status: 500 })
  }
}

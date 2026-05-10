import { after, NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { checkRateLimit } from "@/lib/rate-limit"
import { createOfferPurchase, fulfillOfferPurchase } from "@/lib/offer-fulfillment"
import { syncAutomatedOfferCatalog } from "@/lib/offer-catalog-sync"
import { logger } from "@/lib/logger"

const ScorecardSchema = z.object({
  email: z.string().email(),
  fullName: z.string().max(200).optional(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  phone: z.string().max(40).optional(),
  companyName: z.string().max(200).optional(),
  websiteUrl: z.string().url().max(2000).optional().or(z.literal("")),
  googleBusinessUrl: z.string().url().max(2000).optional().or(z.literal("")),
  serviceSlug: z.string().min(2).max(120),
  sourcePage: z.string().max(1000).optional(),
  sourcePageType: z.string().max(100).optional(),
  convertBoxId: z.union([z.string(), z.number()]).optional(),
  convertBoxEventId: z.string().max(300).optional(),
  utmSource: z.string().max(200).optional().nullable(),
  utmMedium: z.string().max(200).optional().nullable(),
  utmCampaign: z.string().max(200).optional().nullable(),
  gclid: z.string().max(300).optional().nullable(),
})

export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, "lead-event")
  if (rateLimited) return rateLimited

  const body = await request.json().catch(() => null)
  const parsed = ScorecardSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    await syncAutomatedOfferCatalog().catch(() => null)
    const { purchase, job } = await createOfferPurchase({
      offerSlug: "erie-lead-readiness-scorecard",
      serviceSlug: parsed.data.serviceSlug,
      amountCents: 0,
      status: "paid",
      sourceSystem: "erie-pro-scorecard",
      sourcePage: parsed.data.sourcePage,
      sourcePageType: parsed.data.sourcePageType,
      convertBoxId: parsed.data.convertBoxId == null ? null : String(parsed.data.convertBoxId),
      convertBoxEventId: parsed.data.convertBoxEventId,
      utmSource: parsed.data.utmSource,
      utmMedium: parsed.data.utmMedium,
      utmCampaign: parsed.data.utmCampaign,
      gclid: parsed.data.gclid,
      rawPayload: body,
      normalizedPayload: parsed.data,
      customer: {
        email: parsed.data.email,
        fullName: parsed.data.fullName,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        phone: parsed.data.phone,
        companyName: parsed.data.companyName,
        websiteUrl: parsed.data.websiteUrl || null,
        googleBusinessUrl: parsed.data.googleBusinessUrl || null,
      },
    })

    after(async () => {
      await fulfillOfferPurchase(purchase.id).catch((error) => {
        logger.error("api/offers/scorecard", "Async scorecard fulfillment failed", error)
      })
    })

    return NextResponse.json({
      success: true,
      purchaseId: purchase.id,
      fulfillmentJobId: job.id,
      status: "queued",
    })
  } catch (error) {
    logger.error("api/offers/scorecard", "Failed to create scorecard purchase", error)
    return NextResponse.json({ success: false, error: "Could not start scorecard fulfillment" }, { status: 500 })
  }
}

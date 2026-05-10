import { after, NextRequest, NextResponse } from "next/server"
import { createHmac, timingSafeEqual } from "crypto"
import { z } from "zod"
import type { Prisma } from "@/generated/prisma"
import { prisma } from "@/lib/db"
import { automatedOffers } from "@/lib/automated-offers"
import { createOfferPurchase, fulfillOfferPurchase } from "@/lib/offer-fulfillment"
import { syncAutomatedOfferCatalog } from "@/lib/offer-catalog-sync"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"

const PassthroughSchema = z.object({
  serviceSlug: z.string().optional(),
  service_slug: z.string().optional(),
  sourcePage: z.string().optional(),
  source_page: z.string().optional(),
  convertBoxId: z.union([z.string(), z.number()]).optional(),
  convertbox_id: z.union([z.string(), z.number()]).optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  gclid: z.string().optional(),
}).passthrough()

type AnyRecord = Record<string, unknown>

export async function GET() {
  return NextResponse.json({ success: true, webhook: "thrivecart" })
}

function asRecord(value: unknown): AnyRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as AnyRecord : {}
}

function stringValue(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim()
    if (typeof value === "number" && Number.isFinite(value)) return String(value)
  }
  return undefined
}

function numberValue(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value)
  }
  return undefined
}

function verifySignature(rawBody: string, request: NextRequest) {
  const token = process.env.THRIVECART_WEBHOOK_TOKEN
  if (token && request.nextUrl.searchParams.get("token") === token) return true

  const secret = process.env.THRIVECART_WEBHOOK_SECRET
  if (!secret) return process.env.NODE_ENV !== "production"

  const signature =
    request.headers.get("x-thrivecart-signature") ||
    request.headers.get("x-signature") ||
    request.headers.get("thrivecart-signature")
  if (!signature) return false

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex")
  const given = signature.replace(/^sha256=/, "")
  const expectedBuffer = Buffer.from(expected)
  const givenBuffer = Buffer.from(given)
  return expectedBuffer.length === givenBuffer.length && timingSafeEqual(expectedBuffer, givenBuffer)
}

function normalizeThriveCartPayload(body: AnyRecord) {
  const customer = asRecord(body.customer)
  const order = asRecord(body.order)
  const product = asRecord(body.product)
  const purchase = asRecord(body.purchase)
  const passthrough = PassthroughSchema.safeParse({
    ...asRecord(body.passthrough),
    ...asRecord(body.custom_fields),
    ...asRecord(body.customFields),
    ...asRecord(body.metadata),
  }).success
    ? PassthroughSchema.parse({
        ...asRecord(body.passthrough),
        ...asRecord(body.custom_fields),
        ...asRecord(body.customFields),
        ...asRecord(body.metadata),
      })
    : {}

  const productId = stringValue(
    body.product_id,
    body.productId,
    product.id,
    product.product_id,
    purchase.product_id,
  )
  const productName = stringValue(body.product_name, body.productName, product.name, purchase.product_name)
  const offer =
    automatedOffers.find((item) => item.checkoutProductId === productId) ||
    automatedOffers.find((item) => item.slug === stringValue(body.offerSlug, body.offer_slug)) ||
    automatedOffers.find((item) => productName?.toLowerCase().includes(item.shortTitle.toLowerCase())) ||
    automatedOffers[1]

  const amount =
    numberValue(body.amount, body.total, order.total, order.amount, purchase.amount) ??
    offer.basePriceCents / 100
  const amountCents = amount > 1000 ? Math.round(amount) : Math.round(amount * 100)

  return {
    eventType: stringValue(body.event, body.event_type, body.type) ?? "purchase.completed",
    orderId: stringValue(body.order_id, body.orderId, order.id, purchase.order_id),
    productId: productId ?? offer.checkoutProductId,
    productName,
    offerSlug: offer.slug,
    serviceSlug: stringValue(
      body.serviceSlug,
      body.service_slug,
      passthrough.serviceSlug,
      passthrough.service_slug,
    ) ?? "plumbing",
    amountCents,
    currency: stringValue(body.currency, order.currency, purchase.currency) ?? "USD",
    customer: {
      email: stringValue(body.email, customer.email, purchase.email) ?? "",
      fullName: stringValue(body.name, customer.name, customer.full_name, purchase.name),
      firstName: stringValue(body.first_name, customer.first_name, customer.firstName),
      lastName: stringValue(body.last_name, customer.last_name, customer.lastName),
      phone: stringValue(body.phone, customer.phone),
      companyName: stringValue(body.company, customer.company, customer.company_name),
      websiteUrl: stringValue(body.website, passthrough.websiteUrl, asRecord(body.custom_fields).website),
      googleBusinessUrl: stringValue(body.googleBusinessUrl, passthrough.googleBusinessUrl),
    },
    sourcePage: stringValue(body.sourcePage, passthrough.sourcePage, passthrough.source_page),
    convertBoxId: stringValue(body.convertBoxId, passthrough.convertBoxId, passthrough.convertbox_id),
    coupon: stringValue(body.coupon, order.coupon),
    affiliate: stringValue(body.affiliate, order.affiliate),
    utmSource: stringValue(body.utm_source, passthrough.utm_source),
    utmMedium: stringValue(body.utm_medium, passthrough.utm_medium),
    utmCampaign: stringValue(body.utm_campaign, passthrough.utm_campaign),
    gclid: stringValue(body.gclid, passthrough.gclid),
    externalSubscriptionId: stringValue(body.subscription_id, body.subscriptionId, asRecord(body.subscription).id),
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signatureValid = verifySignature(rawBody, request)
  let body: AnyRecord
  try {
    body = JSON.parse(rawBody) as AnyRecord
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 })
  }

  const normalized = normalizeThriveCartPayload(body)
  const thriveCartEvent = await prisma.thriveCartEvent.create({
    data: {
      eventType: normalized.eventType,
      orderId: normalized.orderId,
      productId: normalized.productId,
      customerEmail: normalized.customer.email || null,
      signatureValid,
      rawPayload: body as Prisma.InputJsonValue,
      normalizedPayload: normalized as Prisma.InputJsonValue,
      processingStatus: signatureValid ? "pending" : "signature_failed",
    },
  })

  if (!signatureValid) {
    return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 401 })
  }

  if (!normalized.customer.email) {
    await prisma.thriveCartEvent.update({
      where: { id: thriveCartEvent.id },
      data: { processingStatus: "failed", lastError: "Missing customer email" },
    })
    return NextResponse.json({ success: false, error: "Missing customer email" }, { status: 400 })
  }

  try {
    await syncAutomatedOfferCatalog().catch(() => null)
    const { purchase } = await createOfferPurchase({
      offerSlug: normalized.offerSlug,
      serviceSlug: normalized.serviceSlug,
      amountCents: normalized.amountCents,
      currency: normalized.currency,
      status: "paid",
      sourceSystem: "thrivecart",
      sourcePage: normalized.sourcePage,
      sourcePageType: "thrivecart_checkout",
      convertBoxId: normalized.convertBoxId,
      thriveCartOrderId: normalized.orderId,
      thriveCartProductId: normalized.productId,
      coupon: normalized.coupon,
      affiliate: normalized.affiliate,
      utmSource: normalized.utmSource,
      utmMedium: normalized.utmMedium,
      utmCampaign: normalized.utmCampaign,
      gclid: normalized.gclid,
      rawPayload: body,
      normalizedPayload: normalized,
      customer: normalized.customer,
    })

    await prisma.thriveCartEvent.update({
      where: { id: thriveCartEvent.id },
      data: { purchaseId: purchase.id, processingStatus: "processed", processedAt: new Date() },
    })

    if (normalized.externalSubscriptionId) {
      const purchaseWithRelations = await prisma.offerPurchase.findUnique({
        where: { id: purchase.id },
        select: { offerId: true, customerId: true, serviceSlug: true, serviceFamily: true },
      })
      if (purchaseWithRelations) {
        await prisma.offerSubscriptionEntitlement.create({
          data: {
            offerId: purchaseWithRelations.offerId,
            customerId: purchaseWithRelations.customerId,
            purchaseId: purchase.id,
            serviceSlug: purchaseWithRelations.serviceSlug,
            serviceFamily: purchaseWithRelations.serviceFamily,
            externalSubscriptionId: normalized.externalSubscriptionId,
            metadata: { sourceSystem: "thrivecart" },
          },
        })
      }
    }

    after(async () => {
      await fulfillOfferPurchase(purchase.id).catch((error) => {
        logger.error("api/webhooks/thrivecart", "Async ThriveCart fulfillment failed", error)
      })
    })

    return NextResponse.json({ success: true, purchaseId: purchase.id })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown ThriveCart processing error"
    logger.error("api/webhooks/thrivecart", "Failed to process ThriveCart webhook", error)
    await prisma.thriveCartEvent.update({
      where: { id: thriveCartEvent.id },
      data: { processingStatus: "failed", lastError: message },
    }).catch(() => {})
    return NextResponse.json({ success: false, error: "Webhook processing failed" }, { status: 500 })
  }
}

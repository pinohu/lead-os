import { after, NextRequest, NextResponse } from "next/server"
import { createHash, createHmac, timingSafeEqual } from "crypto"
import { z } from "zod"
import type { Prisma } from "@/generated/prisma"
import { prisma } from "@/lib/db"
import { automatedOffers } from "@/lib/automated-offers"
import { createOfferPurchase, fulfillOfferPurchase } from "@/lib/offer-fulfillment"
import { syncAutomatedOfferCatalog } from "@/lib/offer-catalog-sync"
import { recordRevenueActionPlan } from "@/lib/revenue-actions"
import { logger } from "@/lib/logger"
import { handleProviderOfferThriveCartEvent } from "@/lib/provider-offer-thrivecart"
import { syncProviderOfferCatalog } from "@/lib/provider-offer-catalog-sync"

export const dynamic = "force-dynamic"

const PassthroughSchema = z.object({
  serviceSlug: z.string().optional(),
  service_slug: z.string().optional(),
  sourcePage: z.string().optional(),
  source_page: z.string().optional(),
  convertBoxId: z.union([z.string(), z.number()]).optional(),
  convertbox_id: z.union([z.string(), z.number()]).optional(),
  offerSlug: z.string().optional(),
  offer_slug: z.string().optional(),
  planSlug: z.string().optional(),
  plan_slug: z.string().optional(),
  providerId: z.string().optional(),
  provider_id: z.string().optional(),
  funnelSlug: z.string().optional(),
  funnel_slug: z.string().optional(),
  sourcePageType: z.string().optional(),
  source_page_type: z.string().optional(),
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

function arrayValue(value: unknown) {
  return Array.isArray(value) ? value : []
}

function normalizeEventType(value: string) {
  const lower = value.toLowerCase()
  if (lower.includes("abandon")) return "cart.abandoned"
  if (lower.includes("refund")) return "order.refunded"
  if (lower.includes("cancel")) return "subscription.cancelled"
  if (lower.includes("subscription") && lower.includes("payment")) return "subscription.payment"
  if (lower.includes("subscription")) return "subscription.updated"
  if (lower.includes("bump")) return "order.payment_bump"
  if (lower.includes("upsell")) return "order.payment_upsell"
  if (lower.includes("downsell")) return "order.payment_downsell"
  if (lower.includes("success") || lower.includes("complete") || lower.includes("purchase")) return "order.success"
  return value
}

function isPaidEvent(eventType: string) {
  return ["order.success", "order.payment_bump", "order.payment_upsell", "order.payment_downsell", "subscription.payment"].includes(eventType)
}

function statusForEvent(eventType: string) {
  if (eventType === "order.refunded") return "refunded"
  if (eventType === "cart.abandoned") return "abandoned"
  if (eventType === "subscription.cancelled") return "cancelled"
  return "paid"
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

  const purchases = arrayValue(body.purchases).map((item) => asRecord(item))
  const firstPurchase = purchases[0] ?? {}
  const productId = stringValue(
    body.product_id,
    body.productId,
    product.id,
    product.product_id,
    purchase.product_id,
    firstPurchase.product_id,
    firstPurchase.productId,
  )
  const productName = stringValue(body.product_name, body.productName, product.name, purchase.product_name, firstPurchase.name, firstPurchase.product_name)
  const offer =
    automatedOffers.find((item) => item.checkoutProductId === productId) ||
    automatedOffers.find((item) => item.slug === stringValue(body.offerSlug, body.offer_slug, passthrough.offerSlug, passthrough.offer_slug)) ||
    automatedOffers.find((item) => productName?.toLowerCase().includes(item.shortTitle.toLowerCase())) ||
    automatedOffers[1]

  const amount =
    numberValue(body.amount, body.total, order.total, order.amount, purchase.amount) ??
    offer.basePriceCents / 100
  const amountCents = amount > 1000 ? Math.round(amount) : Math.round(amount * 100)

  const eventType = normalizeEventType(stringValue(body.event, body.event_type, body.type) ?? "order.success")
  const normalizedPurchases = purchases.map((item) => {
    const itemProductId = stringValue(item.product_id, item.productId, item.id)
    const itemProductName = stringValue(item.product_name, item.productName, item.name)
    const itemOffer =
      automatedOffers.find((offerItem) => offerItem.checkoutProductId === itemProductId) ||
      automatedOffers.find((offerItem) => itemProductName?.toLowerCase().includes(offerItem.shortTitle.toLowerCase())) ||
      offer
    const itemAmount = numberValue(item.amount, item.total, item.price) ?? itemOffer.basePriceCents / 100
    return {
      productId: itemProductId ?? itemOffer.checkoutProductId,
      productName: itemProductName ?? itemOffer.title,
      offerSlug: itemOffer.slug,
      purchaseType: normalizeEventType(stringValue(item.type, item.purchase_type, item.kind) ?? eventType),
      amountCents: itemAmount > 1000 ? Math.round(itemAmount) : Math.round(itemAmount * 100),
    }
  })

  return {
    eventType,
    orderId: stringValue(body.order_id, body.orderId, order.id, purchase.order_id),
    productId: productId ?? offer.checkoutProductId,
    productName,
    offerSlug: offer.slug,
    planSlug: stringValue(body.planSlug, body.plan_slug, passthrough.planSlug, passthrough.plan_slug),
    providerId: stringValue(body.providerId, body.provider_id, passthrough.providerId, passthrough.provider_id),
    funnelSlug: stringValue(body.funnelSlug, body.funnel_slug, passthrough.funnelSlug, passthrough.funnel_slug),
    sourcePageType: stringValue(body.sourcePageType, body.source_page_type, passthrough.sourcePageType, passthrough.source_page_type),
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
    purchases: normalizedPurchases,
    orderStatus: statusForEvent(eventType),
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

  // ── Idempotency: payload hash short-circuit ─────────────────────
  // ThriveCart retries failed webhook deliveries for ~24 hours with
  // identical payloads. Without this check, a single $399 purchase
  // would create multiple OfferPurchase rows, multiple fulfillment
  // jobs, multiple confirmation emails, and multiple Boost.space syncs
  // on every retry. We hash the raw body and short-circuit on duplicate.
  // The OfferPurchase compound unique on (thriveCartOrderId, offerId)
  // is the second-layer defense for the race-window case.
  const payloadHash = createHash("sha256").update(rawBody).digest("hex")
  const existingEvent = await prisma.thriveCartEvent.findUnique({
    where: { payloadHash },
    select: { id: true, processingStatus: true, processedAt: true },
  })
  if (existingEvent && existingEvent.processingStatus === "processed") {
    logger.info("webhook/thrivecart", "Duplicate webhook short-circuited", {
      eventId: existingEvent.id,
      payloadHash: payloadHash.slice(0, 12),
      processedAt: existingEvent.processedAt,
    })
    return NextResponse.json({
      success: true,
      duplicate: true,
      originalEventId: existingEvent.id,
      message: "Webhook payload already processed",
    })
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
      payloadHash,
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
    await syncProviderOfferCatalog().catch(() => null)

    if (isPaidEvent(normalized.eventType)) {
      const providerResult = await handleProviderOfferThriveCartEvent(thriveCartEvent.id, {
        eventType: normalized.eventType,
        orderId: normalized.orderId,
        productId: normalized.productId,
        planSlug: normalized.planSlug,
        amountCents: normalized.amountCents,
        customer: normalized.customer,
        serviceSlug: normalized.serviceSlug,
        providerId: normalized.providerId,
        externalSubscriptionId: normalized.externalSubscriptionId,
        rawPayload: body,
      })
      if (providerResult.handled && providerResult.reconciled) {
        await prisma.thriveCartEvent.update({
          where: { id: thriveCartEvent.id },
          data: {
            processingStatus: "processed",
            processedAt: new Date(),
            providerSubscriptionId: providerResult.subscriptionId,
            normalizedPayload: {
              ...normalized,
              providerOffer: providerResult,
            } as Prisma.InputJsonValue,
          },
        })
        return NextResponse.json({
          success: true,
          flow: "provider_offer",
          providerId: providerResult.providerId,
          subscriptionId: providerResult.subscriptionId,
        })
      }
      if (providerResult.handled && !providerResult.reconciled) {
        await prisma.thriveCartEvent.update({
          where: { id: thriveCartEvent.id },
          data: {
            processingStatus: "processed",
            processedAt: new Date(),
            reconciliationStatus: "unmatched",
            normalizedPayload: { ...normalized, providerOffer: providerResult } as Prisma.InputJsonValue,
          },
        })
        return NextResponse.json({
          success: true,
          flow: "provider_offer_reconciliation",
          message: "Payment recorded; manual reconciliation required",
        })
      }
    }

    if (!isPaidEvent(normalized.eventType)) {
      const customer = normalized.customer.email
        ? await prisma.offerCustomer.upsert({
            where: { email: normalized.customer.email.toLowerCase().trim() },
            create: {
              email: normalized.customer.email.toLowerCase().trim(),
              fullName: normalized.customer.fullName ?? null,
              firstName: normalized.customer.firstName ?? null,
              lastName: normalized.customer.lastName ?? null,
              phone: normalized.customer.phone ?? null,
              companyName: normalized.customer.companyName ?? null,
              websiteUrl: normalized.customer.websiteUrl ?? null,
              googleBusinessUrl: normalized.customer.googleBusinessUrl ?? null,
            },
            update: {
              fullName: normalized.customer.fullName ?? undefined,
              firstName: normalized.customer.firstName ?? undefined,
              lastName: normalized.customer.lastName ?? undefined,
              phone: normalized.customer.phone ?? undefined,
              companyName: normalized.customer.companyName ?? undefined,
              websiteUrl: normalized.customer.websiteUrl ?? undefined,
              googleBusinessUrl: normalized.customer.googleBusinessUrl ?? undefined,
            },
            select: { id: true },
          })
        : null
      await prisma.offerInteraction.create({
        data: {
          eventType: `thrivecart.${normalized.eventType}`,
          customerId: customer?.id ?? null,
          serviceSlug: normalized.serviceSlug,
          sourcePage: normalized.sourcePage,
          sourcePageType: normalized.sourcePageType ?? "thrivecart_checkout",
          convertBoxId: normalized.convertBoxId,
          utmSource: normalized.utmSource,
          utmMedium: normalized.utmMedium,
          utmCampaign: normalized.utmCampaign,
          gclid: normalized.gclid,
          metadata: {
            offerSlug: normalized.offerSlug,
            funnelSlug: normalized.funnelSlug,
            orderId: normalized.orderId,
            productId: normalized.productId,
            productName: normalized.productName,
            orderStatus: normalized.orderStatus,
            coupon: normalized.coupon,
            affiliate: normalized.affiliate,
            purchases: normalized.purchases,
          } as Prisma.InputJsonValue,
        },
      })
      const actionPlan = await recordRevenueActionPlan({
        sourceSystem: "thrivecart",
        eventType: normalized.eventType,
        offerSlug: normalized.offerSlug,
        customerId: customer?.id,
        customerEmail: normalized.customer.email,
        serviceSlug: normalized.serviceSlug,
        sourcePage: normalized.sourcePage,
        sourcePageType: normalized.sourcePageType ?? "thrivecart_checkout",
        convertBoxId: normalized.convertBoxId,
        funnelSlug: normalized.funnelSlug,
        orderId: normalized.orderId,
        productId: normalized.productId,
        coupon: normalized.coupon,
        affiliate: normalized.affiliate,
        utmSource: normalized.utmSource,
        utmMedium: normalized.utmMedium,
        utmCampaign: normalized.utmCampaign,
        gclid: normalized.gclid,
        amountCents: normalized.amountCents,
        metadata: { purchases: normalized.purchases, orderStatus: normalized.orderStatus },
      })
      await prisma.thriveCartEvent.update({
        where: { id: thriveCartEvent.id },
        data: {
          processingStatus: "processed",
          processedAt: new Date(),
          normalizedPayload: {
            ...normalized,
            revenueActionPlan: actionPlan.plan,
            revenueActionRecordIds: actionPlan.records.map((record) => record.id),
          } as Prisma.InputJsonValue,
        },
      })
      return NextResponse.json({ success: true, recordedEvent: normalized.eventType, revenueActions: actionPlan.records.length })
    }

    const purchaseItems = normalized.purchases.length > 0
      ? normalized.purchases
      : [{
          offerSlug: normalized.offerSlug,
          productId: normalized.productId,
          amountCents: normalized.amountCents,
          purchaseType: normalized.eventType,
        }]

    const createdPurchases: Array<{ id: string }> = []
    for (const item of purchaseItems) {
      // ── Layer-2 idempotency: catch unique-constraint violation ──
      // If two concurrent webhook deliveries both pass the payloadHash
      // check (race window between SELECT and INSERT on ThriveCartEvent),
      // the OfferPurchase compound unique on (thriveCartOrderId, offerId)
      // will reject the second insert with Prisma error P2002. We treat
      // that as success: the first insert already created the row and
      // its fulfillment chain. Look up the existing row so downstream
      // recordRevenueActionPlan still has a purchase to attach to.
      let purchase: { id: string; customerId: string; serviceSlug: string; serviceLabel: string; serviceFamily: string }
      try {
        const result = await createOfferPurchase({
          offerSlug: item.offerSlug,
          serviceSlug: normalized.serviceSlug,
          amountCents: item.amountCents,
          currency: normalized.currency,
          status: "paid",
          sourceSystem: "thrivecart",
          sourcePage: normalized.sourcePage,
          sourcePageType: normalized.sourcePageType ?? item.purchaseType ?? "thrivecart_checkout",
          convertBoxId: normalized.convertBoxId,
          thriveCartOrderId: normalized.orderId,
          thriveCartProductId: item.productId,
          coupon: normalized.coupon,
          affiliate: normalized.affiliate,
          utmSource: normalized.utmSource,
          utmMedium: normalized.utmMedium,
          utmCampaign: normalized.utmCampaign,
          gclid: normalized.gclid,
          rawPayload: body,
          normalizedPayload: {
            ...normalized,
            activePurchase: item,
          },
          customer: normalized.customer,
        })
        purchase = result.purchase
      } catch (err) {
        const isUniqueViolation =
          typeof err === "object" &&
          err !== null &&
          "code" in err &&
          (err as { code: unknown }).code === "P2002"
        if (!isUniqueViolation || !normalized.orderId) throw err

        logger.info("webhook/thrivecart", "Race-window duplicate caught by unique index", {
          orderId: normalized.orderId,
          offerSlug: item.offerSlug,
        })
        // Look up the existing row so the rest of the loop still runs
        const existing = await prisma.offerPurchase.findFirst({
          where: {
            thriveCartOrderId: normalized.orderId,
            offer: { slug: item.offerSlug },
          },
          select: {
            id: true,
            customerId: true,
            serviceSlug: true,
            serviceLabel: true,
            serviceFamily: true,
          },
        })
        if (!existing) {
          // Genuinely impossible (P2002 means a row exists) but bail safely
          throw err
        }
        purchase = existing
      }
      await recordRevenueActionPlan({
        sourceSystem: "thrivecart",
        eventType: item.purchaseType,
        offerSlug: item.offerSlug,
        purchaseId: purchase.id,
        customerId: purchase.customerId,
        customerEmail: normalized.customer.email,
        serviceSlug: purchase.serviceSlug,
        serviceLabel: purchase.serviceLabel,
        serviceFamily: purchase.serviceFamily,
        sourcePage: normalized.sourcePage,
        sourcePageType: normalized.sourcePageType ?? item.purchaseType ?? "thrivecart_checkout",
        convertBoxId: normalized.convertBoxId,
        funnelSlug: normalized.funnelSlug,
        orderId: normalized.orderId,
        productId: item.productId,
        coupon: normalized.coupon,
        affiliate: normalized.affiliate,
        utmSource: normalized.utmSource,
        utmMedium: normalized.utmMedium,
        utmCampaign: normalized.utmCampaign,
        gclid: normalized.gclid,
        amountCents: item.amountCents,
        metadata: { activePurchase: item, allPurchases: normalized.purchases },
      })
      createdPurchases.push(purchase)
    }

    await prisma.thriveCartEvent.update({
      where: { id: thriveCartEvent.id },
      data: { purchaseId: createdPurchases[0]?.id, processingStatus: "processed", processedAt: new Date() },
    })

    if (normalized.externalSubscriptionId && createdPurchases[0]) {
      const purchase = createdPurchases[0]
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
      await Promise.all(createdPurchases.map((purchase) =>
        fulfillOfferPurchase(purchase.id).catch((error) => {
          logger.error("api/webhooks/thrivecart", "Async ThriveCart fulfillment failed", error)
        }),
      ))
    })

    return NextResponse.json({ success: true, purchaseIds: createdPurchases.map((purchase) => purchase.id) })
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

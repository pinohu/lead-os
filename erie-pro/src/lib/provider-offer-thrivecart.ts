// erie-pro/src/lib/provider-offer-thrivecart.ts
// Routes ThriveCart events to provider offer system when product maps to a plan.

import { prisma } from "@/lib/db"
import { processProviderOfferCheckout } from "@/lib/provider-offer-provisioning"
import {
  enqueueThriveCartReconciliation,
  markThriveCartEventMatched,
} from "@/lib/thrivecart-reconciliation"

export interface NormalizedThriveCartForProvider {
  eventType: string
  orderId?: string | null
  productId?: string | null
  planSlug?: string | null
  amountCents?: number
  customer: {
    email: string
    fullName?: string | null
    phone?: string | null
    companyName?: string | null
  }
  serviceSlug?: string | null
  providerId?: string | null
  externalSubscriptionId?: string | null
  rawPayload?: unknown
}

const PAID_EVENTS = new Set([
  "order.success",
  "order.payment_bump",
  "order.payment_upsell",
  "subscription.payment",
])

export async function resolveProviderPlanFromProduct(productId: string | null | undefined) {
  if (!productId) return null
  const mapping = await prisma.thriveCartProductMapping.findUnique({
    where: { thriveCartProductId: productId },
    include: { plan: true },
  })
  if (mapping?.plan) return mapping.plan
  for (const plan of await prisma.providerPlan.findMany({ where: { isActive: true } })) {
    if (plan.thriveCartSetupId === productId || plan.thriveCartMonthlyId === productId) return plan
  }
  return null
}

export async function handleProviderOfferThriveCartEvent(
  thriveCartEventId: string,
  normalized: NormalizedThriveCartForProvider,
) {
  if (!PAID_EVENTS.has(normalized.eventType)) {
    return { handled: false as const, reason: "not_paid_event" }
  }

  if (!normalized.customer.email) {
    await enqueueThriveCartReconciliation({
      thriveCartEventId,
      reason: "missing_customer_email",
      suggestedAction: "contact_customer_or_refund",
    })
    return { handled: true as const, reconciled: false }
  }

  let planSlug = normalized.planSlug ?? null
  if (!planSlug && normalized.productId) {
    const plan = await resolveProviderPlanFromProduct(normalized.productId)
    planSlug = plan?.slug ?? null
  }

  // Not a provider-offer product — let automated offer engine handle it.
  if (!planSlug) {
    return { handled: false as const, reason: "not_provider_product" }
  }

  const result = await processProviderOfferCheckout({
    email: normalized.customer.email,
    planSlug,
    thriveCartOrderId: normalized.orderId,
    thriveCartSubscriptionId: normalized.externalSubscriptionId,
    thriveCartProductId: normalized.productId,
    amountCents: normalized.amountCents,
    businessName: normalized.customer.companyName ?? normalized.customer.fullName,
    phone: normalized.customer.phone,
    niche: normalized.serviceSlug ?? undefined,
    providerId: normalized.providerId ?? undefined,
    rawPayload: normalized.rawPayload,
  })

  if (!result.matched) {
    await enqueueThriveCartReconciliation({
      thriveCartEventId,
      reason: result.reason,
      metadata: { planSlug },
    })
    return { handled: true as const, reconciled: false }
  }

  await markThriveCartEventMatched({
    thriveCartEventId,
    providerSubscriptionId: result.subscriptionId,
  })

  return {
    handled: true as const,
    reconciled: true,
    providerId: result.providerId,
    subscriptionId: result.subscriptionId,
  }
}

import type { Prisma } from "@/generated/prisma"
import { prisma } from "@/lib/db"

export type RevenueOutcome = "deliver" | "recover" | "route" | "learn"

export type RevenueActionInput = {
  sourceSystem: string
  eventType: string
  offerSlug?: string | null
  offerTitle?: string | null
  purchaseId?: string | null
  customerId?: string | null
  customerEmail?: string | null
  serviceSlug?: string | null
  serviceLabel?: string | null
  serviceFamily?: string | null
  sourcePage?: string | null
  sourcePageType?: string | null
  convertBoxId?: string | null
  funnelSlug?: string | null
  orderId?: string | null
  productId?: string | null
  coupon?: string | null
  affiliate?: string | null
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
  gclid?: string | null
  amountCents?: number | null
  metadata?: Record<string, unknown>
}

export type RevenueAction = {
  outcome: RevenueOutcome
  priority: "immediate" | "high" | "normal" | "low"
  title: string
  action: string
  ownerTool: string
  targetTools: string[]
  automationKey: string
  dueInMinutes?: number
}

export type RevenueActionAutomationPayload = {
  actionId: string
  automationKey: string | null
  outcome: RevenueOutcome
  status: string
  priority: RevenueAction["priority"]
  ownerTool: string
  targetTools: string[]
  title: string
  action: string | null
  routing: {
    preferredTool: string
    fallbackTools: string[]
    suggestedStatus: "queued"
  }
  context: {
    sourceSystem?: string | null
    sourceEventType?: string | null
    purchaseId?: string | null
    offerSlug?: string | null
    offerTitle?: string | null
    customerEmail?: string | null
    funnelSlug?: string | null
    orderId?: string | null
    productId?: string | null
    serviceSlug?: string | null
    serviceLabel?: string | null
    serviceFamily?: string | null
    sourcePage?: string | null
    sourcePageType?: string | null
    coupon?: string | null
    affiliate?: string | null
    amountCents?: number | null
    utmSource?: string | null
    utmMedium?: string | null
    utmCampaign?: string | null
    gclid?: string | null
    eventMetadata?: Record<string, unknown> | null
  }
}

export type RevenueActionPlan = {
  eventType: string
  primaryOutcome: RevenueOutcome
  actions: RevenueAction[]
  shouldFulfill: boolean
  shouldRecover: boolean
  shouldRoute: boolean
  shouldLearn: boolean
}

function normalizedEvent(eventType: string) {
  return eventType.toLowerCase().replace(/^thrivecart\./, "")
}

function isPaidEvent(eventType: string) {
  const event = normalizedEvent(eventType)
  return ["order.success", "order.payment_bump", "order.payment_upsell", "order.payment_downsell", "subscription.payment"].includes(event)
}

function isRecoveryEvent(eventType: string) {
  const event = normalizedEvent(eventType)
  return event.includes("abandon") || event.includes("refund") || event.includes("cancel") || event.includes("failed")
}

function routeOwnerFor(input: RevenueActionInput) {
  if (input.offerSlug?.includes("client-portal")) return "suitedash"
  if (input.offerSlug?.includes("launch")) return "suitedash"
  if (input.offerSlug?.includes("growth") || input.offerSlug?.includes("government")) return "taskade"
  return "boostspace"
}

export function buildRevenueActionPlan(input: RevenueActionInput): RevenueActionPlan {
  const event = normalizedEvent(input.eventType)
  const actions: RevenueAction[] = []
  const label = input.offerTitle ?? input.offerSlug ?? input.productId ?? "Erie.Pro offer"
  const service = input.serviceLabel ?? input.serviceSlug ?? "Erie County service"
  const paid = isPaidEvent(event)
  const recovery = isRecoveryEvent(event)
  const routeOwner = routeOwnerFor(input)

  if (paid) {
    actions.push({
      outcome: "deliver",
      priority: event.includes("subscription") ? "high" : "immediate",
      title: `Deliver ${label}`,
      action: `Create or update the paid deliverable for ${service}, including any bump, upsell, or downsell context from the ThriveCart payload.`,
      ownerTool: "erie-pro",
      targetTools: ["neon", "boostspace", "suitedash"],
      automationKey: "revenue.deliver.paid_offer",
      dueInMinutes: 5,
    })
  }

  if (recovery) {
    const title = event.includes("refund")
      ? `Start refund-save path for ${label}`
      : event.includes("cancel")
        ? `Start cancellation winback for ${label}`
        : `Recover abandoned checkout for ${label}`
    actions.push({
      outcome: "recover",
      priority: input.amountCents && input.amountCents >= 19900 ? "high" : "normal",
      title,
      action: "Trigger the matching recovery sequence, preserve the original service context, and avoid showing the same checkout prompt as a cold offer.",
      ownerTool: "thrivecart",
      targetTools: ["boostspace", "taskade", "convertbox", "emailit"],
      automationKey: event.includes("refund")
        ? "revenue.recover.refund"
        : event.includes("cancel")
          ? "revenue.recover.subscription_cancelled"
          : "revenue.recover.abandoned_cart",
      dueInMinutes: event.includes("abandon") ? 60 : 15,
    })
  }

  actions.push({
    outcome: "route",
    priority: paid ? "high" : "normal",
    title: `Route ${label} context`,
    action: `Sync the canonical Neon record to ${routeOwner}, keeping customer, service, coupon, affiliate, funnel, and UTM context attached.`,
    ownerTool: "neon",
    targetTools: ["boostspace", routeOwner, "suitedash"].filter((tool, index, list) => list.indexOf(tool) === index),
    automationKey: "revenue.route.context",
    dueInMinutes: paid ? 10 : 120,
  })

  actions.push({
    outcome: "learn",
    priority: "normal",
    title: `Learn from ${event}`,
    action: "Update reporting dimensions for service, funnel, offer, bump/upsell/downsell, coupon, affiliate, ConvertBox path, and traffic source.",
    ownerTool: "neon",
    targetTools: ["erie-pro", "admin-dashboard"],
    automationKey: "revenue.learn.attribution",
  })

  return {
    eventType: event,
    primaryOutcome: paid ? "deliver" : recovery ? "recover" : "route",
    actions,
    shouldFulfill: paid,
    shouldRecover: recovery,
    shouldRoute: true,
    shouldLearn: true,
  }
}

export async function recordRevenueActionPlan(input: RevenueActionInput) {
  const plan = buildRevenueActionPlan(input)
  const records = await Promise.all(plan.actions.map((action) =>
    prisma.offerInteraction.create({
      data: {
        customerId: input.customerId ?? null,
        eventType: `revenue_action.${action.outcome}`,
        serviceSlug: input.serviceSlug ?? undefined,
        serviceLabel: input.serviceLabel ?? undefined,
        serviceFamily: input.serviceFamily ?? undefined,
        sourcePage: input.sourcePage ?? undefined,
        sourcePageType: input.sourcePageType ?? input.sourceSystem,
        convertBoxId: input.convertBoxId ?? undefined,
        utmSource: input.utmSource ?? undefined,
        utmMedium: input.utmMedium ?? undefined,
        utmCampaign: input.utmCampaign ?? undefined,
        gclid: input.gclid ?? undefined,
        metadata: {
          status: "planned",
          sourceSystem: input.sourceSystem,
          sourceEventType: input.eventType,
          primaryOutcome: plan.primaryOutcome,
          purchaseId: input.purchaseId ?? null,
          offerSlug: input.offerSlug ?? null,
          offerTitle: input.offerTitle ?? null,
          customerEmail: input.customerEmail ?? null,
          funnelSlug: input.funnelSlug ?? null,
          orderId: input.orderId ?? null,
          productId: input.productId ?? null,
          coupon: input.coupon ?? null,
          affiliate: input.affiliate ?? null,
          amountCents: input.amountCents ?? null,
          action,
          eventMetadata: input.metadata ?? {},
        } as Prisma.InputJsonValue,
      },
      select: { id: true, eventType: true },
    }),
  ))

  return { plan, records }
}

export function buildRevenueActionAutomationPayload(input: {
  actionId: string
  eventType: string
  status?: string | null
  action?: RevenueAction | null
  sourceSystem?: string | null
  sourceEventType?: string | null
  purchaseId?: string | null
  offerSlug?: string | null
  offerTitle?: string | null
  customerEmail?: string | null
  funnelSlug?: string | null
  orderId?: string | null
  productId?: string | null
  coupon?: string | null
  affiliate?: string | null
  amountCents?: number | null
  serviceSlug?: string | null
  serviceLabel?: string | null
  serviceFamily?: string | null
  sourcePage?: string | null
  sourcePageType?: string | null
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
  gclid?: string | null
  eventMetadata?: Record<string, unknown> | null
}): RevenueActionAutomationPayload {
  const outcome = input.eventType.replace("revenue_action.", "") as RevenueOutcome
  const action = input.action
  const targetTools = action?.targetTools ?? []
  const preferredTool =
    action?.ownerTool === "neon"
      ? targetTools.find((tool) => tool !== "neon") ?? "boostspace"
      : action?.ownerTool ?? "boostspace"

  return {
    actionId: input.actionId,
    automationKey: action?.automationKey ?? null,
    outcome,
    status: input.status ?? "planned",
    priority: action?.priority ?? "normal",
    ownerTool: action?.ownerTool ?? "neon",
    targetTools,
    title: action?.title ?? "Planned revenue action",
    action: action?.action ?? null,
    routing: {
      preferredTool,
      fallbackTools: targetTools.filter((tool) => tool !== preferredTool),
      suggestedStatus: "queued",
    },
    context: {
      sourceSystem: input.sourceSystem ?? null,
      sourceEventType: input.sourceEventType ?? null,
      purchaseId: input.purchaseId ?? null,
      offerSlug: input.offerSlug ?? null,
      offerTitle: input.offerTitle ?? null,
      customerEmail: input.customerEmail ?? null,
      funnelSlug: input.funnelSlug ?? null,
      orderId: input.orderId ?? null,
      productId: input.productId ?? null,
      serviceSlug: input.serviceSlug ?? null,
      serviceLabel: input.serviceLabel ?? null,
      serviceFamily: input.serviceFamily ?? null,
      sourcePage: input.sourcePage ?? null,
      sourcePageType: input.sourcePageType ?? null,
      coupon: input.coupon ?? null,
      affiliate: input.affiliate ?? null,
      amountCents: input.amountCents ?? null,
      utmSource: input.utmSource ?? null,
      utmMedium: input.utmMedium ?? null,
      utmCampaign: input.utmCampaign ?? null,
      gclid: input.gclid ?? null,
      eventMetadata: input.eventMetadata ?? null,
    },
  }
}

export const revenueActionPlaybook: Array<{
  outcome: RevenueOutcome
  description: string
  triggerExamples: string[]
  defaultOwner: string
}> = [
  {
    outcome: "deliver",
    description: "Create the purchased asset, entitlement, portal context, or subscription report.",
    triggerExamples: ["order.success", "order.payment_bump", "order.payment_upsell", "subscription.payment"],
    defaultOwner: "erie-pro",
  },
  {
    outcome: "recover",
    description: "Save abandoned, cancelled, failed, or refund-risk revenue with the correct follow-up path.",
    triggerExamples: ["cart.abandoned", "order.refunded", "subscription.cancelled", "payment.failed"],
    defaultOwner: "thrivecart",
  },
  {
    outcome: "route",
    description: "Move the canonical Neon context to Boost.space, SuiteDash, Taskade, ProductDyno, or another selected tool.",
    triggerExamples: ["purchase.created", "lead.created", "asset.generated", "sync.failed"],
    defaultOwner: "neon",
  },
  {
    outcome: "learn",
    description: "Record attribution and performance data for dashboards and future funnel decisions.",
    triggerExamples: ["funnel.viewed", "checkout.clicked", "coupon.used", "affiliate.sale"],
    defaultOwner: "neon",
  },
]

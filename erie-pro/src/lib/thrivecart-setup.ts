import {
  automatedOffers,
  getOfferBySlug,
  type AutomatedOfferDefinition,
  type AutomatedOfferSlug,
} from "@/lib/automated-offers"

export type ThriveCartSetupProduct = {
  slug: AutomatedOfferSlug
  title: string
  productId: string
  checkoutUrl: string
  priceCents: number
  successUrl: string
  fulfillmentUrl: string
  orderBump?: ThriveCartRelatedOffer
  upsell?: ThriveCartRelatedOffer
  downsell?: ThriveCartRelatedOffer
  abandonedCartTag: string
  couponFamilies: string[]
  splitTests: string[]
  affiliateEligible: boolean
  subscriptionEligible: boolean
  passthroughFields: string[]
  checkoutDesignChecklist: string[]
  webhookEvents: string[]
}

export type ThriveCartRelatedOffer = {
  slug: AutomatedOfferSlug
  title: string
  productId?: string
  checkoutUrl?: string
  priceCents: number
}

export type ThriveCartEventSubscription = {
  event: string
  target_url: string
  trigger_fields?: Record<string, unknown>
}

export type ThriveCartSetupExport = {
  generatedAt: string
  appUrl: string
  accountSlug: string
  webhookUrl: string
  webhookTokenVariable: string
  apiKeyVariable: string
  references: Array<{ title: string; url: string }>
  globalPassthroughFields: string[]
  products: ThriveCartSetupProduct[]
  eventSubscriptions: ThriveCartEventSubscription[]
  manualDashboardTasks: string[]
}

const checkoutEvents = [
  "order_created",
  "order_payment_product",
  "order_payment_bump",
  "order_payment_upsell",
  "order_payment_downsell",
  "order_rebill",
  "order_rebill_failed",
  "order_rebill_completed",
  "order_rebill_cancelled",
  "order_refund_product",
  "order_refund_bump",
  "order_refund_upsell",
  "order_refund_downsell",
  "subscription_paused",
  "subscription_resumed",
  "cart_abandoned",
  "affiliate_approved",
  "affiliate_rejected",
  "affiliate_commission_earned",
  "affiliate_commission_payout",
  "affiliate_commission_refund",
]

export const thriveCartPassthroughFields = [
  "serviceSlug",
  "serviceLabel",
  "serviceFamily",
  "sourcePage",
  "sourcePageType",
  "convertBoxId",
  "offerSlug",
  "funnelSlug",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "gclid",
  "affiliate",
  "coupon",
] as const

function asUrl(appUrl: string, path: string) {
  return `${appUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`
}

function relatedOffer(slug: AutomatedOfferSlug | undefined): ThriveCartRelatedOffer | undefined {
  if (!slug) return undefined
  const offer = getOfferBySlug(slug)
  if (!offer) return undefined
  return {
    slug: offer.slug,
    title: offer.title,
    productId: offer.checkoutProductId,
    checkoutUrl: offer.checkoutUrl,
    priceCents: offer.basePriceCents,
  }
}

function designChecklist(offer: AutomatedOfferDefinition) {
  return [
    "Use a two-column desktop checkout with order summary visible and a single-column mobile flow.",
    "Place Erie County/service-specific outcome copy above the payment section.",
    "Use strong text/background contrast, concise labels, and no internal strategy language.",
    "Show guarantee/risk-reversal copy directly before payment.",
    "Place order bump immediately after customer details and before payment.",
    `Frame the purchase as ${offer.shortTitle}, not generic consulting.`,
    "Keep the primary CTA action-oriented and customer-facing.",
  ]
}

function productSetup(offer: AutomatedOfferDefinition, appUrl: string): ThriveCartSetupProduct {
  if (!offer.thriveCartFunnel || !offer.checkoutProductId || !offer.checkoutUrl) {
    throw new Error(`Paid offer is missing ThriveCart setup fields: ${offer.slug}`)
  }

  return {
    slug: offer.slug,
    title: offer.title,
    productId: offer.checkoutProductId,
    checkoutUrl: offer.checkoutUrl,
    priceCents: offer.basePriceCents,
    successUrl: asUrl(appUrl, offer.thriveCartFunnel.successPath),
    fulfillmentUrl: asUrl(appUrl, `/api/webhooks/thrivecart?token=${"${THRIVECART_WEBHOOK_TOKEN}"}`),
    orderBump: relatedOffer(offer.thriveCartFunnel.orderBumpSlug),
    upsell: relatedOffer(offer.thriveCartFunnel.upsellSlug),
    downsell: relatedOffer(offer.thriveCartFunnel.downsellSlug),
    abandonedCartTag: offer.thriveCartFunnel.abandonedCartTag,
    couponFamilies: offer.thriveCartFunnel.couponFamilies,
    splitTests: offer.thriveCartFunnel.splitTests,
    affiliateEligible: offer.thriveCartFunnel.affiliateEligible,
    subscriptionEligible: offer.thriveCartFunnel.subscriptionEligible,
    passthroughFields: [...thriveCartPassthroughFields],
    checkoutDesignChecklist: designChecklist(offer),
    webhookEvents: checkoutEvents,
  }
}

export function buildThriveCartEventSubscriptions(appUrl: string): ThriveCartEventSubscription[] {
  const targetUrl = asUrl(appUrl, "/api/webhooks/thrivecart")
  return checkoutEvents.map((event) => ({
    event,
    target_url: targetUrl,
  }))
}

export function buildThriveCartSetupExport(appUrl: string, accountSlug = "relgard"): ThriveCartSetupExport {
  const paidOffers = automatedOffers.filter((offer) => offer.basePriceCents > 0)
  return {
    generatedAt: new Date().toISOString(),
    appUrl: appUrl.replace(/\/$/, ""),
    accountSlug,
    webhookUrl: asUrl(appUrl, "/api/webhooks/thrivecart"),
    webhookTokenVariable: "THRIVECART_WEBHOOK_TOKEN",
    apiKeyVariable: "THRIVECART_API_KEY",
    references: [
      {
        title: "ThriveCart Event Subscription API",
        url: "https://developers.thrivecart.com/documentation/event_subscription/intro/",
      },
      {
        title: "ThriveCart API key authentication",
        url: "https://developers.thrivecart.com/documentation/intro/authentication-via-api-key/",
      },
      {
        title: "ThriveCart passthrough custom variables",
        url: "https://support.thrivecart.com/help/passing-custom-variables-through-the-checkout/",
      },
    ],
    globalPassthroughFields: [...thriveCartPassthroughFields],
    products: paidOffers.map((offer) => productSetup(offer, appUrl)),
    eventSubscriptions: buildThriveCartEventSubscriptions(appUrl),
    manualDashboardTasks: [
      "Create or confirm each product/page listed in products.",
      "Attach the listed order bump, upsell, and downsell to each product funnel.",
      "Set each product success URL to the Erie.Pro success path.",
      "Enable abandoned cart behavior with the listed tag.",
      "Create coupon families listed for each product.",
      "Enable affiliate eligibility where listed.",
      "Configure split tests listed for each product.",
      "Confirm each checkout URL passes the required passthrough fields.",
      "Install event subscriptions via API or create the account webhook manually.",
    ],
  }
}

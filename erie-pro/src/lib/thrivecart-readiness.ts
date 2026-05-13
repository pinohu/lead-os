import { automatedOffers, getOfferBySlug, type AutomatedOfferDefinition } from "@/lib/automated-offers"

export type ThriveCartReadinessIssue = {
  offerSlug: string
  severity: "blocker" | "warning"
  message: string
}

export type ThriveCartReadinessItem = {
  offerSlug: string
  title: string
  checkoutProductId?: string
  checkoutUrl?: string
  successPath?: string
  orderBumpSlug?: string
  upsellSlug?: string
  downsellSlug?: string
  connected: boolean
  issues: ThriveCartReadinessIssue[]
}

function issue(offer: AutomatedOfferDefinition, severity: "blocker" | "warning", message: string): ThriveCartReadinessIssue {
  return { offerSlug: offer.slug, severity, message }
}

function validateRelatedOffer(
  offer: AutomatedOfferDefinition,
  relatedSlug: string | undefined,
  role: "order bump" | "upsell" | "downsell",
) {
  if (!relatedSlug) return [issue(offer, "warning", `Missing ${role} offer.`)]
  const related = getOfferBySlug(relatedSlug)
  if (!related) return [issue(offer, "blocker", `Configured ${role} offer does not exist: ${relatedSlug}.`)]
  if (related.basePriceCents > 0 && !related.checkoutUrl) {
    return [issue(offer, "warning", `${role} offer exists but has no checkout URL: ${relatedSlug}.`)]
  }
  return []
}

export function getThriveCartReadiness() {
  const paidOffers = automatedOffers.filter((offer) => offer.basePriceCents > 0)
  const items: ThriveCartReadinessItem[] = paidOffers.map((offer) => {
    const funnel = offer.thriveCartFunnel
    const issues: ThriveCartReadinessIssue[] = []

    if (!offer.checkoutUrl) issues.push(issue(offer, "blocker", "Missing checkout URL."))
    if (offer.checkoutUrl && !offer.checkoutUrl.startsWith("https://relgard.thrivecart.com/")) {
      issues.push(issue(offer, "warning", "Checkout URL is not on the expected relgard.thrivecart.com account."))
    }
    if (!offer.checkoutProductId) issues.push(issue(offer, "blocker", "Missing ThriveCart product ID."))
    if (!funnel) {
      issues.push(issue(offer, "blocker", "Missing ThriveCart funnel metadata."))
    } else {
      if (funnel.checkoutUrl !== offer.checkoutUrl) issues.push(issue(offer, "warning", "Offer checkout URL and funnel checkout URL differ."))
      if (funnel.productId !== offer.checkoutProductId) issues.push(issue(offer, "warning", "Offer product ID and funnel product ID differ."))
      if (!funnel.successPath?.startsWith("/offers/success/")) issues.push(issue(offer, "blocker", "Missing connected Erie.Pro success path."))
      if (!funnel.abandonedCartTag) issues.push(issue(offer, "warning", "Missing abandoned cart tag."))
      if (funnel.couponFamilies.length === 0) issues.push(issue(offer, "warning", "Missing coupon families."))
      if (funnel.splitTests.length === 0) issues.push(issue(offer, "warning", "Missing split-test targets."))
      issues.push(...validateRelatedOffer(offer, funnel.orderBumpSlug, "order bump"))
      issues.push(...validateRelatedOffer(offer, funnel.upsellSlug, "upsell"))
      issues.push(...validateRelatedOffer(offer, funnel.downsellSlug, "downsell"))
    }

    return {
      offerSlug: offer.slug,
      title: offer.title,
      checkoutProductId: offer.checkoutProductId,
      checkoutUrl: offer.checkoutUrl,
      successPath: funnel?.successPath,
      orderBumpSlug: funnel?.orderBumpSlug,
      upsellSlug: funnel?.upsellSlug,
      downsellSlug: funnel?.downsellSlug,
      connected: issues.every((item) => item.severity !== "blocker"),
      issues,
    }
  })

  return {
    total: items.length,
    connected: items.filter((item) => item.connected).length,
    blockers: items.flatMap((item) => item.issues).filter((item) => item.severity === "blocker").length,
    warnings: items.flatMap((item) => item.issues).filter((item) => item.severity === "warning").length,
    items,
  }
}

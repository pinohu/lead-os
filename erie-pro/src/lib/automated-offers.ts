import { niches, type LocalNiche } from "@/lib/niches"

export type AutomatedOfferSlug =
  | "erie-lead-readiness-scorecard"
  | "service-page-conversion-blueprint"
  | "provider-launch-kit"
  | "growth-intelligence-subscription"
  | "convertbox-funnel-in-a-box"
  | "review-reputation-growth-kit"
  | "missed-call-recovery-kit"
  | "seasonal-booking-campaign-pack"
  | "government-opportunity-scanner"
  | "client-portal-starter-pack"

export type AutomatedOfferDefinition = {
  slug: AutomatedOfferSlug
  title: string
  shortTitle: string
  description: string
  category: string
  fulfillmentType:
    | "scorecard"
    | "blueprint"
    | "template_kit"
    | "campaign_kit"
    | "automation_kit"
    | "subscription_report"
    | "website_blueprint"
  basePriceCents: number
  checkoutProductId?: string
  checkoutUrl?: string
  thriveCartFunnel?: ThriveCartFunnelDefinition
  fulfillmentChannels?: FulfillmentChannelDefinition[]
  repoSource: string
  sortOrder: number
  primaryCta: string
}

export type ThriveCartFunnelDefinition = {
  checkoutUrl: string
  productId: string
  orderBumpSlug?: AutomatedOfferSlug
  upsellSlug?: AutomatedOfferSlug
  downsellSlug?: AutomatedOfferSlug
  successPath: string
  abandonedCartTag: string
  affiliateEligible: boolean
  subscriptionEligible: boolean
  couponFamilies: string[]
  splitTests: string[]
}

export type FulfillmentChannelDefinition = {
  toolId: "erie-pro" | "boostspace" | "suitedash" | "taskade" | "productdyno" | "documents"
  role: string
  required: boolean
}

export type ServiceOfferRecommendation = {
  serviceSlug: string
  serviceLabel: string
  serviceFamily: string
  offerSlug: AutomatedOfferSlug
  priority: number
  visitorSegment: "provider" | "requester"
  urgency: "standard" | "urgent" | "emergency" | "seasonal"
  conversionAngle: string
  painPoint: string
  recommendedPriceCents: number
  isPrimary: boolean
}

const emergencyServices = new Set([
  "plumbing",
  "hvac",
  "electrical",
  "roofing",
  "garage-door",
  "appliance-repair",
  "septic",
  "locksmith",
  "towing",
  "restoration",
  "glass",
  "mold-remediation",
  "fire-damage-restoration",
  "storm-damage-repair",
  "water-heater-services",
  "drain-cleaning",
  "sewer-line-repair",
  "ac-repair",
  "furnace-repair",
  "emergency-board-up",
  "basement-flood-cleanup",
  "ice-dam-removal",
])

const seasonalServices = new Set([
  "landscaping",
  "tree-service",
  "chimney",
  "pool-spa",
  "gutters",
  "snow-removal",
  "irrigation",
  "asphalt-sealing",
  "commercial-snow-removal",
  "outdoor-lighting",
  "holiday-lighting",
  "boat-repair-marine-services",
  "dock-installation-repair",
  "marina-boat-winterization",
  "lakefront-property-maintenance",
  "snow-plow-contractors",
  "salt-deicing-services",
  "storm-window-repair",
])

const professionalServices = new Set([
  "legal",
  "real-estate",
  "accounting",
  "photography",
  "home-inspection",
  "property-management",
  "septic-inspection",
  "airbnb-property-management",
  "funeral-homes",
  "insurance-agents",
  "financial-advisors",
  "mortgage-brokers",
  "estate-sale-services",
])

const healthServices = new Set([
  "dental",
  "veterinary",
  "chiropractic",
  "pet-grooming",
  "optometry",
  "dermatology",
  "physical-therapy",
  "mental-health-counseling",
  "senior-home-care",
  "home-health-care",
  "hearing-aids-audiology",
])

const cleaningServices = new Set([
  "cleaning",
  "moving",
  "carpet-cleaning",
  "pressure-washing",
  "junk-removal",
  "dumpster-rental",
  "rental-turnover-cleaning",
  "commercial-cleaning",
  "vacation-rental-cleaning",
])

const pestEnvironmentalServices = new Set([
  "pest-control",
  "mold-remediation",
  "radon-testing-mitigation",
  "wildlife-removal",
  "bat-removal",
  "bee-wasp-removal",
  "well-water-testing",
])

const autoMarineServices = new Set([
  "auto-repair",
  "towing",
  "boat-repair-marine-services",
  "dock-installation-repair",
  "marina-boat-winterization",
])

export const automatedOffers: AutomatedOfferDefinition[] = [
  {
    slug: "erie-lead-readiness-scorecard",
    title: "Erie County Lead Readiness Scorecard",
    shortTitle: "Lead Readiness Scorecard",
    description: "A self-serve scorecard that shows local providers where their website, listing, and follow-up path are leaking leads.",
    category: "lead-intelligence",
    fulfillmentType: "scorecard",
    basePriceCents: 0,
    checkoutProductId: "erie-scorecard",
    repoSource: "lead-os",
    sortOrder: 10,
    primaryCta: "Get my scorecard",
  },
  {
    slug: "service-page-conversion-blueprint",
    title: "Service Page Conversion Blueprint",
    shortTitle: "Conversion Blueprint",
    description: "A service-specific page and funnel blueprint with Erie County positioning, CTAs, trust signals, and follow-up copy.",
    category: "conversion-blueprint",
    fulfillmentType: "blueprint",
    basePriceCents: 9900,
    checkoutProductId: "157",
    checkoutUrl: "https://relgard.thrivecart.com/erie-conversion-blueprint/",
    thriveCartFunnel: {
      checkoutUrl: "https://relgard.thrivecart.com/erie-conversion-blueprint/",
      productId: "157",
      orderBumpSlug: "review-reputation-growth-kit",
      upsellSlug: "provider-launch-kit",
      downsellSlug: "missed-call-recovery-kit",
      successPath: "/offers/success/service-page-conversion-blueprint",
      abandonedCartTag: "tc_abandoned_conversion_blueprint",
      affiliateEligible: true,
      subscriptionEligible: false,
      couponFamilies: ["launch", "partner", "provider", "recovery"],
      splitTests: ["checkout-headline", "guarantee-copy", "order-bump-copy"],
    },
    fulfillmentChannels: [
      { toolId: "erie-pro", role: "Generate HTML blueprint asset and success page", required: true },
      { toolId: "boostspace", role: "Sync purchase and fulfillment event", required: true },
      { toolId: "suitedash", role: "Create provider/client operations record", required: true },
      { toolId: "documents", role: "Optional PDF blueprint when document delivery is enabled", required: false },
    ],
    repoSource: "lead-os,dynasty-authority-template",
    sortOrder: 20,
    primaryCta: "Build my blueprint",
  },
  {
    slug: "provider-launch-kit",
    title: "Provider Launch Kit",
    shortTitle: "Provider Launch Kit",
    description: "A complete self-serve launch pack for a provider to tighten their offer, intake, local trust, and follow-up.",
    category: "launch-kit",
    fulfillmentType: "template_kit",
    basePriceCents: 39900,
    checkoutProductId: "158",
    checkoutUrl: "https://relgard.thrivecart.com/erie-provider-launch-kit/",
    thriveCartFunnel: {
      checkoutUrl: "https://relgard.thrivecart.com/erie-provider-launch-kit/",
      productId: "158",
      orderBumpSlug: "growth-intelligence-subscription",
      upsellSlug: "client-portal-starter-pack",
      downsellSlug: "service-page-conversion-blueprint",
      successPath: "/offers/success/provider-launch-kit",
      abandonedCartTag: "tc_abandoned_provider_launch",
      affiliateEligible: true,
      subscriptionEligible: false,
      couponFamilies: ["launch", "partner", "provider"],
      splitTests: ["checkout-layout", "proof-block", "order-bump-copy"],
    },
    fulfillmentChannels: [
      { toolId: "erie-pro", role: "Generate launch kit asset", required: true },
      { toolId: "boostspace", role: "Route automation event", required: true },
      { toolId: "suitedash", role: "Create provider workspace record", required: true },
      { toolId: "taskade", role: "Create manual review task for serious providers", required: false },
      { toolId: "productdyno", role: "Protected kit delivery when member access is enabled", required: false },
    ],
    repoSource: "dynasty-launcher,dynasty-services,lead-os",
    sortOrder: 30,
    primaryCta: "Launch my provider kit",
  },
  {
    slug: "growth-intelligence-subscription",
    title: "Growth Intelligence Subscription",
    shortTitle: "Growth Intelligence",
    description: "Monthly automated insights, seasonal prompts, and opportunity alerts for the provider's Erie County service category.",
    category: "subscription",
    fulfillmentType: "subscription_report",
    basePriceCents: 19900,
    checkoutProductId: "160",
    checkoutUrl: "https://relgard.thrivecart.com/erie-growth-intelligence/",
    thriveCartFunnel: {
      checkoutUrl: "https://relgard.thrivecart.com/erie-growth-intelligence/",
      productId: "160",
      orderBumpSlug: "seasonal-booking-campaign-pack",
      upsellSlug: "provider-launch-kit",
      downsellSlug: "review-reputation-growth-kit",
      successPath: "/offers/success/growth-intelligence-subscription",
      abandonedCartTag: "tc_abandoned_growth_intelligence",
      affiliateEligible: true,
      subscriptionEligible: true,
      couponFamilies: ["launch", "partner", "monthly", "winback"],
      splitTests: ["subscription-price-frame", "monthly-proof", "guarantee-copy"],
    },
    fulfillmentChannels: [
      { toolId: "erie-pro", role: "Generate subscription entitlement and first report", required: true },
      { toolId: "boostspace", role: "Sync subscription lifecycle events", required: true },
      { toolId: "suitedash", role: "Create ongoing provider operations record", required: true },
      { toolId: "taskade", role: "Create monthly review queue item", required: false },
    ],
    repoSource: "lead-os,SAM-Scout,leadOSGov",
    sortOrder: 40,
    primaryCta: "Start monthly intelligence",
  },
  {
    slug: "convertbox-funnel-in-a-box",
    title: "ConvertBox Funnel-in-a-Box",
    shortTitle: "Funnel-in-a-Box",
    description: "A service-specific overlay funnel plan with steps, triggers, copy, fields, and checkout paths.",
    category: "convertbox",
    fulfillmentType: "automation_kit",
    basePriceCents: 29900,
    checkoutProductId: "159",
    checkoutUrl: "https://relgard.thrivecart.com/erie-convertbox-funnel/",
    thriveCartFunnel: {
      checkoutUrl: "https://relgard.thrivecart.com/erie-convertbox-funnel/",
      productId: "159",
      orderBumpSlug: "missed-call-recovery-kit",
      upsellSlug: "provider-launch-kit",
      downsellSlug: "review-reputation-growth-kit",
      successPath: "/offers/success/convertbox-funnel-in-a-box",
      abandonedCartTag: "tc_abandoned_convertbox_funnel",
      affiliateEligible: true,
      subscriptionEligible: false,
      couponFamilies: ["launch", "provider", "recovery"],
      splitTests: ["service-specific-copy", "order-bump-copy", "success-path-copy"],
    },
    fulfillmentChannels: [
      { toolId: "erie-pro", role: "Generate service-specific ConvertBox plan", required: true },
      { toolId: "boostspace", role: "Sync purchase and implementation event", required: true },
      { toolId: "suitedash", role: "Create provider operations record", required: true },
      { toolId: "productdyno", role: "Optional protected template library", required: false },
    ],
    repoSource: "lead-os,lead-os-embed-widgets",
    sortOrder: 50,
    primaryCta: "Get my funnel kit",
  },
  {
    slug: "review-reputation-growth-kit",
    title: "Review & Reputation Growth Kit",
    shortTitle: "Review Growth Kit",
    description: "Review request scripts, QR copy, email/SMS sequences, and reputation-safe follow-up templates.",
    category: "reputation",
    fulfillmentType: "template_kit",
    basePriceCents: 9900,
    checkoutProductId: "165",
    checkoutUrl: "https://relgard.thrivecart.com/erie-review-reputation/",
    thriveCartFunnel: {
      checkoutUrl: "https://relgard.thrivecart.com/erie-review-reputation/",
      productId: "165",
      orderBumpSlug: "missed-call-recovery-kit",
      upsellSlug: "service-page-conversion-blueprint",
      downsellSlug: "seasonal-booking-campaign-pack",
      successPath: "/offers/success/review-reputation-growth-kit",
      abandonedCartTag: "tc_abandoned_review_reputation",
      affiliateEligible: true,
      subscriptionEligible: false,
      couponFamilies: ["launch", "provider", "reputation"],
      splitTests: ["review-proof", "checkout-headline", "bump-position"],
    },
    fulfillmentChannels: [
      { toolId: "erie-pro", role: "Generate reputation kit asset", required: true },
      { toolId: "boostspace", role: "Sync reputation purchase", required: true },
      { toolId: "suitedash", role: "Attach kit to provider record", required: true },
      { toolId: "documents", role: "Optional printable scripts and QR guidance", required: false },
    ],
    repoSource: "lead-os,SuiteDash",
    sortOrder: 60,
    primaryCta: "Improve my reviews",
  },
  {
    slug: "missed-call-recovery-kit",
    title: "Missed-Call Recovery Kit",
    shortTitle: "Missed-Call Kit",
    description: "Callback scripts, SMS/email recovery templates, voicemail prompts, and response-time guidance.",
    category: "response",
    fulfillmentType: "automation_kit",
    basePriceCents: 14900,
    checkoutProductId: "163",
    checkoutUrl: "https://relgard.thrivecart.com/erie-missed-call-kit/",
    thriveCartFunnel: {
      checkoutUrl: "https://relgard.thrivecart.com/erie-missed-call-kit/",
      productId: "163",
      orderBumpSlug: "review-reputation-growth-kit",
      upsellSlug: "convertbox-funnel-in-a-box",
      downsellSlug: "service-page-conversion-blueprint",
      successPath: "/offers/success/missed-call-recovery-kit",
      abandonedCartTag: "tc_abandoned_missed_call",
      affiliateEligible: true,
      subscriptionEligible: false,
      couponFamilies: ["launch", "emergency", "recovery"],
      splitTests: ["urgency-copy", "order-bump-copy", "checkout-headline"],
    },
    fulfillmentChannels: [
      { toolId: "erie-pro", role: "Generate missed-call recovery kit", required: true },
      { toolId: "boostspace", role: "Sync recovery event", required: true },
      { toolId: "suitedash", role: "Store response workflow context", required: true },
      { toolId: "taskade", role: "Create implementation reminder when configured", required: false },
    ],
    repoSource: "lead-os,leadnest-flow-forge",
    sortOrder: 70,
    primaryCta: "Recover missed calls",
  },
  {
    slug: "seasonal-booking-campaign-pack",
    title: "Seasonal Booking Campaign Pack",
    shortTitle: "Seasonal Campaign Pack",
    description: "Seasonal campaign calendar, offer prompts, email/SMS copy, and booking reminders for Erie County timing.",
    category: "seasonal",
    fulfillmentType: "campaign_kit",
    basePriceCents: 14900,
    checkoutProductId: "164",
    checkoutUrl: "https://relgard.thrivecart.com/erie-seasonal-booking/",
    thriveCartFunnel: {
      checkoutUrl: "https://relgard.thrivecart.com/erie-seasonal-booking/",
      productId: "164",
      orderBumpSlug: "growth-intelligence-subscription",
      upsellSlug: "provider-launch-kit",
      downsellSlug: "review-reputation-growth-kit",
      successPath: "/offers/success/seasonal-booking-campaign-pack",
      abandonedCartTag: "tc_abandoned_seasonal_booking",
      affiliateEligible: true,
      subscriptionEligible: false,
      couponFamilies: ["seasonal", "launch", "provider"],
      splitTests: ["seasonal-window-copy", "order-bump-copy", "calendar-proof"],
    },
    fulfillmentChannels: [
      { toolId: "erie-pro", role: "Generate seasonal campaign calendar and copy", required: true },
      { toolId: "boostspace", role: "Sync seasonal campaign event", required: true },
      { toolId: "suitedash", role: "Attach campaign assets to provider record", required: true },
      { toolId: "documents", role: "Optional campaign PDF", required: false },
    ],
    repoSource: "lead-os,dynasty-services",
    sortOrder: 80,
    primaryCta: "Plan my season",
  },
  {
    slug: "government-opportunity-scanner",
    title: "Government Opportunity Scanner",
    shortTitle: "Gov Opportunity Scanner",
    description: "Automated public-sector opportunity alerts and fit summaries for service providers that can sell to institutions.",
    category: "opportunity-scanner",
    fulfillmentType: "subscription_report",
    basePriceCents: 29900,
    checkoutProductId: "161",
    checkoutUrl: "https://relgard.thrivecart.com/erie-gov-opportunity/",
    thriveCartFunnel: {
      checkoutUrl: "https://relgard.thrivecart.com/erie-gov-opportunity/",
      productId: "161",
      orderBumpSlug: "client-portal-starter-pack",
      upsellSlug: "growth-intelligence-subscription",
      downsellSlug: "seasonal-booking-campaign-pack",
      successPath: "/offers/success/government-opportunity-scanner",
      abandonedCartTag: "tc_abandoned_gov_opportunity",
      affiliateEligible: true,
      subscriptionEligible: true,
      couponFamilies: ["launch", "government", "partner", "monthly"],
      splitTests: ["opportunity-proof", "subscription-price-frame", "order-bump-copy"],
    },
    fulfillmentChannels: [
      { toolId: "erie-pro", role: "Generate first opportunity scanner asset", required: true },
      { toolId: "boostspace", role: "Sync opportunity and subscription events", required: true },
      { toolId: "suitedash", role: "Create provider operations record", required: true },
      { toolId: "taskade", role: "Create recurring opportunity review task", required: false },
    ],
    repoSource: "SAM-Scout,leadOSGov",
    sortOrder: 90,
    primaryCta: "Find government opportunities",
  },
  {
    slug: "client-portal-starter-pack",
    title: "Client Portal Starter Pack",
    shortTitle: "Client Portal Pack",
    description: "SuiteDash-ready intake, client stages, task templates, and onboarding messages for repeatable service delivery.",
    category: "operations",
    fulfillmentType: "template_kit",
    basePriceCents: 19900,
    checkoutProductId: "162",
    checkoutUrl: "https://relgard.thrivecart.com/erie-client-portal/",
    thriveCartFunnel: {
      checkoutUrl: "https://relgard.thrivecart.com/erie-client-portal/",
      productId: "162",
      orderBumpSlug: "review-reputation-growth-kit",
      upsellSlug: "provider-launch-kit",
      downsellSlug: "service-page-conversion-blueprint",
      successPath: "/offers/success/client-portal-starter-pack",
      abandonedCartTag: "tc_abandoned_client_portal",
      affiliateEligible: true,
      subscriptionEligible: false,
      couponFamilies: ["launch", "operations", "provider"],
      splitTests: ["portal-outcome-copy", "order-bump-copy", "checkout-layout"],
    },
    fulfillmentChannels: [
      { toolId: "erie-pro", role: "Generate portal starter pack", required: true },
      { toolId: "boostspace", role: "Sync operations purchase", required: true },
      { toolId: "suitedash", role: "Prepare client/provider portal record", required: true },
      { toolId: "productdyno", role: "Optional template library delivery", required: false },
    ],
    repoSource: "SuiteDash,dynasty-saas-template",
    sortOrder: 100,
    primaryCta: "Set up my client portal",
  },
]

export function inferServiceFamily(serviceSlug: string) {
  if (emergencyServices.has(serviceSlug)) return "Emergency Home Response"
  if (seasonalServices.has(serviceSlug)) return "Seasonal Erie Services"
  if (professionalServices.has(serviceSlug)) return "Professional and Financial"
  if (healthServices.has(serviceSlug)) return "Health and Appointments"
  if (cleaningServices.has(serviceSlug)) return "Cleaning and Turnover"
  if (pestEnvironmentalServices.has(serviceSlug)) return "Pest and Environmental"
  if (autoMarineServices.has(serviceSlug)) return "Auto Marine Roadside"
  return "Planned Home Projects"
}

export function getOfferBySlug(slug: string) {
  return automatedOffers.find((offer) => offer.slug === slug)
}

export function getServiceOfferRecommendations(niche: LocalNiche): ServiceOfferRecommendation[] {
  const serviceFamily = inferServiceFamily(niche.slug)
  const basePainPoint = `${niche.label} providers can lose Erie County buyers when their page, proof, intake, or follow-up path is unclear.`

  const recommendations: ServiceOfferRecommendation[] = [
    {
      serviceSlug: niche.slug,
      serviceLabel: niche.label,
      serviceFamily,
      offerSlug: "erie-lead-readiness-scorecard",
      priority: 10,
      visitorSegment: "provider",
      urgency: emergencyServices.has(niche.slug) ? "urgent" : "standard",
      conversionAngle: `Show ${niche.label.toLowerCase()} providers exactly where Erie County leads are slipping away.`,
      painPoint: basePainPoint,
      recommendedPriceCents: 0,
      isPrimary: true,
    },
    {
      serviceSlug: niche.slug,
      serviceLabel: niche.label,
      serviceFamily,
      offerSlug: "service-page-conversion-blueprint",
      priority: 20,
      visitorSegment: "provider",
      urgency: "standard",
      conversionAngle: `Give ${niche.label.toLowerCase()} providers a ready-to-use page and funnel plan.`,
      painPoint: `Most ${niche.label.toLowerCase()} pages describe services but do not move visitors toward a clear next step.`,
      recommendedPriceCents: 9900,
      isPrimary: false,
    },
    {
      serviceSlug: niche.slug,
      serviceLabel: niche.label,
      serviceFamily,
      offerSlug: "provider-launch-kit",
      priority: 30,
      visitorSegment: "provider",
      urgency: "standard",
      conversionAngle: `Package the provider's Erie County offer, intake, proof, and follow-up into one practical launch kit.`,
      painPoint: `Providers often need the full operating kit, not just more traffic.`,
      recommendedPriceCents: 39900,
      isPrimary: false,
    },
    {
      serviceSlug: niche.slug,
      serviceLabel: niche.label,
      serviceFamily,
      offerSlug: "growth-intelligence-subscription",
      priority: 40,
      visitorSegment: "provider",
      urgency: seasonalServices.has(niche.slug) ? "seasonal" : "standard",
      conversionAngle: `Keep ${niche.label.toLowerCase()} providers aware of timing, demand, and opportunity changes.`,
      painPoint: `One-time improvements fade if the provider does not keep watching demand and follow-up signals.`,
      recommendedPriceCents: 19900,
      isPrimary: false,
    },
  ]

  if (emergencyServices.has(niche.slug) || autoMarineServices.has(niche.slug)) {
    recommendations.push({
      serviceSlug: niche.slug,
      serviceLabel: niche.label,
      serviceFamily,
      offerSlug: "missed-call-recovery-kit",
      priority: 15,
      visitorSegment: "provider",
      urgency: "emergency",
      conversionAngle: `Recover urgent ${niche.label.toLowerCase()} buyers who would otherwise call the next provider.`,
      painPoint: `Urgent buyers move fast. One missed call can become a lost job.`,
      recommendedPriceCents: 14900,
      isPrimary: false,
    })
  }

  if (seasonalServices.has(niche.slug)) {
    recommendations.push({
      serviceSlug: niche.slug,
      serviceLabel: niche.label,
      serviceFamily,
      offerSlug: "seasonal-booking-campaign-pack",
      priority: 15,
      visitorSegment: "provider",
      urgency: "seasonal",
      conversionAngle: `Book Erie County demand before the seasonal rush peaks.`,
      painPoint: `Seasonal providers often market too late, when buyers have already chosen someone else.`,
      recommendedPriceCents: 14900,
      isPrimary: false,
    })
  }

  if (
    professionalServices.has(niche.slug) ||
    healthServices.has(niche.slug) ||
    cleaningServices.has(niche.slug)
  ) {
    recommendations.push({
      serviceSlug: niche.slug,
      serviceLabel: niche.label,
      serviceFamily,
      offerSlug: "client-portal-starter-pack",
      priority: 35,
      visitorSegment: "provider",
      urgency: "standard",
      conversionAngle: `Turn inquiries into a clear intake and onboarding path.`,
      painPoint: `Trust-based services need organized intake, expectations, and follow-through.`,
      recommendedPriceCents: 19900,
      isPrimary: false,
    })
  }

  if (
    cleaningServices.has(niche.slug) ||
    seasonalServices.has(niche.slug) ||
    emergencyServices.has(niche.slug) ||
    niche.monthlyFee >= 700
  ) {
    recommendations.push({
      serviceSlug: niche.slug,
      serviceLabel: niche.label,
      serviceFamily,
      offerSlug: "government-opportunity-scanner",
      priority: 45,
      visitorSegment: "provider",
      urgency: "standard",
      conversionAngle: `Surface public-sector opportunities that match the provider's actual service category.`,
      painPoint: `Many local providers could sell to public buyers but never see the opportunities in time.`,
      recommendedPriceCents: 29900,
      isPrimary: false,
    })
  }

  recommendations.push(
    {
      serviceSlug: niche.slug,
      serviceLabel: niche.label,
      serviceFamily,
      offerSlug: "convertbox-funnel-in-a-box",
      priority: 50,
      visitorSegment: "provider",
      urgency: "standard",
      conversionAngle: `Give the provider a tailored overlay funnel for their existing website.`,
      painPoint: `Existing websites often get traffic but fail to ask the right qualifying questions at the right time.`,
      recommendedPriceCents: 29900,
      isPrimary: false,
    },
    {
      serviceSlug: niche.slug,
      serviceLabel: niche.label,
      serviceFamily,
      offerSlug: "review-reputation-growth-kit",
      priority: 60,
      visitorSegment: "provider",
      urgency: "standard",
      conversionAngle: `Help ${niche.label.toLowerCase()} providers build more visible local trust.`,
      painPoint: `Buyers compare proof before they contact a provider.`,
      recommendedPriceCents: 9900,
      isPrimary: false,
    },
  )

  return recommendations.sort((a, b) => a.priority - b.priority)
}

export function getPrimaryOfferForService(serviceSlug: string) {
  const niche = niches.find((item) => item.slug === serviceSlug)
  if (!niche) return null
  return getServiceOfferRecommendations(niche)[0] ?? null
}

export function getAllServiceOfferRecommendations() {
  return niches.flatMap(getServiceOfferRecommendations)
}

export function buildOfferVariantCopy(offer: AutomatedOfferDefinition, niche: LocalNiche) {
  const family = inferServiceFamily(niche.slug)
  const urgencyLine =
    family === "Emergency Home Response"
      ? "Speed, trust, and immediate contact matter most for this category."
      : family === "Health and Appointments"
        ? "Privacy, reassurance, and appointment fit matter most for this category."
        : family === "Professional and Financial"
          ? "Authority, proof, and consultation clarity matter most for this category."
          : family === "Seasonal Erie Services"
            ? "Timing, reminders, and pre-season demand capture matter most for this category."
            : "Clarity, proof, and follow-up matter most for this category."

  return {
    headline: `${niche.label} growth plan for Erie County`,
    subheadline: `${offer.shortTitle} tailored to how ${niche.label.toLowerCase()} buyers decide.`,
    painPoint: `${niche.label} providers can lose ready buyers when their page, proof, intake, or follow-up does not match the visitor's urgency.`,
    promise: `Get a practical, service-specific plan for converting more Erie County ${niche.label.toLowerCase()} demand without adding manual work.`,
    primaryCta: offer.primaryCta,
    deliverySummary: `${urgencyLine} This deliverable is generated from the Erie.Pro service matrix, Lead OS funnel logic, and the buyer psychology for ${niche.label.toLowerCase()}.`,
    deliverableConfig: {
      serviceSlug: niche.slug,
      serviceLabel: niche.label,
      serviceFamily: family,
      avgProjectValue: niche.avgProjectValue,
      searchTerms: niche.searchTerms,
    },
  }
}

import generated from "@/lib/seo-page-plans.json"

export type SeoLaunchPageType = "core" | "emergency" | "pricing" | "directory" | "reviews" | "faq"

export type SeoLaunchPlan = {
  serviceSlug: string
  pageType: SeoLaunchPageType
  primaryKeyword: string
  supportingKeywords: string[]
  sectionOutline: string[]
  faqs: Array<{ question: string; answer: string }>
  trustSignals: string[]
  localProof: string[]
  contentDepthTarget: string
  lastUpdated: string
}

type GeneratedRegistry = {
  services: Array<{
    name: string
    slug: string
    category: string
    priority: string
    relatedServices: string[]
    serviceAreas: string[]
    complianceCategory: string
  }>
  plans: SeoLaunchPlan[]
}

const registry = generated as GeneratedRegistry

export const canonicalToGenerated: Record<string, string> = {
  accounting: "accounting-and-tax",
  chimney: "chimney-and-fireplace",
  chiropractic: "chiropractic-care",
  "closet-storage-systems": "closet-and-storage-systems",
  concrete: "concrete-and-masonry",
  "decks-patios": "decks-and-patios",
  demolition: "demolition-and-excavation",
  "dock-installation-repair": "dock-installation-and-repair",
  drywall: "drywall-and-plastering",
  foundation: "foundation-and-waterproofing",
  glass: "glass-and-glazing",
  gutters: "gutter-services",
  handyman: "handyman-services",
  insulation: "insulation-services",
  irrigation: "irrigation-and-sprinklers",
  locksmith: "locksmith-services",
  photography: "photography-services",
  "pool-spa": "pool-and-spa-services",
  "radon-testing-mitigation": "radon-testing-and-mitigation",
  "salt-deicing-services": "salt-and-de-icing-services",
  septic: "septic-and-sewer",
  solar: "solar-and-energy",
  towing: "towing-and-roadside-assistance",
  veterinary: "veterinary-services",
  restoration: "water-damage-restoration",
  "windows-doors": "windows-and-doors",
}

export function getSeoLaunchPlan(nicheSlug: string, pageType: SeoLaunchPageType) {
  const generatedSlug = canonicalToGenerated[nicheSlug] ?? nicheSlug
  const exactPlan = registry.plans.find((plan) => plan.serviceSlug === generatedSlug && plan.pageType === pageType)
  if (exactPlan) return exactPlan

  if (pageType === "reviews" || pageType === "faq") {
    const corePlan = registry.plans.find((plan) => plan.serviceSlug === generatedSlug && plan.pageType === "core")
    if (corePlan) return createSupportPlan(corePlan, pageType)
  }

  return undefined
}

export function getSeoLaunchService(nicheSlug: string) {
  const generatedSlug = canonicalToGenerated[nicheSlug] ?? nicheSlug
  return registry.services.find((service) => service.slug === generatedSlug)
}

export function getSeoLaunchFaqSchema(nicheSlug: string, pageType: SeoLaunchPageType) {
  const plan = getSeoLaunchPlan(nicheSlug, pageType)
  if (!plan?.faqs.length) return null

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: plan.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  }
}

function createSupportPlan(corePlan: SeoLaunchPlan, pageType: "reviews" | "faq"): SeoLaunchPlan {
  const serviceName = toServiceName(corePlan.serviceSlug)

  if (pageType === "reviews") {
    return {
      ...corePlan,
      pageType,
      primaryKeyword: `${serviceName} reviews Erie PA`,
      supportingKeywords: [
        `best ${serviceName} Erie PA`,
        `${serviceName} companies Erie PA reviews`,
        `trusted ${serviceName} near Erie PA`,
        ...corePlan.supportingKeywords.slice(0, 5),
      ],
      sectionOutline: [
        `How to compare ${serviceName} reviews in Erie`,
        "Review signals that are useful and verifiable",
        "Questions to ask before choosing a provider",
        "How Erie.pro checks provider fit before matching",
        "What to verify about licensing, insurance, and service area",
        "How to avoid fake or misleading review claims",
      ],
      faqs: [
        {
          question: `How should I compare ${serviceName} reviews in Erie, PA?`,
          answer:
            "Look for recent reviews, clear job details, consistent service-area mentions, and proof that the provider handles the exact type of work you need.",
        },
        {
          question: "Does Erie.pro publish fake ratings?",
          answer:
            "No. Ratings, reviews, licensing, availability, and pricing should only be shown when they can be verified from provider or customer sources.",
        },
        {
          question: `What should I ask a ${serviceName} provider before hiring?`,
          answer:
            "Ask whether they serve your Erie neighborhood, whether the job type matches their experience, what is included in the estimate, and what proof of insurance or credentials applies.",
        },
      ],
      contentDepthTarget: "900-1,200 words plus verified review and provider-selection guidance",
    }
  }

  return {
    ...corePlan,
    pageType,
    primaryKeyword: `${serviceName} FAQ Erie PA`,
    supportingKeywords: [
      `${serviceName} questions Erie PA`,
      `${serviceName} help Erie PA`,
      `hire ${serviceName} Erie PA`,
      ...corePlan.supportingKeywords.slice(0, 5),
    ],
    sectionOutline: [
      `Most common ${serviceName} questions from Erie residents`,
      "When to request a match",
      "What information to include in a request",
      "How pricing and availability should be verified",
      "How Erie.pro protects trust in the matching process",
      "Related service pages to compare before deciding",
    ],
    faqs: [
      {
        question: `What should I include when requesting ${serviceName} help in Erie?`,
        answer:
          "Share the job type, location or ZIP code, timing, any photos if available, and whether the request is urgent so Erie.pro can route it to a suitable local provider.",
      },
      {
        question: `Can Erie.pro guarantee ${serviceName} pricing before a provider reviews the job?`,
        answer:
          "No. Erie.pro can explain common cost factors, but final pricing must come from a provider after reviewing the scope, site conditions, timing, and materials.",
      },
      {
        question: "Why does Erie.pro use one matched local pro instead of many bids?",
        answer:
          "The goal is to reduce phone calls and confusion by matching the request to one relevant local provider within the Erie service area.",
      },
    ],
    contentDepthTarget: "800-1,100 words plus concise Erie-specific answers and internal links",
  }
}

function toServiceName(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

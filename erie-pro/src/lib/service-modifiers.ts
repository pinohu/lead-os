// erie-pro/src/lib/service-modifiers.ts
import { cityConfig } from "@/lib/city-config"
import { getNicheBySlug } from "@/lib/niches"

export interface ServiceModifier {
  slug: string
  headlineSuffix: string
  primaryKeyword: (nicheLabel: string) => string
  metaDescription: (nicheLabel: string) => string
  ctaHref: (nicheSlug: string) => string
  relatedHref?: (nicheSlug: string) => string
  relatedLabel?: string
}

const GLOBAL_MODIFIERS: ServiceModifier[] = [
  {
    slug: "emergency",
    headlineSuffix: "Emergency help",
    primaryKeyword: (label) => `emergency ${label.toLowerCase()} ${cityConfig.name.toLowerCase()} ${cityConfig.stateCode.toLowerCase()}`,
    metaDescription: (label) =>
      `Need emergency ${label.toLowerCase()} in ${cityConfig.name}, ${cityConfig.stateCode}? Get matched with a vetted local pro for urgent help across Erie County.`,
    ctaHref: (niche) => `/${niche}/emergency`,
    relatedHref: (niche) => `/${niche}/emergency`,
    relatedLabel: "Emergency page",
  },
  {
    slug: "24-hour",
    headlineSuffix: "24-hour availability",
    primaryKeyword: (label) => `24 hour ${label.toLowerCase()} ${cityConfig.name.toLowerCase()} ${cityConfig.stateCode.toLowerCase()}`,
    metaDescription: (label) =>
      `Looking for 24-hour ${label.toLowerCase()} near ${cityConfig.name}, ${cityConfig.stateCode}? Request a same-day match with a vetted Erie County professional.`,
    ctaHref: (niche) => `/${niche}/emergency`,
    relatedHref: (niche) => `/${niche}/emergency`,
    relatedLabel: "24/7 options",
  },
  {
    slug: "cost",
    headlineSuffix: "Cost & pricing",
    primaryKeyword: (label) => `${label.toLowerCase()} cost ${cityConfig.name.toLowerCase()} ${cityConfig.stateCode.toLowerCase()}`,
    metaDescription: (label) =>
      `How much does ${label.toLowerCase()} cost in ${cityConfig.name}, ${cityConfig.stateCode}? Compare typical Erie County price ranges before you hire.`,
    ctaHref: (niche) => `/${niche}/costs`,
    relatedHref: (niche) => `/${niche}/pricing`,
    relatedLabel: "Pricing guide",
  },
  {
    slug: "near-me",
    headlineSuffix: "Near you",
    primaryKeyword: (label) => `${label.toLowerCase()} near me ${cityConfig.name.toLowerCase()} ${cityConfig.stateCode.toLowerCase()}`,
    metaDescription: (label) =>
      `Find ${label.toLowerCase()} near you in ${cityConfig.name}, ${cityConfig.stateCode}. One vetted local pro — free match, no bidding wars.`,
    ctaHref: (niche) => `/get-matched?niche=${niche}`,
    relatedHref: (niche) => `/${niche}/directory`,
    relatedLabel: "Local directory",
  },
  {
    slug: "commercial",
    headlineSuffix: "Commercial projects",
    primaryKeyword: (label) => `commercial ${label.toLowerCase()} ${cityConfig.name.toLowerCase()} ${cityConfig.stateCode.toLowerCase()}`,
    metaDescription: (label) =>
      `Commercial ${label.toLowerCase()} in ${cityConfig.name}, ${cityConfig.stateCode}. Match with pros who serve businesses and multi-unit properties in Erie County.`,
    ctaHref: (niche) => `/${niche}`,
    relatedHref: (niche) => `/${niche}/directory`,
    relatedLabel: "Commercial-ready pros",
  },
  {
    slug: "licensed-insured",
    headlineSuffix: "Licensed & insured",
    primaryKeyword: (label) => `licensed ${label.toLowerCase()} ${cityConfig.name.toLowerCase()} ${cityConfig.stateCode.toLowerCase()}`,
    metaDescription: (label) =>
      `Hire licensed, insured ${label.toLowerCase()} pros in ${cityConfig.name}, ${cityConfig.stateCode}. ${cityConfig.domain} matches you with vetted Erie County professionals.`,
    ctaHref: (niche) => `/${niche}`,
    relatedHref: (niche) => `/${niche}/certifications`,
    relatedLabel: "Credentials",
  },
]

const modifierBySlug = new Map(GLOBAL_MODIFIERS.map((modifier) => [modifier.slug, modifier]))

export function getServiceModifier(slug: string) {
  return modifierBySlug.get(slug)
}

export function getServiceModifierSlugs() {
  return [...modifierBySlug.keys()]
}

export function getModifiersForNiche(nicheSlug: string) {
  if (!getNicheBySlug(nicheSlug)) return []
  return GLOBAL_MODIFIERS
}

/** Reserved second segment under /[niche]/ — must not be treated as a provider slug. */
export const RESERVED_NICHE_SEGMENTS = new Set([
  "blog",
  "guides",
  "faq",
  "pricing",
  "costs",
  "compare",
  "emergency",
  "glossary",
  "seasonal",
  "checklist",
  "directory",
  "reviews",
  "tips",
  "certifications",
  "permits",
  "when-to-call",
  "diy-vs-pro",
  "red-flags",
  "what-to-expect",
  "modifiers",
  "areas",
])

export function isReservedNicheSegment(segment: string) {
  return RESERVED_NICHE_SEGMENTS.has(segment)
}

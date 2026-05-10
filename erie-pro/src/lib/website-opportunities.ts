import type { DirectoryListing } from "@/generated/prisma"
import { getNicheBySlug } from "@/lib/niches"

export const websiteOpportunityStatuses = [
  "qualified",
  "needs_manual_review",
  "not_a_business",
  "already_has_website",
  "do_not_contact",
  "preview_created",
  "contacted",
  "claimed",
  "sold",
  "declined",
] as const

export type WebsiteOpportunityStatus = (typeof websiteOpportunityStatuses)[number]

export const websiteOpportunityStatusLabels: Record<WebsiteOpportunityStatus, string> = {
  qualified: "Qualified",
  needs_manual_review: "Needs review",
  not_a_business: "Not a business",
  already_has_website: "Already has website",
  do_not_contact: "Do not contact",
  preview_created: "Preview created",
  contacted: "Contacted",
  claimed: "Claimed",
  sold: "Sold",
  declined: "Declined",
}

export const websitePackages = [
  {
    key: "starter-presence",
    name: "Starter Presence",
    setup: 299,
    monthly: 49,
    summary: "One-page local website with phone CTA, contact form, basic SEO, and hosting.",
  },
  {
    key: "local-growth",
    name: "Local Growth",
    setup: 799,
    monthly: 149,
    summary: "Five-page website with service pages, analytics, photos, and monthly edits.",
  },
  {
    key: "lead-engine",
    name: "Lead Engine",
    setup: 1500,
    monthly: 299,
    summary: "Full local SEO site with conversion tracking, review funnel, and growth support.",
  },
] as const

const highValueNiches = new Set([
  "plumbing",
  "hvac",
  "electrical",
  "roofing",
  "auto-repair",
  "towing",
  "appliance-repair",
  "painting",
  "concrete",
  "drywall",
  "landscaping",
  "tree-service",
  "garage-door",
  "locksmith",
  "foundation",
  "water-heater-services",
  "sewer-line-repair",
])

const poorFirstWaveNiches = new Set([
  "legal",
  "dental",
  "dermatology",
  "mental-health-counseling",
  "financial-advisors",
  "insurance-agents",
  "funeral-homes",
  "senior-home-care",
  "home-health-care",
])

const publicPlaceTerms = [
  "park",
  "boat ramp",
  "beach",
  "trail",
  "charging station",
  "supercharger",
  "destination charger",
  "car wash",
  "warehouse",
  "gorge",
  "marina",
]

export type OpportunityListing = Pick<
  DirectoryListing,
  | "businessName"
  | "niche"
  | "phone"
  | "email"
  | "website"
  | "rating"
  | "reviewCount"
  | "addressCity"
  | "categories"
  | "photoRefs"
>

export function scoreWebsiteOpportunity(listing: OpportunityListing) {
  let score = 0
  const notes: string[] = []
  const businessText = [
    listing.businessName,
    listing.niche,
    listing.addressCity,
    ...(listing.categories ?? []),
  ]
    .join(" ")
    .toLowerCase()

  if (!listing.website?.trim()) {
    score += 30
    notes.push("No website on listing")
  }

  if (listing.phone?.trim()) {
    score += 25
    notes.push("Phone present")
  } else {
    score -= 50
    notes.push("No phone number")
  }

  if ((listing.reviewCount ?? 0) >= 50) {
    score += 20
    notes.push("50+ reviews")
  } else if ((listing.reviewCount ?? 0) >= 15) {
    score += 10
    notes.push("15+ reviews")
  }

  if ((listing.rating ?? 0) >= 4.3) {
    score += 15
    notes.push("Strong rating")
  }

  if (highValueNiches.has(listing.niche)) {
    score += 15
    notes.push("High-value service niche")
  }

  if ((listing.photoRefs ?? []).length > 0) {
    score += 5
    notes.push("Photos available")
  }

  if (poorFirstWaveNiches.has(listing.niche)) {
    score -= 20
    notes.push("Compliance-sensitive niche; review before outreach")
  }

  if (publicPlaceTerms.some((term) => businessText.includes(term))) {
    score -= 50
    notes.push("May be public place or non-service business")
  }

  let status: WebsiteOpportunityStatus = "needs_manual_review"
  if (score >= 65) status = "qualified"
  if (score < 25) status = "needs_manual_review"
  if (publicPlaceTerms.some((term) => businessText.includes(term)) && !listing.phone) {
    status = "not_a_business"
  }

  return { score, status, notes }
}

export function previewPathForListing(listing: { slug: string }) {
  return `/website-preview/${listing.slug}`
}

export function serviceLabelForNiche(niche: string) {
  return getNicheBySlug(niche)?.label ?? niche.replace(/-/g, " ")
}

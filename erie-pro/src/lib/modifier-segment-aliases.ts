// erie-pro/src/lib/modifier-segment-aliases.ts
import { cityConfig } from "@/lib/city-config"
import { getNicheBySlug } from "@/lib/niches"
import { getServiceModifierSlugs } from "@/lib/service-modifiers"

function slugifyToken(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function nicheStem(nicheSlug: string) {
  const niche = getNicheBySlug(nicheSlug)
  if (!niche) return null
  const term = niche.searchTerms[0] ?? niche.label
  return slugifyToken(term)
}

const cityToken = slugifyToken(`${cityConfig.name} ${cityConfig.stateCode}`)

export function buildModifierSegmentAlias(nicheSlug: string, modifierSlug: string) {
  const stem = nicheStem(nicheSlug)
  if (!stem) return null

  switch (modifierSlug) {
    case "emergency":
      return `emergency-${stem}-${cityToken}`
    case "24-hour":
      return `24-hour-${stem}-${cityToken}`
    case "cost":
      return `${stem}-cost-${cityToken}`
    case "near-me":
      return `${stem}-near-me`
    case "commercial":
      return `commercial-${stem}-${cityToken}`
    case "licensed-insured":
      return `licensed-${stem}-${cityToken}`
    default:
      return null
  }
}

export function resolveModifierFromSegment(nicheSlug: string, segment: string) {
  for (const modifierSlug of getServiceModifierSlugs()) {
    const alias = buildModifierSegmentAlias(nicheSlug, modifierSlug)
    if (alias === segment) return modifierSlug
  }
  return null
}

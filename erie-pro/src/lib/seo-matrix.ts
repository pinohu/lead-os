// erie-pro/src/lib/seo-matrix.ts
import { cityConfig } from "@/lib/city-config"
import { niches } from "@/lib/niches"
import { getServiceAreaSlugs, serviceAreas } from "@/lib/area-registry"
import { getModifiersForNiche, getServiceModifierSlugs } from "@/lib/service-modifiers"

export function getMatrixNicheSlugs() {
  const mode = process.env.SEO_AREA_MATRIX_MODE ?? "pilot"
  if (mode === "full") return niches.map((niche) => niche.slug)
  const pilots = cityConfig.pilotCategories ?? []
  return niches.filter((niche) => pilots.includes(niche.slug)).map((niche) => niche.slug)
}

export function getMatrixAreaSlugs() {
  const mode = process.env.SEO_AREA_MATRIX_MODE ?? "pilot"
  if (mode === "full") return getServiceAreaSlugs()
  return serviceAreas
    .filter((area) => area.type === "municipality")
    .map((area) => area.slug)
}

export function getAreaNicheStaticParams() {
  const nicheSlugs = getMatrixNicheSlugs()
  const areaSlugs = getMatrixAreaSlugs()
  return areaSlugs.flatMap((area) => nicheSlugs.map((niche) => ({ area, niche })))
}

/** Canonical matrix route: /[niche]/areas/[area] */
export function getNicheAreaStaticParams() {
  return getAreaNicheStaticParams().map(({ area, niche }) => ({ niche, area }))
}

export function getModifierStaticParams() {
  return getMatrixNicheSlugs().flatMap((niche) =>
    getModifiersForNiche(niche).map((modifier) => ({
      niche,
      modifier: modifier.slug,
    })),
  )
}

export function shouldIndexAreaMatrixPage(nicheSlug: string) {
  if (process.env.SEO_AREA_MATRIX_INDEX === "0") return false
  return getMatrixNicheSlugs().includes(nicheSlug)
}

export function shouldIndexModifierPage(nicheSlug: string) {
  if (process.env.SEO_MODIFIER_INDEX === "0") return false
  return getMatrixNicheSlugs().includes(nicheSlug)
}

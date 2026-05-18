// erie-pro/src/lib/area-registry.ts
import { cityConfig } from "@/lib/city-config"
import { localSeo } from "@/lib/local-seo"

export interface ServiceAreaEntry {
  slug: string
  label: string
  description: string
  type: "municipality" | "neighborhood"
}

const AREA_DESCRIPTIONS: Record<string, string> = {
  Erie: "The heart of Erie County and the core of our service area. Erie's mix of historic neighborhoods, waterfront districts, and developing suburbs means diverse home service needs year-round.",
  Millcreek: "Erie's largest township and most populous suburb. Millcreek's growing residential areas and established neighborhoods keep local service professionals busy.",
  Harborcreek: "A thriving eastern suburb with a mix of rural properties and newer subdivisions. Quick access to Erie-based professionals with a more spacious setting.",
  Fairview: "A western Erie suburb known for its strong school district and family-friendly neighborhoods.",
  "Summit Township": "Located south of Erie, Summit Township offers suburban development and open space with ongoing demand for licensed contractors.",
  McKean: "A small borough south of Erie with a close-knit community character.",
  Edinboro: "Home to a university campus and a charming small-town atmosphere.",
  Waterford: "A historic borough southeast of Erie known for well-preserved architecture.",
  "North East": "The easternmost community in our service area, known for vineyards and lake access.",
  Girard: "A western Erie County borough with a strong community identity.",
}

function slugifyArea(label: string) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function buildAreaEntry(label: string, type: ServiceAreaEntry["type"]): ServiceAreaEntry {
  const slug = slugifyArea(label)
  return {
    slug,
    label,
    type,
    description:
      AREA_DESCRIPTIONS[label] ??
      `A valued community in the ${cityConfig.name} metro area served by verified professionals on ${cityConfig.domain}.`,
  }
}

const areaBySlug = new Map<string, ServiceAreaEntry>()

for (const municipality of cityConfig.serviceArea) {
  const entry = buildAreaEntry(municipality, "municipality")
  areaBySlug.set(entry.slug, entry)
}

for (const neighborhood of localSeo.neighborhoods) {
  const entry = buildAreaEntry(neighborhood, "neighborhood")
  if (!areaBySlug.has(entry.slug)) areaBySlug.set(entry.slug, entry)
}

export const serviceAreas: ServiceAreaEntry[] = [...areaBySlug.values()].sort((a, b) =>
  a.label.localeCompare(b.label),
)

export function getServiceAreaBySlug(slug: string) {
  return areaBySlug.get(slug)
}

export function getServiceAreaSlugs() {
  return serviceAreas.map((area) => area.slug)
}

export function getServiceAreaSlugForLabel(label: string) {
  return slugifyArea(label)
}

export function matchAreaLabelInText(text: string | null | undefined, areaLabel: string) {
  if (!text) return false
  return text.toLowerCase().includes(areaLabel.toLowerCase())
}

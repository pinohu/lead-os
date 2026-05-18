// erie-pro/src/lib/seo-publish-gate.ts
import generated from "@/lib/seo-page-plans.json"
import { cityConfig } from "@/lib/city-config"
import { canonicalToGenerated } from "@/lib/seo-launch-plans"
import { getMatrixAreaSlugs, shouldIndexAreaMatrixPage, shouldIndexModifierPage } from "@/lib/seo-matrix"

export type SeoPlanPageType =
  | "core"
  | "emergency"
  | "pricing"
  | "directory"
  | "reviews"
  | "faq"
  | "costs"
  | "compare"
  | "blog"
  | "guides"
  | "glossary"
  | "checklist"
  | "tips"
  | "certifications"
  | "permits"
  | "when-to-call"
  | "diy-vs-pro"
  | "red-flags"
  | "what-to-expect"
  | "seasonal"

type PlanRow = {
  serviceSlug: string
  pageType: string
  robots?: string
  goNoGo?: string
  publishStatus?: string
  launchWave?: string
}

const registry = generated as { plans: PlanRow[] }

const planIndex = new Map<string, PlanRow>()
for (const plan of registry.plans) {
  planIndex.set(`${plan.serviceSlug}:${plan.pageType}`, plan)
}

/** Money pages we allow to stay indexable while Wave 1 content QA is in progress. */
const PILOT_INDEXABLE_SUBPAGES = new Set([
  "",
  "pricing",
  "emergency",
  "faq",
  "directory",
  "costs",
  "compare",
  "reviews",
])

export function isSeoPublishGateEnabled() {
  return process.env.SEO_PUBLISH_GATE === "1"
}

function resolveGeneratedSlug(nicheSlug: string) {
  return canonicalToGenerated[nicheSlug as keyof typeof canonicalToGenerated] ?? nicheSlug
}

function getPlan(nicheSlug: string, pageType: SeoPlanPageType) {
  const generatedSlug = resolveGeneratedSlug(nicheSlug)
  const mappedType =
    pageType === "core" ? "core" : pageType === "costs" ? "pricing" : pageType
  return planIndex.get(`${generatedSlug}:${mappedType}`)
}

export function shouldNoindexNichePage(nicheSlug: string, pageType: SeoPlanPageType) {
  if (!isSeoPublishGateEnabled()) return false

  const plan = getPlan(nicheSlug, pageType)
  if (plan?.goNoGo === "Go" || plan?.publishStatus === "Published") return false
  if (plan?.robots?.includes("noindex")) {
    const pilots = cityConfig.pilotCategories ?? []
    const isPilotMoneyPage =
      pilots.includes(nicheSlug) &&
      PILOT_INDEXABLE_SUBPAGES.has(pageType === "core" ? "" : pageType)
    if (isPilotMoneyPage && process.env.SEO_PILOT_INDEX_OVERRIDE !== "0") return false
    return true
  }

  const pilots = cityConfig.pilotCategories ?? []
  if (
    pilots.includes(nicheSlug) &&
    PILOT_INDEXABLE_SUBPAGES.has(pageType === "core" ? "" : pageType)
  ) {
    return process.env.SEO_PILOT_INDEX_OVERRIDE === "0"
  }

  return true
}

export function parseNichePathname(pathname: string): { nicheSlug: string; pageType: SeoPlanPageType } | null {
  const segments = pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean)
  if (segments.length === 0) return null
  if (segments.length === 1) return { nicheSlug: segments[0], pageType: "core" }
  if (segments.length === 2) return { nicheSlug: segments[0], pageType: segments[1] as SeoPlanPageType }
  return null
}

function isPilotNiche(nicheSlug: string) {
  const pilots = cityConfig.pilotCategories ?? []
  return pilots.includes(nicheSlug)
}

function pilotMatrixOverride() {
  return process.env.SEO_PILOT_INDEX_OVERRIDE !== "0"
}

export function shouldNoindexAreaHubPage(areaSlug: string) {
  if (!isSeoPublishGateEnabled()) return false
  if (!getMatrixAreaSlugs().includes(areaSlug)) return true
  return false
}

export function shouldNoindexAreaMatrixPage(nicheSlug: string, areaSlug: string) {
  if (!isSeoPublishGateEnabled()) return false
  if (!shouldIndexAreaMatrixPage(nicheSlug)) return true
  if (!getMatrixAreaSlugs().includes(areaSlug)) return true
  if (isPilotNiche(nicheSlug) && pilotMatrixOverride()) return false
  return true
}

export function shouldNoindexModifierPage(nicheSlug: string) {
  if (!isSeoPublishGateEnabled()) return false
  if (!shouldIndexModifierPage(nicheSlug)) return true
  if (isPilotNiche(nicheSlug) && pilotMatrixOverride()) return false
  return true
}

export function shouldNoindexPath(pathname: string) {
  const segments = pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean)

  if (segments[0] === "areas" && segments.length === 2) {
    return shouldNoindexAreaHubPage(segments[1])
  }
  if (segments[0] === "areas" && segments.length === 3) {
    return shouldNoindexAreaMatrixPage(segments[2], segments[1])
  }
  if (segments.length === 3 && segments[1] === "areas") {
    return shouldNoindexAreaMatrixPage(segments[0], segments[2])
  }
  if (segments.length === 3 && segments[1] === "modifiers") {
    return shouldNoindexModifierPage(segments[0])
  }

  const parsed = parseNichePathname(pathname)
  if (!parsed) return false
  return shouldNoindexNichePage(parsed.nicheSlug, parsed.pageType)
}

// erie-pro/src/scripts/seo-content-qa.ts
import generated from "@/lib/seo-page-plans.json"
import { cityConfig } from "@/lib/city-config"
import {
  getMatrixAreaSlugs,
  getMatrixNicheSlugs,
  getModifierStaticParams,
} from "@/lib/seo-matrix"
import { getAreaNicheCanonicalPath } from "@/lib/area-niche-urls"
import { shouldNoindexAreaMatrixPage, shouldNoindexModifierPage, shouldNoindexNichePage } from "@/lib/seo-publish-gate"

type PlanRow = {
  serviceSlug: string
  pageType: string
  goNoGo?: string
  robots?: string
  publishStatus?: string
  launchWave?: string
}

const registry = generated as { plans: PlanRow[] }
const waveFilter = process.argv.find((arg) => arg.startsWith("--wave="))?.split("=")[1] ?? "1"

function summarizePlans() {
  const filtered = registry.plans.filter((plan) => {
    if (!waveFilter) return true
    return plan.launchWave === `Wave ${waveFilter}` || plan.launchWave === waveFilter
  })

  const byGo = new Map<string, number>()
  const noindexWithGo = filtered.filter(
    (plan) => plan.goNoGo === "Go" && plan.robots?.includes("noindex"),
  )

  for (const plan of filtered) {
    const key = plan.goNoGo ?? "Unknown"
    byGo.set(key, (byGo.get(key) ?? 0) + 1)
  }

  return { filtered, byGo, noindexWithGo }
}

function summarizeMatrixUrls() {
  const gateOn = process.env.SEO_PUBLISH_GATE === "1"
  const matrix = getMatrixAreaSlugs().flatMap((area) =>
    getMatrixNicheSlugs().map((niche) => ({
      path: getAreaNicheCanonicalPath(niche, area),
      noindex: gateOn ? shouldNoindexAreaMatrixPage(niche, area) : false,
    })),
  )
  const modifiers = getModifierStaticParams().map(({ niche, modifier }) => ({
    path: `/${niche}/modifiers/${modifier}`,
    noindex: gateOn ? shouldNoindexModifierPage(niche) : false,
  }))
  return { matrix, modifiers, gateOn }
}

function main() {
  const { filtered, byGo, noindexWithGo } = summarizePlans()
  const pilots = cityConfig.pilotCategories ?? []
  const { matrix, modifiers, gateOn } = summarizeMatrixUrls()

  console.log(`SEO content QA — Wave ${waveFilter}`)
  console.log(`Plans in scope: ${filtered.length}`)
  console.log("goNoGo counts:")
  for (const [key, count] of [...byGo.entries()].sort()) {
    console.log(`  ${key}: ${count}`)
  }

  if (noindexWithGo.length > 0) {
    console.log(`\n⚠ ${noindexWithGo.length} plans marked Go but robots=noindex (sample):`)
    for (const plan of noindexWithGo.slice(0, 5)) {
      console.log(`  - ${plan.serviceSlug}:${plan.pageType}`)
    }
  }

  console.log(`\nPilot niches (${pilots.length}): ${pilots.join(", ")}`)
  console.log(`Publish gate: ${gateOn ? "ON" : "off (set SEO_PUBLISH_GATE=1 to simulate prod)"}`)

  const indexableMatrix = matrix.filter((row) => !row.noindex).length
  const indexableModifiers = modifiers.filter((row) => !row.noindex).length
  console.log(`Area×service matrix URLs: ${matrix.length} (${indexableMatrix} indexable with current env)`)
  console.log(`Modifier landers: ${modifiers.length} (${indexableModifiers} indexable)`)

  const pilotCoreBlocked = pilots.filter((slug) => shouldNoindexNichePage(slug, "core"))
  if (pilotCoreBlocked.length > 0) {
    console.log(`\n⚠ Pilot core pages still noindex: ${pilotCoreBlocked.join(", ")}`)
    process.exitCode = 1
    return
  }

  if (noindexWithGo.length > 0) process.exitCode = 1
}

main()

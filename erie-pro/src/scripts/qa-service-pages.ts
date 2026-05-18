import { createHash } from "crypto"
import { mkdirSync, writeFileSync } from "fs"
import { resolve } from "path"
import { erieDocsPath } from "./paths"
import { chromium, type Browser, type Page } from "@playwright/test"
import { niches } from "@/lib/niches"
import { getOfferBySlug, getServiceOfferRecommendations } from "@/lib/automated-offers"

type PageQaResult = {
  serviceSlug: string
  serviceLabel: string
  path: string
  viewport: "desktop" | "mobile"
  status: number | null
  screenshotHash: string | null
  checks: Record<string, boolean>
  errors: string[]
}

const appUrl = (process.env.SERVICE_QA_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://erie.pro").replace(/\/$/, "")
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="))
const onlyArg = process.argv.find((arg) => arg.startsWith("--only="))
const limit = limitArg ? Number(limitArg.split("=")[1]) : Number(process.env.SERVICE_QA_LIMIT || 0)
const onlySlug = onlyArg?.split("=")[1]
const serviceList = onlySlug
  ? niches.filter((n) => n.slug === onlySlug)
  : limit > 0
    ? niches.slice(0, limit)
    : niches
const outputDir = erieDocsPath("qa", "service-pages")
const resultsPath = resolve(outputDir, "service-page-qa-results.json")
const snapshotsPath = resolve(outputDir, "visual-snapshots.json")

function sha256(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex")
}

export function expectedPaidOfferUrls(serviceSlug: string) {
  const niche = niches.find((item) => item.slug === serviceSlug)
  if (!niche) return []
  return getServiceOfferRecommendations(niche)
    .map((recommendation) => getOfferBySlug(recommendation.offerSlug))
    .filter((offer): offer is NonNullable<typeof offer> & { checkoutUrl: string } => Boolean(offer?.checkoutUrl && offer.basePriceCents > 0))
    .slice(0, 3)
    .map((offer) => offer.checkoutUrl)
}

async function noHorizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2)
}

async function visibleText(page: Page) {
  return page.locator("body").innerText({ timeout: 5000 }).catch(() => "")
}

function tokenAppearsInH1(text: string, token: string) {
  if (token.length < 4) return false
  if (text.includes(token)) return true
  if (token.endsWith("ing")) {
    const stem = token.slice(0, -3)
    if (stem.length >= 4 && (text.includes(stem) || text.includes(`${stem}er`) || text.includes(`${stem}ers`))) return true
  }
  return false
}

function h1MatchesService(
  h1: string,
  service: { slug: string; label: string; searchTerms?: string[] },
) {
  const text = h1.toLowerCase()
  const tokens = [
    ...service.label.toLowerCase().split(/\s+/),
    ...service.slug.split("-"),
    ...(service.searchTerms ?? []),
  ]
    .map((word) => word.toLowerCase().trim())
    .filter((word) => word.length >= 4)
  return tokens.some((token) => tokenAppearsInH1(text, token))
}

async function linkHrefs(page: Page) {
  return page.locator("a").evaluateAll((links) => links.map((link) => (link as HTMLAnchorElement).href))
}

async function qaOnePage(
  browser: Browser,
  service: { slug: string; label: string; searchTerms?: string[] },
  path: string,
  viewport: PageQaResult["viewport"],
): Promise<PageQaResult> {
  const page = await browser.newPage({
    viewport: viewport === "desktop" ? { width: 1366, height: 900 } : { width: 390, height: 844 },
  })
  const url = `${appUrl}${path}`
  const checks: Record<string, boolean> = {}
  const errors: string[] = []
  let status: number | null = null
  let screenshotHash: string | null = null

  try {
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 })
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {})
    status = response?.status() ?? null
    checks.statusOk = Boolean(response?.ok())
    checks.h1MentionsService = await page.locator("h1").first().innerText({ timeout: 8000 })
      .then((text) => h1MatchesService(text, service))
      .catch(() => false)
    checks.noHorizontalOverflow = await noHorizontalOverflow(page)
    checks.hasCountyOrErieContext = (await visibleText(page)).toLowerCase().includes("erie")

    const hrefs = await linkHrefs(page)
    if (path.endsWith("/pricing")) {
      const expectedCheckoutUrls = expectedPaidOfferUrls(service.slug)
      checks.noStripeCheckoutLinks = hrefs.every((href) => !href.includes("stripe.com"))
      checks.hasThriveCartCheckout = expectedCheckoutUrls.length === 0 || hrefs.some((href) => href.includes("thrivecart.com"))
      checks.matchesExpectedOffers = expectedCheckoutUrls.every((expectedUrl) => hrefs.some((href) => href.startsWith(expectedUrl)))
      checks.hasProviderGrowthSection = (await visibleText(page)).includes("For Erie County")
    } else {
      checks.hasQuoteCta = hrefs.some((href) => href.endsWith(`${path}#quote`) || href.endsWith("#quote"))
      checks.hasLeadForm = await page.locator("form").count().then((count) => count > 0)
      checks.hasProviderGrowthOffer = (await visibleText(page)).includes("Claim this territory")
    }

    const screenshot = await page.screenshot({ fullPage: false })
    screenshotHash = sha256(screenshot)

    for (const [check, passed] of Object.entries(checks)) {
      if (!passed) errors.push(`Failed check: ${check}`)
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Unknown service QA error")
  } finally {
    await page.close().catch(() => {})
  }

  return {
    serviceSlug: service.slug,
    serviceLabel: service.label,
    path,
    viewport,
    status,
    screenshotHash,
    checks,
    errors,
  }
}

async function main() {
  if (serviceList.length === 0) {
    console.error(onlySlug ? `Unknown service slug: ${onlySlug}` : "No services selected for QA.")
    process.exitCode = 1
    return
  }

  mkdirSync(outputDir, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const results: PageQaResult[] = []

  try {
    for (const service of serviceList) {
      for (const viewport of ["desktop", "mobile"] as const) {
        results.push(await qaOnePage(browser, service, `/${service.slug}`, viewport))
        results.push(await qaOnePage(browser, service, `/${service.slug}/pricing`, viewport))
      }
    }
  } finally {
    await browser.close()
  }

  const failed = results.filter((result) => result.errors.length > 0)
  const snapshotRows = results.map((result) => ({
    serviceSlug: result.serviceSlug,
    path: result.path,
    viewport: result.viewport,
    screenshotHash: result.screenshotHash,
  }))

  writeFileSync(resultsPath, `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    appUrl,
    servicesChecked: serviceList.length,
    pagesChecked: results.length,
    passed: results.length - failed.length,
    failed: failed.length,
    results,
  }, null, 2)}\n`, "utf8")

  writeFileSync(snapshotsPath, `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    appUrl,
    snapshots: snapshotRows,
  }, null, 2)}\n`, "utf8")

  console.log(`Wrote service QA results to ${resultsPath}`)
  console.log(`Wrote visual snapshot hashes to ${snapshotsPath}`)
  console.log(`Checked ${results.length} pages across ${serviceList.length} services; passed ${results.length - failed.length}; failed ${failed.length}`)
  if (failed.length > 0) {
    console.log(JSON.stringify(failed.slice(0, 10), null, 2))
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
}).finally(() => {
  process.exit(process.exitCode ?? 0)
})

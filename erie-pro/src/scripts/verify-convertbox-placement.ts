import { mkdirSync, writeFileSync } from "fs"
import { resolve } from "path"
import { chromium } from "@playwright/test"
import { convertBoxServiceMap, convertBoxServiceSlugs, type ConvertBoxServiceSlug } from "@/lib/convertbox-service-map"

type VerificationResult = {
  url: string
  serviceSlug: string
  expectedBoxId: number
  scriptPresent: boolean
  uuidPresent: boolean
  contextPresent: boolean
  datasetMatches: boolean
  errors: string[]
}

const appUrl = (process.env.CONVERTBOX_VERIFY_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://erie.pro").replace(/\/$/, "")
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="))
const limit = limitArg ? Number(limitArg.split("=")[1]) : Number(process.env.CONVERTBOX_VERIFY_LIMIT || 0)
const submitProbe = process.argv.includes("--submit-probe") || process.env.CONVERTBOX_SUBMIT_PROBE === "1"
const slugs = limit > 0 ? convertBoxServiceSlugs.slice(0, limit) : convertBoxServiceSlugs
const outputDir = resolve(process.cwd(), "..", "docs", "external-setup", "convertbox")
const matrixPath = resolve(outputDir, "placement-matrix.json")
const resultsPath = resolve(outputDir, "placement-verification-results.json")

function buildMatrix() {
  return {
    generatedAt: new Date().toISOString(),
    appUrl,
    totalServices: convertBoxServiceSlugs.length,
    dashboardStatus: "Dashboard boxes must be activated in ConvertBox before live overlays can display.",
    services: convertBoxServiceSlugs.map((slug) => {
      const entry = convertBoxServiceMap[slug]
      return {
        serviceNumber: entry.serviceNumber,
        serviceSlug: entry.serviceSlug,
        serviceLabel: entry.serviceLabel,
        family: entry.family,
        boxId: entry.boxId,
        boxName: entry.boxName,
        activeInSourceMap: entry.active,
        stepCount: entry.stepCount,
        routeType: entry.routeType,
        urgencyProfile: entry.urgencyProfile,
        persona: entry.persona,
        includeTargets: entry.includeTargets,
        convertBoxIncludeTargets: entry.convertBoxIncludeTargets,
        excludeTargets: entry.excludeTargets,
        requiredTriggers: [
          "time-on-page after visitor has context",
          "scroll-depth after service content",
          "exit-intent on non-emergency pages",
          "pricing intent on pricing/cost pages",
          "directory/provider comparison intent on directory/reviews/compare pages",
        ],
        submitEndpoint: `${appUrl}/api/events/convertbox`,
      }
    }),
  }
}

async function verifyPage(browser: Awaited<ReturnType<typeof chromium.launch>>, serviceSlug: ConvertBoxServiceSlug): Promise<VerificationResult> {
  const entry = convertBoxServiceMap[serviceSlug]
  const url = `${appUrl}/${entry.serviceSlug}/pricing?utm_source=qa&utm_medium=convertbox&utm_campaign=placement`
  const page = await browser.newPage()
  const errors: string[] = []

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 })
    await page.waitForTimeout(1200)
    const scriptPresent = await page.locator("script#app-convertbox-script").count().then((count) => count > 0)
    const uuidPresent = await page.locator("script#app-convertbox-script[data-uuid]").count().then((count) => count > 0)
    const context = await page.evaluate(() => (window as unknown as { erieProConvertBox?: unknown }).erieProConvertBox ?? null)
    const dataset = await page.evaluate(() => ({
      serviceSlug: document.documentElement.dataset.epServiceSlug ?? null,
      boxId: document.documentElement.dataset.epConvertboxId ?? null,
      countyFocus: document.documentElement.dataset.epCountyFocus ?? null,
    }))
    const contextPresent = Boolean(context)
    const datasetMatches =
      dataset.serviceSlug === entry.serviceSlug &&
      dataset.boxId === String(entry.boxId) &&
      dataset.countyFocus === "Erie County"

    if (!scriptPresent) errors.push("Missing ConvertBox script tag.")
    if (!uuidPresent) errors.push("Missing ConvertBox UUID data attribute.")
    if (!contextPresent) errors.push("Missing window.erieProConvertBox context.")
    if (!datasetMatches) errors.push("Service dataset does not match placement matrix.")

    if (submitProbe) {
      const response = await page.request.post(`${appUrl}/api/events/convertbox`, {
        data: {
          eventType: "convertbox.context_loaded",
          sourcePage: url,
          sourcePageType: "pricing",
          serviceSlug: entry.serviceSlug,
          serviceLabel: entry.serviceLabel,
          serviceNiche: entry.serviceSlug,
          family: entry.family,
          boxId: entry.boxId,
          sessionId: `qa_session_${Date.now()}`,
          visitorId: "qa_convertbox_verifier",
          metadata: { qa: true, script: "verify-convertbox-placement" },
        },
      })
      if (!response.ok()) errors.push(`ConvertBox event endpoint probe failed: ${response.status()}`)
    }

    return { url, serviceSlug, expectedBoxId: entry.boxId, scriptPresent, uuidPresent, contextPresent, datasetMatches, errors }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Unknown placement verification error")
    return {
      url,
      serviceSlug,
      expectedBoxId: entry.boxId,
      scriptPresent: false,
      uuidPresent: false,
      contextPresent: false,
      datasetMatches: false,
      errors,
    }
  } finally {
    await page.close().catch(() => {})
  }
}

async function main() {
  mkdirSync(outputDir, { recursive: true })
  writeFileSync(matrixPath, `${JSON.stringify(buildMatrix(), null, 2)}\n`, "utf8")

  const browser = await chromium.launch({ headless: true })
  const results: VerificationResult[] = []
  try {
    for (const slug of slugs) {
      results.push(await verifyPage(browser, slug))
    }
  } finally {
    await browser.close()
  }

  writeFileSync(resultsPath, `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    appUrl,
    checked: results.length,
    passed: results.filter((result) => result.errors.length === 0).length,
    failed: results.filter((result) => result.errors.length > 0).length,
    submitProbe,
    results,
  }, null, 2)}\n`, "utf8")

  const failed = results.filter((result) => result.errors.length > 0)
  console.log(`Wrote ConvertBox placement matrix to ${matrixPath}`)
  console.log(`Wrote ConvertBox verification results to ${resultsPath}`)
  console.log(`Checked ${results.length}; passed ${results.length - failed.length}; failed ${failed.length}`)
  if (failed.length > 0) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
}).finally(() => {
  process.exit(process.exitCode ?? 0)
})

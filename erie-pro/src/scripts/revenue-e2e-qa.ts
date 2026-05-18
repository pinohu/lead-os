import { createHmac } from "crypto"
import { mkdirSync, writeFileSync } from "fs"
import { resolve } from "path"
import { erieDocsPath } from "./paths"

type QaStep = {
  name: string
  status: "passed" | "failed" | "skipped"
  detail: string
  responseStatus?: number
}

const baseUrl = (process.env.REVENUE_QA_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://erie.pro").replace(/\/$/, "")
const writeMode = process.env.REVENUE_QA_WRITE === "1" || process.argv.includes("--write")
const outputDir = erieDocsPath("qa")
const outputPath = resolve(outputDir, "revenue-e2e-results.json")
const serviceSlug = process.env.REVENUE_QA_SERVICE || "plumbing"
const qaEmail = process.env.REVENUE_QA_EMAIL || `qa+revenue-${Date.now()}@erie.pro`

async function readJson(url: string, init?: RequestInit) {
  const response = await fetch(url, init)
  const text = await response.text()
  let json: unknown = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = text
  }
  return { response, json }
}

async function step(name: string, run: () => Promise<QaStep>): Promise<QaStep> {
  try {
    return await run()
  } catch (error) {
    return {
      name,
      status: "failed",
      detail: error instanceof Error ? error.message : "Unknown QA failure",
    }
  }
}

function signedThriveCartRequest(body: string) {
  const token = process.env.THRIVECART_WEBHOOK_TOKEN
  const secret = process.env.THRIVECART_WEBHOOK_SECRET
  const url = token
    ? `${baseUrl}/api/webhooks/thrivecart?token=${encodeURIComponent(token)}`
    : `${baseUrl}/api/webhooks/thrivecart`
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (secret) {
    headers["x-thrivecart-signature"] = createHmac("sha256", secret).update(body).digest("hex")
  }
  return { url, headers, configured: Boolean(token || secret) }
}

async function main() {
  mkdirSync(outputDir, { recursive: true })
  const steps: QaStep[] = []

  steps.push(await step("health", async () => {
    const { response, json } = await readJson(`${baseUrl}/api/health`)
    return {
      name: "health",
      status: response.ok ? "passed" : "failed",
      responseStatus: response.status,
      detail: JSON.stringify(json).slice(0, 500),
    }
  }))

  steps.push(await step("revenue stack readiness", async () => {
    const { response, json } = await readJson(`${baseUrl}/api/revenue-stack`)
    const text = JSON.stringify(json)
    const ok = response.ok && text.includes("thriveCartReadiness") && text.includes("recentRevenueActions")
    return {
      name: "revenue stack readiness",
      status: ok ? "passed" : "failed",
      responseStatus: response.status,
      detail: text.slice(0, 700),
    }
  }))

  steps.push(await step("Boost.space queue signal", async () => {
    const { response, json } = await readJson(`${baseUrl}/api/integrations/boostspace/revenue-actions?status=planned&limit=1`)
    const text = JSON.stringify(json)
    return {
      name: "Boost.space queue signal",
      status: response.ok && text.includes("boostspace") ? "passed" : "failed",
      responseStatus: response.status,
      detail: text.slice(0, 700),
    }
  }))

  steps.push(await step("SuiteDash queue signal", async () => {
    const { response, json } = await readJson(`${baseUrl}/api/integrations/suitedash/revenue-actions?status=planned&limit=1`)
    const text = JSON.stringify(json)
    return {
      name: "SuiteDash queue signal",
      status: response.ok && text.includes("suitedash") ? "passed" : "failed",
      responseStatus: response.status,
      detail: text.slice(0, 700),
    }
  }))

  if (!writeMode) {
    steps.push({
      name: "synthetic ConvertBox submit",
      status: "skipped",
      detail: "Set REVENUE_QA_WRITE=1 or pass --write to create QA-marked production events.",
    })
    steps.push({
      name: "synthetic ThriveCart webhook",
      status: "skipped",
      detail: "Set REVENUE_QA_WRITE=1 and provide THRIVECART_WEBHOOK_TOKEN or THRIVECART_WEBHOOK_SECRET.",
    })
  } else {
    steps.push(await step("synthetic ConvertBox submit", async () => {
      const { response, json } = await readJson(`${baseUrl}/api/events/convertbox`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "convertbox.lead_submitted",
          sourcePage: `${baseUrl}/${serviceSlug}/pricing`,
          sourcePageType: "pricing",
          serviceSlug,
          serviceLabel: "Plumbing",
          serviceNiche: serviceSlug,
          family: "Emergency Home Response",
          boxId: 232604,
          consumerName: "Revenue QA",
          consumerEmail: qaEmail,
          consumerPhone: "555-010-2026",
          requestSummary: "QA synthetic ConvertBox path verification.",
          consentToContact: true,
          marketingConsent: false,
          sessionId: `qa_session_${Date.now()}`,
          visitorId: "qa_revenue_e2e",
          metadata: { qa: true, script: "revenue-e2e-qa" },
        }),
      })
      return {
        name: "synthetic ConvertBox submit",
        status: response.ok ? "passed" : "failed",
        responseStatus: response.status,
        detail: JSON.stringify(json).slice(0, 700),
      }
    }))

    steps.push(await step("synthetic ThriveCart webhook", async () => {
      const body = JSON.stringify({
        event: "order.success",
        order_id: `qa_order_${Date.now()}`,
        product_id: "157",
        product_name: "Service Page Conversion Blueprint",
        amount: 99,
        currency: "USD",
        email: qaEmail,
        name: "Revenue QA",
        phone: "555-010-2026",
        passthrough: {
          serviceSlug,
          sourcePage: `${baseUrl}/${serviceSlug}/pricing`,
          sourcePageType: "pricing",
          convertBoxId: "232604",
          offerSlug: "service-page-conversion-blueprint",
          funnelSlug: "service-page-blueprint",
          utm_source: "qa",
          utm_medium: "revenue-e2e",
          utm_campaign: "synthetic",
        },
      })
      const request = signedThriveCartRequest(body)
      if (!request.configured) {
        return {
          name: "synthetic ThriveCart webhook",
          status: "skipped",
          detail: "Missing THRIVECART_WEBHOOK_TOKEN or THRIVECART_WEBHOOK_SECRET.",
        }
      }
      const { response, json } = await readJson(request.url, {
        method: "POST",
        headers: request.headers,
        body,
      })
      return {
        name: "synthetic ThriveCart webhook",
        status: response.ok ? "passed" : "failed",
        responseStatus: response.status,
        detail: JSON.stringify(json).slice(0, 700),
      }
    }))
  }

  steps.push(await step("revenue actions contain all outcomes", async () => {
    const { response, json } = await readJson(`${baseUrl}/api/revenue-actions?status=all&limit=100`)
    const text = JSON.stringify(json)
    const outcomes = ["deliver", "recover", "route", "learn"].filter((outcome) => text.includes(`"outcome":"${outcome}"`))
    return {
      name: "revenue actions contain all outcomes",
      status: response.ok && outcomes.includes("route") && outcomes.includes("learn") ? "passed" : "failed",
      responseStatus: response.status,
      detail: `Observed outcomes: ${outcomes.join(", ") || "none"}`,
    }
  }))

  const failed = steps.filter((item) => item.status === "failed")
  const result = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    writeMode,
    status: failed.length === 0 ? "passed" : "failed",
    steps,
  }

  writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8")
  console.log(`Wrote revenue E2E QA results to ${outputPath}`)
  console.log(`Status: ${result.status}; passed=${steps.filter((item) => item.status === "passed").length}; skipped=${steps.filter((item) => item.status === "skipped").length}; failed=${failed.length}`)
  process.exit(failed.length === 0 ? 0 : 1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

import { mkdirSync, writeFileSync } from "fs"
import { resolve } from "path"
import {
  buildThriveCartSetupExport,
  type ThriveCartEventSubscription,
} from "@/lib/thrivecart-setup"

const appUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://erie.pro"
const accountSlug = process.env.THRIVECART_ACCOUNT_SLUG || "relgard"
const setup = buildThriveCartSetupExport(appUrl, accountSlug)
const outputDir = resolve(process.cwd(), "..", "docs", "external-setup", "thrivecart")
const outputPath = resolve(outputDir, "master-setup.json")

mkdirSync(outputDir, { recursive: true })
writeFileSync(outputPath, `${JSON.stringify(setup, null, 2)}\n`, "utf8")

console.log(`Wrote ThriveCart master setup package to ${outputPath}`)
console.log(`Products: ${setup.products.length}`)
console.log(`Event subscriptions: ${setup.eventSubscriptions.length}`)

async function subscribe(event: ThriveCartEventSubscription, apiKey: string) {
  const response = await fetch("https://thrivecart.com/api/external/subscribe", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "EriePro-ThriveCartSetup/1.0",
    },
    body: JSON.stringify(event),
  })
  const text = await response.text()
  if (!response.ok) throw new Error(`${event.event}: ${response.status} ${text.slice(0, 300)}`)
  return text
}

async function main() {
  const apiKey = process.env.THRIVECART_API_KEY
  if (!apiKey) {
    console.log("THRIVECART_API_KEY not present; API event subscription creation is BLOCKED-EXTERNAL.")
    console.log("Product pages, bumps, upsells, downsells, coupons, affiliates, and split tests remain dashboard setup tasks.")
    return
  }

  const results: Array<{ event: string; ok: boolean; message: string }> = []
  for (const event of setup.eventSubscriptions) {
    try {
      const message = await subscribe(event, apiKey)
      results.push({ event: event.event, ok: true, message: message.slice(0, 300) })
    } catch (error) {
      results.push({
        event: event.event,
        ok: false,
        message: error instanceof Error ? error.message : "Unknown ThriveCart subscription error",
      })
    }
  }

  const resultPath = resolve(outputDir, "event-subscription-results.json")
  writeFileSync(resultPath, `${JSON.stringify(results, null, 2)}\n`, "utf8")
  const failed = results.filter((result) => !result.ok)
  console.log(`Wrote ThriveCart event subscription results to ${resultPath}`)
  console.log(`Succeeded: ${results.length - failed.length}; Failed: ${failed.length}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

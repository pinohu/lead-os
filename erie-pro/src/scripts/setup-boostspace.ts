import { writeFileSync, mkdirSync } from "node:fs"
import { resolve } from "node:path"
import { erieDocsPath } from "./paths"
import { buildBoostspaceScenarioExport } from "@/lib/boostspace-revenue-actions"

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://erie.pro"
const tokenVariable = process.env.BOOST_SPACE_REVENUE_ACTION_TOKEN
  ? "BOOST_SPACE_REVENUE_ACTION_TOKEN"
  : "REVENUE_ACTIONS_API_TOKEN"
const outputDir = erieDocsPath("external-setup", "boostspace")
const outputPath = resolve(outputDir, "revenue-action-scenarios.json")
const exportPayload = buildBoostspaceScenarioExport(appUrl, tokenVariable)

mkdirSync(outputDir, { recursive: true })
writeFileSync(outputPath, `${JSON.stringify(exportPayload, null, 2)}\n`)

console.log(`Wrote Boost.space scenario export: ${outputPath}`)
console.log(`Poll endpoint: ${exportPayload.endpoints.poll}`)
console.log(`Status callback endpoint: ${exportPayload.endpoints.statusCallback}`)

if (!process.env.BOOST_SPACE_API_TOKEN && !process.env.BOOST_SPACE_API_KEY) {
  console.log("Boost.space API token not present; API-side scenario creation is BLOCKED-EXTERNAL.")
  console.log("Import or recreate the scenarios manually using docs/external-setup/boostspace.md.")
}

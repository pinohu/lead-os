import { mkdirSync, writeFileSync } from "fs"
import { resolve } from "path"
import { buildSuiteDashSetupExport } from "@/lib/suitedash-operational-sync"
import { isSuiteDashConfigured } from "@/lib/suitedash"

const appUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://erie.pro"
const outputDir = resolve(process.cwd(), "..", "docs", "external-setup", "suitedash")
const outputPath = resolve(outputDir, "operational-sync-package.json")
const setup = buildSuiteDashSetupExport(appUrl)

mkdirSync(outputDir, { recursive: true })
writeFileSync(outputPath, `${JSON.stringify(setup, null, 2)}\n`, "utf8")

console.log(`Wrote SuiteDash setup package to ${outputPath}`)
console.log(`Poll endpoint: ${setup.endpoints.poll}`)
console.log(`Status callback endpoint: ${setup.endpoints.statusCallback}`)

if (!isSuiteDashConfigured()) {
  console.log("SuiteDash API credentials not present; dashboard/API object creation is BLOCKED-EXTERNAL.")
} else {
  console.log("SuiteDash credentials detected. Secure API contact sync is enabled; project/portal/task endpoint mapping still requires dashboard/API confirmation.")
}

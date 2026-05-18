import { mkdirSync, writeFileSync } from "fs"
import { resolve } from "path"
import { erieDocsPath } from "./paths"
import { buildFulfillmentSetupExport } from "@/lib/offer-fulfillment-automation"

const outputDir = erieDocsPath("external-setup", "offer-fulfillment")
const outputPath = resolve(outputDir, "fulfillment-channel-map.json")
const setup = buildFulfillmentSetupExport()

mkdirSync(outputDir, { recursive: true })
writeFileSync(outputPath, `${JSON.stringify(setup, null, 2)}\n`, "utf8")

console.log(`Wrote fulfillment channel setup export to ${outputPath}`)
console.log(`Offers: ${setup.offers.length}`)
console.log("ProductDyno, document delivery, and Taskade remain BLOCKED-EXTERNAL until their webhook/API credentials are present.")

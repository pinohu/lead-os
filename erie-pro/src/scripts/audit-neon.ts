import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { resolve } from "path"
import { prisma } from "@/lib/db"

type Finding = {
  severity: "info" | "warning" | "critical"
  code: string
  message: string
  count?: number
}

const outputDir = resolve(process.cwd(), "..", "docs", "qa")
const outputPath = resolve(outputDir, "neon-audit-results.json")
const envFile = process.env.REVENUE_AUDIT_ENV_FILE

function stripQuotes(value: string) {
  const trimmed = value.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

function loadEnvFile(path: string | undefined) {
  if (!path || !existsSync(path)) return
  const content = readFileSync(path, "utf8")
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith("#") || !line.includes("=")) continue
    const index = line.indexOf("=")
    const key = line.slice(0, index).trim()
    const value = stripQuotes(line.slice(index + 1))
    if (key && process.env[key] == null) process.env[key] = value
  }
}

async function countRevenueActionsByStatus() {
  const actions = await prisma.offerInteraction.findMany({
    where: { eventType: { startsWith: "revenue_action." } },
    select: { eventType: true, metadata: true },
    take: 10000,
  })

  const byStatus = new Map<string, number>()
  const byOutcome = new Map<string, number>()
  let missingActionMetadata = 0

  for (const action of actions) {
    const metadata = (action.metadata ?? {}) as { status?: string; action?: unknown }
    const status = metadata.status ?? "missing"
    const outcome = action.eventType.replace("revenue_action.", "")
    byStatus.set(status, (byStatus.get(status) ?? 0) + 1)
    byOutcome.set(outcome, (byOutcome.get(outcome) ?? 0) + 1)
    if (!metadata.action) missingActionMetadata += 1
  }

  return {
    total: actions.length,
    byStatus: Object.fromEntries(byStatus.entries()),
    byOutcome: Object.fromEntries(byOutcome.entries()),
    missingActionMetadata,
  }
}

async function main() {
  loadEnvFile(envFile)
  mkdirSync(outputDir, { recursive: true })

  const findings: Finding[] = []
  if (!process.env.DATABASE_URL) {
    const result = {
      generatedAt: new Date().toISOString(),
      status: "blocked",
      findings: [{
        severity: "critical",
        code: "database_url_missing",
        message: "DATABASE_URL is not configured for the Neon audit run.",
      }],
    }
    writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8")
    console.log(`Wrote Neon audit results to ${outputPath}`)
    console.log("Status: blocked; DATABASE_URL missing")
    process.exit(1)
  }

  const [
    leadEvents,
    thriveCartEvents,
    offerPurchases,
    fulfillmentJobs,
    generatedAssets,
    offerInteractions,
    revenueActions,
    failedThriveCartEvents,
    failedFulfillmentJobs,
    failedBoostspacePurchases,
    failedSuiteDashPurchases,
    fulfilledWithoutAsset,
    paidWithoutPaidAt,
  ] = await Promise.all([
    prisma.leadEvent.count(),
    prisma.thriveCartEvent.count(),
    prisma.offerPurchase.count(),
    prisma.fulfillmentJob.count(),
    prisma.generatedAsset.count(),
    prisma.offerInteraction.count(),
    countRevenueActionsByStatus(),
    prisma.thriveCartEvent.count({ where: { processingStatus: "failed" } }),
    prisma.fulfillmentJob.count({ where: { status: "failed" } }),
    prisma.offerPurchase.count({ where: { boostspaceSyncStatus: "failed" } }),
    prisma.offerPurchase.count({ where: { suitedashSyncStatus: "failed" } }),
    prisma.offerPurchase.count({ where: { status: "fulfilled", generatedAssets: { none: {} } } }),
    prisma.offerPurchase.count({ where: { status: { in: ["paid", "fulfilled"] }, paidAt: null } }),
  ])

  const thriveCartOrderKeys = await prisma.thriveCartEvent.findMany({
    where: { orderId: { not: null } },
    select: { orderId: true, productId: true },
    take: 10000,
  })
  const duplicateGroups = new Map<string, { orderId: string | null; productId: string | null; count: number }>()
  for (const event of thriveCartOrderKeys) {
    const key = `${event.orderId ?? ""}|${event.productId ?? ""}`
    const existing = duplicateGroups.get(key)
    duplicateGroups.set(key, {
      orderId: event.orderId,
      productId: event.productId,
      count: (existing?.count ?? 0) + 1,
    })
  }
  const duplicateThriveCartOrders = Array.from(duplicateGroups.values())
    .filter((item) => item.count > 1)
    .slice(0, 25)

  if (revenueActions.missingActionMetadata > 0) {
    findings.push({
      severity: "critical",
      code: "revenue_action_missing_metadata",
      message: "Revenue actions exist without embedded action metadata.",
      count: revenueActions.missingActionMetadata,
    })
  }
  if (failedThriveCartEvents > 0) {
    findings.push({ severity: "warning", code: "failed_thrivecart_events", message: "ThriveCart events failed processing.", count: failedThriveCartEvents })
  }
  if (failedFulfillmentJobs > 0) {
    findings.push({ severity: "warning", code: "failed_fulfillment_jobs", message: "Fulfillment jobs are failed.", count: failedFulfillmentJobs })
  }
  if (failedBoostspacePurchases > 0) {
    findings.push({ severity: "warning", code: "failed_boostspace_purchase_sync", message: "Offer purchases have failed Boost.space sync.", count: failedBoostspacePurchases })
  }
  if (failedSuiteDashPurchases > 0) {
    findings.push({ severity: "warning", code: "failed_suitedash_purchase_sync", message: "Offer purchases have failed SuiteDash sync.", count: failedSuiteDashPurchases })
  }
  if (fulfilledWithoutAsset > 0) {
    findings.push({ severity: "critical", code: "fulfilled_without_asset", message: "Fulfilled purchases are missing generated assets.", count: fulfilledWithoutAsset })
  }
  if (paidWithoutPaidAt > 0) {
    findings.push({ severity: "warning", code: "paid_without_paid_at", message: "Paid/fulfilled purchases are missing paidAt timestamps.", count: paidWithoutPaidAt })
  }
  if (duplicateThriveCartOrders.length > 0) {
    findings.push({ severity: "warning", code: "duplicate_thrivecart_orders", message: "Duplicate ThriveCart order/product event groups found.", count: duplicateThriveCartOrders.length })
  }
  if (findings.length === 0) {
    findings.push({ severity: "info", code: "no_findings", message: "No Neon revenue data issues found by the current audit rules." })
  }

  const result = {
    generatedAt: new Date().toISOString(),
    status: findings.some((finding) => finding.severity === "critical") ? "failed" : "passed",
    counts: {
      leadEvents,
      thriveCartEvents,
      offerPurchases,
      fulfillmentJobs,
      generatedAssets,
      offerInteractions,
      revenueActions,
    },
    duplicateThriveCartOrders,
    findings,
  }

  writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8")
  console.log(`Wrote Neon audit results to ${outputPath}`)
  console.log(`Status: ${result.status}; findings=${findings.length}`)
  await prisma.$disconnect()
  process.exit(result.status === "failed" ? 1 : 0)
}

main().catch(async (error) => {
  mkdirSync(outputDir, { recursive: true })
  writeFileSync(outputPath, `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    status: "failed",
    findings: [{
      severity: "critical",
      code: "audit_runtime_error",
      message: error instanceof Error ? error.message : "Unknown Neon audit error",
    }],
  }, null, 2)}\n`, "utf8")
  await prisma.$disconnect().catch(() => {})
  console.error(error)
  process.exit(1)
})

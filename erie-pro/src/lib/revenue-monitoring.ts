import { prisma } from "@/lib/db"

export type RevenueMonitoringSnapshot = {
  generatedAt: string
  status: "healthy" | "degraded"
  counts: {
    failedThriveCartEvents: number
    failedFulfillmentJobs: number
    failedBoostspacePurchases: number
    failedSuiteDashPurchases: number
    failedRevenueActions: number
    stalePlannedRevenueActions: number
    recentRevenueActions24h: number
  }
  alerts: Array<{
    severity: "warning" | "critical"
    code: string
    message: string
    count: number
  }>
}

function metadataStatus(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const status = (value as Record<string, unknown>).status
  return typeof status === "string" ? status : null
}

export async function getRevenueMonitoringSnapshot(): Promise<RevenueMonitoringSnapshot> {
  const staleCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const dayCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const [
    failedThriveCartEvents,
    failedFulfillmentJobs,
    failedBoostspacePurchases,
    failedSuiteDashPurchases,
    recentRevenueActions24h,
    revenueActionRows,
  ] = await Promise.all([
    prisma.thriveCartEvent.count({ where: { processingStatus: "failed" } }),
    prisma.fulfillmentJob.count({ where: { status: "failed" } }),
    prisma.offerPurchase.count({ where: { boostspaceSyncStatus: "failed" } }),
    prisma.offerPurchase.count({ where: { suitedashSyncStatus: "failed" } }),
    prisma.offerInteraction.count({
      where: { eventType: { startsWith: "revenue_action." }, createdAt: { gte: dayCutoff } },
    }),
    prisma.offerInteraction.findMany({
      where: { eventType: { startsWith: "revenue_action." } },
      select: { metadata: true, createdAt: true },
      take: 10000,
    }),
  ])

  let failedRevenueActions = 0
  let stalePlannedRevenueActions = 0
  for (const row of revenueActionRows) {
    const status = metadataStatus(row.metadata)
    if (status === "failed") failedRevenueActions += 1
    if ((status ?? "planned") === "planned" && row.createdAt < staleCutoff) stalePlannedRevenueActions += 1
  }

  const alerts: RevenueMonitoringSnapshot["alerts"] = []
  if (failedThriveCartEvents > 0) {
    alerts.push({ severity: "critical", code: "failed_thrivecart_events", message: "ThriveCart webhook events are failing.", count: failedThriveCartEvents })
  }
  if (failedFulfillmentJobs > 0) {
    alerts.push({ severity: "critical", code: "failed_fulfillment_jobs", message: "Fulfillment jobs are failing.", count: failedFulfillmentJobs })
  }
  if (failedRevenueActions > 0) {
    alerts.push({ severity: "critical", code: "failed_revenue_actions", message: "Revenue actions are marked failed.", count: failedRevenueActions })
  }
  if (failedBoostspacePurchases > 0) {
    alerts.push({ severity: "warning", code: "failed_boostspace_purchase_sync", message: "Offer purchase Boost.space sync failures exist.", count: failedBoostspacePurchases })
  }
  if (failedSuiteDashPurchases > 0) {
    alerts.push({ severity: "warning", code: "failed_suitedash_purchase_sync", message: "Offer purchase SuiteDash sync failures exist.", count: failedSuiteDashPurchases })
  }
  if (stalePlannedRevenueActions > 0) {
    alerts.push({ severity: "warning", code: "stale_planned_revenue_actions", message: "Planned revenue actions are older than 24 hours.", count: stalePlannedRevenueActions })
  }

  return {
    generatedAt: new Date().toISOString(),
    status: alerts.some((alert) => alert.severity === "critical") ? "degraded" : "healthy",
    counts: {
      failedThriveCartEvents,
      failedFulfillmentJobs,
      failedBoostspacePurchases,
      failedSuiteDashPurchases,
      failedRevenueActions,
      stalePlannedRevenueActions,
      recentRevenueActions24h,
    },
    alerts,
  }
}

export function renderRevenueMonitoringDigest(snapshot: RevenueMonitoringSnapshot) {
  const rows = Object.entries(snapshot.counts)
    .map(([key, value]) => `<tr><td style="padding:6px 10px;border-bottom:1px solid #e5e7eb">${key}</td><td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:right">${value}</td></tr>`)
    .join("")
  const alertRows = snapshot.alerts.length
    ? snapshot.alerts.map((alert) => `<li><strong>${alert.code}</strong>: ${alert.message} (${alert.count})</li>`).join("")
    : "<li>No active revenue alerts.</li>"

  return `
    <div style="font-family:Inter,Arial,sans-serif;color:#12213a;line-height:1.5">
      <h2 style="margin:0 0 12px">Erie.Pro Revenue Monitoring Digest</h2>
      <p>Status: <strong>${snapshot.status}</strong></p>
      <table style="border-collapse:collapse;width:100%;max-width:640px">${rows}</table>
      <h3>Alerts</h3>
      <ul>${alertRows}</ul>
      <p style="color:#64748b;font-size:13px">Generated at ${snapshot.generatedAt}</p>
    </div>
  `
}

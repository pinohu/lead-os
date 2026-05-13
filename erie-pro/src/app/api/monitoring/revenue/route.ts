import { NextRequest, NextResponse } from "next/server"
import { getRevenueMonitoringSnapshot } from "@/lib/revenue-monitoring"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"

function hasAccess(request: NextRequest) {
  const token = process.env.CRON_SECRET || process.env.REVENUE_MONITORING_TOKEN
  if (!token) return false
  const auth = request.headers.get("authorization")
  const bearer = auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : null
  return bearer === token || request.nextUrl.searchParams.get("token") === token
}

export async function GET(request: NextRequest) {
  if (!hasAccess(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const snapshot = await getRevenueMonitoringSnapshot()
    return NextResponse.json({ success: true, snapshot }, { status: snapshot.status === "healthy" ? 200 : 503 })
  } catch (error) {
    logger.error("api/monitoring/revenue", "Revenue monitoring snapshot failed", error)
    return NextResponse.json({ success: false, error: "Revenue monitoring failed" }, { status: 500 })
  }
}

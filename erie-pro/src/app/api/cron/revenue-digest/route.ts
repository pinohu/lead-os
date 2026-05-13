import { NextRequest, NextResponse } from "next/server"
import { sendEmail } from "@/lib/email"
import { logger } from "@/lib/logger"
import {
  getRevenueMonitoringSnapshot,
  renderRevenueMonitoringDigest,
} from "@/lib/revenue-monitoring"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const snapshot = await getRevenueMonitoringSnapshot()
    const recipient = process.env.REVENUE_MONITORING_EMAIL || process.env.ADMIN_EMAIL
    let emailed = false

    if (recipient) {
      emailed = await sendEmail({
        to: recipient,
        subject: `Erie.Pro revenue monitoring: ${snapshot.status}`,
        html: renderRevenueMonitoringDigest(snapshot),
        replyTo: "hello@erie.pro",
      })
    }

    return NextResponse.json({
      success: true,
      emailed,
      snapshot,
    }, { status: snapshot.status === "healthy" ? 200 : 207 })
  } catch (error) {
    logger.error("api/cron/revenue-digest", "Revenue digest failed", error)
    return NextResponse.json({ success: false, error: "Revenue digest failed" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { processPendingOfferFulfillmentJobs } from "@/lib/offer-fulfillment"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const limit = Number(request.nextUrl.searchParams.get("limit") ?? 10)

  try {
    const result = await processPendingOfferFulfillmentJobs(limit)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    logger.error("api/cron/offer-fulfillment", "Offer fulfillment cron failed", error)
    return NextResponse.json({ success: false, error: "Offer fulfillment failed" }, { status: 500 })
  }
}

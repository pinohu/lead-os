import { NextRequest, NextResponse } from "next/server"
import { getServiceRequestStatus } from "@/lib/service-requests/status"
import { processNotificationQueue } from "@/lib/notifications/queue"
import { logger } from "@/lib/logger"

interface RouteParams {
  params: Promise<{ requestId: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { requestId } = await params
  const token = request.nextUrl.searchParams.get("token")

  if (!token) {
    return NextResponse.json({ success: false, error: "Missing token" }, { status: 400 })
  }

  try {
    await processNotificationQueue(5)
    const status = await getServiceRequestStatus(requestId, token)
    if (!status) {
      return NextResponse.json({ success: false, error: "Request not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true, ...status })
  } catch (err) {
    logger.error("/api/service-requests/status", "Error:", err)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

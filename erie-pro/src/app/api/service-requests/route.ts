import { NextRequest, NextResponse } from "next/server"
import { after } from "next/server"
import { ServiceRequestSchema, formatZodErrors, MAX_BODY_SIZE } from "@/lib/validation"
import { checkRateLimit } from "@/lib/rate-limit"
import { prisma } from "@/lib/db"
import { logger } from "@/lib/logger"
import { createServiceRequest } from "@/lib/service-requests/create"
import { processNotificationQueue } from "@/lib/notifications/queue"

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await checkRateLimit(request, "lead")
    if (rateLimited) return rateLimited

    const contentLength = Number.parseInt(request.headers.get("content-length") ?? "0", 10)
    if (contentLength > MAX_BODY_SIZE) {
      return NextResponse.json({ success: false, error: "Request body too large" }, { status: 413 })
    }

    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 })
    }

    const parsed = ServiceRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: formatZodErrors(parsed.error) },
        { status: 400 }
      )
    }

    const { email, phone } = parsed.data
    const suppressed = await prisma.suppression.findFirst({
      where: {
        OR: [{ email }, ...(phone ? [{ phone }] : [])],
      },
    })
    if (suppressed) {
      return NextResponse.json(
        { success: false, error: "This contact has opted out of communications" },
        { status: 403 }
      )
    }

    const tcpaIpAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"

    const result = await createServiceRequest({
      ...parsed.data,
      tcpaIpAddress,
    })

    after(async () => {
      try {
        await processNotificationQueue(20)
      } catch (err) {
        logger.error("service-requests", "Background queue processing failed", err)
      }
    })

    return NextResponse.json(result)
  } catch (err) {
    logger.error("/api/service-requests", "Error:", err)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

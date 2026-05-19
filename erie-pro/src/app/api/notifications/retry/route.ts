import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { processNotificationEvent, processNotificationQueue } from "@/lib/notifications/queue"
import { logger } from "@/lib/logger"

const RetrySchema = z.object({
  eventId: z.string().min(1).optional(),
  serviceRequestId: z.string().min(1).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const parsed = RetrySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid body" }, { status: 400 })
    }

    const { eventId, serviceRequestId } = parsed.data
    if (!eventId && !serviceRequestId) {
      return NextResponse.json(
        { success: false, error: "eventId or serviceRequestId required" },
        { status: 400 }
      )
    }

    if (eventId) {
      const event = await prisma.notificationEvent.findUnique({ where: { id: eventId } })
      if (!event) {
        return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 })
      }
      await prisma.notificationEvent.update({
        where: { id: eventId },
        data: { status: "queued", nextRetryAt: null },
      })
      await processNotificationEvent(eventId)
    } else if (serviceRequestId) {
      const events = await prisma.notificationEvent.findMany({
        where: {
          serviceRequestId,
          status: { in: ["queued", "failed"] },
        },
      })
      for (const event of events) {
        await prisma.notificationEvent.update({
          where: { id: event.id },
          data: { status: "queued", nextRetryAt: null },
        })
        await processNotificationEvent(event.id)
      }
    }

    const processed = await processNotificationQueue(20)
    return NextResponse.json({ success: true, processed })
  } catch (err) {
    logger.error("/api/notifications/retry", "Error:", err)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

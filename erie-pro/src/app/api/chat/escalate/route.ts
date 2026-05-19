// POST /api/chat/escalate

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { checkRateLimit } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"
import { classifyChatApiError } from "@/lib/chatbot/api-errors"
import { createEscalation } from "@/lib/chatbot/escalation"
import { recordChatAnalytics } from "@/lib/chatbot/analytics"
import { prisma } from "@/lib/db"
import type { ChatPersona } from "@/lib/chatbot/personas"

const BodySchema = z.object({
  sessionId: z.string().min(1).max(100),
  reason: z.string().min(3).max(2000),
  requestId: z.string().max(80).optional(),
})

export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, "lead-event")
  if (rateLimited) return rateLimited

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 })
  }

  try {
    const session = await prisma.chatSession.findUnique({
      where: { id: parsed.data.sessionId },
    })
    if (!session) {
      return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 })
    }

    const escalation = await createEscalation({
      sessionId: parsed.data.sessionId,
      reason: parsed.data.reason,
      metadata: {
        requestId: parsed.data.requestId ?? session.serviceRequestId,
      },
    })

    await recordChatAnalytics({
      sessionId: session.id,
      persona: session.persona as ChatPersona,
      eventType: "escalated",
    })

    return NextResponse.json({
      success: true,
      escalationId: escalation.id,
      status: escalation.status,
    })
  } catch (err) {
    logger.error("/api/chat/escalate", err)
    const classified = classifyChatApiError(err)
    return NextResponse.json(
      { success: false, error: classified.error, code: classified.code },
      { status: classified.status },
    )
  }
}

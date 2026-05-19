// POST /api/chat/message

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { checkRateLimit } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"
import { classifyChatApiError } from "@/lib/chatbot/api-errors"
import { handleChatMessage } from "@/lib/chatbot/orchestrator"

const BodySchema = z.object({
  sessionId: z.string().min(1).max(100),
  message: z.string().min(1).max(4000),
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

    if (session.persona === "admin_operations") {
      const authSession = await auth()
      const role = (authSession?.user as { role?: string } | undefined)?.role
      if (role !== "admin") {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
      }
    }

    if (session.persona === "provider_operations" && !session.providerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const result = await handleChatMessage({
      sessionId: parsed.data.sessionId,
      message: parsed.data.message,
    })

    return NextResponse.json({ success: true, reply: result.reply })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg === "session-not-found" || msg === "empty-message") {
      return NextResponse.json({ success: false, error: msg }, { status: 400 })
    }
    logger.error("/api/chat/message", err)
    const classified = classifyChatApiError(err)
    return NextResponse.json(
      { success: false, error: classified.error, code: classified.code },
      { status: classified.status },
    )
  }
}

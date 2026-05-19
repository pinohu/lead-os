// GET /api/chat/session/[id]

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { classifyChatApiError } from "@/lib/chatbot/api-errors"
import { getChatSessionForClient } from "@/lib/chatbot/session"
import { logger } from "@/lib/logger"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  try {
    const session = await getChatSessionForClient(id)
    if (!session) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })
    }

    if (session.persona === "admin_operations") {
      const authSession = await auth()
      if ((authSession?.user as { role?: string } | undefined)?.role !== "admin") {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
      }
    }

    return NextResponse.json({ success: true, session })
  } catch (err) {
    logger.error("/api/chat/session/[id]", err)
    const classified = classifyChatApiError(err)
    return NextResponse.json(
      { success: false, error: classified.error, code: classified.code },
      { status: classified.status },
    )
  }
}

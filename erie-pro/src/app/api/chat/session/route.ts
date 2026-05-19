// POST /api/chat/session

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { checkRateLimit } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"
import { resolveAudienceFromPathname } from "@/lib/page-audience-registry"
import { resolveChatPersona } from "@/lib/chatbot/personas"
import { createChatSession } from "@/lib/chatbot/session"

const BodySchema = z.object({
  pathname: z.string().min(1).max(500),
  visitorId: z.string().max(120).optional(),
  serviceRequestId: z.string().max(80).optional(),
  statusToken: z.string().max(200).optional(),
  personaOverride: z
    .enum([
      "consumer_service",
      "consumer_status",
      "provider_growth",
      "provider_operations",
      "admin_operations",
    ])
    .optional(),
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
    const sessionAuth = await auth()
    const audience = resolveAudienceFromPathname(parsed.data.pathname)
    const persona =
      parsed.data.personaOverride ??
      resolveChatPersona({
        pathname: parsed.data.pathname,
        audience: audience.audience,
        serviceRequestId: parsed.data.serviceRequestId,
      })

    let userId: string | undefined
    let providerId: string | undefined
    let isAdmin = false

    if (sessionAuth?.user?.id) {
      userId = sessionAuth.user.id
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { providerId: true, role: true },
      })
      providerId = user?.providerId ?? undefined
      isAdmin = user?.role === "admin"
    }

    if (persona === "admin_operations" && !isAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    if (persona === "provider_operations" && !providerId) {
      return NextResponse.json(
        { success: false, error: "Provider sign-in required for dashboard assistant" },
        { status: 401 },
      )
    }

    const chatSession = await createChatSession({
      persona,
      visitorId: parsed.data.visitorId,
      userId,
      providerId,
      serviceRequestId: parsed.data.serviceRequestId,
      contextPath: parsed.data.pathname,
      statusToken: parsed.data.statusToken,
      contextJson: { isAdmin },
    })

    return NextResponse.json({
      success: true,
      sessionId: chatSession.id,
      persona: chatSession.persona,
    })
  } catch (err) {
    logger.error("/api/chat/session", err)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// erie-pro/src/lib/chatbot/session.ts

import { prisma } from "@/lib/db"
import type { ChatPersona } from "@/lib/chatbot/personas"
import type { ChatPersona as PrismaChatPersona } from "@/generated/prisma"
import { appendChatMessage } from "@/lib/chatbot/memory"
import { CHAT_PERSONA_UI } from "@/lib/chatbot/personas"
import { recordChatAnalytics } from "@/lib/chatbot/analytics"

export interface CreateChatSessionInput {
  persona: ChatPersona
  visitorId?: string
  userId?: string
  providerId?: string
  serviceRequestId?: string
  contextPath?: string
  contextJson?: Record<string, unknown>
  statusToken?: string
}

export async function createChatSession(input: CreateChatSessionInput) {
  const contextJson = {
    ...(input.contextJson ?? {}),
    ...(input.statusToken ? { statusToken: input.statusToken } : {}),
  }

  const session = await prisma.chatSession.create({
    data: {
      persona: input.persona as PrismaChatPersona,
      visitorId: input.visitorId ?? null,
      userId: input.userId ?? null,
      providerId: input.providerId ?? null,
      serviceRequestId: input.serviceRequestId ?? null,
      contextPath: input.contextPath ?? null,
      contextJson,
    },
  })

  const opening = CHAT_PERSONA_UI[input.persona].openingMessage
  await appendChatMessage({
    sessionId: session.id,
    role: "assistant",
    content: opening,
  })

  await recordChatAnalytics({
    sessionId: session.id,
    persona: input.persona,
    eventType: "session_started",
    metadata: { contextPath: input.contextPath },
  })

  return session
}

export async function getChatSessionForClient(sessionId: string) {
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    include: {
      messages: { orderBy: { createdAt: "asc" }, take: 50 },
      escalations: { where: { status: "open" }, take: 1 },
    },
  })
  if (!session) return null

  const ctx = (session.contextJson ?? {}) as Record<string, unknown>

  return {
    id: session.id,
    persona: session.persona,
    status: session.status,
    contextPath: session.contextPath,
    serviceRequestId: session.serviceRequestId,
    messages: session.messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    })),
    hasOpenEscalation: session.escalations.length > 0,
    statusToken: typeof ctx.statusToken === "string" ? ctx.statusToken : null,
  }
}

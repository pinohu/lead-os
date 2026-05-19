// erie-pro/src/lib/chatbot/analytics.ts

import { prisma } from "@/lib/db"
import { logger } from "@/lib/logger"
import type { ChatPersona } from "@/lib/chatbot/personas"

export async function recordChatAnalytics(event: {
  sessionId: string
  persona: ChatPersona
  eventType: "session_started" | "message_sent" | "tool_called" | "escalated"
  metadata?: Record<string, unknown>
}) {
  logger.info("chatbot.analytics", event)
  await prisma.userAction
    .create({
      data: {
        correlationId: event.sessionId,
        actionType: `chatbot.${event.eventType}`,
        actorType: "visitor",
        metadata: {
          persona: event.persona,
          ...(event.metadata ?? {}),
        },
      },
    })
    .catch(() => null)
}

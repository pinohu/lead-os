// erie-pro/src/lib/chatbot/memory.ts

import { prisma } from "@/lib/db"
import type { ChatMessageRole } from "@/generated/prisma"

export async function appendChatMessage({
  sessionId,
  role,
  content,
  toolName,
  toolPayload,
}: {
  sessionId: string
  role: ChatMessageRole
  content: string
  toolName?: string
  toolPayload?: unknown
}) {
  return prisma.chatMessage.create({
    data: {
      sessionId,
      role,
      content,
      toolName: toolName ?? null,
      toolPayload: toolPayload ? (toolPayload as object) : undefined,
    },
  })
}

export async function loadRecentMessages(sessionId: string, limit = 24) {
  const rows = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    take: limit,
  })
  return rows
}

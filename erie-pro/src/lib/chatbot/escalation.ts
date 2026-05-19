// erie-pro/src/lib/chatbot/escalation.ts

import type { Prisma } from "@/generated/prisma"
import { prisma } from "@/lib/db"

export async function createEscalation({
  sessionId,
  reason,
  metadata,
}: {
  sessionId: string
  reason: string
  metadata?: Record<string, unknown>
}) {
  const escalation = await prisma.chatEscalation.create({
    data: {
      sessionId,
      reason,
      metadata: (metadata ?? {}) as Prisma.InputJsonValue,
    },
  })
  await prisma.chatSession.update({
    where: { id: sessionId },
    data: { status: "escalated" },
  })
  return escalation
}

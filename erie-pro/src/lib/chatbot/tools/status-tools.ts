// erie-pro/src/lib/chatbot/tools/status-tools.ts

import { prisma } from "@/lib/db"
import { getServiceRequestStatus } from "@/lib/service-requests/status"
import { processNotificationEvent, processNotificationQueue } from "@/lib/notifications/queue"
import { TEMPLATE_SLUGS } from "@/lib/notifications/templates"
import { createEscalation } from "@/lib/chatbot/escalation"
import type { ChatToolContext, ToolResult } from "@/lib/chatbot/tools/types"

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined
}

export async function executeStatusTool(
  toolName: string,
  input: Record<string, unknown>,
  ctx: ChatToolContext,
): Promise<ToolResult> {
  switch (toolName) {
    case "getRequestStatus": {
      const requestId = str(input.requestId) ?? ctx.serviceRequestId ?? undefined
      const token = str(input.token) ?? ctx.statusToken ?? undefined
      if (!requestId || !token) {
        return { ok: false, error: "requestId and token are required to read status" }
      }
      await processNotificationQueue(3).catch(() => null)
      const status = await getServiceRequestStatus(requestId, token)
      if (!status) return { ok: false, error: "Request not found or invalid token" }
      return { ok: true, data: status }
    }
    case "retryConsumerConfirmation": {
      const requestId = str(input.requestId) ?? ctx.serviceRequestId
      const token = str(input.token) ?? ctx.statusToken
      if (!requestId || !token) {
        return { ok: false, error: "requestId and token required" }
      }
      const sr = await prisma.serviceRequest.findUnique({ where: { requestId } })
      if (!sr || sr.statusAccessToken !== token) {
        return { ok: false, error: "Request not found" }
      }
      const event = await prisma.notificationEvent.findFirst({
        where: {
          serviceRequestId: sr.id,
          templateSlug: TEMPLATE_SLUGS.consumerConfirmation,
        },
        orderBy: { createdAt: "desc" },
      })
      if (!event) {
        return { ok: false, error: "No consumer confirmation notification on file" }
      }
      await processNotificationEvent(event.id)
      const updated = await prisma.notificationEvent.findUnique({ where: { id: event.id } })
      return {
        ok: true,
        data: {
          eventId: event.id,
          status: updated?.status ?? event.status,
          label: updated?.status ?? "unknown",
        },
      }
    }
    case "escalateServiceRequest": {
      const requestId = str(input.requestId) ?? ctx.serviceRequestId
      const reason = str(input.reason) ?? "Consumer requested human review via chat"
      const token = str(input.token) ?? ctx.statusToken
      if (!requestId) return { ok: false, error: "requestId required" }
      if (token) {
        const sr = await prisma.serviceRequest.findUnique({ where: { requestId } })
        if (!sr || sr.statusAccessToken !== token) {
          return { ok: false, error: "Invalid token" }
        }
      }
      const escalation = await createEscalation({
        sessionId: ctx.sessionId,
        reason,
        metadata: { requestId, source: "chat" },
      })
      return { ok: true, data: { escalationId: escalation.id, status: escalation.status } }
    }
    default:
      return { ok: false, error: `Unknown status tool: ${toolName}` }
  }
}

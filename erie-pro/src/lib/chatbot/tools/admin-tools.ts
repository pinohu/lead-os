// erie-pro/src/lib/chatbot/tools/admin-tools.ts

import { prisma } from "@/lib/db"
import { processNotificationEvent } from "@/lib/notifications/queue"
import { resolveReconciliationItem } from "@/lib/thrivecart-reconciliation"
import type { ChatToolContext, ToolResult } from "@/lib/chatbot/tools/types"

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined
}

function parseLimit(v: unknown, fallback = 20): number {
  return Math.min(Number.parseInt(str(v) ?? String(fallback), 10) || fallback, 50)
}

export async function executeAdminTool(
  toolName: string,
  input: Record<string, unknown>,
  ctx: ChatToolContext,
): Promise<ToolResult> {
  if (!ctx.isAdmin) {
    return { ok: false, error: "Admin authentication required for this tool" }
  }

  switch (toolName) {
    case "getFailedNotifications": {
      const events = await prisma.notificationEvent.findMany({
        where: { status: "failed" },
        orderBy: { createdAt: "desc" },
        take: parseLimit(input.limit),
        include: {
          serviceRequest: { select: { requestId: true, email: true, niche: true } },
        },
      })
      return {
        ok: true,
        data: events.map((e) => ({
          id: e.id,
          templateSlug: e.templateSlug,
          recipientEmail: e.recipientEmail,
          retryCount: e.retryCount,
          lastError: e.lastError,
          requestId: e.serviceRequest.requestId,
        })),
      }
    }
    case "retryNotification": {
      const eventId = str(input.eventId)
      if (!eventId) return { ok: false, error: "eventId required" }
      await processNotificationEvent(eventId)
      const updated = await prisma.notificationEvent.findUnique({ where: { id: eventId } })
      return { ok: true, data: { eventId, status: updated?.status ?? "unknown" } }
    }
    case "getUnmatchedThriveCartEvents": {
      const items = await prisma.thriveCartReconciliationItem.findMany({
        where: { status: "unmatched" },
        orderBy: { createdAt: "desc" },
        take: parseLimit(input.limit),
      })
      return { ok: true, data: items }
    }
    case "reconcilePurchase": {
      const itemId = str(input.itemId)
      if (!itemId) return { ok: false, error: "itemId required" }
      const item = await resolveReconciliationItem({
        itemId,
        resolvedBy: ctx.userId ?? "chatbot-admin",
        resolutionNotes: str(input.notes) ?? "Resolved via admin chatbot",
        status: "manual_resolved",
      })
      return { ok: true, data: item }
    }
    case "getProvisioningFailures": {
      const jobs = await prisma.provisioningJob.findMany({
        where: { status: "failed" },
        orderBy: { updatedAt: "desc" },
        take: parseLimit(input.limit),
        select: {
          id: true,
          status: true,
          subscriptionId: true,
          providerId: true,
          lastError: true,
          updatedAt: true,
        },
      })
      return { ok: true, data: jobs }
    }
    case "retryProvisioningJob": {
      const jobId = str(input.jobId)
      if (!jobId) return { ok: false, error: "jobId required" }
      const job = await prisma.provisioningJob.update({
        where: { id: jobId },
        data: { status: "pending", lastError: null },
      })
      return { ok: true, data: { jobId: job.id, status: job.status } }
    }
    case "getProviderHealth": {
      const [failedNotifs, unmatched, failedJobs, activeProviders] = await Promise.all([
        prisma.notificationEvent.count({ where: { status: "failed" } }),
        prisma.thriveCartReconciliationItem.count({ where: { status: "unmatched" } }),
        prisma.provisioningJob.count({ where: { status: "failed" } }),
        prisma.provider.count({ where: { lifecycleStatus: "live" } }),
      ])
      return {
        ok: true,
        data: {
          failedNotifications: failedNotifs,
          unmatchedThriveCart: unmatched,
          failedProvisioningJobs: failedJobs,
          publishedProviders: activeProviders,
        },
      }
    }
    default:
      return { ok: false, error: `Unknown admin tool: ${toolName}` }
  }
}

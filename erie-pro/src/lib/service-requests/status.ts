// src/lib/service-requests/status.ts

import { prisma } from "@/lib/db"
import { mapEventStatusToLabel, providerWasNotified } from "@/lib/notifications/status"

export async function getServiceRequestStatus(requestId: string, token: string) {
  const sr = await prisma.serviceRequest.findUnique({
    where: { requestId },
    include: {
      statusEvents: { orderBy: { createdAt: "asc" } },
      notificationEvents: { orderBy: { createdAt: "asc" } },
    },
  })

  if (!sr || sr.statusAccessToken !== token) {
    return null
  }

  return {
    requestId: sr.requestId,
    correlationId: sr.correlationId,
    status: sr.status,
    niche: sr.niche,
    city: sr.city,
    routedTo: sr.routedToProviderName,
    providerNotified: providerWasNotified(sr.notificationEvents),
    createdAt: sr.createdAt.toISOString(),
    timeline: sr.statusEvents.map((e) => ({
      status: e.status,
      message: e.message,
      at: e.createdAt.toISOString(),
    })),
    notifications: sr.notificationEvents.map((e) => ({
      templateSlug: e.templateSlug,
      recipientRole: e.recipientRole,
      status: e.status,
      label: mapEventStatusToLabel(e.status),
      retryCount: e.retryCount,
      sentAt: e.sentAt?.toISOString() ?? null,
    })),
  }
}

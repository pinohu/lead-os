// src/lib/notifications/queue.ts
// Processes notification_events with retry policy: 1m, 5m, 15m then admin alert.

import { prisma } from "@/lib/db"
import { logger } from "@/lib/logger"
import type { ServiceRequestStatus } from "@/generated/prisma"
import { sendNotificationEmail, isEmailConfigured } from "./send-email"
import { renderTemplate, TEMPLATE_SLUGS, type TemplateVariables } from "./templates"

const RETRY_DELAYS_MS = [60_000, 300_000, 900_000] as const

function nextRetryAt(retryCount: number): Date | null {
  const delay = RETRY_DELAYS_MS[retryCount]
  if (delay === undefined) return null
  return new Date(Date.now() + delay)
}

function buildStatusUrl(requestId: string, token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002"
  return `${base}/request-status/${encodeURIComponent(requestId)}?token=${encodeURIComponent(token)}`
}

async function updateServiceRequestStatus(
  serviceRequestId: string,
  status: ServiceRequestStatus,
  message: string
): Promise<void> {
  await prisma.$transaction([
    prisma.serviceRequest.update({
      where: { id: serviceRequestId },
      data: { status },
    }),
    prisma.statusEvent.create({
      data: { serviceRequestId, status, message },
    }),
  ])
}

async function queueAdminFailureAlert(
  serviceRequestId: string,
  requestId: string,
  failedEventId: string,
  reason: string,
  statusAccessToken: string
): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) return

  const existing = await prisma.notificationEvent.findFirst({
    where: {
      serviceRequestId,
      templateSlug: TEMPLATE_SLUGS.adminFailure,
      recipientEmail: adminEmail,
    },
  })
  if (existing) return

  await prisma.notificationEvent.create({
    data: {
      serviceRequestId,
      templateSlug: TEMPLATE_SLUGS.adminFailure,
      recipientEmail: adminEmail,
      recipientRole: "admin",
      status: "queued",
      metadata: { failedEventId, reason },
    },
  })

  const sr = await prisma.serviceRequest.findUnique({ where: { id: serviceRequestId } })
  if (!sr) return

  const vars: TemplateVariables = {
    requestId,
    consumerName: [sr.firstName, sr.lastName].filter(Boolean).join(" ") || "Consumer",
    consumerEmail: sr.email,
    niche: sr.niche,
    statusUrl: buildStatusUrl(requestId, statusAccessToken),
    failureReason: reason,
    eventId: failedEventId,
  }

  const rendered = await renderTemplate(TEMPLATE_SLUGS.adminFailure, vars)
  if (!rendered) return

  const adminEvent = await prisma.notificationEvent.findFirst({
    where: {
      serviceRequestId,
      templateSlug: TEMPLATE_SLUGS.adminFailure,
      recipientEmail: adminEmail,
    },
    orderBy: { createdAt: "desc" },
  })
  if (!adminEvent) return

  await processNotificationEvent(adminEvent.id)
}

export async function processNotificationEvent(eventId: string): Promise<void> {
  const event = await prisma.notificationEvent.findUnique({
    where: { id: eventId },
    include: {
      serviceRequest: true,
      template: true,
    },
  })
  if (!event || event.status === "sent" || event.status === "sending") return

  const sr = event.serviceRequest
  const statusUrl = buildStatusUrl(sr.requestId, sr.statusAccessToken)
  const consumerName = [sr.firstName, sr.lastName].filter(Boolean).join(" ") || "there"

  const vars: TemplateVariables = {
    requestId: sr.requestId,
    consumerName,
    consumerEmail: sr.email,
    consumerPhone: sr.phone,
    niche: sr.niche,
    message: sr.message,
    statusUrl,
    providerName: sr.routedToProviderName,
    routedToName: sr.routedToProviderName,
    failureReason: event.lastError ?? undefined,
    eventId: event.id,
  }

  if (!isEmailConfigured() && process.env.NODE_ENV === "production") {
    logger.warn("notifications", "Email not configured in production", { eventId })
    await prisma.notificationEvent.update({
      where: { id: eventId },
      data: {
        status: "failed",
        lastError: "EMAIL_PROVIDER not configured",
        nextRetryAt: nextRetryAt(event.retryCount),
      },
    })
    return
  }

  await prisma.notificationEvent.update({
    where: { id: eventId },
    data: { status: "sending" },
  })

  const rendered = await renderTemplate(
    event.templateSlug as "consumer_service_request_confirmation" | "provider_new_service_request" | "admin_notification_failure",
    vars
  )
  if (!rendered) {
    await prisma.notificationEvent.update({
      where: { id: eventId },
      data: { status: "failed", lastError: "Template missing or inactive" },
    })
    return
  }

  let providerBlock = ""
  if (event.templateSlug === TEMPLATE_SLUGS.consumerConfirmation) {
    providerBlock = sr.routedToProviderName
      ? `<p style="color:#374151">Routed to <strong>${sr.routedToProviderName}</strong>.</p>`
      : `<p style="color:#374151">We are reviewing providers for your area.</p>`
    rendered.html = rendered.html.replace("{{providerName}}", providerBlock)
  }

  const result = await sendNotificationEmail({
    to: event.recipientEmail,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    replyTo: `hello@${process.env.NEXT_PUBLIC_SITE_DOMAIN ?? "erie.pro"}`,
  })

  if (result.ok) {
    await prisma.notificationEvent.update({
      where: { id: eventId },
      data: {
        status: "sent",
        sentAt: new Date(),
        providerMessageId: result.messageId ?? null,
        lastError: null,
        nextRetryAt: null,
      },
    })

    if (event.templateSlug === TEMPLATE_SLUGS.consumerConfirmation) {
      await updateServiceRequestStatus(
        sr.id,
        "consumer_confirmation_sent",
        "Confirmation email sent"
      )
    }
    if (event.templateSlug === TEMPLATE_SLUGS.providerNewRequest) {
      await updateServiceRequestStatus(
        sr.id,
        "provider_notification_sent",
        "Provider notified"
      )
    }
    return
  }

  const nextRetry = event.retryCount + 1
  const exhausted = nextRetry >= event.maxRetries

  await prisma.notificationEvent.update({
    where: { id: eventId },
    data: {
      status: "failed",
      retryCount: nextRetry,
      lastError: result.error ?? "Send failed",
      nextRetryAt: exhausted ? null : nextRetryAt(event.retryCount),
    },
  })

  if (event.templateSlug === TEMPLATE_SLUGS.consumerConfirmation) {
    await updateServiceRequestStatus(
      sr.id,
      exhausted ? "consumer_confirmation_failed" : "consumer_confirmation_queued",
      result.error ?? "Confirmation email failed"
    )
  }
  if (event.templateSlug === TEMPLATE_SLUGS.providerNewRequest) {
    await updateServiceRequestStatus(
      sr.id,
      exhausted ? "provider_notification_failed" : "provider_notification_queued",
      result.error ?? "Provider notification failed"
    )
  }

  if (exhausted) {
    await queueAdminFailureAlert(sr.id, sr.requestId, eventId, result.error ?? "Send failed", sr.statusAccessToken)
  }
}

export async function processNotificationQueue(limit = 20): Promise<number> {
  const now = new Date()
  const events = await prisma.notificationEvent.findMany({
    where: {
      status: { in: ["queued", "failed"] },
      OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }],
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  })

  for (const event of events) {
    if (event.status === "failed" && event.retryCount >= event.maxRetries) continue
    await processNotificationEvent(event.id)
  }

  return events.length
}

export async function enqueueNotification(params: {
  serviceRequestId: string
  templateSlug: string
  recipientEmail: string
  recipientRole: "consumer" | "provider" | "admin"
}): Promise<string> {
  const event = await prisma.notificationEvent.create({
    data: {
      serviceRequestId: params.serviceRequestId,
      templateSlug: params.templateSlug,
      recipientEmail: params.recipientEmail,
      recipientRole: params.recipientRole,
      status: "queued",
    },
  })
  return event.id
}

export { RETRY_DELAYS_MS, nextRetryAt }

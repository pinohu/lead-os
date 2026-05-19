// src/lib/service-requests/create.ts
// Creates service request records, routes lead, queues notifications with honest status.

import { prisma } from "@/lib/db"
import { routeLead } from "@/lib/lead-routing"
import type { LeadRequest } from "@/lib/validation"
import { generateServiceRequestId } from "./request-id"
import { ensureNotificationTemplatesSeeded, TEMPLATE_SLUGS } from "@/lib/notifications/templates"
import {
  enqueueNotification,
  processNotificationEvent,
  processNotificationQueue,
} from "@/lib/notifications/queue"
import { mapEventStatusToLabel, providerWasNotified } from "@/lib/notifications/status"
import type { ServiceRequestSubmitResponse, NotificationStatusSummary } from "./types"
import type { NotificationEventStatus } from "@/generated/prisma"

function buildStatusUrl(requestId: string, token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002"
  return `${base}/request-status/${encodeURIComponent(requestId)}?token=${encodeURIComponent(token)}`
}

function summarizeEvent(
  event: { id: string; status: NotificationEventStatus } | null
): NotificationStatusSummary {
  if (!event) {
    return { status: "not_applicable", eventId: null, label: "not applicable" }
  }
  return {
    status: event.status,
    eventId: event.id,
    label: mapEventStatusToLabel(event.status),
  }
}

export async function createServiceRequest(
  input: LeadRequest & { tcpaIpAddress?: string }
): Promise<ServiceRequestSubmitResponse> {
  await ensureNotificationTemplatesSeeded()

  const correlationId = crypto.randomUUID()
  const requestId = await generateServiceRequestId()
  const statusAccessToken = crypto.randomUUID()

  const isProviderSpecific =
    input.routingIntent === "provider_specific" ||
    Boolean(input.requestedProviderName || input.requestedProviderSlug)

  const targetProviderName = input.requestedProviderName || input.provider

  const serviceRequest = await prisma.serviceRequest.create({
    data: {
      requestId,
      correlationId,
      status: "submitted",
      statusAccessToken,
      niche: input.niche,
      city: input.city.toLowerCase(),
      firstName: input.firstName ?? null,
      lastName: input.lastName ?? null,
      email: input.email,
      phone: input.phone ?? null,
      message: input.message ?? null,
      sourcePage: input.sourcePage ?? null,
      routingIntent: input.routingIntent ?? "general",
      requestedProviderName: targetProviderName ?? null,
      requestedProviderSlug: input.requestedProviderSlug ?? null,
      requestedProviderPhone: input.requestedProviderPhone ?? null,
      requestedProviderAddress: input.requestedProviderAddress ?? null,
      tcpaConsent: input.tcpaConsent,
      tcpaConsentText: input.tcpaConsentText ?? null,
      tcpaConsentAt: new Date(),
      tcpaIpAddress: input.tcpaIpAddress ?? null,
    },
  })

  await prisma.userAction.create({
    data: {
      correlationId,
      actionType: "service_request.submitted",
      actorType: "consumer",
      serviceRequestId: serviceRequest.id,
      metadata: { requestId, niche: input.niche },
    },
  })

  await prisma.statusEvent.create({
    data: {
      serviceRequestId: serviceRequest.id,
      status: "submitted",
      message: "Service request received",
    },
  })

  let leadId: string | null = null
  let routedToName: string | null = null
  let routedToId: string | null = null
  let routeType: string | null = null
  let providerEmail: string | null = null

  if (isProviderSpecific && (targetProviderName || input.requestedProviderSlug)) {
    const preferred = await prisma.provider.findFirst({
      where: {
        OR: [
          ...(targetProviderName
            ? [{ businessName: { equals: targetProviderName, mode: "insensitive" as const } }]
            : []),
          ...(input.requestedProviderSlug ? [{ slug: input.requestedProviderSlug }] : []),
        ],
        niche: input.niche,
        city: { equals: input.city, mode: "insensitive" },
        subscriptionStatus: "active",
        emailVerified: true,
        verificationStatus: { in: ["verified", "auto_verified", "admin_approved"] },
      },
    })

    if (preferred) {
      const result = await routeLead(input.niche, input.city, {
        ...input,
        routingIntent: "provider_specific",
        requestedProviderName: targetProviderName,
        source: "client-site",
        timestamp: new Date().toISOString(),
        tcpaConsentAt: new Date().toISOString(),
      })
      leadId = result.leadId
      routedToName = result.routedTo?.businessName ?? preferred.businessName
      routedToId = result.routedTo?.id ?? preferred.id
      routeType = result.routeType
      providerEmail = result.routedTo?.email ?? preferred.email
    } else {
      const statusToken = crypto.randomUUID()
      const lead = await prisma.lead.create({
        data: {
          niche: input.niche,
          city: input.city.toLowerCase(),
          firstName: input.firstName ?? null,
          lastName: input.lastName ?? null,
          email: input.email,
          phone: input.phone ?? null,
          message: input.message ?? null,
          routeType: "unmatched",
          source: "client-site",
          requestedProviderName: targetProviderName ?? null,
          requestedProviderSlug: input.requestedProviderSlug ?? null,
          routingIntent: "provider_specific",
          providerDeliveryStatus: "pending_provider_delivery",
          statusToken,
          tcpaConsent: true,
          tcpaConsentText: input.tcpaConsentText,
          tcpaConsentAt: new Date(),
          tcpaIpAddress: input.tcpaIpAddress,
        },
      })
      leadId = lead.id
      routeType = "unmatched"
    }
  } else {
    const result = await routeLead(input.niche, input.city, {
      ...input,
      routingIntent: "general",
      source: "erie-pro",
      timestamp: new Date().toISOString(),
      tcpaConsentAt: new Date().toISOString(),
    })
    leadId = result.leadId
    routedToName = result.routedTo?.businessName ?? null
    routedToId = result.routedTo?.id ?? null
    routeType = result.routeType
    providerEmail = result.routedTo?.email ?? null
  }

  await prisma.serviceRequest.update({
    where: { id: serviceRequest.id },
    data: {
      leadId,
      routedToProviderId: routedToId,
      routedToProviderName: routedToName,
      routeType,
    },
  })

  await prisma.serviceRequest.update({
    where: { id: serviceRequest.id },
    data: { status: "consumer_confirmation_queued" },
  })
  await prisma.statusEvent.create({
    data: {
      serviceRequestId: serviceRequest.id,
      status: "consumer_confirmation_queued",
      message: "Consumer confirmation email queued",
    },
  })

  const consumerEventId = await enqueueNotification({
    serviceRequestId: serviceRequest.id,
    templateSlug: TEMPLATE_SLUGS.consumerConfirmation,
    recipientEmail: input.email,
    recipientRole: "consumer",
  })

  let providerEventId: string | null = null
  if (routedToId && providerEmail) {
    await prisma.serviceRequest.update({
      where: { id: serviceRequest.id },
      data: { status: "provider_notification_queued" },
    })
    await prisma.statusEvent.create({
      data: {
        serviceRequestId: serviceRequest.id,
        status: "provider_notification_queued",
        message: "Provider notification queued",
      },
    })
    providerEventId = await enqueueNotification({
      serviceRequestId: serviceRequest.id,
      templateSlug: TEMPLATE_SLUGS.providerNewRequest,
      recipientEmail: providerEmail,
      recipientRole: "provider",
    })
  }

  await processNotificationEvent(consumerEventId)
  if (providerEventId) await processNotificationEvent(providerEventId)
  await processNotificationQueue(10)

  const events = await prisma.notificationEvent.findMany({
    where: { serviceRequestId: serviceRequest.id },
  })

  const consumerEvent = events.find((e) => e.templateSlug === TEMPLATE_SLUGS.consumerConfirmation) ?? null
  const providerEvent = events.find((e) => e.templateSlug === TEMPLATE_SLUGS.providerNewRequest) ?? null

  const updated = await prisma.serviceRequest.findUniqueOrThrow({
    where: { id: serviceRequest.id },
  })

  const partialFailures: string[] = []
  if (consumerEvent && consumerEvent.status === "failed") {
    partialFailures.push("We saved your request but could not send your confirmation email yet. Use the status link below to check progress.")
  }
  if (providerEvent && providerEvent.status === "failed") {
    partialFailures.push("Your request was saved; provider email delivery is pending retry.")
  }

  const niceNiche = input.niche.replace(/-/g, " ")
  let message: string
  if (routedToName) {
    message = `Your request ${requestId} was received and routed to ${routedToName}.`
  } else if (isProviderSpecific) {
    message = `Your request ${requestId} for ${targetProviderName ?? "this business"} was received. Erie.pro will follow up within 24 hours.`
  } else {
    message = `Your request ${requestId} was received. We are reviewing ${niceNiche} providers in ${input.city}.`
  }

  const providerNotified = providerWasNotified(events)

  return {
    success: true,
    requestId,
    correlationId,
    status: updated.status,
    statusUrl: buildStatusUrl(requestId, statusAccessToken),
    leadId,
    routedTo: routedToName,
    providerNotified,
    notifications: {
      consumerConfirmation: summarizeEvent(consumerEvent),
      providerNotification: summarizeEvent(providerEvent),
    },
    message,
    partialFailures,
  }
}

// src/lib/service-requests/types.ts

import type { NotificationEventStatus, ServiceRequestStatus } from "@/generated/prisma"

export interface NotificationStatusSummary {
  status: NotificationEventStatus | "not_applicable"
  eventId: string | null
  label: string
}

export interface ServiceRequestSubmitResponse {
  success: true
  requestId: string
  correlationId: string
  status: ServiceRequestStatus
  statusUrl: string
  leadId: string | null
  routedTo: string | null
  providerNotified: boolean
  notifications: {
    consumerConfirmation: NotificationStatusSummary
    providerNotification: NotificationStatusSummary
  }
  message: string
  partialFailures: string[]
}

// src/lib/notifications/status.ts
// Maps notification_event rows to consumer-facing delivery labels.

import type { NotificationEventStatus } from "@/generated/prisma"

export type ConsumerNotificationLabel =
  | "pending"
  | "queued"
  | "sending"
  | "sent"
  | "failed"
  | "not_applicable"

export function mapEventStatusToLabel(status: NotificationEventStatus): ConsumerNotificationLabel {
  switch (status) {
    case "queued":
      return "queued"
    case "sending":
      return "sending"
    case "sent":
      return "sent"
    case "failed":
      return "failed"
    default:
      return "pending"
  }
}

export function providerWasNotified(
  events: Array<{ templateSlug: string; status: NotificationEventStatus }>
): boolean {
  return events.some(
    (e) =>
      e.templateSlug === "provider_new_service_request" && e.status === "sent"
  )
}

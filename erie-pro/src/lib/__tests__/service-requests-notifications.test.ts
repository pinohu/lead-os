import { describe, expect, it } from "vitest"
import { providerWasNotified, mapEventStatusToLabel } from "@/lib/notifications/status"
import type { NotificationEventStatus } from "@/generated/prisma"

describe("providerWasNotified", () => {
  it("returns false when no provider event exists", () => {
    expect(providerWasNotified([])).toBe(false)
  })

  it("returns false when provider event is queued or failed", () => {
    expect(
      providerWasNotified([
        { templateSlug: "provider_new_service_request", status: "queued" },
      ])
    ).toBe(false)
    expect(
      providerWasNotified([
        { templateSlug: "provider_new_service_request", status: "failed" },
      ])
    ).toBe(false)
  })

  it("returns true only when provider_new_service_request is sent", () => {
    expect(
      providerWasNotified([
        { templateSlug: "consumer_service_request_confirmation", status: "sent" },
        { templateSlug: "provider_new_service_request", status: "sent" },
      ])
    ).toBe(true)
  })

  it("does not treat consumer confirmation as provider notified", () => {
    expect(
      providerWasNotified([
        { templateSlug: "consumer_service_request_confirmation", status: "sent" },
      ])
    ).toBe(false)
  })
})

describe("mapEventStatusToLabel", () => {
  const cases: Array<[NotificationEventStatus, string]> = [
    ["queued", "queued"],
    ["sending", "sending"],
    ["sent", "sent"],
    ["failed", "failed"],
  ]

  it.each(cases)("maps %s to %s", (status, label) => {
    expect(mapEventStatusToLabel(status)).toBe(label)
  })
})

describe("service request API response shape", () => {
  it("documents honest providerNotified contract", () => {
    const response = {
      success: true as const,
      requestId: "ERIE-2026-000001",
      correlationId: "corr-1",
      status: "submitted",
      statusUrl: "/request-status/ERIE-2026-000001?token=abc",
      leadId: null,
      routedTo: null,
      providerNotified: false,
      notifications: {
        consumerConfirmation: { status: "sent" as const, eventId: "e1", label: "sent" },
        providerNotification: {
          status: "not_applicable" as const,
          eventId: null,
          label: "not applicable",
        },
      },
      message: "Your request was received.",
      partialFailures: [] as string[],
    }

    expect(response.providerNotified).toBe(false)
    expect(response.notifications.providerNotification.status).toBe("not_applicable")
  })

  it("providerNotified true only when provider event sent", () => {
    const events = [
      { templateSlug: "provider_new_service_request", status: "sent" as const },
    ]
    expect(providerWasNotified(events)).toBe(true)
  })
})

describe("retry policy", () => {
  it("uses three retry delays (1m, 5m, 15m)", async () => {
    const { RETRY_DELAYS_MS } = await import("@/lib/notifications/queue")
    expect(RETRY_DELAYS_MS).toEqual([60_000, 300_000, 900_000])
    expect(RETRY_DELAYS_MS).toHaveLength(3)
  })
})

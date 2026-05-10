import { describe, expect, it } from "vitest"
import { ConvertBoxEventSchema } from "../universal-lead-events"

describe("ConvertBoxEventSchema", () => {
  it("accepts a display event with Erie.Pro service context", () => {
    const parsed = ConvertBoxEventSchema.parse({
      eventType: "convertbox.box_displayed",
      sourcePage: "https://erie.pro/plumbing",
      sourcePageType: "core",
      serviceSlug: "plumbing",
      serviceLabel: "Plumbing",
      family: "home_services",
      boxId: 232604,
      sessionId: "session-1",
    })

    expect(parsed.sourceDomain).toBe("erie.pro")
    expect(parsed.serviceSlug).toBe("plumbing")
    expect(parsed.boxId).toBe(232604)
    expect(parsed.urgency).toBe("standard")
  })

  it("normalizes ConvertBox lead submission email and phone", () => {
    const parsed = ConvertBoxEventSchema.parse({
      eventType: "convertbox.lead_submitted",
      sourcePage: "https://erie.pro/roofing",
      serviceSlug: "roofing",
      consumerEmail: "CUSTOMER@EXAMPLE.COM",
      consumerPhone: "(814) 555-0199",
      consentToContact: true,
    })

    expect(parsed.consumerEmail).toBe("customer@example.com")
    expect(parsed.consumerPhone).toBe("+18145550199")
    expect(parsed.consentToContact).toBe(true)
  })

  it("rejects unknown event types", () => {
    const parsed = ConvertBoxEventSchema.safeParse({
      eventType: "convertbox.random_event",
    })

    expect(parsed.success).toBe(false)
  })
})

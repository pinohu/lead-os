import { describe, expect, it, vi } from "vitest"
import {
  buildFulfillmentAutomationActions,
  buildFulfillmentSetupExport,
  executeFulfillmentAutomationActions,
} from "../offer-fulfillment-automation"
import { automatedOffers, inferServiceFamily } from "../automated-offers"

function purchaseFor(offerSlug: string, serviceSlug = "plumbing") {
  const offer = automatedOffers.find((item) => item.slug === offerSlug)
  if (!offer) throw new Error(`Missing test offer: ${offerSlug}`)
  return {
    id: `purchase-${offerSlug}`,
    serviceSlug,
    serviceLabel: "Plumbing",
    serviceFamily: inferServiceFamily(serviceSlug),
    amountCents: offer.basePriceCents,
    currency: "USD",
    sourcePage: `/${serviceSlug}/pricing`,
    offer: {
      slug: offer.slug,
      title: offer.title,
      shortTitle: offer.shortTitle,
      fulfillmentType: offer.fulfillmentType,
    },
    customer: {
      email: "buyer@example.com",
      fullName: "Buyer Example",
      firstName: "Buyer",
      lastName: "Example",
      phone: "8145550100",
      companyName: "Example Plumbing",
      websiteUrl: "https://example.com",
      googleBusinessUrl: "https://maps.google.com/example",
    },
  }
}

describe("offer fulfillment automation", () => {
  it("builds data-driven actions from each offer channel declaration", () => {
    const purchase = purchaseFor("provider-launch-kit")
    const actions = buildFulfillmentAutomationActions(purchase, "https://erie.pro/offer-assets/token")

    expect(actions.map((action) => action.toolId)).toEqual([
      "erie-pro",
      "boostspace",
      "suitedash",
      "taskade",
      "productdyno",
    ])
    expect(actions.every((action) => action.idempotencyKey.includes(purchase.id))).toBe(true)
    expect(actions.find((action) => action.toolId === "productdyno")?.payload).toMatchObject({
      productKey: "provider-launch-kit",
      accessLevel: "lifetime",
    })
  })

  it("covers all configured offer families with at least an Erie.Pro delivery action", () => {
    for (const offer of automatedOffers) {
      const actions = buildFulfillmentAutomationActions(purchaseFor(offer.slug))
      expect(actions.length).toBeGreaterThan(0)
      expect(actions.some((action) => action.toolId === "erie-pro")).toBe(true)
    }
  })

  it("skips optional external channels when their destination is not configured", async () => {
    const purchase = purchaseFor("convertbox-funnel-in-a-box")
    const actions = buildFulfillmentAutomationActions(purchase)
    const results = await executeFulfillmentAutomationActions(actions)

    expect(results.find((result) => result.toolId === "erie-pro")?.status).toBe("completed")
    expect(results.find((result) => result.toolId === "productdyno")?.status).toBe("skipped")
  })

  it("posts ProductDyno webhook actions when configured", async () => {
    vi.stubEnv("PRODUCTDYNO_WEBHOOK_URL", "https://productdyno.test/hook")
    vi.stubEnv("PRODUCTDYNO_API_KEY", "test-token")
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ memberId: "member-1" }),
    } as Response)

    const actions = buildFulfillmentAutomationActions(purchaseFor("provider-launch-kit"))
      .filter((action) => action.toolId === "productdyno")
    const results = await executeFulfillmentAutomationActions(actions)

    expect(results[0]).toMatchObject({ status: "completed", externalId: "member-1" })
    expect(fetchMock).toHaveBeenCalledWith(
      "https://productdyno.test/hook",
      expect.objectContaining({ method: "POST" }),
    )

    fetchMock.mockRestore()
    vi.unstubAllEnvs()
  })

  it("exports a complete setup manifest for external fulfillment tools", () => {
    const setup = buildFulfillmentSetupExport()

    expect(setup.offers).toHaveLength(automatedOffers.length)
    expect(setup.environmentVariables).toContain("PRODUCTDYNO_WEBHOOK_URL")
    expect(setup.environmentVariables).toContain("TASKADE_WEBHOOK_URL")
    expect(setup.environmentVariables).toContain("DOCUMENT_DELIVERY_WEBHOOK_URL")
  })
})

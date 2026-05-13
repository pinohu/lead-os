import { describe, expect, it } from "vitest"
import {
  buildThriveCartEventSubscriptions,
  buildThriveCartSetupExport,
  thriveCartPassthroughFields,
} from "../thrivecart-setup"

describe("ThriveCart setup export", () => {
  it("exports every paid offer with checkout, success, and funnel relationships", () => {
    const setup = buildThriveCartSetupExport("https://erie.pro/")

    expect(setup.products).toHaveLength(9)
    expect(setup.products.every((product) => product.checkoutUrl.startsWith("https://relgard.thrivecart.com/"))).toBe(true)
    expect(setup.products.every((product) => product.successUrl.startsWith("https://erie.pro/offers/success/"))).toBe(true)
    expect(setup.products.every((product) => product.orderBump && product.upsell && product.downsell)).toBe(true)
  })

  it("includes the passthrough fields needed for attribution and service context", () => {
    const setup = buildThriveCartSetupExport("https://erie.pro")
    const providerLaunch = setup.products.find((product) => product.slug === "provider-launch-kit")

    expect(providerLaunch?.passthroughFields).toEqual([...thriveCartPassthroughFields])
    expect(providerLaunch?.passthroughFields).toContain("serviceSlug")
    expect(providerLaunch?.passthroughFields).toContain("convertBoxId")
    expect(providerLaunch?.passthroughFields).toContain("utm_campaign")
  })

  it("builds event subscriptions for checkout lifecycle events", () => {
    const subscriptions = buildThriveCartEventSubscriptions("https://erie.pro/")

    expect(subscriptions).toContainEqual({
      event: "order_payment_product",
      target_url: "https://erie.pro/api/webhooks/thrivecart",
    })
    expect(subscriptions).toContainEqual({
      event: "cart_abandoned",
      target_url: "https://erie.pro/api/webhooks/thrivecart",
    })
    expect(subscriptions).toContainEqual({
      event: "affiliate_commission_earned",
      target_url: "https://erie.pro/api/webhooks/thrivecart",
    })
  })
})

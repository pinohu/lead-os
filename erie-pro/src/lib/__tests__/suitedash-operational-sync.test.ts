import { describe, expect, it } from "vitest"
import {
  buildSuiteDashIdempotencyKey,
  buildSuiteDashOperationalPackage,
  buildSuiteDashSetupExport,
  shouldRouteToSuiteDash,
} from "../suitedash-operational-sync"
import type { RevenueActionAutomationPayload } from "../revenue-actions"

const action: RevenueActionAutomationPayload = {
  actionId: "act_123",
  automationKey: "revenue.deliver.paid_offer",
  outcome: "deliver",
  status: "planned",
  priority: "immediate",
  ownerTool: "erie-pro",
  targetTools: ["neon", "boostspace", "suitedash"],
  title: "Deliver Provider Launch Kit",
  action: "Create the purchased deliverable and portal context.",
  routing: {
    preferredTool: "erie-pro",
    fallbackTools: ["boostspace", "suitedash"],
    suggestedStatus: "queued",
  },
  context: {
    sourceSystem: "thrivecart",
    sourceEventType: "order.success",
    purchaseId: "purchase_123",
    offerSlug: "provider-launch-kit",
    offerTitle: "Provider Launch Kit",
    customerEmail: "buyer@example.com",
    funnelSlug: "government-opportunity",
    orderId: "order_123",
    productId: "product_123",
    serviceSlug: "plumbing",
    serviceLabel: "Plumbing",
    serviceFamily: "Emergency Home Response",
    sourcePage: "https://erie.pro/plumbing/pricing",
    sourcePageType: "pricing",
    coupon: "COUNTYREADY",
    affiliate: "partner-1",
    amountCents: 9900,
    utmSource: "convertbox",
    utmMedium: "overlay",
    utmCampaign: "provider-launch",
    gclid: "gclid-1",
    eventMetadata: { companyName: "County Plumbing LLC" },
  },
}

describe("SuiteDash operational sync", () => {
  it("builds stable idempotency keys", () => {
    expect(buildSuiteDashIdempotencyKey({
      actionId: "act_123",
      kind: "project",
      contextKey: "Provider Launch Kit",
    })).toBe("erie-pro:suitedash:act_123:project:provider-launch-kit")
  })

  it("detects SuiteDash-routed actions", () => {
    expect(shouldRouteToSuiteDash(action)).toBe(true)
    expect(shouldRouteToSuiteDash({ ...action, targetTools: ["boostspace"], routing: { ...action.routing, preferredTool: "boostspace" } })).toBe(false)
  })

  it("builds a complete operational package for paid delivery", () => {
    const pkg = buildSuiteDashOperationalPackage({ action })

    expect(pkg.integration).toBe("suitedash")
    expect(pkg.status).toBe("planned")
    expect(pkg.operations.map((operation) => operation.kind)).toEqual([
      "customer_contact",
      "provider_contact",
      "project",
      "portal",
      "support_record",
      "fulfillment_task",
    ])
    expect(pkg.operations.filter((operation) => operation.required).map((operation) => operation.kind)).toEqual([
      "customer_contact",
      "provider_contact",
      "project",
      "portal",
      "support_record",
      "fulfillment_task",
    ])
    expect(pkg.operations[0].payload).toMatchObject({
      customerEmail: "buyer@example.com",
      service: "Plumbing",
      offer: "Provider Launch Kit",
      companyName: "County Plumbing LLC",
    })
  })

  it("exports SuiteDash setup endpoints", () => {
    const exported = buildSuiteDashSetupExport("https://erie.pro/")
    expect(exported.endpoints.poll).toBe("https://erie.pro/api/integrations/suitedash/revenue-actions")
    expect(exported.pollViews).toHaveLength(3)
    expect(exported.operationKinds.some((item) => item.kind === "fulfillment_task")).toBe(true)
  })
})

import { describe, expect, it } from "vitest"
import { buildRevenueActionAutomationPayload, buildRevenueActionPlan } from "../revenue-actions"

describe("revenue action engine", () => {
  it("turns paid orders into deliver, route, and learn actions", () => {
    const plan = buildRevenueActionPlan({
      sourceSystem: "thrivecart",
      eventType: "order.success",
      offerSlug: "government-opportunity-scanner",
      serviceSlug: "snow-removal",
      amountCents: 29900,
    })

    expect(plan.primaryOutcome).toBe("deliver")
    expect(plan.shouldFulfill).toBe(true)
    expect(plan.shouldRoute).toBe(true)
    expect(plan.shouldLearn).toBe(true)
    expect(plan.actions.map((action) => action.outcome)).toEqual(["deliver", "route", "learn"])
  })

  it("turns abandoned carts into recover, route, and learn actions", () => {
    const plan = buildRevenueActionPlan({
      sourceSystem: "thrivecart",
      eventType: "cart.abandoned",
      offerSlug: "provider-launch-kit",
      amountCents: 39900,
    })

    expect(plan.primaryOutcome).toBe("recover")
    expect(plan.shouldRecover).toBe(true)
    expect(plan.shouldFulfill).toBe(false)
    expect(plan.actions.map((action) => action.outcome)).toEqual(["recover", "route", "learn"])
    expect(plan.actions[0].priority).toBe("high")
  })

  it("routes and learns from neutral events", () => {
    const plan = buildRevenueActionPlan({
      sourceSystem: "convertbox",
      eventType: "funnel.step_completed",
      offerSlug: "convertbox-funnel-in-a-box",
    })

    expect(plan.primaryOutcome).toBe("route")
    expect(plan.actions.map((action) => action.outcome)).toEqual(["route", "learn"])
  })

  it("builds automation payloads with routing context for external tools", () => {
    const plan = buildRevenueActionPlan({
      sourceSystem: "thrivecart",
      eventType: "order.success",
      offerSlug: "client-portal-starter-pack",
      offerTitle: "Client Portal Starter Pack",
      serviceSlug: "cleaning",
      serviceLabel: "Cleaning",
      amountCents: 19900,
    })
    const routeAction = plan.actions.find((action) => action.outcome === "route")

    const payload = buildRevenueActionAutomationPayload({
      actionId: "action_123",
      eventType: "revenue_action.route",
      status: "planned",
      action: routeAction,
      sourceSystem: "thrivecart",
      sourceEventType: "order.success",
      offerSlug: "client-portal-starter-pack",
      offerTitle: "Client Portal Starter Pack",
      serviceSlug: "cleaning",
      serviceLabel: "Cleaning",
      amountCents: 19900,
      eventMetadata: {
        checkoutEngine: "thrivecart",
        orderBumpAccepted: true,
      },
    })

    expect(payload.actionId).toBe("action_123")
    expect(payload.outcome).toBe("route")
    expect(payload.routing.preferredTool).toBe("boostspace")
    expect(payload.routing.suggestedStatus).toBe("queued")
    expect(payload.context.offerSlug).toBe("client-portal-starter-pack")
    expect(payload.context.serviceLabel).toBe("Cleaning")
    expect(payload.context.eventMetadata).toEqual({
      checkoutEngine: "thrivecart",
      orderBumpAccepted: true,
    })
  })
})

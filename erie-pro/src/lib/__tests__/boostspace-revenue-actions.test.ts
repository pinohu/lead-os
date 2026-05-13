import { describe, expect, it } from "vitest"
import {
  buildBoostspaceIdempotencyKey,
  buildBoostspaceRevenueActionEnvelope,
  buildBoostspaceScenarioExport,
} from "../boostspace-revenue-actions"

describe("Boost.space revenue action integration", () => {
  it("creates stable idempotency keys", () => {
    expect(buildBoostspaceIdempotencyKey("act_1", "revenue.route.context", "planned")).toBe(
      "erie-pro:boostspace:act_1:revenue.route.context:planned",
    )
  })

  it("wraps automation payloads with Boost.space routing metadata", () => {
    const envelope = buildBoostspaceRevenueActionEnvelope({
      id: "act_2",
      outcome: "route",
      status: "queued",
      automationPayload: {
        actionId: "act_2",
        automationKey: "revenue.route.context",
        outcome: "route",
        status: "queued",
        priority: "normal",
        ownerTool: "neon",
        targetTools: ["boostspace", "suitedash"],
        title: "Route context",
        action: "Sync context",
        routing: {
          preferredTool: "boostspace",
          fallbackTools: ["suitedash"],
          suggestedStatus: "queued",
        },
        context: {
          serviceSlug: "plumbing",
          sourceSystem: "thrivecart",
        },
      },
    })

    expect(envelope.status).toBe("queued")
    expect(envelope.idempotencyKey).toBe("erie-pro:boostspace:act_2:revenue.route.context:queued")
    expect(envelope.automationPayload.routing.preferredTool).toBe("boostspace")
  })

  it("exports scenario definitions with poll and callback endpoints", () => {
    const exported = buildBoostspaceScenarioExport("https://erie.pro/", "BOOST_SPACE_REVENUE_ACTION_TOKEN")

    expect(exported.endpoints.poll).toBe("https://erie.pro/api/integrations/boostspace/revenue-actions")
    expect(exported.scenarios.length).toBeGreaterThanOrEqual(4)
    expect(exported.scenarios[0].callback.body).toMatchObject({
      status: "queued",
      externalSystem: "boostspace",
    })
  })
})

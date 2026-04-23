import test from "node:test"
import assert from "node:assert/strict"
import { setupIntegrationEnvironment } from "./helpers/integration-db.ts"
import { withEnv } from "./test-helpers.ts"

function signedCronHeaders(secret: string): HeadersInit {
  return {
    "content-type": "application/json",
    "x-cron-secret": secret,
  }
}

test("cron autonomy route requires cron auth", async () => {
  const restoreDb = await setupIntegrationEnvironment({
    LEAD_OS_BILLING_ENFORCE: "false",
  })
  try {
    const { POST } = await import("../src/app/api/cron/autonomy/route.ts")
    const response = await POST(
      new Request("http://localhost/api/cron/autonomy", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
    )
    assert.equal(response.status, 401)
  } finally {
    restoreDb()
  }
})

test("cron autonomy route executes in shadow mode by default", async () => {
  const restoreDb = await setupIntegrationEnvironment({
    LEAD_OS_BILLING_ENFORCE: "false",
  })
  const secret = "cron-autonomy-test-secret"
  const restoreEnv = withEnv({
    CRON_SECRET: secret,
    AUTONOMY_ENABLED: "true",
    AUTONOMY_MODE: "shadow",
    AGENT_KILL_SWITCH: "false",
    PRICING_KILL_SWITCH: "false",
  })
  try {
    const { POST } = await import("../src/app/api/cron/autonomy/route.ts")
    const response = await POST(
      new Request("http://localhost/api/cron/autonomy", {
        method: "POST",
        headers: signedCronHeaders(secret),
        body: JSON.stringify({
          tenantId: "default-tenant",
          agents: ["routing-agent", "messaging-agent"],
          context: {
            leadData: {
              category: "general",
              leadKey: "cron-lead-1",
            },
            tenantConfig: {
              tenantId: "default-tenant",
            },
            performanceHistory: {
              deliverySuccessRate: 0.68,
              conversionRate: 0.31,
              engagementRate: 0.52,
            },
            gtmState: {
              status: "in_progress",
            },
          },
          outcomes: [],
        }),
      }),
    )
    assert.equal(response.status, 200)
    const json = (await response.json()) as {
      ok: boolean
      data: {
        mode: "shadow" | "active"
        summary: { totalAgents: number; failed: number }
      }
    }
    assert.equal(json.ok, true)
    assert.equal(json.data.mode, "shadow")
    assert.equal(json.data.summary.totalAgents, 2)
    assert.equal(json.data.summary.failed, 0)
  } finally {
    restoreEnv()
    restoreDb()
  }
})

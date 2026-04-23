import test from "node:test"
import assert from "node:assert/strict"
import { setupIntegrationEnvironment } from "./helpers/integration-db.ts"
import { withEnv } from "./test-helpers.ts"
import { queryPostgres } from "../src/lib/db.ts"

test("intake remains successful when autonomy runner fails internally", async () => {
  const restoreDb = await setupIntegrationEnvironment({
    LEAD_OS_BILLING_ENFORCE: "false",
  })
  const restoreEnv = withEnv({
    AUTONOMY_ENABLED: "true",
    AUTONOMY_MODE: "active",
    AGENT_KILL_SWITCH: "false",
  })
  try {
    await queryPostgres(
      `INSERT INTO billing_subscriptions (tenant_id, plan_key, status, current_period_end, updated_at)
       VALUES ($1, 'enterprise', 'active', NOW() + interval '30 days', NOW())
       ON CONFLICT (tenant_id) DO UPDATE SET
         status = EXCLUDED.status,
         current_period_end = EXCLUDED.current_period_end,
         updated_at = NOW()`,
      ["default-tenant"],
    )

    const { POST } = await import("../src/app/api/intake/route.ts")
    const response = await POST(
      new Request("http://localhost/api/intake", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-tenant-id": "default-tenant",
        },
        body: JSON.stringify({
          email: `autonomy-safety-${Date.now()}@example.com`,
          firstName: "Autonomy",
          message: "runner should never break intake",
        }),
      }),
    )

    assert.equal(response.status, 200)
    const json = (await response.json()) as {
      success: boolean
      id: number
      routing: Record<string, unknown>
      deliveryLog: Record<string, unknown> | null
    }
    assert.equal(json.success, true)
    assert.equal(typeof json.id, "number")
    assert.equal(typeof json.routing, "object")
  } finally {
    restoreEnv()
    restoreDb()
  }
})

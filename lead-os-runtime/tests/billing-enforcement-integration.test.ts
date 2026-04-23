import assert from "node:assert/strict"
import { before, describe, it } from "node:test"
import { queryPostgres } from "../src/lib/db.ts"
import { getBillingGateState } from "../src/lib/billing/entitlements.ts"
import {
  ensureIntegrationDatabase,
  setupIntegrationEnvironment,
  withEnv,
} from "./helpers/integration-db.ts"

describe("billing enforcement runtime validation", () => {
  before(async () => {
    const databaseUrl = await ensureIntegrationDatabase()
    const restore = withEnv({
      DATABASE_URL: databaseUrl,
      LEAD_OS_AUTH_SECRET: process.env.LEAD_OS_AUTH_SECRET ?? "test-auth-secret",
      LEAD_OS_ALLOW_RESET: "true",
    })
    const { initializeDatabase } = await import("../src/lib/db.ts")
    await initializeDatabase()
    restore()
  })

  it("allows active subscriptions and blocks inactive subscriptions", async () => {
    const tenantId = "billing-enforcement-tenant"
    const restoreDb = await setupIntegrationEnvironment()
    const restore = withEnv({ LEAD_OS_BILLING_ENFORCE: "true" })
    try {
      await queryPostgres(
        `INSERT INTO billing_subscriptions (tenant_id, plan_key, status, current_period_end, updated_at)
         VALUES ($1, 'enterprise', 'active', NOW() + INTERVAL '30 days', NOW())
         ON CONFLICT (tenant_id) DO UPDATE SET
           plan_key = EXCLUDED.plan_key,
           status = EXCLUDED.status,
           current_period_end = EXCLUDED.current_period_end,
           updated_at = EXCLUDED.updated_at`,
        [tenantId],
      )

      const activeState = await getBillingGateState(tenantId)
      assert.equal(activeState.subscriptionActive, true)

      await queryPostgres(
        `UPDATE billing_subscriptions
            SET status = 'canceled', updated_at = NOW()
          WHERE tenant_id = $1`,
        [tenantId],
      )
      const blockedState = await getBillingGateState(tenantId)
      assert.equal(blockedState.subscriptionActive, false)
    } finally {
      await queryPostgres("DELETE FROM billing_subscriptions WHERE tenant_id = $1", [
        tenantId,
      ])
      restore()
      restoreDb()
    }
  })
})

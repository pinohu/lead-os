// tests/billing-entitlements.test.ts
import assert from "node:assert/strict"
import { afterEach, beforeEach, describe, it } from "node:test"
import { setupIntegrationDb } from "./helpers/integration-db.ts"

describe("billing entitlements", () => {
  let prev: string | undefined

  beforeEach(() => {
    prev = process.env.LEAD_OS_BILLING_ENFORCE
    delete process.env.LEAD_OS_BILLING_ENFORCE
  })

  afterEach(() => {
    if (prev !== undefined) process.env.LEAD_OS_BILLING_ENFORCE = prev
    else delete process.env.LEAD_OS_BILLING_ENFORCE
  })

  it("assertPricingExecutionAllowed passes when enforcement is off", async () => {
    const { assertPricingExecutionAllowed } = await import("../src/lib/billing/entitlements.ts")
    const r = await assertPricingExecutionAllowed("any-tenant-id")
    assert.equal(r.allowed, true)
    assert.equal(r.state.enforcement, false)
  })

  it("assertPricingExecutionAllowed blocks inactive subscription when enforcement is on", async (t) => {
    const db = await setupIntegrationDb()
    if (!db.available) {
      t.skip()
      return
    }
    process.env.LEAD_OS_BILLING_ENFORCE = "true"

    const tenantId = "billing-inactive-tenant"
    await db.pool.query(
      `INSERT INTO billing_plans (plan_key, display_name, max_nodes, pricing_execution_allowed, api_access_tier)
       VALUES ('growth', 'Growth', 25, true, 'standard')
       ON CONFLICT (plan_key) DO NOTHING`,
    )
    await db.pool.query(
      "INSERT INTO billing_subscriptions (tenant_id, plan_key, status, current_period_end) VALUES ($1, 'growth', 'canceled', NOW() + INTERVAL '1 day') ON CONFLICT (tenant_id) DO UPDATE SET status = EXCLUDED.status",
      [tenantId],
    )

    const { assertPricingExecutionAllowed } = await import("../src/lib/billing/entitlements.ts")
    const r = await assertPricingExecutionAllowed(tenantId)
    assert.equal(r.allowed, false)
    assert.equal(r.blockReason, "subscription_inactive")
    await db.pool.query("DELETE FROM billing_subscriptions WHERE tenant_id = $1", [tenantId])
  })

  it("assertApiAccessTierAllows enforces required tier", async () => {
    const { assertApiAccessTierAllows } = await import("../src/lib/billing/entitlements.ts")
    assert.equal(
      assertApiAccessTierAllows(
        {
          enforcement: true,
          subscriptionActive: true,
          pricingExecutionAllowed: true,
          planKey: "growth",
          maxNodes: 25,
          nodeCount: 1,
          apiAccessTier: "standard",
        },
        "full",
      ),
      false,
    )
    assert.equal(
      assertApiAccessTierAllows(
        {
          enforcement: true,
          subscriptionActive: true,
          pricingExecutionAllowed: true,
          planKey: "enterprise",
          maxNodes: 999999,
          nodeCount: 1,
          apiAccessTier: "full",
        },
        "full",
      ),
      true,
    )
  })
})

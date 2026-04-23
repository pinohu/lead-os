import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { setupIntegrationDb, setupIntegrationEnvironment } from "./helpers/integration-db.ts"

describe("clean fail conditions", () => {
  it("db helper fails clearly when DATABASE_URL is missing", async () => {
    const previous = process.env.DATABASE_URL
    delete process.env.DATABASE_URL
    try {
      const { getDatabaseUrl } = await import("../src/lib/db.ts")
      assert.throws(() => getDatabaseUrl(), /DATABASE_URL is required/i)
    } finally {
      if (previous !== undefined) process.env.DATABASE_URL = previous
    }
  })

  it("db client fails clearly when LEAD_OS_AUTH_SECRET is missing for auth helper", async () => {
    const previous = process.env.LEAD_OS_AUTH_SECRET
    delete process.env.LEAD_OS_AUTH_SECRET
    try {
      const { requireAuth } = await import("../src/lib/auth.ts")
      assert.throws(
        () => requireAuth(new Request("http://localhost/api/operator/leads")),
        /Missing x-auth-secret header/i,
      )
    } finally {
      if (previous !== undefined) process.env.LEAD_OS_AUTH_SECRET = previous
      else process.env.LEAD_OS_AUTH_SECRET = "test-auth-secret"
    }
  })

  it("intake route rejects invalid JSON input", async () => {
    const { POST } = await import("../src/app/api/intake/route.ts")
    const req = new Request("http://localhost/api/intake", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not-json",
    })
    const res = await POST(req)
    assert.equal(res.status, 500)
    const json = await res.json()
    assert.equal(json.success, false)
  })

  it("intake route fails on invalid tenant when single-tenant enforce is enabled", async () => {
    const restore = await setupIntegrationEnvironment({
      LEAD_OS_SINGLE_TENANT_ENFORCE: "true",
    })
    try {
      const { POST } = await import("../src/app/api/intake/route.ts")
      const req = new Request("http://localhost/api/intake", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-tenant-id": "invalid-tenant-id",
        },
        body: JSON.stringify({
          email: "tenant-mismatch@example.com",
          firstName: "Tenant",
          message: "Mismatch",
        }),
      })
      const res = await POST(req)
      assert.equal(res.status, 403)
    } finally {
      restore()
    }
  })

  it("billing enforcement returns blocked state for inactive tenants", async (t) => {
    const restore = await setupIntegrationEnvironment()
    const db = await setupIntegrationDb()
    if (!db.available) {
      restore()
      t.skip()
      return
    }
    const previous = process.env.LEAD_OS_BILLING_ENFORCE
    process.env.LEAD_OS_BILLING_ENFORCE = "true"
    try {
      const tenantId = "billing-blocked-tenant"
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
      const state = await assertPricingExecutionAllowed(tenantId)
      assert.equal(state.allowed, false)
      assert.equal(state.blockReason, "subscription_inactive")
    } finally {
      if (previous === undefined) delete process.env.LEAD_OS_BILLING_ENFORCE
      else process.env.LEAD_OS_BILLING_ENFORCE = previous
      restore()
    }
  })
})

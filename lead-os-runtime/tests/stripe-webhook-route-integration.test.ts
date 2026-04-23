import assert from "node:assert/strict"
import test from "node:test"
import Stripe from "stripe"
import { setupIntegrationDb, withEnv } from "./helpers/integration-db.ts"

test("stripe webhook route rejects missing signature", async () => {
  const db = await setupIntegrationDb("stripe_webhook_missing_sig")
  const restore = withEnv({
    DATABASE_URL: db.url,
    LEAD_OS_AUTH_SECRET: "secret",
    STRIPE_SECRET_KEY: "sk_test_placeholder",
    STRIPE_WEBHOOK_SECRET: "whsec_test_secret",
  })
  try {
    const { POST } = await import("../src/app/api/billing/stripe/webhook/route.ts")
    const response = await POST(
      new Request("http://localhost/api/billing/stripe/webhook", {
        method: "POST",
        body: "{}",
      }),
    )
    assert.equal(response.status, 400)
    const json = await response.json()
    assert.equal(json.error.code, "MISSING_SIGNATURE")
  } finally {
    restore()
  }
})

test("stripe webhook route rejects invalid signature", async () => {
  const db = await setupIntegrationDb("stripe_webhook_bad_sig")
  const restore = withEnv({
    DATABASE_URL: db.url,
    LEAD_OS_AUTH_SECRET: "secret",
    STRIPE_SECRET_KEY: "sk_test_placeholder",
    STRIPE_WEBHOOK_SECRET: "whsec_test_secret",
  })
  try {
    const { POST } = await import("../src/app/api/billing/stripe/webhook/route.ts")
    const response = await POST(
      new Request("http://localhost/api/billing/stripe/webhook", {
        method: "POST",
        headers: { "stripe-signature": "t=1,v1=bad" },
        body: JSON.stringify({ id: "evt_test_bad", type: "noop" }),
      }),
    )
    assert.equal(response.status, 400)
    const json = await response.json()
    assert.equal(json.error.code, "WEBHOOK_ERROR")
  } finally {
    restore()
  }
})

test("stripe webhook route processes duplicate event only once", async () => {
  const db = await setupIntegrationDb("stripe_webhook_dupe")
  if (!db.available) return
  const webhookSecret = "whsec_live_test_secret"
  const stripeClient = new Stripe("sk_test_any", { apiVersion: "2026-03-25.dahlia" })
  const restore = withEnv({
    DATABASE_URL: db.url,
    LEAD_OS_AUTH_SECRET: "secret",
    STRIPE_SECRET_KEY: "sk_test_live",
    STRIPE_WEBHOOK_SECRET: webhookSecret,
  })
  try {
    const tenantId = "default-tenant"
    await db.query(
      "INSERT INTO lead_os_subscriptions (tenant_id, plan_id, stripe_customer_id, stripe_subscription_id, status, current_period_start, current_period_end, cancel_at_period_end, created_at, updated_at) VALUES ($1, 'managed-growth', 'cus_initial', 'sub_initial', 'active', NOW(), NOW() + INTERVAL '30 days', false, NOW(), NOW()) ON CONFLICT (tenant_id) DO NOTHING",
      [tenantId],
    )

    const payload = JSON.stringify({
      id: "evt_test_subscription_deleted_once",
      object: "event",
      type: "customer.subscription.deleted",
      data: {
        object: {
          id: "sub_deleted_1",
          object: "subscription",
          status: "canceled",
          customer: "cus_deleted_1",
          cancel_at_period_end: false,
          metadata: {
            tenantId,
            planId: "managed-growth",
          },
          items: {
            data: [
              {
                current_period_start: Math.floor(Date.now() / 1000),
                current_period_end: Math.floor(Date.now() / 1000) + 86400,
                price: { id: "price_test_growth" },
              },
            ],
          },
        },
      },
      created: Math.floor(Date.now() / 1000),
      livemode: false,
      pending_webhooks: 0,
      request: null,
    })

    const signature = stripeClient.webhooks.generateTestHeaderString({
      payload,
      secret: webhookSecret,
    })

    const { POST } = await import("../src/app/api/billing/stripe/webhook/route.ts")
    const firstResponse = await POST(
      new Request("http://localhost/api/billing/stripe/webhook", {
        method: "POST",
        headers: { "stripe-signature": signature },
        body: payload,
      }),
    )
    assert.equal(firstResponse.status, 200)
    const firstJson = await firstResponse.json()
    assert.equal(firstJson.data.handled, true)
    assert.equal(firstJson.data.duplicate, undefined)

    const secondResponse = await POST(
      new Request("http://localhost/api/billing/stripe/webhook", {
        method: "POST",
        headers: { "stripe-signature": signature },
        body: payload,
      }),
    )
    assert.equal(secondResponse.status, 200)
    const secondJson = await secondResponse.json()
    assert.equal(secondJson.data.handled, true)
    assert.equal(secondJson.data.duplicate, true)

    const claimed = await db.query(
      "SELECT COUNT(*)::text AS c FROM stripe_webhook_events WHERE event_id = $1",
      ["evt_test_subscription_deleted_once"],
    )
    assert.equal(Number(claimed.rows[0]?.c ?? 0), 1)

    const sub = await db.query(
      "SELECT status FROM lead_os_subscriptions WHERE tenant_id = $1",
      [tenantId],
    )
    assert.equal(sub.rows[0]?.status, "cancelled")
  } finally {
    restore()
  }
})

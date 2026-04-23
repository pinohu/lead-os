// tests/stripe-webhook-idempotency.test.ts
import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { setupIntegrationDb, setupTestDbEnv } from "./helpers/integration-db.ts"
import {
  releaseStripeWebhookEventClaim,
  tryClaimStripeWebhookEvent,
} from "../src/lib/billing/stripe-webhook-idempotency.ts"

describe("stripe webhook idempotency (Postgres)", () => {
  it("tryClaim then duplicate claim returns false when DB and migration 009 exist", async (t) => {
    const db = await setupIntegrationDb()
    if (!db.available) {
      t.skip()
      return
    }

    const restore = setupTestDbEnv({ DATABASE_URL: db.url })
    const id = `evt_test_idempotency_${process.pid}`
    try {
      await releaseStripeWebhookEventClaim(id)
      const first = await tryClaimStripeWebhookEvent(id)
      const second = await tryClaimStripeWebhookEvent(id)
      assert.equal(first, true)
      assert.equal(second, false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes("stripe_webhook_events")) {
        t.skip()
        return
      }
      throw err
    } finally {
      await releaseStripeWebhookEventClaim(id).catch(() => {})
      restore()
    }
  })
})

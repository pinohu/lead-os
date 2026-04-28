// tests/stripe-webhook-idempotency.test.ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { tryClaimStripeWebhookEvent, releaseStripeWebhookEventClaim } from "../src/lib/billing/stripe-webhook-idempotency.ts";

describe("stripe webhook idempotency (Postgres)", () => {
  it("tryClaim then duplicate claim returns false when DB and migration 009 exist", async (t) => {
    const url = process.env.LEAD_OS_DATABASE_URL ?? process.env.DATABASE_URL;
    if (!url) {
      t.skip();
      return;
    }

    const { initializeDatabase } = await import("../src/lib/db");
    await initializeDatabase();

    const id = `evt_test_idempotency_${process.pid}`;
    try {
      await releaseStripeWebhookEventClaim(id);
      const first = await tryClaimStripeWebhookEvent(id);
      const second = await tryClaimStripeWebhookEvent(id);
      assert.equal(first, true);
      assert.equal(second, false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("stripe_webhook_events")) {
        t.skip();
        return;
      }
      throw err;
    } finally {
      await releaseStripeWebhookEventClaim(id).catch(() => {});
    }
  });
});

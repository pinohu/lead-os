import test from "node:test";
import assert from "node:assert/strict";
import { getStripeWebhookConfigStatus } from "../src/lib/billing.ts";
import { withEnv } from "./test-helpers.ts";

test("Stripe webhook config reports production unavailable when required secrets are missing", () => {
  const restore = withEnv({
    NODE_ENV: "production",
    VERCEL_ENV: undefined,
    STRIPE_SECRET_KEY: undefined,
    STRIPE_WEBHOOK_SECRET: undefined,
  });

  try {
    const status = getStripeWebhookConfigStatus();
    assert.equal(status.configured, false);
    assert.equal(status.productionMissing, true);
    assert.deepEqual(status.missing, ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"]);
  } finally {
    restore();
  }
});

test("Stripe webhook config does not mark local dry-run mode as production unavailable", () => {
  const restore = withEnv({
    NODE_ENV: "test",
    VERCEL_ENV: undefined,
    STRIPE_SECRET_KEY: undefined,
    STRIPE_WEBHOOK_SECRET: undefined,
  });

  try {
    const status = getStripeWebhookConfigStatus();
    assert.equal(status.configured, false);
    assert.equal(status.productionMissing, false);
  } finally {
    restore();
  }
});

// tests/stripe-billing-sync.test.ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  catalogPlanIdToBillingPlanKey,
  mapStripeStatusToBillingSubscriptionStatus,
} from "../src/lib/billing/stripe-billing-subscription-sync";

describe("stripe billing subscription sync helpers", () => {
  it("maps Stripe statuses into billing_subscriptions CHECK values", () => {
    assert.equal(mapStripeStatusToBillingSubscriptionStatus("active"), "active");
    assert.equal(mapStripeStatusToBillingSubscriptionStatus("trialing"), "trialing");
    assert.equal(mapStripeStatusToBillingSubscriptionStatus("canceled"), "canceled");
    assert.equal(mapStripeStatusToBillingSubscriptionStatus("past_due"), "past_due");
    assert.equal(mapStripeStatusToBillingSubscriptionStatus("unpaid"), "past_due");
  });

  it("maps catalog plan ids to billing plan keys", () => {
    assert.equal(catalogPlanIdToBillingPlanKey("managed-enterprise"), "enterprise");
    assert.equal(catalogPlanIdToBillingPlanKey("managed-growth"), "growth");
    assert.equal(catalogPlanIdToBillingPlanKey("unknown-plan-xyz"), "growth");
  });
});

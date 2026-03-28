import test from "node:test";
import assert from "node:assert/strict";
import {
  enforcePlanLimits,
  isFeatureEnabled,
  getPlanForTenant,
} from "../src/lib/plan-enforcer.ts";
import {
  upsertSubscription,
  incrementUsage,
  _resetBillingStores,
  type SubscriptionRecord,
} from "../src/lib/billing-store.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSubscription(
  tenantId: string,
  planId: string,
  status: SubscriptionRecord["status"] = "active",
): SubscriptionRecord {
  const now = new Date().toISOString();
  return {
    tenantId,
    planId,
    stripeCustomerId: `cus_${tenantId}`,
    stripeSubscriptionId: `sub_${tenantId}`,
    status,
    currentPeriodStart: now,
    currentPeriodEnd: now,
    cancelAtPeriodEnd: false,
    createdAt: now,
    updatedAt: now,
  };
}

// ---------------------------------------------------------------------------
// enforcePlanLimits — usage within limits
// ---------------------------------------------------------------------------

test("enforcePlanLimits returns allowed for usage within limits", async () => {
  _resetBillingStores();

  await upsertSubscription(makeSubscription("pe-within-1", "managed-starter"));
  await incrementUsage("pe-within-1", "leads", 10);

  const result = await enforcePlanLimits("pe-within-1", "leads");

  assert.equal(result.allowed, true);
  assert.equal(result.reason, undefined);
});

test("enforcePlanLimits returns allowed when no metric specified", async () => {
  _resetBillingStores();

  await upsertSubscription(makeSubscription("pe-nometric", "managed-starter"));

  const result = await enforcePlanLimits("pe-nometric");

  assert.equal(result.allowed, true);
});

// ---------------------------------------------------------------------------
// enforcePlanLimits — usage over limits
// ---------------------------------------------------------------------------

test("enforcePlanLimits returns error when over limit", async () => {
  _resetBillingStores();

  await upsertSubscription(makeSubscription("pe-over-1", "managed-starter"));
  await incrementUsage("pe-over-1", "leads", 500);

  const result = await enforcePlanLimits("pe-over-1", "leads");

  assert.equal(result.allowed, false);
  assert.ok(result.reason);
  assert.ok(result.reason.includes("limit reached"));
  assert.ok(result.usage);
  assert.equal(result.usage.metric, "leads");
  assert.equal(result.usage.used, 500);
  assert.equal(result.usage.limit, 500);
});

test("enforcePlanLimits returns error when over email limit", async () => {
  _resetBillingStores();

  await upsertSubscription(makeSubscription("pe-over-email", "managed-starter"));
  await incrementUsage("pe-over-email", "emails", 5000);

  const result = await enforcePlanLimits("pe-over-email", "emails");

  assert.equal(result.allowed, false);
  assert.ok(result.usage);
  assert.equal(result.usage.metric, "emails");
  assert.equal(result.usage.used, 5000);
  assert.equal(result.usage.limit, 5000);
});

// ---------------------------------------------------------------------------
// enforcePlanLimits — unlimited plans
// ---------------------------------------------------------------------------

test("enforcePlanLimits allows unlimited plans regardless of usage", async () => {
  _resetBillingStores();

  await upsertSubscription(makeSubscription("pe-unlimited", "managed-enterprise"));
  await incrementUsage("pe-unlimited", "leads", 999999);

  const result = await enforcePlanLimits("pe-unlimited", "leads");

  assert.equal(result.allowed, true);
});

// ---------------------------------------------------------------------------
// enforcePlanLimits — no subscription (unmanaged tenant)
// ---------------------------------------------------------------------------

test("enforcePlanLimits allows when no subscription exists", async () => {
  _resetBillingStores();

  const result = await enforcePlanLimits("pe-no-sub", "leads");

  assert.equal(result.allowed, true);
});

// ---------------------------------------------------------------------------
// enforcePlanLimits — cancelled subscription
// ---------------------------------------------------------------------------

test("enforcePlanLimits rejects cancelled subscription", async () => {
  _resetBillingStores();

  await upsertSubscription(makeSubscription("pe-cancelled", "managed-starter", "cancelled"));

  const result = await enforcePlanLimits("pe-cancelled", "leads");

  assert.equal(result.allowed, false);
  assert.ok(result.reason);
  assert.ok(result.reason.includes("cancelled"));
});

test("enforcePlanLimits rejects past_due subscription", async () => {
  _resetBillingStores();

  await upsertSubscription(makeSubscription("pe-pastdue", "managed-starter", "past_due"));

  const result = await enforcePlanLimits("pe-pastdue", "leads");

  assert.equal(result.allowed, false);
  assert.ok(result.reason);
  assert.ok(result.reason.includes("past_due"));
});

// ---------------------------------------------------------------------------
// enforcePlanLimits — trialing subscription
// ---------------------------------------------------------------------------

test("enforcePlanLimits allows trialing subscription within limits", async () => {
  _resetBillingStores();

  await upsertSubscription(makeSubscription("pe-trial", "managed-starter", "trialing"));
  await incrementUsage("pe-trial", "leads", 10);

  const result = await enforcePlanLimits("pe-trial", "leads");

  assert.equal(result.allowed, true);
});

// ---------------------------------------------------------------------------
// enforcePlanLimits — boundary values
// ---------------------------------------------------------------------------

test("enforcePlanLimits blocks at exactly the limit", async () => {
  _resetBillingStores();

  await upsertSubscription(makeSubscription("pe-exact", "managed-starter"));
  await incrementUsage("pe-exact", "sms", 500);

  const result = await enforcePlanLimits("pe-exact", "sms");

  assert.equal(result.allowed, false);
});

test("enforcePlanLimits allows at one below the limit", async () => {
  _resetBillingStores();

  await upsertSubscription(makeSubscription("pe-below", "managed-starter"));
  await incrementUsage("pe-below", "sms", 499);

  const result = await enforcePlanLimits("pe-below", "sms");

  assert.equal(result.allowed, true);
});

// ---------------------------------------------------------------------------
// isFeatureEnabled
// ---------------------------------------------------------------------------

test("isFeatureEnabled returns true for included feature", async () => {
  _resetBillingStores();

  await upsertSubscription(makeSubscription("feat-1", "managed-starter"));

  const hasScoring = await isFeatureEnabled("feat-1", "Scoring");
  assert.equal(hasScoring, true);

  const hasCapture = await isFeatureEnabled("feat-1", "Lead capture");
  assert.equal(hasCapture, true);
});

test("isFeatureEnabled returns false for excluded feature", async () => {
  _resetBillingStores();

  await upsertSubscription(makeSubscription("feat-2", "managed-starter"));

  const hasVoice = await isFeatureEnabled("feat-2", "Voice AI");
  assert.equal(hasVoice, false);
});

test("isFeatureEnabled is case-insensitive", async () => {
  _resetBillingStores();

  await upsertSubscription(makeSubscription("feat-case", "managed-starter"));

  const result = await isFeatureEnabled("feat-case", "scoring");
  assert.equal(result, true);

  const result2 = await isFeatureEnabled("feat-case", "SCORING");
  assert.equal(result2, true);
});

test("isFeatureEnabled returns false when no subscription exists", async () => {
  _resetBillingStores();

  const result = await isFeatureEnabled("feat-no-sub", "Scoring");
  assert.equal(result, false);
});

test("isFeatureEnabled returns false for cancelled subscription", async () => {
  _resetBillingStores();

  await upsertSubscription(makeSubscription("feat-cancelled", "managed-starter", "cancelled"));

  const result = await isFeatureEnabled("feat-cancelled", "Scoring");
  assert.equal(result, false);
});

test("isFeatureEnabled returns true for enterprise features on enterprise plan", async () => {
  _resetBillingStores();

  await upsertSubscription(makeSubscription("feat-ent", "managed-enterprise"));

  const hasVoice = await isFeatureEnabled("feat-ent", "Voice AI");
  assert.equal(hasVoice, true);

  const hasCustom = await isFeatureEnabled("feat-ent", "Custom integrations");
  assert.equal(hasCustom, true);
});

// ---------------------------------------------------------------------------
// getPlanForTenant
// ---------------------------------------------------------------------------

test("getPlanForTenant returns plan for active subscription", async () => {
  _resetBillingStores();

  await upsertSubscription(makeSubscription("plan-active", "managed-growth"));

  const plan = await getPlanForTenant("plan-active");
  assert.ok(plan);
  assert.equal(plan.id, "managed-growth");
  assert.equal(plan.name, "Managed Growth");
});

test("getPlanForTenant returns plan for trialing subscription", async () => {
  _resetBillingStores();

  await upsertSubscription(makeSubscription("plan-trial", "whitelabel-starter", "trialing"));

  const plan = await getPlanForTenant("plan-trial");
  assert.ok(plan);
  assert.equal(plan.id, "whitelabel-starter");
});

test("getPlanForTenant returns null for cancelled subscription", async () => {
  _resetBillingStores();

  await upsertSubscription(makeSubscription("plan-cancelled", "managed-growth", "cancelled"));

  const plan = await getPlanForTenant("plan-cancelled");
  assert.equal(plan, null);
});

test("getPlanForTenant returns null when no subscription exists", async () => {
  _resetBillingStores();

  const plan = await getPlanForTenant("plan-no-sub");
  assert.equal(plan, null);
});

test("getPlanForTenant returns null for past_due subscription", async () => {
  _resetBillingStores();

  await upsertSubscription(makeSubscription("plan-pastdue", "managed-growth", "past_due"));

  const plan = await getPlanForTenant("plan-pastdue");
  assert.equal(plan, null);
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  getPlanById,
  getPlansForModel,
  PLAN_CATALOG,
} from "../src/lib/plan-catalog.ts";
import {
  upsertSubscription,
  getSubscription,
  upsertUsage,
  getUsage,
  incrementUsage,
  getCurrentPeriod,
  _resetBillingStores,
  type SubscriptionRecord,
  type UsageRecord,
} from "../src/lib/billing-store.ts";
import {
  enforcePlanLimits,
  isFeatureEnabled,
  getPlanForTenant,
} from "../src/lib/plan-enforcer.ts";
import {
  createCheckoutSession,
  createBillingPortalSession,
  getSubscriptionStatus,
} from "../src/lib/billing.ts";

const ORIGINAL_NODE_ENV = process.env.NODE_ENV;
const ORIGINAL_VERCEL_ENV = process.env.VERCEL_ENV;
const ORIGINAL_STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

function restoreBillingEnv() {
  if (ORIGINAL_NODE_ENV === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = ORIGINAL_NODE_ENV;
  if (ORIGINAL_VERCEL_ENV === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = ORIGINAL_VERCEL_ENV;
  if (ORIGINAL_STRIPE_SECRET_KEY === undefined) delete process.env.STRIPE_SECRET_KEY;
  else process.env.STRIPE_SECRET_KEY = ORIGINAL_STRIPE_SECRET_KEY;
}

// ---------------------------------------------------------------------------
// Plan Catalog
// ---------------------------------------------------------------------------

test("getPlanById finds a known plan", () => {
  const plan = getPlanById("managed-starter");
  assert.ok(plan);
  assert.equal(plan.id, "managed-starter");
  assert.equal(plan.name, "Managed Starter");
  assert.equal(plan.revenueModel, "managed");
});

test("getPlanById returns undefined for unknown plan", () => {
  const plan = getPlanById("nonexistent-plan");
  assert.equal(plan, undefined);
});

test("getPlansForModel filters managed plans", () => {
  const managed = getPlansForModel("managed");
  assert.ok(managed.length >= 3);
  for (const plan of managed) {
    assert.equal(plan.revenueModel, "managed");
  }
});

test("getPlansForModel filters white-label plans", () => {
  const wl = getPlansForModel("white-label");
  assert.ok(wl.length >= 3);
  for (const plan of wl) {
    assert.equal(plan.revenueModel, "white-label");
  }
});

test("getPlansForModel returns empty for unknown model", () => {
  const plans = getPlansForModel("unknown-model");
  assert.equal(plans.length, 0);
});

test("all plans have required fields", () => {
  for (const plan of PLAN_CATALOG) {
    assert.ok(plan.id.length > 0, `Plan missing id`);
    assert.ok(plan.name.length > 0, `Plan ${plan.id} missing name`);
    assert.ok(plan.stripePriceId.length > 0, `Plan ${plan.id} missing stripePriceId`);
    assert.ok(plan.features.length > 0, `Plan ${plan.id} missing features`);
    assert.ok(plan.limits.leadsPerMonth !== undefined, `Plan ${plan.id} missing leadsPerMonth`);
  }
});

// ---------------------------------------------------------------------------
// Billing Store — in-memory (no Postgres during tests)
// ---------------------------------------------------------------------------

test("upsertSubscription and getSubscription round-trip", async () => {
  _resetBillingStores();
  const now = new Date().toISOString();
  const record: SubscriptionRecord = {
    tenantId: "tenant-1",
    planId: "managed-starter",
    stripeCustomerId: "cus_test_1",
    stripeSubscriptionId: "sub_test_1",
    status: "active",
    currentPeriodStart: now,
    currentPeriodEnd: now,
    cancelAtPeriodEnd: false,
    createdAt: now,
    updatedAt: now,
  };

  await upsertSubscription(record);
  const retrieved = await getSubscription("tenant-1");

  assert.ok(retrieved);
  assert.equal(retrieved.tenantId, "tenant-1");
  assert.equal(retrieved.planId, "managed-starter");
  assert.equal(retrieved.status, "active");
});

test("getSubscription returns null for unknown tenant", async () => {
  _resetBillingStores();
  const result = await getSubscription("nonexistent-tenant");
  assert.equal(result, null);
});

test("upsertUsage and getUsage round-trip", async () => {
  _resetBillingStores();
  const now = new Date().toISOString();
  const period = getCurrentPeriod();
  const record: UsageRecord = {
    tenantId: "tenant-2",
    period,
    leads: 10,
    emails: 100,
    sms: 5,
    whatsapp: 2,
    updatedAt: now,
  };

  await upsertUsage(record);
  const retrieved = await getUsage("tenant-2", period);

  assert.ok(retrieved);
  assert.equal(retrieved.leads, 10);
  assert.equal(retrieved.emails, 100);
  assert.equal(retrieved.sms, 5);
  assert.equal(retrieved.whatsapp, 2);
});

test("incrementUsage atomically increments a specific metric", async () => {
  _resetBillingStores();
  const result1 = await incrementUsage("tenant-3", "leads", 5);
  assert.equal(result1.leads, 5);
  assert.equal(result1.emails, 0);

  const result2 = await incrementUsage("tenant-3", "leads", 3);
  assert.equal(result2.leads, 8);

  const result3 = await incrementUsage("tenant-3", "emails", 10);
  assert.equal(result3.leads, 8);
  assert.equal(result3.emails, 10);
});

test("incrementUsage defaults to increment of 1", async () => {
  _resetBillingStores();
  const result = await incrementUsage("tenant-4", "sms");
  assert.equal(result.sms, 1);
});

// ---------------------------------------------------------------------------
// Plan Enforcer
// ---------------------------------------------------------------------------

test("enforcePlanLimits allows under limit", async () => {
  _resetBillingStores();
  const now = new Date().toISOString();
  await upsertSubscription({
    tenantId: "enforce-1",
    planId: "managed-starter",
    stripeCustomerId: "cus_e1",
    stripeSubscriptionId: "sub_e1",
    status: "active",
    currentPeriodStart: now,
    currentPeriodEnd: now,
    cancelAtPeriodEnd: false,
    createdAt: now,
    updatedAt: now,
  });
  await incrementUsage("enforce-1", "leads", 10);

  const result = await enforcePlanLimits("enforce-1", "leads");
  assert.equal(result.allowed, true);
});

test("enforcePlanLimits blocks over limit", async () => {
  _resetBillingStores();
  const now = new Date().toISOString();
  await upsertSubscription({
    tenantId: "enforce-2",
    planId: "managed-starter",
    stripeCustomerId: "cus_e2",
    stripeSubscriptionId: "sub_e2",
    status: "active",
    currentPeriodStart: now,
    currentPeriodEnd: now,
    cancelAtPeriodEnd: false,
    createdAt: now,
    updatedAt: now,
  });
  await incrementUsage("enforce-2", "leads", 500);

  const result = await enforcePlanLimits("enforce-2", "leads");
  assert.equal(result.allowed, false);
  assert.ok(result.reason);
  assert.ok(result.usage);
  assert.equal(result.usage.metric, "leads");
  assert.equal(result.usage.used, 500);
  assert.equal(result.usage.limit, 500);
});

test("enforcePlanLimits allows unlimited (-1) plans", async () => {
  _resetBillingStores();
  const now = new Date().toISOString();
  await upsertSubscription({
    tenantId: "enforce-3",
    planId: "managed-enterprise",
    stripeCustomerId: "cus_e3",
    stripeSubscriptionId: "sub_e3",
    status: "active",
    currentPeriodStart: now,
    currentPeriodEnd: now,
    cancelAtPeriodEnd: false,
    createdAt: now,
    updatedAt: now,
  });
  await incrementUsage("enforce-3", "leads", 999999);

  const result = await enforcePlanLimits("enforce-3", "leads");
  assert.equal(result.allowed, true);
});

test("enforcePlanLimits allows when no subscription exists (unmanaged tenant)", async () => {
  _resetBillingStores();
  const result = await enforcePlanLimits("no-sub-tenant", "leads");
  assert.equal(result.allowed, true);
});

test("enforcePlanLimits rejects cancelled subscription", async () => {
  _resetBillingStores();
  const now = new Date().toISOString();
  await upsertSubscription({
    tenantId: "enforce-4",
    planId: "managed-starter",
    stripeCustomerId: "cus_e4",
    stripeSubscriptionId: "sub_e4",
    status: "cancelled",
    currentPeriodStart: now,
    currentPeriodEnd: now,
    cancelAtPeriodEnd: false,
    createdAt: now,
    updatedAt: now,
  });

  const result = await enforcePlanLimits("enforce-4", "leads");
  assert.equal(result.allowed, false);
  assert.ok(result.reason?.includes("cancelled"));
});

// ---------------------------------------------------------------------------
// Feature Gating
// ---------------------------------------------------------------------------

test("isFeatureEnabled checks plan features", async () => {
  _resetBillingStores();
  const now = new Date().toISOString();
  await upsertSubscription({
    tenantId: "feature-1",
    planId: "managed-starter",
    stripeCustomerId: "cus_f1",
    stripeSubscriptionId: "sub_f1",
    status: "active",
    currentPeriodStart: now,
    currentPeriodEnd: now,
    cancelAtPeriodEnd: false,
    createdAt: now,
    updatedAt: now,
  });

  const hasScoring = await isFeatureEnabled("feature-1", "Scoring");
  assert.equal(hasScoring, true);

  const hasVoice = await isFeatureEnabled("feature-1", "Voice AI");
  assert.equal(hasVoice, false);
});

test("isFeatureEnabled returns false when no subscription", async () => {
  _resetBillingStores();
  const result = await isFeatureEnabled("no-tenant", "Scoring");
  assert.equal(result, false);
});

test("getPlanForTenant returns plan for active subscription", async () => {
  _resetBillingStores();
  const now = new Date().toISOString();
  await upsertSubscription({
    tenantId: "plan-tenant-1",
    planId: "whitelabel-growth",
    stripeCustomerId: "cus_pt1",
    stripeSubscriptionId: "sub_pt1",
    status: "active",
    currentPeriodStart: now,
    currentPeriodEnd: now,
    cancelAtPeriodEnd: false,
    createdAt: now,
    updatedAt: now,
  });

  const plan = await getPlanForTenant("plan-tenant-1");
  assert.ok(plan);
  assert.equal(plan.id, "whitelabel-growth");
});

test("getPlanForTenant returns null for cancelled subscription", async () => {
  _resetBillingStores();
  const now = new Date().toISOString();
  await upsertSubscription({
    tenantId: "plan-tenant-2",
    planId: "whitelabel-growth",
    stripeCustomerId: "cus_pt2",
    stripeSubscriptionId: "sub_pt2",
    status: "cancelled",
    currentPeriodStart: now,
    currentPeriodEnd: now,
    cancelAtPeriodEnd: false,
    createdAt: now,
    updatedAt: now,
  });

  const plan = await getPlanForTenant("plan-tenant-2");
  assert.equal(plan, null);
});

// ---------------------------------------------------------------------------
// Billing functions — dry-run (no STRIPE_SECRET_KEY)
// ---------------------------------------------------------------------------

test("createCheckoutSession returns dry-run when Stripe not configured", async () => {
  restoreBillingEnv();
  delete process.env.VERCEL_ENV;
  process.env.NODE_ENV = "test";
  delete process.env.STRIPE_SECRET_KEY;
  const result = await createCheckoutSession("dry-tenant", "managed-starter", "/success", "/cancel");
  assert.equal(result.dryRun, true);
  assert.equal(result.url, "/success");
  assert.ok(result.sessionId.startsWith("dry_cs_"));
  restoreBillingEnv();
});

test("createCheckoutSession rejects dry-run billing in production", async () => {
  restoreBillingEnv();
  process.env.VERCEL_ENV = "production";
  delete process.env.STRIPE_SECRET_KEY;
  await assert.rejects(
    () => createCheckoutSession("dry-tenant", "managed-starter", "/success", "/cancel"),
    { message: "Stripe is not configured; checkout cannot run in production" },
  );
  restoreBillingEnv();
});

test("createCheckoutSession throws for unknown plan", async () => {
  await assert.rejects(
    () => createCheckoutSession("dry-tenant", "nonexistent-plan"),
    { message: "Unknown plan: nonexistent-plan" },
  );
});

test("createBillingPortalSession returns dry-run when Stripe not configured", async () => {
  const result = await createBillingPortalSession("dry-tenant", "/dashboard");
  assert.equal(result.dryRun, true);
  assert.equal(result.url, "/dashboard");
});

test("getSubscriptionStatus returns inactive for unknown tenant", async () => {
  _resetBillingStores();
  const status = await getSubscriptionStatus("unknown-tenant");
  assert.equal(status.isActive, false);
  assert.equal(status.subscription, null);
  assert.equal(status.plan, null);
});

test("getSubscriptionStatus returns active for subscribed tenant", async () => {
  _resetBillingStores();
  const now = new Date().toISOString();
  await upsertSubscription({
    tenantId: "status-tenant",
    planId: "managed-growth",
    stripeCustomerId: "cus_st1",
    stripeSubscriptionId: "sub_st1",
    status: "active",
    currentPeriodStart: now,
    currentPeriodEnd: now,
    cancelAtPeriodEnd: false,
    createdAt: now,
    updatedAt: now,
  });

  const status = await getSubscriptionStatus("status-tenant");
  assert.equal(status.isActive, true);
  assert.ok(status.subscription);
  assert.ok(status.plan);
  assert.equal(status.plan.id, "managed-growth");
});

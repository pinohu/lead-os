import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveChargebeeConfig,
  isChargebeeDryRun,
  createCustomer,
  getCustomer,
  listCustomers,
  createSubscription,
  cancelSubscription,
  pauseSubscription,
  resumeSubscription,
  getSubscription,
  listSubscriptions,
  createInvoice,
  listInvoices,
  recordUsage,
  getUsage,
  handleWebhookEvent,
  getMRRStats,
  syncWithStripe,
  chargebeeBillingResult,
  resetChargebeeStore,
} from "../src/lib/integrations/chargebee-adapter.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clearChargebeeEnv() {
  delete process.env.CHARGEBEE_API_KEY;
  delete process.env.CHARGEBEE_SITE;
  delete process.env.CHARGEBEE_BASE_URL;
}

// ---------------------------------------------------------------------------
// Config resolution
// ---------------------------------------------------------------------------

test("resolveChargebeeConfig returns null when no env vars set", () => {
  clearChargebeeEnv();
  const cfg = resolveChargebeeConfig();
  assert.equal(cfg, null);
});

test("resolveChargebeeConfig resolves from environment variables", () => {
  clearChargebeeEnv();
  process.env.CHARGEBEE_API_KEY = "test_key_123";
  process.env.CHARGEBEE_SITE = "mysite";

  const cfg = resolveChargebeeConfig();
  assert.ok(cfg);
  assert.equal(cfg.apiKey, "test_key_123");
  assert.equal(cfg.site, "mysite");
  assert.equal(cfg.baseUrl, "https://mysite.chargebee.com/api/v2");

  clearChargebeeEnv();
});

test("resolveChargebeeConfig uses CHARGEBEE_BASE_URL override", () => {
  clearChargebeeEnv();
  process.env.CHARGEBEE_API_KEY = "key";
  process.env.CHARGEBEE_SITE = "mysite";
  process.env.CHARGEBEE_BASE_URL = "https://custom.chargebee.test/api/v2";

  const cfg = resolveChargebeeConfig();
  assert.ok(cfg);
  assert.equal(cfg.baseUrl, "https://custom.chargebee.test/api/v2");

  clearChargebeeEnv();
});

// ---------------------------------------------------------------------------
// Dry-run detection
// ---------------------------------------------------------------------------

test("isChargebeeDryRun returns true when no API key", () => {
  clearChargebeeEnv();
  assert.equal(isChargebeeDryRun(), true);
});

test("isChargebeeDryRun returns false when API key is set", () => {
  clearChargebeeEnv();
  process.env.CHARGEBEE_API_KEY = "live_key";
  assert.equal(isChargebeeDryRun(), false);
  clearChargebeeEnv();
});

// ---------------------------------------------------------------------------
// Customer CRUD
// ---------------------------------------------------------------------------

test("createCustomer creates a customer in dry-run", async () => {
  clearChargebeeEnv();
  resetChargebeeStore();

  const customer = await createCustomer({
    email: "alice@example.com",
    firstName: "Alice",
    lastName: "Smith",
    company: "Acme Inc",
    tenantId: "tenant-1",
  });

  assert.ok(customer.id.startsWith("cust_"));
  assert.equal(customer.email, "alice@example.com");
  assert.equal(customer.firstName, "Alice");
  assert.equal(customer.lastName, "Smith");
  assert.equal(customer.company, "Acme Inc");
  assert.equal(customer.tenantId, "tenant-1");
  assert.ok(customer.createdAt);
});

test("getCustomer retrieves a stored customer", async () => {
  clearChargebeeEnv();
  resetChargebeeStore();

  const created = await createCustomer({
    email: "bob@example.com",
    tenantId: "tenant-1",
  });

  const retrieved = await getCustomer(created.id);
  assert.ok(retrieved);
  assert.equal(retrieved.email, "bob@example.com");
});

test("getCustomer returns undefined for non-existent customer", async () => {
  clearChargebeeEnv();
  resetChargebeeStore();

  const result = await getCustomer("non-existent");
  assert.equal(result, undefined);
});

test("listCustomers returns all customers", async () => {
  clearChargebeeEnv();
  resetChargebeeStore();

  await createCustomer({ email: "a@test.com", tenantId: "t1" });
  await createCustomer({ email: "b@test.com", tenantId: "t2" });

  const all = await listCustomers();
  assert.equal(all.length, 2);
});

test("listCustomers filters by tenantId", async () => {
  clearChargebeeEnv();
  resetChargebeeStore();

  await createCustomer({ email: "a@test.com", tenantId: "t1" });
  await createCustomer({ email: "b@test.com", tenantId: "t2" });

  const filtered = await listCustomers("t1");
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].email, "a@test.com");
});

// ---------------------------------------------------------------------------
// Subscription lifecycle
// ---------------------------------------------------------------------------

test("createSubscription creates an active subscription", async () => {
  clearChargebeeEnv();
  resetChargebeeStore();

  const customer = await createCustomer({ email: "sub@test.com", tenantId: "t1" });
  const sub = await createSubscription({ customerId: customer.id, planId: "pro-monthly" });

  assert.ok(sub.id.startsWith("sub_"));
  assert.equal(sub.customerId, customer.id);
  assert.equal(sub.planId, "pro-monthly");
  assert.equal(sub.status, "active");
  assert.ok(sub.currentTermStart);
  assert.ok(sub.currentTermEnd);
  assert.equal(sub.trialEnd, undefined);
});

test("createSubscription with trialDays sets trial status", async () => {
  clearChargebeeEnv();
  resetChargebeeStore();

  const customer = await createCustomer({ email: "trial@test.com", tenantId: "t1" });
  const sub = await createSubscription({ customerId: customer.id, planId: "pro-monthly", trialDays: 14 });

  assert.equal(sub.status, "trial");
  assert.ok(sub.trialEnd);
});

test("createSubscription throws for non-existent customer", async () => {
  clearChargebeeEnv();
  resetChargebeeStore();

  await assert.rejects(
    () => createSubscription({ customerId: "non-existent", planId: "plan" }),
    { message: "Customer not found: non-existent" },
  );
});

test("cancelSubscription with endOfTerm preserves term end", async () => {
  clearChargebeeEnv();
  resetChargebeeStore();

  const customer = await createCustomer({ email: "cancel@test.com", tenantId: "t1" });
  const sub = await createSubscription({ customerId: customer.id, planId: "pro" });
  const originalTermEnd = sub.currentTermEnd;

  const cancelled = await cancelSubscription(sub.id, true);

  assert.equal(cancelled.status, "cancelled");
  assert.equal(cancelled.currentTermEnd, originalTermEnd);
});

test("cancelSubscription with immediate sets term end to now", async () => {
  clearChargebeeEnv();
  resetChargebeeStore();

  const customer = await createCustomer({ email: "cancel2@test.com", tenantId: "t1" });
  const sub = await createSubscription({ customerId: customer.id, planId: "pro" });

  const cancelled = await cancelSubscription(sub.id, false);

  assert.equal(cancelled.status, "cancelled");
  assert.notEqual(cancelled.currentTermEnd, sub.currentTermEnd);
});

test("cancelSubscription throws for already cancelled subscription", async () => {
  clearChargebeeEnv();
  resetChargebeeStore();

  const customer = await createCustomer({ email: "double-cancel@test.com", tenantId: "t1" });
  const sub = await createSubscription({ customerId: customer.id, planId: "pro" });
  await cancelSubscription(sub.id);

  await assert.rejects(
    () => cancelSubscription(sub.id),
    { message: `Subscription already cancelled: ${sub.id}` },
  );
});

test("cancelSubscription throws for non-existent subscription", async () => {
  clearChargebeeEnv();
  resetChargebeeStore();

  await assert.rejects(
    () => cancelSubscription("non-existent"),
    { message: "Subscription not found: non-existent" },
  );
});

test("pauseSubscription pauses an active subscription", async () => {
  clearChargebeeEnv();
  resetChargebeeStore();

  const customer = await createCustomer({ email: "pause@test.com", tenantId: "t1" });
  const sub = await createSubscription({ customerId: customer.id, planId: "pro" });

  const paused = await pauseSubscription(sub.id);
  assert.equal(paused.status, "paused");
});

test("resumeSubscription resumes a paused subscription", async () => {
  clearChargebeeEnv();
  resetChargebeeStore();

  const customer = await createCustomer({ email: "resume@test.com", tenantId: "t1" });
  const sub = await createSubscription({ customerId: customer.id, planId: "pro" });
  await pauseSubscription(sub.id);

  const resumed = await resumeSubscription(sub.id);
  assert.equal(resumed.status, "active");
});

test("resumeSubscription throws for non-paused subscription", async () => {
  clearChargebeeEnv();
  resetChargebeeStore();

  const customer = await createCustomer({ email: "resume-err@test.com", tenantId: "t1" });
  const sub = await createSubscription({ customerId: customer.id, planId: "pro" });

  await assert.rejects(
    () => resumeSubscription(sub.id),
    { message: `Subscription is not paused: ${sub.id}` },
  );
});

test("getSubscription retrieves a stored subscription", async () => {
  clearChargebeeEnv();
  resetChargebeeStore();

  const customer = await createCustomer({ email: "get-sub@test.com", tenantId: "t1" });
  const sub = await createSubscription({ customerId: customer.id, planId: "pro" });

  const retrieved = await getSubscription(sub.id);
  assert.ok(retrieved);
  assert.equal(retrieved.planId, "pro");
});

test("listSubscriptions returns all subscriptions", async () => {
  clearChargebeeEnv();
  resetChargebeeStore();

  const c1 = await createCustomer({ email: "ls1@test.com", tenantId: "t1" });
  const c2 = await createCustomer({ email: "ls2@test.com", tenantId: "t1" });
  await createSubscription({ customerId: c1.id, planId: "pro" });
  await createSubscription({ customerId: c2.id, planId: "starter" });

  const all = await listSubscriptions();
  assert.equal(all.length, 2);
});

test("listSubscriptions filters by customerId", async () => {
  clearChargebeeEnv();
  resetChargebeeStore();

  const c1 = await createCustomer({ email: "lsf1@test.com", tenantId: "t1" });
  const c2 = await createCustomer({ email: "lsf2@test.com", tenantId: "t1" });
  await createSubscription({ customerId: c1.id, planId: "pro" });
  await createSubscription({ customerId: c2.id, planId: "starter" });

  const filtered = await listSubscriptions(c1.id);
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].planId, "pro");
});

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------

test("createInvoice creates a pending invoice", async () => {
  clearChargebeeEnv();
  resetChargebeeStore();

  const customer = await createCustomer({ email: "inv@test.com", tenantId: "t1" });
  const sub = await createSubscription({ customerId: customer.id, planId: "pro" });

  const invoice = await createInvoice(sub.id, 9900);

  assert.ok(invoice.id.startsWith("inv_"));
  assert.equal(invoice.customerId, customer.id);
  assert.equal(invoice.subscriptionId, sub.id);
  assert.equal(invoice.status, "pending");
  assert.equal(invoice.amount, 9900);
  assert.equal(invoice.currency, "USD");
  assert.ok(invoice.date);
  assert.ok(invoice.dueDate);
});

test("createInvoice uses custom currency", async () => {
  clearChargebeeEnv();
  resetChargebeeStore();

  const customer = await createCustomer({ email: "inv-eur@test.com", tenantId: "t1" });
  const sub = await createSubscription({ customerId: customer.id, planId: "pro" });

  const invoice = await createInvoice(sub.id, 4900, "eur");
  assert.equal(invoice.currency, "EUR");
});

test("createInvoice throws for non-existent subscription", async () => {
  clearChargebeeEnv();
  resetChargebeeStore();

  await assert.rejects(
    () => createInvoice("non-existent", 100),
    { message: "Subscription not found: non-existent" },
  );
});

test("listInvoices returns all invoices", async () => {
  clearChargebeeEnv();
  resetChargebeeStore();

  const customer = await createCustomer({ email: "inv-list@test.com", tenantId: "t1" });
  const sub = await createSubscription({ customerId: customer.id, planId: "pro" });
  await createInvoice(sub.id, 100);
  await createInvoice(sub.id, 200);

  const all = await listInvoices();
  assert.equal(all.length, 2);
});

test("listInvoices filters by customerId", async () => {
  clearChargebeeEnv();
  resetChargebeeStore();

  const c1 = await createCustomer({ email: "inv-f1@test.com", tenantId: "t1" });
  const c2 = await createCustomer({ email: "inv-f2@test.com", tenantId: "t1" });
  const s1 = await createSubscription({ customerId: c1.id, planId: "pro" });
  const s2 = await createSubscription({ customerId: c2.id, planId: "starter" });
  await createInvoice(s1.id, 100);
  await createInvoice(s2.id, 200);

  const filtered = await listInvoices(c1.id);
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].amount, 100);
});

// ---------------------------------------------------------------------------
// Metered usage
// ---------------------------------------------------------------------------

test("recordUsage records usage for a subscription", async () => {
  clearChargebeeEnv();
  resetChargebeeStore();

  const customer = await createCustomer({ email: "usage@test.com", tenantId: "t1" });
  const sub = await createSubscription({ customerId: customer.id, planId: "metered" });

  const usage = await recordUsage(sub.id, "api-calls", 150);

  assert.equal(usage.subscriptionId, sub.id);
  assert.equal(usage.itemId, "api-calls");
  assert.equal(usage.quantity, 150);
  assert.ok(usage.timestamp);
});

test("recordUsage throws for non-existent subscription", async () => {
  clearChargebeeEnv();
  resetChargebeeStore();

  await assert.rejects(
    () => recordUsage("non-existent", "item", 10),
    { message: "Subscription not found: non-existent" },
  );
});

test("getUsage returns all usage for a subscription", async () => {
  clearChargebeeEnv();
  resetChargebeeStore();

  const customer = await createCustomer({ email: "usage2@test.com", tenantId: "t1" });
  const sub = await createSubscription({ customerId: customer.id, planId: "metered" });

  await recordUsage(sub.id, "api-calls", 100);
  await recordUsage(sub.id, "storage", 50);
  await recordUsage(sub.id, "api-calls", 200);

  const all = await getUsage(sub.id);
  assert.equal(all.length, 3);
});

test("getUsage filters by itemId", async () => {
  clearChargebeeEnv();
  resetChargebeeStore();

  const customer = await createCustomer({ email: "usage3@test.com", tenantId: "t1" });
  const sub = await createSubscription({ customerId: customer.id, planId: "metered" });

  await recordUsage(sub.id, "api-calls", 100);
  await recordUsage(sub.id, "storage", 50);

  const filtered = await getUsage(sub.id, "api-calls");
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].quantity, 100);
});

test("getUsage returns empty array for no records", async () => {
  clearChargebeeEnv();
  resetChargebeeStore();

  const result = await getUsage("no-records");
  assert.deepEqual(result, []);
});

// ---------------------------------------------------------------------------
// Webhook event handling
// ---------------------------------------------------------------------------

test("handleWebhookEvent handles subscription_created", async () => {
  clearChargebeeEnv();
  resetChargebeeStore();

  const result = await handleWebhookEvent({
    eventType: "subscription_created",
    content: {
      subscription: { id: "ext-sub-1", customer_id: "ext-cust-1", plan_id: "pro" },
    },
    occurredAt: new Date().toISOString(),
  });

  assert.equal(result.handled, true);
  assert.equal(result.action, "subscription_created");

  const sub = await getSubscription("ext-sub-1");
  assert.ok(sub);
  assert.equal(sub.status, "active");
});

test("handleWebhookEvent handles subscription_cancelled", async () => {
  clearChargebeeEnv();
  resetChargebeeStore();

  const customer = await createCustomer({ email: "wh-cancel@test.com", tenantId: "t1" });
  const sub = await createSubscription({ customerId: customer.id, planId: "pro" });

  const result = await handleWebhookEvent({
    eventType: "subscription_cancelled",
    content: { subscription: { id: sub.id } },
    occurredAt: new Date().toISOString(),
  });

  assert.equal(result.handled, true);
  assert.equal(result.action, "subscription_cancelled");

  const updated = await getSubscription(sub.id);
  assert.ok(updated);
  assert.equal(updated.status, "cancelled");
});

test("handleWebhookEvent handles payment_succeeded", async () => {
  clearChargebeeEnv();
  resetChargebeeStore();

  const customer = await createCustomer({ email: "wh-pay@test.com", tenantId: "t1" });
  const sub = await createSubscription({ customerId: customer.id, planId: "pro" });
  const invoice = await createInvoice(sub.id, 9900);

  const result = await handleWebhookEvent({
    eventType: "payment_succeeded",
    content: { invoice: { id: invoice.id } },
    occurredAt: new Date().toISOString(),
  });

  assert.equal(result.handled, true);
  assert.equal(result.action, "payment_succeeded");

  const invoices = await listInvoices(customer.id);
  const paid = invoices.find((i) => i.id === invoice.id);
  assert.ok(paid);
  assert.equal(paid.status, "paid");
  assert.ok(paid.paidAt);
});

test("handleWebhookEvent handles payment_failed", async () => {
  clearChargebeeEnv();
  resetChargebeeStore();

  const customer = await createCustomer({ email: "wh-fail@test.com", tenantId: "t1" });
  const sub = await createSubscription({ customerId: customer.id, planId: "pro" });
  const invoice = await createInvoice(sub.id, 9900);

  const result = await handleWebhookEvent({
    eventType: "payment_failed",
    content: {
      invoice: { id: invoice.id },
      subscription: { id: sub.id },
    },
    occurredAt: new Date().toISOString(),
  });

  assert.equal(result.handled, true);
  assert.equal(result.action, "payment_failed");

  const updatedInvoice = (await listInvoices(customer.id)).find((i) => i.id === invoice.id);
  assert.ok(updatedInvoice);
  assert.equal(updatedInvoice.status, "not_paid");

  const updatedSub = await getSubscription(sub.id);
  assert.ok(updatedSub);
  assert.equal(updatedSub.status, "past_due");
});

test("handleWebhookEvent returns handled=false for unknown event types", async () => {
  clearChargebeeEnv();
  resetChargebeeStore();

  const result = await handleWebhookEvent({
    eventType: "unknown_event",
    content: {},
    occurredAt: new Date().toISOString(),
  });

  assert.equal(result.handled, false);
  assert.equal(result.action, "unknown_event");
});

// ---------------------------------------------------------------------------
// MRR Stats
// ---------------------------------------------------------------------------

test("getMRRStats returns zero stats for empty store", async () => {
  clearChargebeeEnv();
  resetChargebeeStore();

  const stats = await getMRRStats();
  assert.equal(stats.totalMRR, 0);
  assert.equal(stats.activeSubscriptions, 0);
  assert.equal(stats.churnRate, 0);
  assert.equal(stats.avgRevenuePerAccount, 0);
});

test("getMRRStats counts active and cancelled subscriptions", async () => {
  clearChargebeeEnv();
  resetChargebeeStore();

  const c1 = await createCustomer({ email: "mrr1@test.com", tenantId: "t1" });
  const c2 = await createCustomer({ email: "mrr2@test.com", tenantId: "t1" });
  const c3 = await createCustomer({ email: "mrr3@test.com", tenantId: "t1" });

  await createSubscription({ customerId: c1.id, planId: "pro" });
  await createSubscription({ customerId: c2.id, planId: "pro" });
  const s3 = await createSubscription({ customerId: c3.id, planId: "pro" });
  await cancelSubscription(s3.id);

  const stats = await getMRRStats();
  assert.equal(stats.activeSubscriptions, 2);
  assert.equal(stats.churnRate, 1 / 3);
});

test("getMRRStats filters by tenantId", async () => {
  clearChargebeeEnv();
  resetChargebeeStore();

  const c1 = await createCustomer({ email: "mrr-t1@test.com", tenantId: "t1" });
  const c2 = await createCustomer({ email: "mrr-t2@test.com", tenantId: "t2" });

  await createSubscription({ customerId: c1.id, planId: "pro" });
  await createSubscription({ customerId: c2.id, planId: "pro" });

  const stats = await getMRRStats("t1");
  assert.equal(stats.activeSubscriptions, 1);
});

// ---------------------------------------------------------------------------
// Stripe sync
// ---------------------------------------------------------------------------

test("syncWithStripe returns mappings for tenant subscriptions", async () => {
  clearChargebeeEnv();
  resetChargebeeStore();

  const customer = await createCustomer({ email: "sync@test.com", tenantId: "t1" });
  await createSubscription({ customerId: customer.id, planId: "pro" });
  await createSubscription({ customerId: customer.id, planId: "enterprise" });

  const result = await syncWithStripe("t1");
  assert.equal(result.mappings.length, 2);
  assert.equal(result.mappings[0].stripeSubId, null);
});

test("syncWithStripe returns empty mappings for unknown tenant", async () => {
  clearChargebeeEnv();
  resetChargebeeStore();

  const result = await syncWithStripe("unknown-tenant");
  assert.equal(result.mappings.length, 0);
});

// ---------------------------------------------------------------------------
// ProviderResult format
// ---------------------------------------------------------------------------

test("chargebeeBillingResult returns correct ProviderResult in dry-run", () => {
  clearChargebeeEnv();

  const result = chargebeeBillingResult("create_subscription", "Subscription created");
  assert.equal(result.ok, true);
  assert.equal(result.provider, "Chargebee");
  assert.equal(result.mode, "dry-run");
  assert.equal(result.detail, "Subscription created");
  assert.deepEqual(result.payload, { operation: "create_subscription" });
});

test("chargebeeBillingResult returns live mode when API key is set", () => {
  clearChargebeeEnv();
  process.env.CHARGEBEE_API_KEY = "live_key";

  const result = chargebeeBillingResult("create_customer", "Customer created");
  assert.equal(result.mode, "live");

  clearChargebeeEnv();
});

// ---------------------------------------------------------------------------
// Store reset
// ---------------------------------------------------------------------------

test("resetChargebeeStore clears all stores", async () => {
  clearChargebeeEnv();
  resetChargebeeStore();

  await createCustomer({ email: "reset@test.com", tenantId: "t1" });
  const customer = await createCustomer({ email: "reset2@test.com", tenantId: "t1" });
  await createSubscription({ customerId: customer.id, planId: "pro" });

  assert.ok((await listCustomers()).length > 0);
  assert.ok((await listSubscriptions()).length > 0);

  resetChargebeeStore();

  assert.equal((await listCustomers()).length, 0);
  assert.equal((await listSubscriptions()).length, 0);
  assert.equal((await listInvoices()).length, 0);
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

test("createSubscription with trialDays=0 creates active subscription", async () => {
  clearChargebeeEnv();
  resetChargebeeStore();

  const customer = await createCustomer({ email: "trial0@test.com", tenantId: "t1" });
  const sub = await createSubscription({ customerId: customer.id, planId: "pro", trialDays: 0 });

  assert.equal(sub.status, "active");
  assert.equal(sub.trialEnd, undefined);
});

test("pauseSubscription throws for non-existent subscription", async () => {
  clearChargebeeEnv();
  resetChargebeeStore();

  await assert.rejects(
    () => pauseSubscription("non-existent"),
    { message: "Subscription not found: non-existent" },
  );
});

test("resumeSubscription throws for non-existent subscription", async () => {
  clearChargebeeEnv();
  resetChargebeeStore();

  await assert.rejects(
    () => resumeSubscription("non-existent"),
    { message: "Subscription not found: non-existent" },
  );
});

test("full subscription lifecycle: create, pause, resume, cancel", async () => {
  clearChargebeeEnv();
  resetChargebeeStore();

  const customer = await createCustomer({ email: "lifecycle@test.com", tenantId: "t1" });
  const sub = await createSubscription({ customerId: customer.id, planId: "pro" });
  assert.equal(sub.status, "active");

  const paused = await pauseSubscription(sub.id);
  assert.equal(paused.status, "paused");

  const resumed = await resumeSubscription(sub.id);
  assert.equal(resumed.status, "active");

  const cancelled = await cancelSubscription(sub.id);
  assert.equal(cancelled.status, "cancelled");
});

test("multiple customers can have independent subscriptions", async () => {
  clearChargebeeEnv();
  resetChargebeeStore();

  const c1 = await createCustomer({ email: "multi1@test.com", tenantId: "t1" });
  const c2 = await createCustomer({ email: "multi2@test.com", tenantId: "t1" });

  const s1 = await createSubscription({ customerId: c1.id, planId: "starter" });
  const s2 = await createSubscription({ customerId: c2.id, planId: "pro" });

  await cancelSubscription(s1.id);

  const sub1 = await getSubscription(s1.id);
  const sub2 = await getSubscription(s2.id);
  assert.ok(sub1);
  assert.ok(sub2);
  assert.equal(sub1.status, "cancelled");
  assert.equal(sub2.status, "active");
});

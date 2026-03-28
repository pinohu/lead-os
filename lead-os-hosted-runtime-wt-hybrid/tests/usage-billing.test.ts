import test from "node:test";
import assert from "node:assert/strict";
import {
  recordUsage,
  recordBulkUsage,
  getUsageSummary,
  generateInvoice,
  getInvoice,
  listInvoices,
  setPricing,
  getPricing,
  LEAD_OS_USAGE_TYPES,
  resetBillingStore,
} from "../src/lib/integrations/usage-billing.ts";

// ---------------------------------------------------------------------------
// Reset store between tests
// ---------------------------------------------------------------------------

function setup() {
  resetBillingStore();
}

// ---------------------------------------------------------------------------
// LEAD_OS_USAGE_TYPES
// ---------------------------------------------------------------------------

test("LEAD_OS_USAGE_TYPES contains all required usage types", () => {
  const types = LEAD_OS_USAGE_TYPES.map((t) => t.type);
  assert.ok(types.includes("lead-captured"));
  assert.ok(types.includes("email-sent"));
  assert.ok(types.includes("sms-sent"));
  assert.ok(types.includes("whatsapp-sent"));
  assert.ok(types.includes("page-deployed"));
  assert.ok(types.includes("video-generated"));
  assert.ok(types.includes("api-call"));
});

test("LEAD_OS_USAGE_TYPES entries have positive defaultPrice", () => {
  for (const entry of LEAD_OS_USAGE_TYPES) {
    assert.ok(entry.defaultPrice > 0, `${entry.type} should have positive price`);
    assert.ok(entry.description.length > 0);
  }
});

// ---------------------------------------------------------------------------
// recordUsage
// ---------------------------------------------------------------------------

test("recordUsage returns an event ID string", async () => {
  setup();
  const id = await recordUsage({
    tenantId: "t1",
    eventType: "email-sent",
    units: 10,
  });
  assert.ok(typeof id === "string");
  assert.ok(id.length > 0);
});

test("recordUsage accumulates units for the same event type in a period", async () => {
  setup();
  await recordUsage({ tenantId: "t1", eventType: "email-sent", units: 5 });
  await recordUsage({ tenantId: "t1", eventType: "email-sent", units: 3 });

  const summary = await getUsageSummary("t1");
  const emailEvent = summary.events.find((e) => e.type === "email-sent");
  assert.ok(emailEvent);
  assert.equal(emailEvent.totalUnits, 8);
});

test("recordUsage respects explicit timestamp for period bucketing", async () => {
  setup();
  await recordUsage({
    tenantId: "t1",
    eventType: "lead-captured",
    units: 1,
    timestamp: "2026-01-15T12:00:00Z",
  });

  const summary = await getUsageSummary("t1", "2026-01");
  assert.equal(summary.events[0].totalUnits, 1);
});

// ---------------------------------------------------------------------------
// recordBulkUsage
// ---------------------------------------------------------------------------

test("recordBulkUsage records multiple events and returns IDs", async () => {
  setup();
  const ids = await recordBulkUsage([
    { tenantId: "t1", eventType: "sms-sent", units: 2 },
    { tenantId: "t1", eventType: "whatsapp-sent", units: 4 },
  ]);

  assert.equal(ids.length, 2);
  for (const id of ids) {
    assert.ok(typeof id === "string");
  }
});

// ---------------------------------------------------------------------------
// getUsageSummary
// ---------------------------------------------------------------------------

test("getUsageSummary returns empty events for tenant with no usage", async () => {
  setup();
  const summary = await getUsageSummary("no-usage-tenant");
  assert.equal(summary.events.length, 0);
  assert.equal(summary.totalCost, 0);
});

test("getUsageSummary calculates totalCost correctly", async () => {
  setup();
  setPricing("api-call", 0.001, "API call");
  await recordUsage({ tenantId: "t1", eventType: "api-call", units: 1000 });

  const summary = await getUsageSummary("t1");
  const apiEvent = summary.events.find((e) => e.type === "api-call");
  assert.ok(apiEvent);
  assert.equal(apiEvent.totalCost, 1.0);
  assert.equal(summary.totalCost, 1.0);
});

test("getUsageSummary isolates tenants from each other", async () => {
  setup();
  await recordUsage({ tenantId: "t1", eventType: "email-sent", units: 100 });
  await recordUsage({ tenantId: "t2", eventType: "email-sent", units: 200 });

  const t1Summary = await getUsageSummary("t1");
  const t2Summary = await getUsageSummary("t2");

  const t1Email = t1Summary.events.find((e) => e.type === "email-sent");
  const t2Email = t2Summary.events.find((e) => e.type === "email-sent");

  assert.equal(t1Email?.totalUnits, 100);
  assert.equal(t2Email?.totalUnits, 200);
});

// ---------------------------------------------------------------------------
// generateInvoice / getInvoice / listInvoices
// ---------------------------------------------------------------------------

test("generateInvoice creates an invoice with draft status", async () => {
  setup();
  await recordUsage({ tenantId: "t1", eventType: "lead-captured", units: 10 });

  const now = new Date();
  const period = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const invoice = await generateInvoice("t1", period);

  assert.ok(invoice.id.startsWith("inv_"));
  assert.equal(invoice.tenantId, "t1");
  assert.equal(invoice.status, "draft");
  assert.ok(typeof invoice.amount === "number");
  assert.ok(Array.isArray(invoice.items));
});

test("getInvoice retrieves a previously generated invoice", async () => {
  setup();
  await recordUsage({ tenantId: "t1", eventType: "sms-sent", units: 5 });

  const now = new Date();
  const period = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const invoice = await generateInvoice("t1", period);
  const fetched = await getInvoice(invoice.id);

  assert.ok(fetched);
  assert.equal(fetched.id, invoice.id);
});

test("getInvoice returns undefined for unknown invoice", async () => {
  setup();
  const invoice = await getInvoice("inv_nonexistent");
  assert.equal(invoice, undefined);
});

test("listInvoices returns only invoices for the given tenantId", async () => {
  setup();
  const now = new Date();
  const period = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

  await recordUsage({ tenantId: "t1", eventType: "email-sent", units: 10 });
  await recordUsage({ tenantId: "t2", eventType: "email-sent", units: 20 });

  await generateInvoice("t1", period);
  await generateInvoice("t2", period);

  const t1Invoices = await listInvoices("t1");
  assert.equal(t1Invoices.length, 1);
  assert.equal(t1Invoices[0].tenantId, "t1");
});

// ---------------------------------------------------------------------------
// setPricing / getPricing
// ---------------------------------------------------------------------------

test("setPricing overrides unit price for an event type", async () => {
  setup();
  setPricing("email-sent", 0.005, "Email delivery");
  await recordUsage({ tenantId: "t1", eventType: "email-sent", units: 100 });

  const summary = await getUsageSummary("t1");
  const emailEvent = summary.events.find((e) => e.type === "email-sent");
  assert.ok(emailEvent);
  assert.equal(emailEvent.unitPrice, 0.005);
  assert.equal(emailEvent.totalCost, 0.5);
});

test("getPricing returns all registered pricing entries", () => {
  setup();
  setPricing("custom-event", 1.0, "Custom event");
  const pricing = getPricing();
  const custom = pricing.find((p) => p.eventType === "custom-event");
  assert.ok(custom);
  assert.equal(custom.unitPrice, 1.0);
  assert.equal(custom.description, "Custom event");
});

// ---------------------------------------------------------------------------
// resetBillingStore
// ---------------------------------------------------------------------------

test("resetBillingStore clears all usage and invoices", async () => {
  await recordUsage({ tenantId: "t1", eventType: "email-sent", units: 50 });

  const now = new Date();
  const period = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  await generateInvoice("t1", period);

  resetBillingStore();

  const summary = await getUsageSummary("t1");
  assert.equal(summary.totalCost, 0);

  const invoices = await listInvoices("t1");
  assert.equal(invoices.length, 0);
});

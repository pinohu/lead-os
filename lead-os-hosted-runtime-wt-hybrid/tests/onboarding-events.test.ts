import test from "node:test";
import assert from "node:assert/strict";
import {
  emitChecklistEvent,
  getChecklistProgress,
  isChecklistComplete,
  resetChecklistProgress,
  resetChecklistStore,
  type ChecklistEvent,
  type ChecklistProgress,
} from "../src/lib/onboarding-events.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEvent(
  tenantId: string,
  eventType: ChecklistEvent["eventType"],
  occurredAt = new Date().toISOString(),
): ChecklistEvent {
  return { tenantId, eventType, occurredAt };
}

async function emitAll(tenantId: string): Promise<void> {
  const now = new Date().toISOString();
  await emitChecklistEvent(makeEvent(tenantId, "brand-configured", now));
  await emitChecklistEvent(makeEvent(tenantId, "email-connected", now));
  await emitChecklistEvent(makeEvent(tenantId, "widget-configured", now));
  await emitChecklistEvent(makeEvent(tenantId, "first-lead-captured", now));
  await emitChecklistEvent(makeEvent(tenantId, "scoring-reviewed", now));
  await emitChecklistEvent(makeEvent(tenantId, "gone-live", now));
}

// ---------------------------------------------------------------------------
// Setup: clear store before each test by using unique tenant IDs per test
// The resetChecklistStore() call ensures no cross-test leakage.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 1. Unknown tenant returns all-false defaults
// ---------------------------------------------------------------------------

test("getChecklistProgress for unknown tenant returns all-false defaults", async () => {
  resetChecklistStore();
  const progress = await getChecklistProgress("unknown-tenant-001");
  assert.equal(progress.tenantId, "unknown-tenant-001");
  assert.equal(progress.brandConfigured, false);
  assert.equal(progress.emailConnected, false);
  assert.equal(progress.widgetConfigured, false);
  assert.equal(progress.firstLeadCaptured, false);
  assert.equal(progress.scoringReviewed, false);
  assert.equal(progress.goneLive, false);
  assert.equal(progress.completedAt, undefined);
});

// ---------------------------------------------------------------------------
// 2. Each event type marks its field complete
// ---------------------------------------------------------------------------

test("emitChecklistEvent brand-configured marks brandConfigured true", async () => {
  resetChecklistStore();
  await emitChecklistEvent(makeEvent("t-brand", "brand-configured"));
  const p = await getChecklistProgress("t-brand");
  assert.equal(p.brandConfigured, true);
  assert.equal(p.emailConnected, false);
});

test("emitChecklistEvent email-connected marks emailConnected true", async () => {
  resetChecklistStore();
  await emitChecklistEvent(makeEvent("t-email", "email-connected"));
  const p = await getChecklistProgress("t-email");
  assert.equal(p.emailConnected, true);
  assert.equal(p.brandConfigured, false);
});

test("emitChecklistEvent widget-configured marks widgetConfigured true", async () => {
  resetChecklistStore();
  await emitChecklistEvent(makeEvent("t-widget", "widget-configured"));
  const p = await getChecklistProgress("t-widget");
  assert.equal(p.widgetConfigured, true);
  assert.equal(p.brandConfigured, false);
});

test("emitChecklistEvent first-lead-captured marks firstLeadCaptured true", async () => {
  resetChecklistStore();
  await emitChecklistEvent(makeEvent("t-lead", "first-lead-captured"));
  const p = await getChecklistProgress("t-lead");
  assert.equal(p.firstLeadCaptured, true);
  assert.equal(p.widgetConfigured, false);
});

test("emitChecklistEvent scoring-reviewed marks scoringReviewed true", async () => {
  resetChecklistStore();
  await emitChecklistEvent(makeEvent("t-scoring", "scoring-reviewed"));
  const p = await getChecklistProgress("t-scoring");
  assert.equal(p.scoringReviewed, true);
  assert.equal(p.goneLive, false);
});

test("emitChecklistEvent gone-live marks goneLive true", async () => {
  resetChecklistStore();
  await emitChecklistEvent(makeEvent("t-live", "gone-live"));
  const p = await getChecklistProgress("t-live");
  assert.equal(p.goneLive, true);
  assert.equal(p.scoringReviewed, false);
});

// ---------------------------------------------------------------------------
// 3. Multiple events accumulate correctly
// ---------------------------------------------------------------------------

test("multiple events accumulate without resetting earlier steps", async () => {
  resetChecklistStore();
  const tid = "t-accumulate";
  await emitChecklistEvent(makeEvent(tid, "brand-configured"));
  await emitChecklistEvent(makeEvent(tid, "email-connected"));
  await emitChecklistEvent(makeEvent(tid, "scoring-reviewed"));

  const p = await getChecklistProgress(tid);
  assert.equal(p.brandConfigured, true);
  assert.equal(p.emailConnected, true);
  assert.equal(p.scoringReviewed, true);
  assert.equal(p.widgetConfigured, false);
  assert.equal(p.firstLeadCaptured, false);
  assert.equal(p.goneLive, false);
});

// ---------------------------------------------------------------------------
// 4. Duplicate events are idempotent
// ---------------------------------------------------------------------------

test("emitting the same event twice does not change the result", async () => {
  resetChecklistStore();
  const tid = "t-idempotent";
  await emitChecklistEvent(makeEvent(tid, "brand-configured"));
  await emitChecklistEvent(makeEvent(tid, "brand-configured"));

  const p = await getChecklistProgress(tid);
  assert.equal(p.brandConfigured, true);
});

test("emitting all events twice still produces the same complete progress", async () => {
  resetChecklistStore();
  const tid = "t-idempotent-all";
  await emitAll(tid);
  await emitAll(tid);

  const p = await getChecklistProgress(tid);
  assert.equal(p.brandConfigured, true);
  assert.equal(p.emailConnected, true);
  assert.equal(p.widgetConfigured, true);
  assert.equal(p.firstLeadCaptured, true);
  assert.equal(p.scoringReviewed, true);
  assert.equal(p.goneLive, true);
});

// ---------------------------------------------------------------------------
// 5. isChecklistComplete
// ---------------------------------------------------------------------------

test("isChecklistComplete returns false when no steps are done", async () => {
  resetChecklistStore();
  const result = await isChecklistComplete("t-incomplete-empty");
  assert.equal(result, false);
});

test("isChecklistComplete returns false when only 5 of 6 steps are done", async () => {
  resetChecklistStore();
  const tid = "t-five-steps";
  await emitChecklistEvent(makeEvent(tid, "brand-configured"));
  await emitChecklistEvent(makeEvent(tid, "email-connected"));
  await emitChecklistEvent(makeEvent(tid, "widget-configured"));
  await emitChecklistEvent(makeEvent(tid, "first-lead-captured"));
  await emitChecklistEvent(makeEvent(tid, "scoring-reviewed"));

  const result = await isChecklistComplete(tid);
  assert.equal(result, false);
});

test("isChecklistComplete returns true when all 6 steps are done", async () => {
  resetChecklistStore();
  const tid = "t-all-done";
  await emitAll(tid);

  const result = await isChecklistComplete(tid);
  assert.equal(result, true);
});

// ---------------------------------------------------------------------------
// 6. completedAt is set when all steps reach true
// ---------------------------------------------------------------------------

test("completedAt is undefined when not all steps are complete", async () => {
  resetChecklistStore();
  const tid = "t-no-completed-at";
  await emitChecklistEvent(makeEvent(tid, "brand-configured"));
  const p = await getChecklistProgress(tid);
  assert.equal(p.completedAt, undefined);
});

test("completedAt is set when all 6 steps become complete", async () => {
  resetChecklistStore();
  const tid = "t-completed-at";
  await emitAll(tid);
  const p = await getChecklistProgress(tid);
  assert.ok(p.completedAt, "completedAt should be set");
  // Must be a valid ISO timestamp
  assert.ok(!Number.isNaN(new Date(p.completedAt!).getTime()), "completedAt must be a valid date");
});

// ---------------------------------------------------------------------------
// 7. resetChecklistProgress clears a tenant
// ---------------------------------------------------------------------------

test("resetChecklistProgress clears progress for a specific tenant", async () => {
  resetChecklistStore();
  const tid = "t-reset";
  await emitChecklistEvent(makeEvent(tid, "brand-configured"));
  await emitChecklistEvent(makeEvent(tid, "gone-live"));

  await resetChecklistProgress(tid);

  const p = await getChecklistProgress(tid);
  assert.equal(p.brandConfigured, false);
  assert.equal(p.goneLive, false);
});

test("resetChecklistProgress does not affect other tenants", async () => {
  resetChecklistStore();
  const tid1 = "t-reset-isolation-1";
  const tid2 = "t-reset-isolation-2";

  await emitChecklistEvent(makeEvent(tid1, "scoring-reviewed"));
  await emitChecklistEvent(makeEvent(tid2, "scoring-reviewed"));

  await resetChecklistProgress(tid1);

  const p1 = await getChecklistProgress(tid1);
  const p2 = await getChecklistProgress(tid2);

  assert.equal(p1.scoringReviewed, false);
  assert.equal(p2.scoringReviewed, true);
});

// ---------------------------------------------------------------------------
// 8. resetChecklistStore clears all tenants
// ---------------------------------------------------------------------------

test("resetChecklistStore wipes all in-memory progress", async () => {
  const tid1 = "t-store-reset-a";
  const tid2 = "t-store-reset-b";

  await emitChecklistEvent(makeEvent(tid1, "brand-configured"));
  await emitChecklistEvent(makeEvent(tid2, "email-connected"));

  resetChecklistStore();

  const p1 = await getChecklistProgress(tid1);
  const p2 = await getChecklistProgress(tid2);

  assert.equal(p1.brandConfigured, false);
  assert.equal(p2.emailConnected, false);
});

// ---------------------------------------------------------------------------
// 9. updatedAt is set on emit
// ---------------------------------------------------------------------------

test("updatedAt reflects the occurredAt time of the last emitted event", async () => {
  resetChecklistStore();
  const tid = "t-updated-at";
  const ts = "2024-06-01T12:00:00.000Z";
  await emitChecklistEvent(makeEvent(tid, "brand-configured", ts));

  const p = await getChecklistProgress(tid);
  assert.equal(p.updatedAt, ts);
});

// ---------------------------------------------------------------------------
// 10. Metadata field is accepted without error
// ---------------------------------------------------------------------------

test("emitChecklistEvent accepts optional metadata without throwing", async () => {
  resetChecklistStore();
  const tid = "t-metadata";
  await assert.doesNotReject(() =>
    emitChecklistEvent({
      tenantId: tid,
      eventType: "scoring-reviewed",
      metadata: { reviewedBy: "operator@example.com", ruleCount: 5 },
      occurredAt: new Date().toISOString(),
    }),
  );
  const p = await getChecklistProgress(tid);
  assert.equal(p.scoringReviewed, true);
});

// ---------------------------------------------------------------------------
// 11. Tenant isolation — events for one tenant don't affect another
// ---------------------------------------------------------------------------

test("events for one tenant do not affect a different tenant", async () => {
  resetChecklistStore();
  const tid1 = "t-isolation-x";
  const tid2 = "t-isolation-y";

  await emitChecklistEvent(makeEvent(tid1, "brand-configured"));

  const p1 = await getChecklistProgress(tid1);
  const p2 = await getChecklistProgress(tid2);

  assert.equal(p1.brandConfigured, true);
  assert.equal(p2.brandConfigured, false);
});

// ---------------------------------------------------------------------------
// 12. Progress shape always includes all required fields
// ---------------------------------------------------------------------------

test("getChecklistProgress always returns all required fields", async () => {
  resetChecklistStore();
  const p = await getChecklistProgress("t-shape-check");

  const requiredBooleanFields: Array<keyof ChecklistProgress> = [
    "brandConfigured",
    "emailConnected",
    "widgetConfigured",
    "firstLeadCaptured",
    "scoringReviewed",
    "goneLive",
  ];

  assert.equal(typeof p.tenantId, "string");
  assert.equal(typeof p.updatedAt, "string");

  for (const field of requiredBooleanFields) {
    assert.equal(
      typeof p[field],
      "boolean",
      `Field ${String(field)} should be a boolean`,
    );
  }
});

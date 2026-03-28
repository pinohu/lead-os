import test from "node:test";
import assert from "node:assert/strict";
import {
  triggerDMSequence,
  advanceSequence,
  updateSequenceStatus,
  getSequences,
  getSequencesByPlatform,
  getActiveSequences,
  getDMFunnelMetrics,
  _resetStores,
} from "../src/lib/social-dm-engine.ts";

test.beforeEach(() => {
  _resetStores();
});

function makeTrigger(overrides: Record<string, unknown> = {}) {
  return {
    tenantId: `dm-test-${Date.now()}`,
    userId: `user-${Math.random().toString(36).slice(2, 8)}`,
    userName: "John Doe",
    platform: "instagram",
    engagementType: "comment" as const,
    sourceContentId: "content-123",
    niche: "pest-control",
    topic: "pest treatment",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// triggerDMSequence
// ---------------------------------------------------------------------------

test("triggerDMSequence creates a new sequence with 4 messages", () => {
  const config = makeTrigger();
  const seq = triggerDMSequence(config);
  assert.ok(seq.id.length > 0);
  assert.equal(seq.tenantId, config.tenantId);
  assert.equal(seq.userId, config.userId);
  assert.equal(seq.messages.length, 4);
  assert.equal(seq.currentStage, "acknowledge");
  assert.equal(seq.status, "sent");
});

test("triggerDMSequence messages have correct stage order", () => {
  const seq = triggerDMSequence(makeTrigger());
  const stages = seq.messages.map((m) => m.stage);
  assert.deepEqual(stages, ["acknowledge", "value", "qualify", "offer"]);
});

test("triggerDMSequence interpolates userName into messages", () => {
  const config = makeTrigger({ userName: "Jane Smith" });
  const seq = triggerDMSequence(config);
  const hasName = seq.messages.some((m) => m.content.includes("Jane Smith"));
  assert.ok(hasName, "At least one message should contain the user name");
});

test("triggerDMSequence returns existing sequence for same user/platform", () => {
  const config = makeTrigger();
  const first = triggerDMSequence(config);
  const second = triggerDMSequence(config);
  assert.equal(first.id, second.id, "Should return existing active sequence");
});

test("triggerDMSequence uses default template for unknown niche", () => {
  const config = makeTrigger({ niche: "unknown-niche-xyz" });
  const seq = triggerDMSequence(config);
  assert.equal(seq.messages.length, 4);
  assert.ok(seq.messages[0].content.includes("Thanks for engaging"));
});

test("triggerDMSequence messages have increasing delays", () => {
  const seq = triggerDMSequence(makeTrigger());
  for (let i = 1; i < seq.messages.length; i++) {
    assert.ok(seq.messages[i].delayMinutes > seq.messages[i - 1].delayMinutes);
  }
});

// ---------------------------------------------------------------------------
// advanceSequence
// ---------------------------------------------------------------------------

test("advanceSequence moves to the next stage", () => {
  const config = makeTrigger();
  const seq = triggerDMSequence(config);
  const advanced = advanceSequence(config.tenantId, seq.id, "opened");
  assert.ok(advanced);
  assert.equal(advanced.currentStage, "value");
  assert.equal(advanced.status, "opened");
});

test("advanceSequence handles drop status without advancing stage", () => {
  const config = makeTrigger();
  const seq = triggerDMSequence(config);
  const dropped = advanceSequence(config.tenantId, seq.id, "dropped");
  assert.ok(dropped);
  assert.equal(dropped.status, "dropped");
  assert.equal(dropped.currentStage, "acknowledge");
});

test("advanceSequence returns undefined for non-existent sequence", () => {
  const result = advanceSequence(`dm-nope-${Date.now()}`, "bad-id", "opened");
  assert.equal(result, undefined);
});

// ---------------------------------------------------------------------------
// getSequences
// ---------------------------------------------------------------------------

test("getSequences returns all sequences for tenant", () => {
  const tenantId = `dm-all-${Date.now()}`;
  triggerDMSequence(makeTrigger({ tenantId, userId: "user-1" }));
  triggerDMSequence(makeTrigger({ tenantId, userId: "user-2" }));
  const sequences = getSequences(tenantId);
  assert.equal(sequences.length, 2);
});

test("getSequencesByPlatform filters correctly", () => {
  const tenantId = `dm-plat-${Date.now()}`;
  triggerDMSequence(makeTrigger({ tenantId, userId: "user-1", platform: "instagram" }));
  triggerDMSequence(makeTrigger({ tenantId, userId: "user-2", platform: "tiktok" }));
  const ig = getSequencesByPlatform(tenantId, "instagram");
  assert.equal(ig.length, 1);
});

test("getActiveSequences excludes converted and dropped", () => {
  const tenantId = `dm-active-${Date.now()}`;
  const seq1 = triggerDMSequence(makeTrigger({ tenantId, userId: "user-1" }));
  const seq2 = triggerDMSequence(makeTrigger({ tenantId, userId: "user-2" }));
  triggerDMSequence(makeTrigger({ tenantId, userId: "user-3" }));
  updateSequenceStatus(tenantId, seq1.id, "converted");
  updateSequenceStatus(tenantId, seq2.id, "dropped");
  const active = getActiveSequences(tenantId);
  assert.equal(active.length, 1);
});

// ---------------------------------------------------------------------------
// getDMFunnelMetrics
// ---------------------------------------------------------------------------

test("getDMFunnelMetrics calculates correct funnel rates", () => {
  const tenantId = `dm-funnel-${Date.now()}`;
  const s1 = triggerDMSequence(makeTrigger({ tenantId, userId: "u1" }));
  const s2 = triggerDMSequence(makeTrigger({ tenantId, userId: "u2" }));
  const s3 = triggerDMSequence(makeTrigger({ tenantId, userId: "u3" }));
  const s4 = triggerDMSequence(makeTrigger({ tenantId, userId: "u4" }));

  updateSequenceStatus(tenantId, s1.id, "opened");
  updateSequenceStatus(tenantId, s2.id, "replied");
  updateSequenceStatus(tenantId, s3.id, "converted");

  const funnel = getDMFunnelMetrics(tenantId);
  assert.equal(funnel.sent, 4);
  assert.equal(funnel.converted, 1);
  assert.ok(funnel.conversionRate > 0);
  assert.ok(funnel.openRate > 0);
});

test("getDMFunnelMetrics returns zeros for empty tenant", () => {
  const funnel = getDMFunnelMetrics(`dm-empty-${Date.now()}`);
  assert.equal(funnel.sent, 0);
  assert.equal(funnel.openRate, 0);
  assert.equal(funnel.conversionRate, 0);
});

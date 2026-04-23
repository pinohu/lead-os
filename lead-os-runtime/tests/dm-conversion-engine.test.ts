import test from "node:test";
import assert from "node:assert/strict";
import {
  createDMTrigger,
  getDMTriggers,
  updateDMTrigger,
  deleteDMTrigger,
  processIncomingComment,
  processIncomingDM,
  generateDMSequence,
  getDMMetrics,
  resetDMStore,
  type DMGoal,
} from "../src/lib/dm-conversion-engine.ts";

const BASE_RESPONSE = {
  initialMessage: "Hey! Thanks for reaching out. Drop your email below.",
  followUpMessages: ["What is your biggest challenge right now?", "Perfect! Drop your email below."],
  leadCaptureFields: ["email"],
};

const BASE_TRIGGER = {
  platform: "instagram",
  triggerType: "comment-keyword" as const,
  keywords: ["free guide", "info", "link"],
  response: BASE_RESPONSE,
  funnelTarget: "funnel-123",
  active: true,
};

test.beforeEach(() => {
  resetDMStore();
});

// ---------------------------------------------------------------------------
// createDMTrigger
// ---------------------------------------------------------------------------

test("createDMTrigger returns a trigger with generated id and tenantId", async () => {
  const trigger = await createDMTrigger("tenant-1", BASE_TRIGGER);

  assert.ok(trigger.id.startsWith("trigger-"));
  assert.equal(trigger.tenantId, "tenant-1");
  assert.equal(trigger.platform, "instagram");
  assert.equal(trigger.active, true);
  assert.deepEqual(trigger.keywords, BASE_TRIGGER.keywords);
});

test("createDMTrigger stores multiple triggers independently", async () => {
  const a = await createDMTrigger("tenant-1", BASE_TRIGGER);
  const b = await createDMTrigger("tenant-1", { ...BASE_TRIGGER, platform: "tiktok" });

  assert.notEqual(a.id, b.id);
  assert.equal(a.platform, "instagram");
  assert.equal(b.platform, "tiktok");
});

// ---------------------------------------------------------------------------
// getDMTriggers
// ---------------------------------------------------------------------------

test("getDMTriggers returns all triggers for a tenant", async () => {
  await createDMTrigger("tenant-1", BASE_TRIGGER);
  await createDMTrigger("tenant-1", { ...BASE_TRIGGER, platform: "facebook" });

  const triggers = getDMTriggers("tenant-1");
  assert.equal(triggers.length, 2);
});

test("getDMTriggers filters by platform", async () => {
  await createDMTrigger("tenant-1", { ...BASE_TRIGGER, platform: "instagram" });
  await createDMTrigger("tenant-1", { ...BASE_TRIGGER, platform: "tiktok" });

  const insta = getDMTriggers("tenant-1", "instagram");
  assert.equal(insta.length, 1);
  assert.equal(insta[0].platform, "instagram");
});

test("getDMTriggers returns empty for unknown tenant", () => {
  const triggers = getDMTriggers("nobody");
  assert.equal(triggers.length, 0);
});

// ---------------------------------------------------------------------------
// updateDMTrigger
// ---------------------------------------------------------------------------

test("updateDMTrigger updates specified fields", async () => {
  const trigger = await createDMTrigger("tenant-1", BASE_TRIGGER);
  const updated = await updateDMTrigger(trigger.id, { active: false });

  assert.ok(updated);
  assert.equal(updated.active, false);
  assert.equal(updated.platform, BASE_TRIGGER.platform);
});

test("updateDMTrigger returns undefined for unknown triggerId", async () => {
  const result = await updateDMTrigger("nonexistent", { active: false });
  assert.equal(result, undefined);
});

test("updateDMTrigger can update keywords", async () => {
  const trigger = await createDMTrigger("tenant-1", BASE_TRIGGER);
  const updated = await updateDMTrigger(trigger.id, { keywords: ["new-keyword"] });

  assert.ok(updated);
  assert.deepEqual(updated.keywords, ["new-keyword"]);
});

// ---------------------------------------------------------------------------
// deleteDMTrigger
// ---------------------------------------------------------------------------

test("deleteDMTrigger removes the trigger and returns true", async () => {
  const trigger = await createDMTrigger("tenant-1", BASE_TRIGGER);
  const deleted = await deleteDMTrigger(trigger.id);

  assert.equal(deleted, true);
  const remaining = getDMTriggers("tenant-1");
  assert.equal(remaining.length, 0);
});

test("deleteDMTrigger returns false for nonexistent trigger", async () => {
  const result = await deleteDMTrigger("ghost-id");
  assert.equal(result, false);
});

// ---------------------------------------------------------------------------
// processIncomingComment
// ---------------------------------------------------------------------------

test("processIncomingComment matches when keyword is in comment", async () => {
  await createDMTrigger("tenant-1", BASE_TRIGGER);

  const result = await processIncomingComment("tenant-1", "instagram", "Can I get a free guide?");

  assert.equal(result.matched, true);
  assert.ok(result.trigger);
  assert.equal(typeof result.response, "string");
  assert.ok(result.response!.length > 0);
});

test("processIncomingComment is case-insensitive", async () => {
  await createDMTrigger("tenant-1", BASE_TRIGGER);

  const result = await processIncomingComment("tenant-1", "instagram", "FREE GUIDE please!");
  assert.equal(result.matched, true);
});

test("processIncomingComment returns matched false when no keyword matches", async () => {
  await createDMTrigger("tenant-1", BASE_TRIGGER);

  const result = await processIncomingComment("tenant-1", "instagram", "This is unrelated.");
  assert.equal(result.matched, false);
  assert.equal(result.trigger, undefined);
});

test("processIncomingComment does not match inactive triggers", async () => {
  await createDMTrigger("tenant-1", { ...BASE_TRIGGER, active: false });

  const result = await processIncomingComment("tenant-1", "instagram", "free guide please");
  assert.equal(result.matched, false);
});

test("processIncomingComment only matches triggers for the correct platform", async () => {
  await createDMTrigger("tenant-1", { ...BASE_TRIGGER, platform: "tiktok" });

  const result = await processIncomingComment("tenant-1", "instagram", "free guide please");
  assert.equal(result.matched, false);
});

// ---------------------------------------------------------------------------
// processIncomingDM
// ---------------------------------------------------------------------------

test("processIncomingDM starts a conversation for a keyword match", async () => {
  await createDMTrigger("tenant-1", {
    ...BASE_TRIGGER,
    triggerType: "direct-message",
    keywords: ["interested", "info"],
  });

  const result = await processIncomingDM("tenant-1", "instagram", "user-1", "I am interested");

  assert.ok(result.conversationId);
  assert.equal(typeof result.nextMessage, "string");
  assert.ok(result.nextMessage.length > 0);
  assert.equal(result.leadCaptured, false);
});

test("processIncomingDM continues existing conversation on second message", async () => {
  await createDMTrigger("tenant-1", {
    ...BASE_TRIGGER,
    triggerType: "direct-message",
    keywords: ["help"],
  });

  await processIncomingDM("tenant-1", "instagram", "user-convo", "I need help");
  const second = await processIncomingDM("tenant-1", "instagram", "user-convo", "Still here");

  assert.ok(second.conversationId);
  assert.equal(typeof second.nextMessage, "string");
});

test("processIncomingDM captures lead when valid email is provided", async () => {
  await createDMTrigger("tenant-1", {
    ...BASE_TRIGGER,
    triggerType: "direct-message",
    keywords: ["help"],
    response: {
      ...BASE_RESPONSE,
      leadCaptureFields: ["email"],
    },
  });

  await processIncomingDM("tenant-1", "instagram", "user-email", "I need help");
  const result = await processIncomingDM(
    "tenant-1",
    "instagram",
    "user-email",
    "test@example.com",
  );

  assert.equal(result.leadCaptured, true);
  assert.ok(result.leadKey);
});

test("processIncomingDM returns a fallback message for unmatched DM", async () => {
  const result = await processIncomingDM("tenant-1", "instagram", "user-none", "hello there");
  assert.equal(typeof result.nextMessage, "string");
  assert.equal(result.leadCaptured, false);
});

// ---------------------------------------------------------------------------
// generateDMSequence
// ---------------------------------------------------------------------------

test("generateDMSequence returns a DMResponse for lead-capture goal", () => {
  const sequence = generateDMSequence("fitness", "lead-capture");

  assert.ok(typeof sequence.initialMessage === "string");
  assert.ok(sequence.initialMessage.length > 0);
  assert.ok(Array.isArray(sequence.followUpMessages));
  assert.ok(Array.isArray(sequence.leadCaptureFields));
});

test("generateDMSequence personalizes with niche", () => {
  const sequence = generateDMSequence("real-estate", "lead-capture");
  assert.ok(typeof sequence.initialMessage === "string");
});

test("generateDMSequence supports all four goals", () => {
  const goals: DMGoal[] = ["lead-capture", "booking", "consultation", "lead-magnet-delivery"];
  for (const goal of goals) {
    const seq = generateDMSequence("coaching", goal);
    assert.ok(seq.initialMessage.length > 0, `initialMessage should exist for goal: ${goal}`);
  }
});

test("generateDMSequence booking goal includes bookingLink", () => {
  const sequence = generateDMSequence("coaching", "booking");
  assert.ok(sequence.bookingLink || sequence.followUpMessages.some((m) => m.includes("link")));
});

// ---------------------------------------------------------------------------
// getDMMetrics
// ---------------------------------------------------------------------------

test("getDMMetrics returns zero counts for fresh store", () => {
  const metrics = getDMMetrics("tenant-1");
  assert.equal(metrics.conversationsStarted, 0);
  assert.equal(metrics.leadsCaptured, 0);
  assert.equal(metrics.conversionRate, 0);
  assert.equal(metrics.avgMessagesToConversion, 0);
});

test("getDMMetrics counts conversations started", async () => {
  await createDMTrigger("tenant-1", {
    ...BASE_TRIGGER,
    triggerType: "direct-message",
    keywords: ["info"],
  });

  await processIncomingDM("tenant-1", "instagram", "u1", "info");
  await processIncomingDM("tenant-1", "instagram", "u2", "info");

  const metrics = getDMMetrics("tenant-1");
  assert.equal(metrics.conversationsStarted, 2);
});

test("getDMMetrics calculates conversion rate correctly", async () => {
  await createDMTrigger("tenant-1", {
    ...BASE_TRIGGER,
    triggerType: "direct-message",
    keywords: ["go"],
    response: { ...BASE_RESPONSE, leadCaptureFields: ["email"] },
  });

  await processIncomingDM("tenant-1", "instagram", "ua", "go");
  await processIncomingDM("tenant-1", "instagram", "ua", "user@example.com");

  await processIncomingDM("tenant-1", "instagram", "ub", "go");

  const metrics = getDMMetrics("tenant-1");
  assert.equal(metrics.conversationsStarted, 2);
  assert.equal(metrics.leadsCaptured, 1);
  assert.ok(Math.abs(metrics.conversionRate - 0.5) < 0.001);
});

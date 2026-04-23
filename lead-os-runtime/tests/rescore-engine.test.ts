import test from "node:test";
import assert from "node:assert/strict";
import {
  getInteractionBoost,
  shouldReroute,
  rescoreLead,
  type RescoreEvent,
} from "../src/lib/rescore-engine.ts";
import {
  createContext,
  getContextSync,
  updateContext,
  resetContextStore,
} from "../src/lib/context-engine.ts";

// ---------------------------------------------------------------------------
// getInteractionBoost
// ---------------------------------------------------------------------------

test("email-open produces correct score boost", () => {
  const boost = getInteractionBoost("email-open");
  assert.equal(boost.intent, 2);
  assert.equal(boost.engagement, 5);
  assert.equal(boost.urgency, 0);
});

test("email-click produces correct score boost", () => {
  const boost = getInteractionBoost("email-click");
  assert.equal(boost.intent, 5);
  assert.equal(boost.engagement, 8);
  assert.equal(boost.urgency, 3);
});

test("page-view produces correct score boost", () => {
  const boost = getInteractionBoost("page-view");
  assert.equal(boost.intent, 1);
  assert.equal(boost.engagement, 3);
  assert.equal(boost.urgency, 0);
});

test("return-visit produces correct score boost", () => {
  const boost = getInteractionBoost("return-visit");
  assert.equal(boost.intent, 8);
  assert.equal(boost.engagement, 10);
  assert.equal(boost.urgency, 5);
});

test("form-submit produces correct score boost", () => {
  const boost = getInteractionBoost("form-submit");
  assert.equal(boost.intent, 15);
  assert.equal(boost.engagement, 12);
  assert.equal(boost.urgency, 10);
});

test("chat-message produces correct score boost", () => {
  const boost = getInteractionBoost("chat-message");
  assert.equal(boost.intent, 10);
  assert.equal(boost.engagement, 8);
  assert.equal(boost.urgency, 5);
});

test("assessment-complete produces correct score boost", () => {
  const boost = getInteractionBoost("assessment-complete");
  assert.equal(boost.intent, 20);
  assert.equal(boost.engagement, 15);
  assert.equal(boost.urgency, 8);
});

test("booking-request produces correct score boost", () => {
  const boost = getInteractionBoost("booking-request");
  assert.equal(boost.intent, 25);
  assert.equal(boost.engagement, 20);
  assert.equal(boost.urgency, 20);
});

test("unknown event type returns zero boost", () => {
  const boost = getInteractionBoost("unknown-event");
  assert.equal(boost.intent, 0);
  assert.equal(boost.engagement, 0);
  assert.equal(boost.urgency, 0);
});

// ---------------------------------------------------------------------------
// shouldReroute
// ---------------------------------------------------------------------------

test("shouldReroute returns true when crossing conversion threshold (60)", () => {
  assert.equal(shouldReroute(55, 65), true);
});

test("shouldReroute returns true when crossing fast-track threshold (80)", () => {
  assert.equal(shouldReroute(75, 85), true);
});

test("shouldReroute returns false when staying below threshold", () => {
  assert.equal(shouldReroute(30, 45), false);
});

test("shouldReroute returns false when already above threshold", () => {
  assert.equal(shouldReroute(65, 70), false);
});

// ---------------------------------------------------------------------------
// rescoreLead — integration with context engine
// ---------------------------------------------------------------------------

test("rescoreLead returns null for nonexistent lead", async () => {
  resetContextStore();
  const result = await rescoreLead("nonexistent-lead", { type: "email-open" });
  assert.equal(result, null);
});

test("rescoreLead applies email-open boost and updates context", async () => {
  resetContextStore();
  createContext("lead-1", "tenant-1", { source: "organic", niche: "dental" });

  const result = await rescoreLead("lead-1", { type: "email-open" });
  assert.ok(result !== null);
  assert.equal(result.leadKey, "lead-1");
  assert.equal(result.previousScores.intent, 0);
  assert.equal(result.newScores.intent, 2);
  assert.equal(result.newScores.engagement, 5);
  assert.equal(result.newScores.urgency, 0);

  const ctx = getContextSync("lead-1");
  assert.ok(ctx !== null);
  assert.equal(ctx.scores.intent, 2);
  assert.equal(ctx.scores.engagement, 5);
});

test("scores are capped at 100 after multiple boosts", async () => {
  resetContextStore();
  createContext("lead-cap", "tenant-1", { source: "organic" });

  updateContext("lead-cap", {
    scores: { intent: 90, fit: 50, engagement: 95, urgency: 85, composite: 80, temperature: "hot" },
  });

  const result = await rescoreLead("lead-cap", { type: "booking-request" });
  assert.ok(result !== null);
  assert.ok(result.newScores.intent <= 100, "intent should be capped at 100");
  assert.ok(result.newScores.engagement <= 100, "engagement should be capped at 100");
  assert.ok(result.newScores.urgency <= 100, "urgency should be capped at 100");
  assert.ok(result.newScores.composite <= 100, "composite should be capped at 100");
});

test("multiple events compound correctly", async () => {
  resetContextStore();
  createContext("lead-compound", "tenant-1", { source: "organic" });

  await rescoreLead("lead-compound", { type: "email-open" });
  await rescoreLead("lead-compound", { type: "email-open" });
  await rescoreLead("lead-compound", { type: "email-open" });

  const ctx = getContextSync("lead-compound");
  assert.ok(ctx !== null);
  assert.equal(ctx.scores.intent, 6, "3 email opens should boost intent by 3 * 2 = 6");
  assert.equal(ctx.scores.engagement, 15, "3 email opens should boost engagement by 3 * 5 = 15");
});

test("escalation flag triggers at composite score > 85", async () => {
  resetContextStore();
  createContext("lead-escalate", "tenant-1", { source: "organic" });

  updateContext("lead-escalate", {
    scores: { intent: 80, fit: 70, engagement: 80, urgency: 80, composite: 84, temperature: "burning" },
  });

  const result = await rescoreLead("lead-escalate", { type: "booking-request" });
  assert.ok(result !== null);
  assert.equal(result.shouldEscalate, true);

  const ctx = getContextSync("lead-escalate");
  assert.ok(ctx !== null);
  assert.equal(ctx.escalated, true);
});

test("no escalation when composite stays below 85", async () => {
  resetContextStore();
  createContext("lead-no-esc", "tenant-1", { source: "organic" });

  updateContext("lead-no-esc", {
    scores: { intent: 20, fit: 20, engagement: 20, urgency: 20, composite: 20, temperature: "cold" },
  });

  const result = await rescoreLead("lead-no-esc", { type: "email-open" });
  assert.ok(result !== null);
  assert.equal(result.shouldEscalate, false);
});

test("route change detection works when crossing conversion threshold", async () => {
  resetContextStore();
  createContext("lead-route", "tenant-1", { source: "organic" });

  updateContext("lead-route", {
    scores: { intent: 50, fit: 50, engagement: 50, urgency: 50, composite: 58, temperature: "warm" },
  });

  const result = await rescoreLead("lead-route", { type: "form-submit" });
  assert.ok(result !== null);
  assert.equal(result.routeChanged, true);
  assert.equal(result.previousRoute, "nurture");
  assert.equal(result.newRoute, "conversion");
});

test("temperature updates after rescore", async () => {
  resetContextStore();
  createContext("lead-temp", "tenant-1", { source: "organic" });

  updateContext("lead-temp", {
    scores: { intent: 50, fit: 50, engagement: 50, urgency: 50, composite: 55, temperature: "warm" },
  });

  const result = await rescoreLead("lead-temp", { type: "booking-request" });
  assert.ok(result !== null);
  assert.ok(
    result.newScores.temperature === "hot" || result.newScores.temperature === "burning",
    `Expected hot or burning, got ${result.newScores.temperature}`,
  );
});

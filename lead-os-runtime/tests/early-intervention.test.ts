import test from "node:test";
import assert from "node:assert/strict";
import { identifyEarlyInterventionLeads } from "../src/lib/human-amplification.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeLead(overrides: Partial<{
  leadKey: string;
  compositeScore: number;
  predictedValue: number;
  interactionCount: number;
  daysSinceFirstContact: number;
  hasPhoneNumber: boolean;
}> = {}) {
  return {
    leadKey: overrides.leadKey ?? "lead-1",
    compositeScore: overrides.compositeScore ?? 50,
    predictedValue: overrides.predictedValue ?? 3000,
    interactionCount: overrides.interactionCount ?? 1,
    daysSinceFirstContact: overrides.daysSinceFirstContact ?? 3,
    hasPhoneNumber: overrides.hasPhoneNumber ?? false,
  };
}

// ---------------------------------------------------------------------------
// Intervention reason: high value + score above threshold (Rule 1)
// ---------------------------------------------------------------------------

test("flags lead with high value AND score above threshold", () => {
  const results = identifyEarlyInterventionLeads([
    makeLead({ leadKey: "high-val", predictedValue: 8000, compositeScore: 70 }),
  ]);

  assert.equal(results.length, 1);
  assert.equal(results[0].leadKey, "high-val");
  assert.equal(results[0].priority, "high");
  assert.ok(results[0].reason.includes("assign human early"));
});

// ---------------------------------------------------------------------------
// Intervention reason: too valuable to automate (Rule 2)
// ---------------------------------------------------------------------------

test("flags lead with value over 2x threshold as urgent regardless of score", () => {
  const results = identifyEarlyInterventionLeads([
    makeLead({ leadKey: "whale", predictedValue: 15000, compositeScore: 20 }),
  ]);

  assert.equal(results.length, 1);
  assert.equal(results[0].priority, "urgent");
  assert.ok(results[0].reason.includes("too valuable to automate"));
});

test("rule 2 uses custom valueThreshold", () => {
  const results = identifyEarlyInterventionLeads(
    [makeLead({ leadKey: "custom", predictedValue: 6000, compositeScore: 10 })],
    { valueThreshold: 2000 },
  );

  assert.equal(results.length, 1);
  assert.equal(results[0].priority, "urgent");
});

// ---------------------------------------------------------------------------
// Intervention reason: stalling in funnel (Rule 3)
// ---------------------------------------------------------------------------

test("flags lead stalling in funnel beyond maxDaysInFunnel with score > 40", () => {
  const results = identifyEarlyInterventionLeads([
    makeLead({ leadKey: "stalled", daysSinceFirstContact: 10, compositeScore: 45, predictedValue: 3000 }),
  ]);

  assert.equal(results.length, 1);
  assert.ok(results[0].reason.includes("stalling"));
  assert.equal(results[0].priority, "high");
});

test("does not flag stalling lead with score <= 40", () => {
  const results = identifyEarlyInterventionLeads([
    makeLead({ leadKey: "low-score", daysSinceFirstContact: 10, compositeScore: 30 }),
  ]);

  assert.equal(results.length, 0);
});

// ---------------------------------------------------------------------------
// Intervention reason: engaged with phone (Rule 4)
// ---------------------------------------------------------------------------

test("flags lead with phone, score > 50, and 3+ interactions", () => {
  const results = identifyEarlyInterventionLeads([
    makeLead({ leadKey: "phone-ready", hasPhoneNumber: true, compositeScore: 55, interactionCount: 3 }),
  ]);

  assert.equal(results.length, 1);
  assert.equal(results[0].priority, "medium");
  assert.ok(results[0].reason.includes("ready for call"));
});

test("does not flag phone lead with fewer than 3 interactions", () => {
  const results = identifyEarlyInterventionLeads([
    makeLead({ leadKey: "too-few", hasPhoneNumber: true, compositeScore: 55, interactionCount: 2 }),
  ]);

  assert.equal(results.length, 0);
});

// ---------------------------------------------------------------------------
// Priority assignment
// ---------------------------------------------------------------------------

test("assigns urgent priority to 2x-value leads", () => {
  const results = identifyEarlyInterventionLeads([
    makeLead({ leadKey: "urgent", predictedValue: 12000 }),
  ]);

  assert.equal(results[0].priority, "urgent");
});

test("assigns high priority to value+score leads", () => {
  const results = identifyEarlyInterventionLeads([
    makeLead({ leadKey: "high", predictedValue: 7000, compositeScore: 65 }),
  ]);

  assert.equal(results[0].priority, "high");
});

// ---------------------------------------------------------------------------
// Sorting order
// ---------------------------------------------------------------------------

test("sorts by priority first then by predictedValue descending", () => {
  const results = identifyEarlyInterventionLeads([
    makeLead({ leadKey: "medium-low", hasPhoneNumber: true, compositeScore: 55, interactionCount: 3, predictedValue: 2000 }),
    makeLead({ leadKey: "urgent-high", predictedValue: 20000, compositeScore: 10 }),
    makeLead({ leadKey: "high-mid", predictedValue: 8000, compositeScore: 70 }),
    makeLead({ leadKey: "medium-high", hasPhoneNumber: true, compositeScore: 55, interactionCount: 4, predictedValue: 4000 }),
  ]);

  assert.equal(results[0].leadKey, "urgent-high");
  assert.equal(results[1].leadKey, "high-mid");
  assert.equal(results[2].leadKey, "medium-high");
  assert.equal(results[3].leadKey, "medium-low");
});

// ---------------------------------------------------------------------------
// Default config values
// ---------------------------------------------------------------------------

test("uses default valueThreshold of 5000", () => {
  // Value 6000 > 5000 threshold, score 65 > 60 threshold => flagged
  const flagged = identifyEarlyInterventionLeads([
    makeLead({ leadKey: "above", predictedValue: 6000, compositeScore: 65 }),
  ]);
  assert.equal(flagged.length, 1);

  // Value 4000 < 5000 threshold, score 65 but not enough value => not flagged by rule 1
  const notFlagged = identifyEarlyInterventionLeads([
    makeLead({ leadKey: "below", predictedValue: 4000, compositeScore: 65 }),
  ]);
  assert.equal(notFlagged.length, 0);
});

test("uses default scoreThreshold of 60", () => {
  // Value above threshold but score 55 < 60 => not flagged by rule 1
  const notFlagged = identifyEarlyInterventionLeads([
    makeLead({ leadKey: "low-score", predictedValue: 7000, compositeScore: 55 }),
  ]);
  assert.equal(notFlagged.length, 0);
});

// ---------------------------------------------------------------------------
// Custom thresholds
// ---------------------------------------------------------------------------

test("respects custom scoreThreshold", () => {
  const results = identifyEarlyInterventionLeads(
    [makeLead({ leadKey: "custom-score", predictedValue: 7000, compositeScore: 45 })],
    { scoreThreshold: 40 },
  );

  assert.equal(results.length, 1);
  assert.equal(results[0].priority, "high");
});

test("respects custom maxDaysInFunnel", () => {
  const results = identifyEarlyInterventionLeads(
    [makeLead({ leadKey: "quick-stall", daysSinceFirstContact: 4, compositeScore: 45 })],
    { maxDaysInFunnel: 3 },
  );

  assert.equal(results.length, 1);
  assert.ok(results[0].reason.includes("stalling"));
});

// ---------------------------------------------------------------------------
// Empty leads array
// ---------------------------------------------------------------------------

test("returns empty array for empty leads input", () => {
  const results = identifyEarlyInterventionLeads([]);
  assert.equal(results.length, 0);
});

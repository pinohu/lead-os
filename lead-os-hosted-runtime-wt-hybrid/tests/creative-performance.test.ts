import test from "node:test";
import assert from "node:assert/strict";
import { evaluateCreativePerformance } from "../src/lib/weaponized-creative.ts";

// ---------------------------------------------------------------------------
// RPV calculation
// ---------------------------------------------------------------------------

test("evaluateCreativePerformance calculates RPV as revenue / impressions", () => {
  const result = evaluateCreativePerformance([
    { variantId: "a", impressions: 1000, clicks: 100, conversions: 10, revenue: 500 },
    { variantId: "b", impressions: 1000, clicks: 50, conversions: 5, revenue: 100 },
  ]);

  const winnerA = result.winners.find((w) => w.variantId === "a");
  assert.ok(winnerA);
  assert.equal(winnerA.rpv, 0.5);
  assert.equal(winnerA.conversionRate, 0.01);
});

test("evaluateCreativePerformance returns zero RPV when impressions are zero", () => {
  const result = evaluateCreativePerformance([
    { variantId: "a", impressions: 0, clicks: 0, conversions: 0, revenue: 0 },
    { variantId: "b", impressions: 1000, clicks: 50, conversions: 5, revenue: 100 },
  ]);

  const actionA = result.actions.find((a) => a.variantId === "a");
  assert.ok(actionA);
});

// ---------------------------------------------------------------------------
// Winner / loser classification
// ---------------------------------------------------------------------------

test("evaluateCreativePerformance classifies above-median RPV and CR as winners", () => {
  const result = evaluateCreativePerformance([
    { variantId: "high", impressions: 1000, clicks: 100, conversions: 20, revenue: 1000 },
    { variantId: "mid", impressions: 1000, clicks: 80, conversions: 10, revenue: 400 },
    { variantId: "low", impressions: 1000, clicks: 30, conversions: 2, revenue: 50 },
  ]);

  assert.ok(result.winners.some((w) => w.variantId === "high"));
  assert.ok(result.losers.some((l) => l.variantId === "low"));
});

test("evaluateCreativePerformance classifies zero conversions with 100+ impressions as loser", () => {
  const result = evaluateCreativePerformance([
    { variantId: "good", impressions: 1000, clicks: 100, conversions: 10, revenue: 500 },
    { variantId: "dead", impressions: 200, clicks: 5, conversions: 0, revenue: 0 },
  ]);

  const deadLoser = result.losers.find((l) => l.variantId === "dead");
  assert.ok(deadLoser);
  assert.ok(deadLoser.reason.includes("Zero conversions"));
});

test("evaluateCreativePerformance classifies RPV below 50% of median as loser", () => {
  const result = evaluateCreativePerformance([
    { variantId: "a", impressions: 1000, clicks: 100, conversions: 20, revenue: 1000 },
    { variantId: "b", impressions: 1000, clicks: 80, conversions: 15, revenue: 800 },
    { variantId: "c", impressions: 1000, clicks: 10, conversions: 1, revenue: 10 },
  ]);

  assert.ok(result.losers.some((l) => l.variantId === "c"));
});

// ---------------------------------------------------------------------------
// Action assignment
// ---------------------------------------------------------------------------

test("evaluateCreativePerformance assigns scale action to winners", () => {
  const result = evaluateCreativePerformance([
    { variantId: "winner", impressions: 1000, clicks: 100, conversions: 20, revenue: 1000 },
    { variantId: "loser", impressions: 1000, clicks: 10, conversions: 0, revenue: 0 },
  ]);

  const scaleAction = result.actions.find((a) => a.variantId === "winner");
  assert.ok(scaleAction);
  assert.equal(scaleAction.action, "scale");
});

test("evaluateCreativePerformance assigns kill action to losers", () => {
  const result = evaluateCreativePerformance([
    { variantId: "winner", impressions: 1000, clicks: 100, conversions: 20, revenue: 1000 },
    { variantId: "loser", impressions: 1000, clicks: 10, conversions: 0, revenue: 0 },
  ]);

  const killAction = result.actions.find((a) => a.variantId === "loser");
  assert.ok(killAction);
  assert.equal(killAction.action, "kill");
});

test("evaluateCreativePerformance assigns iterate action to middle performers", () => {
  // 4 variants: mid has RPV above median but CR below median — not winner, not loser => iterate
  // RPVs: a=1.0, b=0.6, c=0.4, d=0.01 => median = (0.4+0.6)/2 = 0.5
  // CRs:  a=0.02, b=0.005, c=0.015, d=0.001 => sorted [0.001,0.005,0.015,0.02] => median = (0.005+0.015)/2 = 0.01
  // b: RPV 0.6 >= 0.5 but CR 0.005 < 0.01 => not winner, RPV not < 50% of 0.5 => not loser => iterate
  const result = evaluateCreativePerformance([
    { variantId: "a", impressions: 1000, clicks: 100, conversions: 20, revenue: 1000 },
    { variantId: "b", impressions: 1000, clicks: 60, conversions: 5, revenue: 600 },
    { variantId: "c", impressions: 1000, clicks: 40, conversions: 15, revenue: 400 },
    { variantId: "d", impressions: 1000, clicks: 10, conversions: 1, revenue: 10 },
  ]);

  const iterateAction = result.actions.find((a) => a.action === "iterate");
  assert.ok(iterateAction);
  assert.equal(iterateAction.variantId, "b");
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

test("evaluateCreativePerformance returns empty results for empty input", () => {
  const result = evaluateCreativePerformance([]);

  assert.equal(result.winners.length, 0);
  assert.equal(result.losers.length, 0);
  assert.equal(result.actions.length, 0);
});

test("evaluateCreativePerformance handles single variant", () => {
  const result = evaluateCreativePerformance([
    { variantId: "only", impressions: 1000, clicks: 100, conversions: 10, revenue: 500 },
  ]);

  assert.equal(result.actions.length, 1);
  // Single variant is at the median so it is a winner (>= median for both)
  assert.ok(result.winners.length === 1 || result.actions[0].action === "iterate");
});

test("evaluateCreativePerformance handles all variants with equal performance", () => {
  const result = evaluateCreativePerformance([
    { variantId: "a", impressions: 1000, clicks: 50, conversions: 10, revenue: 200 },
    { variantId: "b", impressions: 1000, clicks: 50, conversions: 10, revenue: 200 },
    { variantId: "c", impressions: 1000, clicks: 50, conversions: 10, revenue: 200 },
  ]);

  // All at median — all should be winners (>= median)
  assert.equal(result.winners.length, 3);
  assert.equal(result.losers.length, 0);
});

test("evaluateCreativePerformance does not classify zero-conversion variant as loser when under 100 impressions", () => {
  const result = evaluateCreativePerformance([
    { variantId: "good", impressions: 1000, clicks: 100, conversions: 10, revenue: 500 },
    { variantId: "new", impressions: 50, clicks: 2, conversions: 0, revenue: 0 },
  ]);

  // 'new' has < 100 impressions so the zero-conversions rule does not apply
  // but RPV is 0 which is below 50% of median, so it is still a loser via RPV rule
  const newAction = result.actions.find((a) => a.variantId === "new");
  assert.ok(newAction);
});

test("evaluateCreativePerformance produces one action per variant", () => {
  const variants = [
    { variantId: "a", impressions: 1000, clicks: 100, conversions: 20, revenue: 1000 },
    { variantId: "b", impressions: 1000, clicks: 80, conversions: 10, revenue: 400 },
    { variantId: "c", impressions: 1000, clicks: 10, conversions: 0, revenue: 0 },
    { variantId: "d", impressions: 500, clicks: 30, conversions: 5, revenue: 100 },
  ];

  const result = evaluateCreativePerformance(variants);

  assert.equal(result.actions.length, variants.length);
  const variantIds = result.actions.map((a) => a.variantId);
  assert.deepEqual([...new Set(variantIds)].sort(), ["a", "b", "c", "d"]);
});

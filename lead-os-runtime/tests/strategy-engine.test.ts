import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateNichePortfolio,
  evaluateChannelStrategy,
  evaluateOfferStrategy,
  evaluateRevenueModelFit,
  createDecision,
  getStrategicDecisions,
  getDecisionById,
  approveDecision,
  executeDecision,
  generateStrategicPlan,
  _resetStores,
} from "../src/lib/strategy-engine.ts";

test.beforeEach(() => {
  _resetStores();
});

// ---------------------------------------------------------------------------
// Niche Portfolio Evaluation
// ---------------------------------------------------------------------------

test("evaluateNichePortfolio returns empty for empty input", () => {
  const result = evaluateNichePortfolio("t1", {}, {});
  assert.equal(result.length, 0);
});

test("evaluateNichePortfolio recommends expand for high-revenue low-competition niche", () => {
  const result = evaluateNichePortfolio(
    "t1",
    { landscaping: 5000 },
    { landscaping: 0.15 },
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].recommendation, "expand");
  assert.ok(result[0].rationale.includes("growth potential"));
});

test("evaluateNichePortfolio recommends contract for low-revenue high-competition niche", () => {
  const result = evaluateNichePortfolio(
    "t1",
    { lawyer: 2000 },
    { lawyer: 0.01 },
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].recommendation, "contract");
});

test("evaluateNichePortfolio recommends maintain for average performance", () => {
  const result = evaluateNichePortfolio(
    "t1",
    { plumber: 4500 },
    { plumber: 0.07 },
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].recommendation, "maintain");
});

test("evaluateNichePortfolio sorts by revenue descending", () => {
  const result = evaluateNichePortfolio(
    "t1",
    { plumber: 3000, lawyer: 10000, dentist: 500 },
    { plumber: 0.05, lawyer: 0.03, dentist: 0.08 },
  );
  assert.equal(result[0].niche, "lawyer");
  assert.equal(result[result.length - 1].niche, "dentist");
});

test("evaluateNichePortfolio uses default benchmark for unknown niche", () => {
  const result = evaluateNichePortfolio(
    "t1",
    { "pet-grooming": 6000 },
    { "pet-grooming": 0.1 },
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].recommendation, "expand");
});

// ---------------------------------------------------------------------------
// Channel Strategy Evaluation
// ---------------------------------------------------------------------------

test("evaluateChannelStrategy recommends scale for high-ROI non-declining channel", () => {
  const result = evaluateChannelStrategy("t1", [
    { channel: "google-ads", roi: 5, trend: "improving", volume: 100, cost: 500 },
  ]);
  assert.equal(result[0].recommendation, "scale");
});

test("evaluateChannelStrategy recommends kill for low-ROI channel", () => {
  const result = evaluateChannelStrategy("t1", [
    { channel: "print-ads", roi: 0.3, trend: "declining", volume: 10, cost: 5000 },
  ]);
  assert.equal(result[0].recommendation, "kill");
});

test("evaluateChannelStrategy recommends maintain for moderate ROI", () => {
  const result = evaluateChannelStrategy("t1", [
    { channel: "seo", roi: 2, trend: "stable", volume: 200, cost: 400 },
  ]);
  assert.equal(result[0].recommendation, "maintain");
});

test("evaluateChannelStrategy sorts by ROI descending", () => {
  const result = evaluateChannelStrategy("t1", [
    { channel: "a", roi: 1, trend: "stable", volume: 10, cost: 100 },
    { channel: "b", roi: 5, trend: "stable", volume: 10, cost: 100 },
    { channel: "c", roi: 3, trend: "stable", volume: 10, cost: 100 },
  ]);
  assert.equal(result[0].channel, "b");
  assert.equal(result[1].channel, "c");
  assert.equal(result[2].channel, "a");
});

test("evaluateChannelStrategy calculates saturation correctly", () => {
  const result = evaluateChannelStrategy("t1", [
    { channel: "expensive", roi: 4, trend: "stable", volume: 10, cost: 900 },
  ]);
  assert.ok(result[0].saturation > 0.5);
});

// ---------------------------------------------------------------------------
// Offer Strategy Evaluation
// ---------------------------------------------------------------------------

test("evaluateOfferStrategy recommends push for strong offers", () => {
  const result = evaluateOfferStrategy("t1", [
    { offer: "premium-package", revenue: 10000, views: 500, conversions: 25, cost: 3000 },
  ]);
  assert.equal(result[0].recommendation, "push");
  assert.ok(result[0].revenuePerView > 5);
});

test("evaluateOfferStrategy recommends retire for weak offers", () => {
  const result = evaluateOfferStrategy("t1", [
    { offer: "bad-offer", revenue: 100, views: 1000, conversions: 1, cost: 95 },
  ]);
  assert.equal(result[0].recommendation, "retire");
});

test("evaluateOfferStrategy calculates margin correctly", () => {
  const result = evaluateOfferStrategy("t1", [
    { offer: "test", revenue: 1000, views: 100, conversions: 10, cost: 400 },
  ]);
  assert.equal(result[0].margin, 0.6);
});

test("evaluateOfferStrategy handles zero views", () => {
  const result = evaluateOfferStrategy("t1", [
    { offer: "no-views", revenue: 0, views: 0, conversions: 0, cost: 0 },
  ]);
  assert.equal(result[0].revenuePerView, 0);
  assert.equal(result[0].conversionRate, 0);
});

// ---------------------------------------------------------------------------
// Revenue Model Fit
// ---------------------------------------------------------------------------

test("evaluateRevenueModelFit returns all models with scores", () => {
  const result = evaluateRevenueModelFit("t1", {
    leadVolume: 200,
    avgDealValue: 150,
    buyerCount: 20,
  });
  assert.ok(result.length >= 5);
  assert.ok(result.some((m) => m.recommended));
});

test("evaluateRevenueModelFit marks exactly one model as recommended", () => {
  const result = evaluateRevenueModelFit("t1", {
    leadVolume: 500,
    avgDealValue: 50,
    buyerCount: 30,
  });
  const recommended = result.filter((m) => m.recommended);
  assert.equal(recommended.length, 1);
});

test("evaluateRevenueModelFit best model has highest fitScore", () => {
  const result = evaluateRevenueModelFit("t1", {
    leadVolume: 100,
    avgDealValue: 200,
    buyerCount: 10,
  });
  assert.equal(result[0].recommended, true);
  for (let i = 1; i < result.length; i++) {
    assert.ok(result[0].fitScore >= result[i].fitScore);
  }
});

// ---------------------------------------------------------------------------
// Decision Management
// ---------------------------------------------------------------------------

test("createDecision stores and returns a decision", async () => {
  const decision = await createDecision("t1", "niche-expand", "Expand plumber", "High ROI", { revenue: 5000, timeframe: "90 days" }, 0.8, "high");
  assert.ok(decision.id.startsWith("sd_"));
  assert.equal(decision.tenantId, "t1");
  assert.equal(decision.status, "proposed");
  assert.equal(decision.type, "niche-expand");
});

test("getStrategicDecisions filters by tenant", async () => {
  await createDecision("t1", "niche-expand", "R1", "Rationale", { revenue: 100, timeframe: "30d" }, 0.5, "medium");
  await createDecision("t2", "channel-scale", "R2", "Rationale", { revenue: 200, timeframe: "60d" }, 0.6, "high");

  const t1Decisions = getStrategicDecisions("t1");
  assert.equal(t1Decisions.length, 1);
  assert.equal(t1Decisions[0].tenantId, "t1");
});

test("getStrategicDecisions filters by status", async () => {
  const d = await createDecision("t1", "niche-expand", "R1", "Rationale", { revenue: 100, timeframe: "30d" }, 0.5, "medium");
  await approveDecision(d.id);

  const proposed = getStrategicDecisions("t1", "proposed");
  assert.equal(proposed.length, 0);

  const approved = getStrategicDecisions("t1", "approved");
  assert.equal(approved.length, 1);
});

test("getStrategicDecisions sorts by priority", async () => {
  await createDecision("t1", "niche-expand", "Low", "Rationale", { revenue: 100, timeframe: "30d" }, 0.5, "low");
  await createDecision("t1", "channel-scale", "Critical", "Rationale", { revenue: 100, timeframe: "30d" }, 0.5, "critical");
  await createDecision("t1", "offer-push", "High", "Rationale", { revenue: 100, timeframe: "30d" }, 0.5, "high");

  const decisions = getStrategicDecisions("t1");
  assert.equal(decisions[0].priority, "critical");
  assert.equal(decisions[1].priority, "high");
  assert.equal(decisions[2].priority, "low");
});

test("getDecisionById returns correct decision", async () => {
  const d = await createDecision("t1", "niche-expand", "R1", "Rationale", { revenue: 100, timeframe: "30d" }, 0.5, "medium");
  const found = getDecisionById(d.id);
  assert.ok(found);
  assert.equal(found.id, d.id);
});

test("getDecisionById returns undefined for unknown id", () => {
  const found = getDecisionById("nonexistent");
  assert.equal(found, undefined);
});

test("approveDecision transitions proposed to approved", async () => {
  const d = await createDecision("t1", "niche-expand", "R1", "Rationale", { revenue: 100, timeframe: "30d" }, 0.5, "medium");
  const approved = await approveDecision(d.id);
  assert.ok(approved);
  assert.equal(approved.status, "approved");
});

test("approveDecision returns null for non-proposed decision", async () => {
  const d = await createDecision("t1", "niche-expand", "R1", "Rationale", { revenue: 100, timeframe: "30d" }, 0.5, "medium");
  await approveDecision(d.id);
  const secondApprove = await approveDecision(d.id);
  assert.equal(secondApprove, null);
});

test("approveDecision returns null for unknown id", async () => {
  const result = await approveDecision("unknown-id");
  assert.equal(result, null);
});

test("executeDecision transitions approved to executing", async () => {
  const d = await createDecision("t1", "niche-expand", "R1", "Rationale", { revenue: 100, timeframe: "30d" }, 0.5, "medium");
  await approveDecision(d.id);
  const executed = await executeDecision(d.id);
  assert.ok(executed);
  assert.equal(executed.status, "executing");
});

test("executeDecision returns null for non-approved decision", async () => {
  const d = await createDecision("t1", "niche-expand", "R1", "Rationale", { revenue: 100, timeframe: "30d" }, 0.5, "medium");
  const result = await executeDecision(d.id);
  assert.equal(result, null);
});

test("createDecision clamps confidence to 0-1", async () => {
  const d = await createDecision("t1", "niche-expand", "R1", "Rationale", { revenue: 100, timeframe: "30d" }, 1.5, "medium");
  assert.equal(d.confidence, 1);
});

// ---------------------------------------------------------------------------
// Strategic Plan Generation
// ---------------------------------------------------------------------------

test("generateStrategicPlan creates decisions from evaluations", async () => {
  const plan = await generateStrategicPlan(
    "t1",
    { landscaping: 5000, lawyer: 2000 },
    { landscaping: 0.15, lawyer: 0.01 },
    [
      { channel: "google-ads", roi: 5, trend: "improving", volume: 100, cost: 500 },
      { channel: "print", roi: 0.3, trend: "declining", volume: 10, cost: 5000 },
    ],
    [
      { offer: "premium", revenue: 10000, views: 500, conversions: 25, cost: 3000 },
      { offer: "basic", revenue: 100, views: 1000, conversions: 1, cost: 95 },
    ],
    { leadVolume: 200, avgDealValue: 150, buyerCount: 20 },
  );

  assert.ok(plan.decisions.length > 0);
  assert.ok(plan.generatedAt);
  assert.ok(plan.summary.length > 0);
  assert.equal(plan.tenantId, "t1");
});

test("generateStrategicPlan includes niche-expand decisions for qualifying niches", async () => {
  const plan = await generateStrategicPlan(
    "t1",
    { landscaping: 5000 },
    { landscaping: 0.15 },
    [],
    [],
    { leadVolume: 200, avgDealValue: 100, buyerCount: 10 },
  );
  const expandDecisions = plan.decisions.filter((d) => d.type === "niche-expand");
  assert.ok(expandDecisions.length > 0);
});

test("generateStrategicPlan returns summary with action counts", async () => {
  const plan = await generateStrategicPlan(
    "t1",
    { landscaping: 5000 },
    { landscaping: 0.15 },
    [{ channel: "google-ads", roi: 5, trend: "improving", volume: 100, cost: 500 }],
    [],
    { leadVolume: 200, avgDealValue: 100, buyerCount: 10 },
  );
  assert.ok(plan.summary.includes("Expand") || plan.summary.includes("Scale") || plan.summary.includes("Consider"));
});

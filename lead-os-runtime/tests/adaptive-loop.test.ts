import test from "node:test";
import assert from "node:assert/strict";
import {
  observe,
  evaluate,
  adjust,
  deploy,
  runAdaptiveCycle,
  getLoopState,
  getLoopHistory,
  isLoopHealthy,
  onConversion,
  onDropOff,
  resetAdaptiveLoopStore,
  type Observation,
  type Evaluation,
} from "../src/lib/adaptive-loop.ts";

function makeObservation(overrides: Partial<Observation> = {}): Observation {
  return {
    conversionRate: 5,
    avgScore: 45,
    avgTimeToConvert: 12,
    topChannel: "google-ads",
    topFunnel: "qualification",
    dropOffStage: "offer",
    leadVolume: 200,
    revenueThisPeriod: 5000,
    period: "last-24h",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// observe -- returns all required fields without DB
// ---------------------------------------------------------------------------

test("observe returns all required fields without DB", async () => {
  resetAdaptiveLoopStore();
  const result = await observe("test-tenant");

  assert.equal(typeof result.conversionRate, "number");
  assert.equal(typeof result.avgScore, "number");
  assert.equal(typeof result.avgTimeToConvert, "number");
  assert.equal(typeof result.topChannel, "string");
  assert.equal(typeof result.topFunnel, "string");
  assert.equal(typeof result.dropOffStage, "string");
  assert.equal(typeof result.leadVolume, "number");
  assert.equal(typeof result.revenueThisPeriod, "number");
  assert.equal(typeof result.period, "string");
});

// ---------------------------------------------------------------------------
// evaluate -- detects improving trend
// ---------------------------------------------------------------------------

test("evaluate detects improving trend when conversion increases", () => {
  resetAdaptiveLoopStore();
  const previous = makeObservation({ conversionRate: 3 });
  const current = makeObservation({ conversionRate: 5 });
  const result = evaluate(current, previous);

  assert.equal(result.performanceTrend, "improving");
});

// ---------------------------------------------------------------------------
// evaluate -- detects declining trend
// ---------------------------------------------------------------------------

test("evaluate detects declining trend when conversion drops", () => {
  resetAdaptiveLoopStore();
  const previous = makeObservation({ conversionRate: 6 });
  const current = makeObservation({ conversionRate: 3 });
  const result = evaluate(current, previous);

  assert.equal(result.performanceTrend, "declining");
});

// ---------------------------------------------------------------------------
// evaluate -- detects stable trend
// ---------------------------------------------------------------------------

test("evaluate detects stable trend when conversion unchanged", () => {
  resetAdaptiveLoopStore();
  const previous = makeObservation({ conversionRate: 5 });
  const current = makeObservation({ conversionRate: 5.2 });
  const result = evaluate(current, previous);

  assert.equal(result.performanceTrend, "stable");
});

// ---------------------------------------------------------------------------
// evaluate -- calculates conversionVsTarget ratio
// ---------------------------------------------------------------------------

test("evaluate calculates conversionVsTarget ratio", () => {
  resetAdaptiveLoopStore();
  const obs = makeObservation({ conversionRate: 5 });
  const result = evaluate(obs);

  assert.equal(result.conversionVsTarget, 1.0);
});

// ---------------------------------------------------------------------------
// evaluate -- identifies bottleneck from dropOffStage
// ---------------------------------------------------------------------------

test("evaluate identifies bottleneck from dropOffStage", () => {
  resetAdaptiveLoopStore();
  const obs = makeObservation({ dropOffStage: "trust" });
  const result = evaluate(obs);

  assert.equal(result.bottleneck, "trust");
});

// ---------------------------------------------------------------------------
// evaluate -- sets urgency to critical when far below target
// ---------------------------------------------------------------------------

test("evaluate sets urgency to critical when far below target", () => {
  resetAdaptiveLoopStore();
  const obs = makeObservation({ conversionRate: 1 });
  const result = evaluate(obs);

  assert.equal(result.urgency, "critical");
});

// ---------------------------------------------------------------------------
// evaluate -- sets urgency to low when at target
// ---------------------------------------------------------------------------

test("evaluate sets urgency to low when at or above target", () => {
  resetAdaptiveLoopStore();
  const obs = makeObservation({ conversionRate: 6 });
  const result = evaluate(obs);

  assert.equal(result.urgency, "low");
});

// ---------------------------------------------------------------------------
// evaluate -- finds opportunity for scoring recalibration
// ---------------------------------------------------------------------------

test("evaluate identifies scoring recalibration opportunity when conversion low", () => {
  resetAdaptiveLoopStore();
  const obs = makeObservation({ conversionRate: 2, dropOffStage: "qualification" });
  const result = evaluate(obs);

  assert.ok(result.opportunity.includes("scoring"));
});

// ---------------------------------------------------------------------------
// adjust -- proposes scoring recalibration when conversion below target
// ---------------------------------------------------------------------------

test("adjust proposes scoring recalibration when conversion below target", () => {
  resetAdaptiveLoopStore();
  const evaluation: Evaluation = {
    performanceTrend: "declining",
    conversionVsTarget: 0.5,
    bottleneck: "qualification",
    opportunity: "scoring recalibration",
    urgency: "critical",
  };
  const adjustments = adjust(evaluation, "test-tenant");

  assert.ok(adjustments.some((a) => a.type === "scoring-recalibration"));
});

// ---------------------------------------------------------------------------
// adjust -- proposes offer rotation when bottleneck is offer
// ---------------------------------------------------------------------------

test("adjust proposes offer rotation when bottleneck is offer", () => {
  resetAdaptiveLoopStore();
  const evaluation: Evaluation = {
    performanceTrend: "stable",
    conversionVsTarget: 0.9,
    bottleneck: "offer",
    opportunity: "rotate offer variants",
    urgency: "medium",
  };
  const adjustments = adjust(evaluation, "test-tenant");

  assert.ok(adjustments.some((a) => a.type === "offer-rotation"));
});

// ---------------------------------------------------------------------------
// adjust -- proposes social proof when bottleneck is trust
// ---------------------------------------------------------------------------

test("adjust proposes social proof injection when bottleneck is trust", () => {
  resetAdaptiveLoopStore();
  const evaluation: Evaluation = {
    performanceTrend: "stable",
    conversionVsTarget: 0.9,
    bottleneck: "trust",
    opportunity: "add social proof",
    urgency: "medium",
  };
  const adjustments = adjust(evaluation, "test-tenant");

  assert.ok(adjustments.some((a) => a.type === "social-proof-injection"));
});

// ---------------------------------------------------------------------------
// adjust -- proposes response time reduction when bottleneck is follow-up
// ---------------------------------------------------------------------------

test("adjust proposes response time reduction when bottleneck is follow-up", () => {
  resetAdaptiveLoopStore();
  const evaluation: Evaluation = {
    performanceTrend: "stable",
    conversionVsTarget: 0.9,
    bottleneck: "follow-up",
    opportunity: "reduce response time",
    urgency: "medium",
  };
  const adjustments = adjust(evaluation, "test-tenant");

  assert.ok(adjustments.some((a) => a.type === "response-time-reduction"));
});

// ---------------------------------------------------------------------------
// adjust -- proposes channel scale-up when overperforming
// ---------------------------------------------------------------------------

test("adjust proposes channel scale-up when overperforming", () => {
  resetAdaptiveLoopStore();
  const evaluation: Evaluation = {
    performanceTrend: "improving",
    conversionVsTarget: 1.5,
    bottleneck: "none",
    opportunity: "double down",
    urgency: "low",
  };
  const adjustments = adjust(evaluation, "test-tenant");

  assert.ok(adjustments.some((a) => a.type === "channel-scale-up"));
});

// ---------------------------------------------------------------------------
// deploy -- applies approved adjustments
// ---------------------------------------------------------------------------

test("deploy returns correct applied/skipped counts", async () => {
  resetAdaptiveLoopStore();
  const adjustments = [
    { type: "scoring-recalibration", target: "scoring-config", from: "a", to: "b", expectedImpact: "x", autoApplied: true },
    { type: "channel-reallocation", target: "distribution", from: "a", to: "b", expectedImpact: "y", autoApplied: false },
  ];
  const result = await deploy(adjustments, "test-tenant");

  assert.equal(result.adjustmentsApplied, 1);
  assert.equal(result.adjustmentsSkipped, 1);
  assert.equal(typeof result.timestamp, "string");
});

// ---------------------------------------------------------------------------
// runAdaptiveCycle -- full cycle produces valid LoopState
// ---------------------------------------------------------------------------

test("runAdaptiveCycle produces valid LoopState", async () => {
  resetAdaptiveLoopStore();
  const state = await runAdaptiveCycle("cycle-tenant");

  assert.equal(state.tenantId, "cycle-tenant");
  assert.equal(state.cycleCount, 1);
  assert.ok(state.lastObservation !== undefined);
  assert.ok(state.lastEvaluation !== undefined);
  assert.ok(Array.isArray(state.lastAdjustment));
  assert.ok(state.lastDeployment !== undefined);
  assert.ok(["healthy", "degraded", "stale"].includes(state.health));
  assert.equal(typeof state.updatedAt, "string");
});

// ---------------------------------------------------------------------------
// runAdaptiveCycle -- increments cycle count
// ---------------------------------------------------------------------------

test("runAdaptiveCycle increments cycle count on subsequent runs", async () => {
  resetAdaptiveLoopStore();
  await runAdaptiveCycle("counter-tenant");
  const state2 = await runAdaptiveCycle("counter-tenant");

  assert.equal(state2.cycleCount, 2);
});

// ---------------------------------------------------------------------------
// getLoopState -- returns state after cycle
// ---------------------------------------------------------------------------

test("getLoopState returns state after cycle", async () => {
  resetAdaptiveLoopStore();
  await runAdaptiveCycle("state-tenant");
  const state = getLoopState("state-tenant");

  assert.ok(state !== undefined);
  assert.equal(state?.tenantId, "state-tenant");
});

// ---------------------------------------------------------------------------
// getLoopState -- returns undefined for unknown tenant
// ---------------------------------------------------------------------------

test("getLoopState returns undefined for unknown tenant", () => {
  resetAdaptiveLoopStore();
  const state = getLoopState("nonexistent");

  assert.equal(state, undefined);
});

// ---------------------------------------------------------------------------
// getLoopHistory -- returns limited history
// ---------------------------------------------------------------------------

test("getLoopHistory returns limited history", async () => {
  resetAdaptiveLoopStore();
  await runAdaptiveCycle("hist-tenant");
  await runAdaptiveCycle("hist-tenant");
  await runAdaptiveCycle("hist-tenant");
  const history = getLoopHistory("hist-tenant", 2);

  assert.equal(history.length, 2);
});

// ---------------------------------------------------------------------------
// isLoopHealthy -- returns true for fresh state
// ---------------------------------------------------------------------------

test("isLoopHealthy returns true for recently updated state", async () => {
  resetAdaptiveLoopStore();
  await runAdaptiveCycle("healthy-tenant");
  const healthy = isLoopHealthy("healthy-tenant");

  assert.equal(healthy, true);
});

// ---------------------------------------------------------------------------
// isLoopHealthy -- returns false for unknown tenant
// ---------------------------------------------------------------------------

test("isLoopHealthy returns false for unknown tenant", () => {
  resetAdaptiveLoopStore();
  const healthy = isLoopHealthy("ghost-tenant");

  assert.equal(healthy, false);
});

// ---------------------------------------------------------------------------
// onConversion -- triggers mini-cycle after threshold
// ---------------------------------------------------------------------------

test("onConversion triggers mini-cycle after threshold conversions", async () => {
  resetAdaptiveLoopStore();
  const lead = { leadKey: "lead-1", score: 75 };

  for (let i = 0; i < 10; i++) {
    await onConversion("conv-tenant", lead);
  }

  const state = getLoopState("conv-tenant");
  assert.ok(state !== undefined, "mini-cycle should have run");
  assert.equal(state?.cycleCount, 1);
});

// ---------------------------------------------------------------------------
// onDropOff -- triggers mini-cycle after threshold drop-offs
// ---------------------------------------------------------------------------

test("onDropOff triggers mini-cycle after threshold drop-offs", async () => {
  resetAdaptiveLoopStore();
  const lead = { leadKey: "lead-2", score: 30 };

  for (let i = 0; i < 10; i++) {
    await onDropOff("drop-tenant", lead, "offer");
  }

  const state = getLoopState("drop-tenant");
  assert.ok(state !== undefined, "mini-cycle should have run");
  assert.equal(state?.cycleCount, 1);
});

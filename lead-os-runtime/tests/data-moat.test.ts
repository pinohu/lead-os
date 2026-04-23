import test from "node:test";
import assert from "node:assert/strict";
import {
  recordBehaviorPattern,
  queryPatterns,
  detectEmergingPattern,
  recordConversionPath,
  getTopConversionPaths,
  getConversionBenchmarks,
  predictConversionProbability,
  getNicheInsights,
  compareNichePerformance,
  identifyBluOceanNiche,
  runDataCompaction,
  calculateDataMoatScore,
  exportAnonymizedBenchmarks,
  _resetStores,
} from "../src/lib/data-moat.ts";

test.beforeEach(() => {
  _resetStores();
});

// ---------------------------------------------------------------------------
// Pattern Recording & Querying
// ---------------------------------------------------------------------------

test("recordBehaviorPattern stores and returns a pattern with generated id", async () => {
  const result = await recordBehaviorPattern("t1", "construction", {
    behaviorType: "repeat-visit",
    funnelStage: "consideration",
    pattern: "Users who view pricing 3x convert 4x faster",
    sampleSize: 100,
    confidence: 0.92,
    liftMultiplier: 4.0,
  });

  assert.ok(result.id.startsWith("pat_"));
  assert.equal(result.tenantId, "t1");
  assert.equal(result.niche, "construction");
  assert.equal(result.behaviorType, "repeat-visit");
  assert.equal(result.sampleSize, 100);
  assert.ok(result.discoveredAt.length > 0);
});

test("queryPatterns returns patterns filtered by niche", async () => {
  await recordBehaviorPattern("t1", "construction", {
    behaviorType: "visit", funnelStage: "awareness", pattern: "p1", sampleSize: 50, confidence: 0.9, liftMultiplier: 2,
  });
  await recordBehaviorPattern("t1", "legal", {
    behaviorType: "visit", funnelStage: "awareness", pattern: "p2", sampleSize: 50, confidence: 0.8, liftMultiplier: 1.5,
  });

  const construction = queryPatterns("construction");
  const legal = queryPatterns("legal");

  assert.equal(construction.length, 1);
  assert.equal(legal.length, 1);
  assert.equal(construction[0].niche, "construction");
});

test("queryPatterns filters by behaviorType and funnelStage", async () => {
  await recordBehaviorPattern("t1", "dental", {
    behaviorType: "form-abandon", funnelStage: "decision", pattern: "p1", sampleSize: 40, confidence: 0.85, liftMultiplier: 1.8,
  });
  await recordBehaviorPattern("t1", "dental", {
    behaviorType: "repeat-visit", funnelStage: "awareness", pattern: "p2", sampleSize: 60, confidence: 0.95, liftMultiplier: 3.0,
  });

  const formAbandons = queryPatterns("dental", { behaviorType: "form-abandon" });
  assert.equal(formAbandons.length, 1);

  const awareness = queryPatterns("dental", { funnelStage: "awareness" });
  assert.equal(awareness.length, 1);
});

test("queryPatterns filters by minConfidence", async () => {
  await recordBehaviorPattern("t1", "hvac", {
    behaviorType: "v", funnelStage: "a", pattern: "low", sampleSize: 30, confidence: 0.5, liftMultiplier: 1,
  });
  await recordBehaviorPattern("t1", "hvac", {
    behaviorType: "v", funnelStage: "a", pattern: "high", sampleSize: 100, confidence: 0.95, liftMultiplier: 3,
  });

  const highConf = queryPatterns("hvac", { minConfidence: 0.9 });
  assert.equal(highConf.length, 1);
  assert.equal(highConf[0].pattern, "high");
});

test("queryPatterns sorts by confidence descending", async () => {
  await recordBehaviorPattern("t1", "roofing", {
    behaviorType: "v", funnelStage: "a", pattern: "mid", sampleSize: 40, confidence: 0.7, liftMultiplier: 1,
  });
  await recordBehaviorPattern("t1", "roofing", {
    behaviorType: "v", funnelStage: "a", pattern: "top", sampleSize: 80, confidence: 0.99, liftMultiplier: 2,
  });

  const results = queryPatterns("roofing");
  assert.equal(results[0].pattern, "top");
});

// ---------------------------------------------------------------------------
// Emerging Pattern Detection
// ---------------------------------------------------------------------------

test("detectEmergingPattern returns empty for fewer than 30 events", () => {
  const events = Array.from({ length: 29 }, (_, i) => ({
    action: "view-pricing",
    converted: i < 10,
    funnelStage: "consideration",
  }));

  const result = detectEmergingPattern("t1", events);
  assert.equal(result.length, 0);
});

test("detectEmergingPattern finds statistically significant patterns", () => {
  const events: { action: string; converted: boolean; funnelStage: string }[] = [];

  for (let i = 0; i < 50; i++) {
    events.push({ action: "view-pricing", converted: i < 40, funnelStage: "decision" });
  }
  for (let i = 0; i < 50; i++) {
    events.push({ action: "browse", converted: i < 5, funnelStage: "awareness" });
  }

  const detected = detectEmergingPattern("t1", events, 0.95);
  assert.ok(detected.length >= 1, "Should detect at least one emerging pattern");
  assert.ok(detected[0].liftMultiplier > 1, "Lift should be greater than 1 for the high-converting action");
});

test("detectEmergingPattern skips actions with fewer than 5 samples", () => {
  const events: { action: string; converted: boolean; funnelStage: string }[] = [];
  for (let i = 0; i < 40; i++) {
    events.push({ action: "main-action", converted: i < 10, funnelStage: "a" });
  }
  events.push({ action: "rare-action", converted: true, funnelStage: "a" });
  events.push({ action: "rare-action", converted: true, funnelStage: "a" });

  const detected = detectEmergingPattern("t1", events, 0.5);
  const rarePattern = detected.find((p) => p.pattern.includes("rare-action"));
  assert.equal(rarePattern, undefined, "Should not detect patterns from tiny sample sizes");
});

// ---------------------------------------------------------------------------
// Conversion Paths
// ---------------------------------------------------------------------------

test("recordConversionPath stores path and calculates duration", async () => {
  const now = Date.now();
  const touchpoints = [
    { channel: "organic", action: "visit", funnelStage: "awareness", timestampIso: new Date(now).toISOString() },
    { channel: "email", action: "click", funnelStage: "consideration", timestampIso: new Date(now + 3600000).toISOString() },
    { channel: "direct", action: "book", funnelStage: "decision", timestampIso: new Date(now + 7200000).toISOString() },
  ];

  const path = await recordConversionPath("t1", "lead-1", "dental", touchpoints);
  assert.ok(path.id.startsWith("cp_"));
  assert.equal(path.touchpoints.length, 3);
  assert.ok(path.totalDurationHours > 0);
  assert.ok(path.totalDurationHours <= 3);
});

test("getTopConversionPaths returns most common sequences", async () => {
  const tp = [
    { channel: "organic", action: "visit", funnelStage: "awareness", timestampIso: new Date().toISOString() },
    { channel: "email", action: "click", funnelStage: "decision", timestampIso: new Date().toISOString() },
  ];

  await recordConversionPath("t1", "l1", "construction", tp);
  await recordConversionPath("t1", "l2", "construction", tp);
  await recordConversionPath("t1", "l3", "construction", [tp[0]]);

  const top = getTopConversionPaths("construction", 5);
  assert.ok(top.length >= 1);
  assert.equal(top[0].count, 2);
});

test("getConversionBenchmarks returns zero-state for unknown niche", () => {
  const bench = getConversionBenchmarks("nonexistent");
  assert.equal(bench.sampleSize, 0);
  assert.equal(bench.avgTimeToConvertHours, 0);
});

test("getConversionBenchmarks calculates averages for populated niche", async () => {
  const now = Date.now();
  await recordConversionPath("t1", "l1", "legal", [
    { channel: "referral", action: "consult", funnelStage: "awareness", timestampIso: new Date(now).toISOString() },
    { channel: "phone", action: "call", funnelStage: "decision", timestampIso: new Date(now + 48 * 3600000).toISOString() },
  ]);

  const bench = getConversionBenchmarks("legal");
  assert.equal(bench.sampleSize, 1);
  assert.ok(bench.avgTouchpoints === 2);
  assert.ok(bench.topChannels.length > 0);
});

// ---------------------------------------------------------------------------
// Conversion Probability
// ---------------------------------------------------------------------------

test("predictConversionProbability returns base 0.1 with no patterns", () => {
  const prob = predictConversionProbability(
    { actions: ["visit"], source: "organic", funnelStage: "awareness" },
    [],
  );
  assert.equal(prob, 0.1);
});

test("predictConversionProbability increases with matching patterns", async () => {
  await recordBehaviorPattern("t1", "dental", {
    behaviorType: "visit", funnelStage: "decision", pattern: "Users who book consult convert fast",
    sampleSize: 100, confidence: 0.95, liftMultiplier: 3.0,
  });

  const patterns = queryPatterns("dental");
  const prob = predictConversionProbability(
    { actions: ["book", "consult"], source: "organic", funnelStage: "decision" },
    patterns,
  );
  assert.ok(prob > 0.1, `Expected probability > 0.1, got ${prob}`);
  assert.ok(prob <= 1, `Expected probability <= 1, got ${prob}`);
});

// ---------------------------------------------------------------------------
// Niche Intelligence
// ---------------------------------------------------------------------------

test("getNicheInsights returns insights with defaults for unknown niche", () => {
  const insights = getNicheInsights("underwater-basket-weaving");
  assert.equal(insights.niche, "underwater-basket-weaving");
  assert.ok(insights.bestOffers.length > 0);
  assert.ok(insights.topObjections.length > 0);
  assert.equal(insights.optimalFollowUpHours, 24);
});

test("getNicheInsights returns niche-specific data for known niches", () => {
  const insights = getNicheInsights("construction");
  assert.ok(insights.bestOffers.some((o) => o.toLowerCase().includes("estimate")));
  assert.ok(insights.topObjections.some((o) => o.toLowerCase().includes("expensive")));
});

test("compareNichePerformance returns comparison for multiple niches", () => {
  const comparison = compareNichePerformance(["construction", "dental", "legal"]);
  assert.equal(comparison.length, 3);
  assert.ok(comparison.every((c) => typeof c.avgTouchpoints === "number"));
});

test("identifyBluOceanNiche ranks niches by opportunity score", () => {
  const data = [
    { niche: "crowded", conversionRate: 0.05, tenantCount: 100, avgLeadValue: 1000 },
    { niche: "goldmine", conversionRate: 0.15, tenantCount: 3, avgLeadValue: 10000 },
    { niche: "mediocre", conversionRate: 0.08, tenantCount: 50, avgLeadValue: 3000 },
  ];

  const result = identifyBluOceanNiche(data);
  assert.equal(result[0].niche, "goldmine");
  assert.ok(result[0].opportunityScore > result[2].opportunityScore);
  assert.ok(result[0].competitionScore < result[result.length - 1].competitionScore);
});

test("identifyBluOceanNiche returns empty for empty input", () => {
  assert.deepEqual(identifyBluOceanNiche([]), []);
});

// ---------------------------------------------------------------------------
// Data Compounding
// ---------------------------------------------------------------------------

test("runDataCompaction merges duplicate patterns within same group", async () => {
  await recordBehaviorPattern("t1", "dental", {
    behaviorType: "visit", funnelStage: "awareness", pattern: "p1", sampleSize: 30, confidence: 0.8, liftMultiplier: 2,
  });
  await recordBehaviorPattern("t1", "dental", {
    behaviorType: "visit", funnelStage: "awareness", pattern: "p2", sampleSize: 50, confidence: 0.9, liftMultiplier: 3,
  });

  const before = queryPatterns("dental");
  assert.equal(before.length, 2);

  const result = await runDataCompaction("t1");
  assert.equal(result.compacted, 1);

  const after = queryPatterns("dental");
  assert.equal(after.length, 1);
  assert.equal(after[0].sampleSize, 80);
});

test("calculateDataMoatScore returns 0 for tenant with no data", () => {
  const score = calculateDataMoatScore("empty-tenant");
  assert.equal(score.score, 0);
  assert.equal(score.patternCount, 0);
  assert.equal(score.conversionPathCount, 0);
});

test("calculateDataMoatScore increases with more data", async () => {
  await recordBehaviorPattern("t1", "dental", {
    behaviorType: "v", funnelStage: "a", pattern: "p", sampleSize: 50, confidence: 0.9, liftMultiplier: 2,
  });
  await recordConversionPath("t1", "l1", "dental", [
    { channel: "organic", action: "visit", funnelStage: "awareness", timestampIso: new Date().toISOString() },
  ]);

  const score = calculateDataMoatScore("t1");
  assert.ok(score.score > 0);
  assert.equal(score.patternCount, 1);
  assert.equal(score.conversionPathCount, 1);
  assert.equal(score.nichesCovered, 1);
});

test("exportAnonymizedBenchmarks returns benchmarks with anonymized flag", () => {
  const result = exportAnonymizedBenchmarks("construction");
  assert.equal(result.anonymized, true);
  assert.equal(result.niche, "construction");
});

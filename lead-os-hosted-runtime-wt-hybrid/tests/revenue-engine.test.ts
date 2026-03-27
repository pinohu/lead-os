import test from "node:test";
import assert from "node:assert/strict";
import {
  estimatePriceElasticity,
  findOptimalPrice,
  generateUpsellSequence,
  getUpsellTiming,
  calculateLTV,
  segmentByLTV,
  recommendRetentionAction,
  identifyCrossSellOpportunities,
  generateCrossSellOffer,
  definePrimaryRevenuePath,
  getRevenuePathMetrics,
  identifyRevenueLeaks,
  type HistoricalPricePoint,
  type RevenuePathMetrics,
} from "../src/lib/revenue-engine.ts";

// ---------------------------------------------------------------------------
// estimatePriceElasticity -- returns valid structure without historical data
// ---------------------------------------------------------------------------

test("estimatePriceElasticity returns valid structure without historical data", () => {
  const result = estimatePriceElasticity("plumber", 100, 5, []);

  assert.equal(result.niche, "plumber");
  assert.equal(result.currentPrice, 100);
  assert.equal(typeof result.elasticityCoefficient, "number");
  assert.ok(result.recommendedPriceMin > 0);
  assert.ok(result.recommendedPriceMax >= result.recommendedPriceMin);
  assert.equal(typeof result.revenueAtCurrent, "number");
  assert.equal(typeof result.revenueAtOptimal, "number");
});

// ---------------------------------------------------------------------------
// estimatePriceElasticity -- uses historical data to calculate elasticity
// ---------------------------------------------------------------------------

test("estimatePriceElasticity calculates elasticity from historical data", () => {
  const history: HistoricalPricePoint[] = [
    { price: 80, conversionRate: 8, period: "2024-Q1" },
    { price: 100, conversionRate: 5, period: "2024-Q2" },
    { price: 120, conversionRate: 3, period: "2024-Q3" },
  ];
  const result = estimatePriceElasticity("plumber", 100, 5, history);

  assert.ok(result.elasticityCoefficient < 0, "elasticity should be negative for normal goods");
});

// ---------------------------------------------------------------------------
// estimatePriceElasticity -- recommends narrower range for elastic goods
// ---------------------------------------------------------------------------

test("estimatePriceElasticity recommends tighter range for highly elastic goods", () => {
  const history: HistoricalPricePoint[] = [
    { price: 50, conversionRate: 15, period: "Q1" },
    { price: 100, conversionRate: 2, period: "Q2" },
  ];
  const result = estimatePriceElasticity("plumber", 100, 2, history);

  const range = result.recommendedPriceMax - result.recommendedPriceMin;
  assert.ok(range > 0);
});

// ---------------------------------------------------------------------------
// findOptimalPrice -- returns price within range
// ---------------------------------------------------------------------------

test("findOptimalPrice returns price within range", () => {
  const result = findOptimalPrice("plumber", { min: 50, max: 200 }, 0.3);

  assert.ok(result.optimalPrice >= 50);
  assert.ok(result.optimalPrice <= 200);
  assert.ok(result.expectedRevenue > 0);
  assert.ok(result.expectedConversion > 0);
});

// ---------------------------------------------------------------------------
// findOptimalPrice -- revenue is positive
// ---------------------------------------------------------------------------

test("findOptimalPrice expected revenue is positive", () => {
  const result = findOptimalPrice("lawyer", { min: 100, max: 500 }, 0.4);

  assert.ok(result.expectedRevenue > 0);
});

// ---------------------------------------------------------------------------
// generateUpsellSequence -- no upsell for score < 50
// ---------------------------------------------------------------------------

test("generateUpsellSequence returns no upsells for score < 50", () => {
  const result = generateUpsellSequence("plumber", "drain-cleaning", 30);

  assert.equal(result.tier, "none");
  assert.equal(result.upsells.length, 0);
  assert.equal(result.primaryOffer, "drain-cleaning");
});

// ---------------------------------------------------------------------------
// generateUpsellSequence -- basic tier for score 50-69
// ---------------------------------------------------------------------------

test("generateUpsellSequence returns basic tier for score 50-69", () => {
  const result = generateUpsellSequence("plumber", "drain-cleaning", 60);

  assert.equal(result.tier, "basic");
  assert.equal(result.upsells.length, 1);
  assert.equal(result.upsells[0].type, "soft-upsell");
});

// ---------------------------------------------------------------------------
// generateUpsellSequence -- standard tier for score 70-84
// ---------------------------------------------------------------------------

test("generateUpsellSequence returns standard tier for score 70-84", () => {
  const result = generateUpsellSequence("hvac", "ac-install", 75);

  assert.equal(result.tier, "standard");
  assert.equal(result.upsells.length, 2);
});

// ---------------------------------------------------------------------------
// generateUpsellSequence -- premium tier for score 85+
// ---------------------------------------------------------------------------

test("generateUpsellSequence returns premium tier for score 85+", () => {
  const result = generateUpsellSequence("lawyer", "consultation", 92);

  assert.equal(result.tier, "premium");
  assert.equal(result.upsells.length, 3);
  assert.ok(result.upsells.some((u) => u.type === "premium-upsell"));
  assert.ok(result.upsells.some((u) => u.type === "cross-sell"));
  assert.ok(result.upsells.some((u) => u.type === "annual-commitment"));
});

// ---------------------------------------------------------------------------
// getUpsellTiming -- returns correct timings for premium leads
// ---------------------------------------------------------------------------

test("getUpsellTiming returns 3 timings for premium leads", () => {
  const result = getUpsellTiming(90, "plumber");

  assert.equal(result.timings.length, 3);
  assert.equal(result.timings[0].delayLabel, "immediate");
});

// ---------------------------------------------------------------------------
// getUpsellTiming -- returns empty for low-score leads
// ---------------------------------------------------------------------------

test("getUpsellTiming returns empty timings for low-score leads", () => {
  const result = getUpsellTiming(30, "plumber");

  assert.equal(result.timings.length, 0);
});

// ---------------------------------------------------------------------------
// calculateLTV -- computes lifetime value correctly
// ---------------------------------------------------------------------------

test("calculateLTV computes positive LTV with revenue history", () => {
  const result = calculateLTV(
    { leadId: "lead-1", score: 80 },
    "plumber",
    [
      { amount: 500, type: "initial", date: "2024-01-01" },
      { amount: 100, type: "upsell", date: "2024-03-01" },
    ],
  );

  assert.equal(result.leadId, "lead-1");
  assert.equal(result.niche, "plumber");
  assert.equal(result.initialValue, 500);
  assert.ok(result.predictedUpsellRevenue > 0);
  assert.ok(result.referralValue > 0);
  assert.ok(result.churnRisk >= 0 && result.churnRisk <= 1);
  assert.ok(result.estimatedLTV > 0);
});

// ---------------------------------------------------------------------------
// calculateLTV -- lower churn risk for high-score leads
// ---------------------------------------------------------------------------

test("calculateLTV assigns lower churn risk to high-score leads", () => {
  const highScore = calculateLTV({ leadId: "h", score: 90 }, "plumber", [{ amount: 100, type: "initial", date: "2024-01-01" }]);
  const lowScore = calculateLTV({ leadId: "l", score: 30 }, "plumber", [{ amount: 100, type: "initial", date: "2024-01-01" }]);

  assert.ok(highScore.churnRisk < lowScore.churnRisk);
});

// ---------------------------------------------------------------------------
// calculateLTV -- uses predicted upsell when no history
// ---------------------------------------------------------------------------

test("calculateLTV predicts upsell revenue when no upsell history", () => {
  const result = calculateLTV(
    { leadId: "lead-new", score: 70 },
    "dentist",
    [{ amount: 200, type: "initial", date: "2024-01-01" }],
  );

  assert.ok(result.predictedUpsellRevenue > 0);
});

// ---------------------------------------------------------------------------
// segmentByLTV -- segments into three tiers
// ---------------------------------------------------------------------------

test("segmentByLTV returns three tiers", () => {
  const leads = [
    { leadId: "a", ltv: 1000 },
    { leadId: "b", ltv: 500 },
    { leadId: "c", ltv: 200 },
    { leadId: "d", ltv: 100 },
    { leadId: "e", ltv: 50 },
  ];
  const segments = segmentByLTV(leads);

  assert.equal(segments.length, 3);
  assert.equal(segments[0].tier, "high");
  assert.equal(segments[1].tier, "medium");
  assert.equal(segments[2].tier, "low");
  assert.ok(segments[0].avgLTV >= segments[1].avgLTV);
});

// ---------------------------------------------------------------------------
// segmentByLTV -- handles empty input
// ---------------------------------------------------------------------------

test("segmentByLTV handles empty array", () => {
  const segments = segmentByLTV([]);

  assert.equal(segments.length, 3);
  assert.equal(segments[0].count, 0);
  assert.equal(segments[1].count, 0);
  assert.equal(segments[2].count, 0);
});

// ---------------------------------------------------------------------------
// recommendRetentionAction -- VIP for high tier
// ---------------------------------------------------------------------------

test("recommendRetentionAction returns VIP action for high tier", () => {
  const result = recommendRetentionAction({ leadId: "lead-1" }, "high");

  assert.equal(result.ltvTier, "high");
  assert.ok(result.action.includes("VIP"));
  assert.equal(result.channel, "phone");
});

// ---------------------------------------------------------------------------
// recommendRetentionAction -- nurture for medium tier
// ---------------------------------------------------------------------------

test("recommendRetentionAction returns nurture action for medium tier", () => {
  const result = recommendRetentionAction({ leadId: "lead-2" }, "medium");

  assert.equal(result.ltvTier, "medium");
  assert.ok(result.action.includes("nurture"));
});

// ---------------------------------------------------------------------------
// recommendRetentionAction -- win-back for low tier
// ---------------------------------------------------------------------------

test("recommendRetentionAction returns win-back for low tier", () => {
  const result = recommendRetentionAction({ leadId: "lead-3" }, "low");

  assert.equal(result.ltvTier, "low");
  assert.ok(result.action.includes("win-back"));
});

// ---------------------------------------------------------------------------
// identifyCrossSellOpportunities -- returns relevant services
// ---------------------------------------------------------------------------

test("identifyCrossSellOpportunities returns opportunities excluding current service", () => {
  const result = identifyCrossSellOpportunities(
    { leadId: "lead-1", currentService: "drain-cleaning", score: 80 },
    "plumber",
    ["drain-cleaning", "pipe-repair", "water-heater"],
  );

  assert.ok(result.length > 0);
  assert.ok(result.every((opp) => opp.recommendedService !== "drain-cleaning"));
  assert.ok(result.every((opp) => opp.relevanceScore > 0));
});

// ---------------------------------------------------------------------------
// identifyCrossSellOpportunities -- uses niche defaults when no services
// ---------------------------------------------------------------------------

test("identifyCrossSellOpportunities falls back to niche defaults", () => {
  const result = identifyCrossSellOpportunities(
    { leadId: "lead-2", currentService: "wiring", score: 70 },
    "electrician",
    [],
  );

  assert.ok(result.length > 0);
});

// ---------------------------------------------------------------------------
// generateCrossSellOffer -- creates valid offer
// ---------------------------------------------------------------------------

test("generateCrossSellOffer creates valid offer structure", () => {
  const opp = {
    leadId: "lead-1",
    currentService: "drain-cleaning",
    recommendedService: "pipe-repair",
    relevanceScore: 0.8,
    estimatedValue: 200,
    reasoning: "Common pairing",
  };
  const result = generateCrossSellOffer(opp);

  assert.ok(result.headline.length > 0);
  assert.ok(result.description.length > 0);
  assert.equal(result.timing, "immediate");
  assert.equal(result.channel, "in-app");
});

// ---------------------------------------------------------------------------
// definePrimaryRevenuePath -- returns 6 steps
// ---------------------------------------------------------------------------

test("definePrimaryRevenuePath returns 6 steps for any niche", () => {
  const result = definePrimaryRevenuePath("plumber");

  assert.equal(result.niche, "plumber");
  assert.equal(result.steps.length, 6);
  assert.equal(result.steps[0].name, "traffic");
  assert.equal(result.steps[5].name, "retention");
});

// ---------------------------------------------------------------------------
// getRevenuePathMetrics -- returns defaults without DB
// ---------------------------------------------------------------------------

test("getRevenuePathMetrics returns defaults without DB", async () => {
  const result = await getRevenuePathMetrics("no-db-tenant");

  assert.equal(result.tenantId, "no-db-tenant");
  assert.equal(result.trafficVolume, 0);
  assert.equal(result.conversionRate, 0);
});

// ---------------------------------------------------------------------------
// identifyRevenueLeaks -- detects low conversion leak
// ---------------------------------------------------------------------------

test("identifyRevenueLeaks detects low conversion rate leak", () => {
  const metrics: RevenuePathMetrics = {
    tenantId: "t1",
    niche: "plumber",
    trafficVolume: 1000,
    captureRate: 50,
    conversionRate: 1,
    avgOrderValue: 200,
    upsellRate: 5,
    ltv: 250,
  };
  const leaks = identifyRevenueLeaks(metrics);

  assert.ok(leaks.some((l) => l.stage === "primary-conversion"));
});

// ---------------------------------------------------------------------------
// identifyRevenueLeaks -- detects low upsell rate
// ---------------------------------------------------------------------------

test("identifyRevenueLeaks detects low upsell rate", () => {
  const metrics: RevenuePathMetrics = {
    tenantId: "t2",
    niche: "plumber",
    trafficVolume: 500,
    captureRate: 40,
    conversionRate: 5,
    avgOrderValue: 150,
    upsellRate: 2,
    ltv: 300,
  };
  const leaks = identifyRevenueLeaks(metrics);

  assert.ok(leaks.some((l) => l.stage === "upsell"));
});

// ---------------------------------------------------------------------------
// identifyRevenueLeaks -- no leaks when metrics are healthy
// ---------------------------------------------------------------------------

test("identifyRevenueLeaks returns no leaks when metrics are healthy", () => {
  const metrics: RevenuePathMetrics = {
    tenantId: "t3",
    niche: "plumber",
    trafficVolume: 1000,
    captureRate: 50,
    conversionRate: 8,
    avgOrderValue: 200,
    upsellRate: 20,
    ltv: 500,
  };
  const leaks = identifyRevenueLeaks(metrics);

  const hasConversionLeak = leaks.some((l) => l.stage === "primary-conversion");
  const hasUpsellLeak = leaks.some((l) => l.stage === "upsell");
  assert.equal(hasConversionLeak, false);
  assert.equal(hasUpsellLeak, false);
});

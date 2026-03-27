import test from "node:test";
import assert from "node:assert/strict";
import {
  analyzeSupplyDemand,
  identifyScarcityOpportunities,
  generateBuyerAcquisitionPlan,
  optimizeDynamicPricing,
  rankBuyersByValue,
  generateLeadScarcitySignals,
  getMarketplaceHealthScore,
  recordSupplyDemand,
  recordBuyerActivity,
  recordClaimEvent,
  _resetStores,
} from "../src/lib/marketplace-growth.ts";

test.beforeEach(() => {
  _resetStores();
});

// ---------------------------------------------------------------------------
// Supply & Demand Analysis
// ---------------------------------------------------------------------------

test("analyzeSupplyDemand returns empty for no data", () => {
  const result = analyzeSupplyDemand("t1");
  assert.equal(result.length, 0);
});

test("analyzeSupplyDemand detects oversupply", () => {
  recordSupplyDemand("plumber", 100, 30, 50);
  const result = analyzeSupplyDemand("t1");
  assert.equal(result.length, 1);
  assert.equal(result[0].status, "oversupply");
  assert.equal(result[0].priceDirection, "decrease");
});

test("analyzeSupplyDemand detects undersupply", () => {
  recordSupplyDemand("lawyer", 10, 50, 200);
  const result = analyzeSupplyDemand("t1");
  assert.equal(result[0].status, "undersupply");
  assert.equal(result[0].priceDirection, "increase");
});

test("analyzeSupplyDemand detects balanced market", () => {
  recordSupplyDemand("dentist", 100, 100, 75);
  const result = analyzeSupplyDemand("t1");
  assert.equal(result[0].status, "balanced");
  assert.equal(result[0].priceDirection, "stable");
});

test("analyzeSupplyDemand sorts by ratio ascending", () => {
  recordSupplyDemand("a", 10, 50, 100);
  recordSupplyDemand("b", 100, 20, 50);
  const result = analyzeSupplyDemand("t1");
  assert.equal(result[0].niche, "a");
  assert.equal(result[1].niche, "b");
});

// ---------------------------------------------------------------------------
// Scarcity Opportunities
// ---------------------------------------------------------------------------

test("identifyScarcityOpportunities returns empty when supply >= demand", () => {
  recordSupplyDemand("plumber", 100, 50, 50);
  const result = identifyScarcityOpportunities();
  assert.equal(result.length, 0);
});

test("identifyScarcityOpportunities finds high urgency when gap is large", () => {
  recordSupplyDemand("lawyer", 5, 50, 200);
  const result = identifyScarcityOpportunities();
  assert.equal(result.length, 1);
  assert.equal(result[0].urgencyLevel, "high");
  assert.ok(result[0].suggestedPrice > 200);
  assert.equal(result[0].priceIncreasePct, 30);
});

test("identifyScarcityOpportunities calculates medium urgency", () => {
  recordSupplyDemand("dentist", 20, 50, 75);
  const result = identifyScarcityOpportunities();
  assert.equal(result[0].urgencyLevel, "medium");
  assert.equal(result[0].priceIncreasePct, 20);
});

test("identifyScarcityOpportunities calculates low urgency for small gap", () => {
  recordSupplyDemand("hvac", 40, 60, 100);
  const result = identifyScarcityOpportunities();
  assert.equal(result[0].urgencyLevel, "low");
  assert.equal(result[0].priceIncreasePct, 10);
});

// ---------------------------------------------------------------------------
// Buyer Acquisition Plan
// ---------------------------------------------------------------------------

test("generateBuyerAcquisitionPlan returns strategies for a niche", () => {
  const plan = generateBuyerAcquisitionPlan("plumber");
  assert.ok(plan.strategies.length >= 5);
  assert.equal(plan.niche, "plumber");
  assert.ok(plan.estimatedBuyerGain >= 5);
});

test("generateBuyerAcquisitionPlan includes niche name in tactics", () => {
  const plan = generateBuyerAcquisitionPlan("lawyer");
  const hasTactic = plan.strategies.some((s) => s.tactic.includes("lawyer"));
  assert.ok(hasTactic);
});

// ---------------------------------------------------------------------------
// Dynamic Pricing
// ---------------------------------------------------------------------------

test("optimizeDynamicPricing increases price for undersupply", () => {
  recordSupplyDemand("lawyer", 10, 50, 200);
  const result = optimizeDynamicPricing("lawyer");
  assert.ok(result.optimizedPrice > result.currentPrice);
  assert.ok(result.changePercent > 0);
});

test("optimizeDynamicPricing decreases price for oversupply", () => {
  recordSupplyDemand("plumber", 200, 30, 50);
  const result = optimizeDynamicPricing("plumber");
  assert.ok(result.optimizedPrice < result.currentPrice);
  assert.ok(result.changePercent < 0);
});

test("optimizeDynamicPricing keeps price stable for balanced market", () => {
  recordSupplyDemand("dentist", 100, 100, 75);
  const result = optimizeDynamicPricing("dentist");
  assert.equal(result.optimizedPrice, result.currentPrice);
  assert.equal(result.changePercent, 0);
});

test("optimizeDynamicPricing returns zeros for unknown niche", () => {
  const result = optimizeDynamicPricing("unknown-niche");
  assert.equal(result.currentPrice, 0);
  assert.equal(result.optimizedPrice, 0);
});

// ---------------------------------------------------------------------------
// Buyer Ranking
// ---------------------------------------------------------------------------

test("rankBuyersByValue returns empty for no buyers", () => {
  const result = rankBuyersByValue();
  assert.equal(result.length, 0);
});

test("rankBuyersByValue ranks high spenders above low spenders", () => {
  recordBuyerActivity("b1", 10000, 50);
  recordBuyerActivity("b2", 100, 2);
  const result = rankBuyersByValue();
  assert.equal(result[0].buyerId, "b1");
  assert.ok(result[0].valueScore > result[1].valueScore);
});

test("rankBuyersByValue assigns correct tiers", () => {
  recordBuyerActivity("platinum-buyer", 15000, 80);
  const result = rankBuyersByValue();
  assert.ok(["platinum", "gold"].includes(result[0].tier));
});

test("rankBuyersByValue calculates avg spend per lead", () => {
  recordBuyerActivity("b1", 1000, 10);
  const result = rankBuyersByValue();
  assert.equal(result[0].avgSpendPerLead, 100);
});

// ---------------------------------------------------------------------------
// Lead Scarcity Signals
// ---------------------------------------------------------------------------

test("generateLeadScarcitySignals returns critical for very low supply", () => {
  recordSupplyDemand("lawyer", 3, 20, 200);
  const signals = generateLeadScarcitySignals();
  assert.equal(signals[0].scarcityLevel, "critical");
  assert.ok(signals[0].urgencyMessage.includes("3"));
});

test("generateLeadScarcitySignals returns low for ample supply", () => {
  recordSupplyDemand("dentist", 100, 20, 75);
  const signals = generateLeadScarcitySignals();
  assert.equal(signals[0].scarcityLevel, "low");
});

test("generateLeadScarcitySignals counts recent claims", () => {
  recordSupplyDemand("plumber", 10, 30, 50);
  recordClaimEvent("plumber", 2);
  recordClaimEvent("plumber", 4);
  const signals = generateLeadScarcitySignals();
  const plumber = signals.find((s) => s.niche === "plumber");
  assert.ok(plumber);
  assert.equal(plumber.claimedLast24h, 2);
});

// ---------------------------------------------------------------------------
// Marketplace Health Score
// ---------------------------------------------------------------------------

test("getMarketplaceHealthScore returns low grade with no data", () => {
  const health = getMarketplaceHealthScore();
  assert.ok(["C", "D", "F"].includes(health.grade));
  assert.equal(health.nicheCount, 0);
  assert.equal(health.activeBuyers, 0);
  assert.equal(health.activeLeads, 0);
  assert.equal(health.liquidity, 0);
});

test("getMarketplaceHealthScore improves with data", () => {
  recordSupplyDemand("plumber", 50, 50, 50);
  recordSupplyDemand("lawyer", 30, 30, 200);
  recordBuyerActivity("b1", 5000, 30);
  recordBuyerActivity("b2", 2000, 15);
  recordClaimEvent("plumber", 6);
  recordClaimEvent("lawyer", 12);

  const health = getMarketplaceHealthScore();
  assert.ok(health.overallScore > 0);
  assert.equal(health.nicheCount, 2);
  assert.equal(health.activeBuyers, 2);
  assert.ok(health.liquidity > 0);
});

test("getMarketplaceHealthScore calculates repeat buyer rate", () => {
  recordSupplyDemand("plumber", 50, 50, 50);
  recordBuyerActivity("b1", 1000, 5);
  recordBuyerActivity("b2", 500, 1);

  const health = getMarketplaceHealthScore();
  assert.equal(health.repeatBuyerRate, 0.5);
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  recordChannelMetric,
  analyzeChannelPerformance,
  rankChannels,
  generateBudgetAllocation,
  generateChannelStrategy,
  detectChannelSaturation,
  identifyUnexploitedChannels,
  _resetStores,
} from "../src/lib/channel-domination.ts";

test.beforeEach(() => {
  _resetStores();
});

// ---------------------------------------------------------------------------
// Channel Performance Analysis
// ---------------------------------------------------------------------------

test("analyzeChannelPerformance returns empty for no data", () => {
  const analysis = analyzeChannelPerformance("tenant-1");
  assert.equal(analysis.length, 0);
});

test("analyzeChannelPerformance aggregates metrics across periods", () => {
  recordChannelMetric({ channel: "google-ads", leadVolume: 100, cost: 1000, conversions: 20, revenue: 5000, period: "2026-01" });
  recordChannelMetric({ channel: "google-ads", leadVolume: 150, cost: 1500, conversions: 35, revenue: 8000, period: "2026-02" });

  const analysis = analyzeChannelPerformance("tenant-1");
  const google = analysis.find((a) => a.channel === "google-ads");

  assert.ok(google);
  assert.equal(google.leadVolume, 250);
  assert.equal(google.roi, 5.2); // 13000 / 2500
});

test("analyzeChannelPerformance calculates cost per lead", () => {
  recordChannelMetric({ channel: "seo", leadVolume: 200, cost: 400, conversions: 50, revenue: 3000, period: "2026-01" });

  const analysis = analyzeChannelPerformance("tenant-1");
  const seo = analysis.find((a) => a.channel === "seo");

  assert.ok(seo);
  assert.equal(seo.costPerLead, 2);
});

test("analyzeChannelPerformance filters by period", () => {
  recordChannelMetric({ channel: "seo", leadVolume: 100, cost: 200, conversions: 20, revenue: 2000, period: "2026-01" });
  recordChannelMetric({ channel: "seo", leadVolume: 150, cost: 300, conversions: 30, revenue: 3000, period: "2026-02" });

  const filtered = analyzeChannelPerformance("tenant-1", "2026-01");
  const seo = filtered.find((a) => a.channel === "seo");

  assert.ok(seo);
  assert.equal(seo.leadVolume, 100);
});

test("analyzeChannelPerformance handles zero-cost channels", () => {
  recordChannelMetric({ channel: "referral", leadVolume: 50, cost: 0, conversions: 10, revenue: 5000, period: "2026-01" });

  const analysis = analyzeChannelPerformance("tenant-1");
  const referral = analysis.find((a) => a.channel === "referral");

  assert.ok(referral);
  assert.equal(referral.roi, 999);
});

// ---------------------------------------------------------------------------
// Channel Ranking
// ---------------------------------------------------------------------------

test("rankChannels assigns correct tiers based on ROI", () => {
  const analysis = [
    { channel: "google-ads", leadVolume: 100, costPerLead: 10, conversionRate: 0.2, revenuePerLead: 50, roi: 5, trend: "stable" as const },
    { channel: "seo", leadVolume: 200, costPerLead: 2, conversionRate: 0.1, revenuePerLead: 20, roi: 2, trend: "stable" as const },
    { channel: "facebook-ads", leadVolume: 80, costPerLead: 15, conversionRate: 0.05, revenuePerLead: 10, roi: 0.7, trend: "stable" as const },
    { channel: "print", leadVolume: 20, costPerLead: 50, conversionRate: 0.02, revenuePerLead: 5, roi: 0.3, trend: "declining" as const },
  ];

  const ranking = rankChannels(analysis);

  assert.equal(ranking[0].channel, "google-ads");
  assert.equal(ranking[0].tier, "double-down");
  assert.equal(ranking[1].channel, "seo");
  assert.equal(ranking[1].tier, "maintain");
  assert.equal(ranking[2].channel, "facebook-ads");
  assert.equal(ranking[2].tier, "optimize");
  assert.equal(ranking[3].channel, "print");
  assert.equal(ranking[3].tier, "kill");
});

test("rankChannels assigns rank numbers sequentially", () => {
  const analysis = [
    { channel: "a", leadVolume: 100, costPerLead: 5, conversionRate: 0.3, revenuePerLead: 60, roi: 6, trend: "stable" as const },
    { channel: "b", leadVolume: 100, costPerLead: 10, conversionRate: 0.2, revenuePerLead: 40, roi: 4, trend: "stable" as const },
  ];

  const ranking = rankChannels(analysis);
  assert.equal(ranking[0].rank, 1);
  assert.equal(ranking[1].rank, 2);
});

test("rankChannels prevents double-down for declining high-ROI channels", () => {
  const analysis = [
    { channel: "dying-channel", leadVolume: 100, costPerLead: 5, conversionRate: 0.3, revenuePerLead: 60, roi: 4, trend: "declining" as const },
  ];

  const ranking = rankChannels(analysis);
  assert.notEqual(ranking[0].tier, "double-down");
});

// ---------------------------------------------------------------------------
// Budget Allocation
// ---------------------------------------------------------------------------

test("generateBudgetAllocation distributes budget by tier", () => {
  const ranking = [
    { channel: "google-ads", tier: "double-down" as const, roi: 5, trend: "stable" as const, rank: 1 },
    { channel: "seo", tier: "maintain" as const, roi: 2, trend: "stable" as const, rank: 2 },
    { channel: "facebook", tier: "optimize" as const, roi: 0.7, trend: "stable" as const, rank: 3 },
    { channel: "print", tier: "kill" as const, roi: 0.3, trend: "declining" as const, rank: 4 },
  ];

  const allocation = generateBudgetAllocation(ranking, 10000);

  const googleAlloc = allocation.find((a) => a.channel === "google-ads");
  const seoAlloc = allocation.find((a) => a.channel === "seo");

  assert.ok(googleAlloc);
  assert.ok(seoAlloc);
  assert.equal(googleAlloc.allocatedBudget, 5000);
  assert.equal(seoAlloc.allocatedBudget, 3000);
});

test("generateBudgetAllocation splits tier budget evenly among channels", () => {
  const ranking = [
    { channel: "google-ads", tier: "double-down" as const, roi: 5, trend: "stable" as const, rank: 1 },
    { channel: "seo", tier: "double-down" as const, roi: 4, trend: "improving" as const, rank: 2 },
  ];

  const allocation = generateBudgetAllocation(ranking, 10000);

  assert.equal(allocation[0].allocatedBudget, 2500);
  assert.equal(allocation[1].allocatedBudget, 2500);
});

test("generateBudgetAllocation handles zero budget", () => {
  const ranking = [
    { channel: "google-ads", tier: "double-down" as const, roi: 5, trend: "stable" as const, rank: 1 },
  ];

  const allocation = generateBudgetAllocation(ranking, 0);
  assert.equal(allocation[0].allocatedBudget, 0);
});

// ---------------------------------------------------------------------------
// Channel Strategy
// ---------------------------------------------------------------------------

test("generateChannelStrategy produces categorized strategy", () => {
  recordChannelMetric({ channel: "google-ads", leadVolume: 100, cost: 500, conversions: 20, revenue: 5000, period: "2026-01" });
  recordChannelMetric({ channel: "facebook-ads", leadVolume: 50, cost: 1000, conversions: 3, revenue: 300, period: "2026-01" });

  const strategy = generateChannelStrategy("tenant-1", "construction");

  assert.equal(strategy.tenantId, "tenant-1");
  assert.equal(strategy.niche, "construction");
  assert.ok(Array.isArray(strategy.doubleDown));
  assert.ok(Array.isArray(strategy.maintain));
  assert.ok(Array.isArray(strategy.optimize));
  assert.ok(Array.isArray(strategy.abandon));
  assert.ok(strategy.generatedAt.length > 0);
});

test("generateChannelStrategy includes tactics for each channel", () => {
  recordChannelMetric({ channel: "google-ads", leadVolume: 100, cost: 500, conversions: 20, revenue: 5000, period: "2026-01" });

  const strategy = generateChannelStrategy("tenant-1", "construction");
  const allTactics = [...strategy.doubleDown, ...strategy.maintain, ...strategy.optimize, ...strategy.abandon];

  for (const entry of allTactics) {
    assert.ok(entry.tactics.length > 0, `${entry.channel} should have tactics`);
  }
});

// ---------------------------------------------------------------------------
// Saturation Detection
// ---------------------------------------------------------------------------

test("detectChannelSaturation returns not saturated with insufficient data", () => {
  const data = [
    { channel: "google-ads", leadVolume: 100, cost: 500, conversions: 20, revenue: 5000, period: "2026-01" },
  ];

  const signal = detectChannelSaturation("google-ads", data);
  assert.equal(signal.isSaturated, false);
  assert.ok(signal.recommendation.includes("Insufficient"));
});

test("detectChannelSaturation detects rising CPL with flat volume", () => {
  const data = [
    { channel: "google-ads", leadVolume: 100, cost: 500, conversions: 20, revenue: 5000, period: "2026-01" },
    { channel: "google-ads", leadVolume: 100, cost: 700, conversions: 18, revenue: 4500, period: "2026-02" },
    { channel: "google-ads", leadVolume: 102, cost: 900, conversions: 16, revenue: 4000, period: "2026-03" },
  ];

  const signal = detectChannelSaturation("google-ads", data);
  assert.equal(signal.isSaturated, true);
  assert.ok(signal.inflectionPeriod !== null);
  assert.ok(signal.recommendation.includes("diminishing returns"));
});

test("detectChannelSaturation returns not saturated for healthy growth", () => {
  const data = [
    { channel: "seo", leadVolume: 100, cost: 500, conversions: 20, revenue: 5000, period: "2026-01" },
    { channel: "seo", leadVolume: 150, cost: 600, conversions: 30, revenue: 7500, period: "2026-02" },
    { channel: "seo", leadVolume: 200, cost: 700, conversions: 40, revenue: 10000, period: "2026-03" },
  ];

  const signal = detectChannelSaturation("seo", data);
  assert.equal(signal.isSaturated, false);
});

// ---------------------------------------------------------------------------
// Unexploited Channels
// ---------------------------------------------------------------------------

test("identifyUnexploitedChannels suggests channels not in use", () => {
  const unexploited = identifyUnexploitedChannels("construction", ["google-ads", "seo"]);

  assert.ok(unexploited.length > 0);
  for (const ch of unexploited) {
    assert.notEqual(ch.channel, "google-ads");
    assert.notEqual(ch.channel, "seo");
  }
});

test("identifyUnexploitedChannels returns empty when all channels used", () => {
  const allChannels = [
    "google-ads", "seo", "referral", "facebook-ads", "linkedin",
    "direct-mail", "youtube", "tiktok", "email", "yelp",
  ];
  const unexploited = identifyUnexploitedChannels("construction", allChannels);
  assert.equal(unexploited.length, 0);
});

test("identifyUnexploitedChannels ranks by niche relevance", () => {
  const unexploited = identifyUnexploitedChannels("construction", ["google-ads"]);
  for (let i = 1; i < unexploited.length; i++) {
    assert.ok(unexploited[i - 1].nicheRelevance >= unexploited[i].nicheRelevance);
  }
});

test("identifyUnexploitedChannels includes difficulty rating", () => {
  const unexploited = identifyUnexploitedChannels("construction", ["google-ads"]);
  for (const ch of unexploited) {
    assert.ok(["low", "medium", "high"].includes(ch.difficulty));
  }
});

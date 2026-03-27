import test from "node:test";
import assert from "node:assert/strict";
import {
  generateInsights,
  proposeAdjustments,
  getDefaultKPITargets,
  resetFeedbackStore,
  type PerformanceMetrics,
  type Insight,
} from "../src/lib/feedback-engine.ts";

function makeMetrics(overrides: Partial<PerformanceMetrics> = {}): PerformanceMetrics {
  return {
    conversionRate: 5,
    avgLeadScore: 45,
    avgTimeToConvert: 14,
    topFunnels: [{ funnel: "qualification", conversions: 50, rate: 8 }],
    bottomFunnels: [{ funnel: "lead-magnet", conversions: 2, rate: 1 }],
    topSources: [{ source: "referral", leads: 100, quality: 65 }],
    bottomSources: [{ source: "organic-social", leads: 50, quality: 20 }],
    dropOffPoints: [],
    emailPerformance: { openRate: 25, clickRate: 5 },
    scoringAccuracy: 0.75,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// collectPerformanceMetrics -- returns all required fields
// ---------------------------------------------------------------------------

test("collectPerformanceMetrics returns all required fields without DB", async () => {
  resetFeedbackStore();
  const { collectPerformanceMetrics } = await import("../src/lib/feedback-engine.ts");
  const metrics = await collectPerformanceMetrics("no-db-tenant", "2024-01-01", "2024-12-31");

  assert.equal(typeof metrics.conversionRate, "number");
  assert.equal(typeof metrics.avgLeadScore, "number");
  assert.equal(typeof metrics.avgTimeToConvert, "number");
  assert.ok(Array.isArray(metrics.topFunnels));
  assert.ok(Array.isArray(metrics.bottomFunnels));
  assert.ok(Array.isArray(metrics.topSources));
  assert.ok(Array.isArray(metrics.bottomSources));
  assert.ok(Array.isArray(metrics.dropOffPoints));
  assert.equal(typeof metrics.emailPerformance.openRate, "number");
  assert.equal(typeof metrics.emailPerformance.clickRate, "number");
  assert.equal(typeof metrics.scoringAccuracy, "number");
});

// ---------------------------------------------------------------------------
// generateInsights -- below-target conversion rate flagged
// ---------------------------------------------------------------------------

test("generateInsights flags below-target conversion rate as problem", () => {
  resetFeedbackStore();
  const metrics = makeMetrics({ conversionRate: 1 });
  const insights = generateInsights(metrics);

  const conversionInsight = insights.find((i) => i.metric === "conversionRate");
  assert.ok(conversionInsight !== undefined);
  assert.equal(conversionInsight.type, "problem");
  assert.ok(["warning", "critical"].includes(conversionInsight.severity));
  assert.equal(conversionInsight.currentValue, 1);
  assert.equal(conversionInsight.targetValue, 5);
});

test("generateInsights flags low email open rate", () => {
  resetFeedbackStore();
  const metrics = makeMetrics({
    emailPerformance: { openRate: 10, clickRate: 2 },
  });
  const insights = generateInsights(metrics);

  const emailInsight = insights.find((i) => i.metric === "emailOpenRate");
  assert.ok(emailInsight !== undefined);
  assert.equal(emailInsight.type, "problem");
});

test("generateInsights flags low scoring accuracy", () => {
  resetFeedbackStore();
  const metrics = makeMetrics({ scoringAccuracy: 0.3 });
  const insights = generateInsights(metrics);

  const scoringInsight = insights.find((i) => i.metric === "scoringAccuracy");
  assert.ok(scoringInsight !== undefined);
  assert.equal(scoringInsight.type, "problem");
  assert.equal(scoringInsight.severity, "critical");
});

test("generateInsights flags low lead quality sources", () => {
  resetFeedbackStore();
  const metrics = makeMetrics({
    bottomSources: [{ source: "bad-source", leads: 100, quality: 15 }],
  });
  const insights = generateInsights(metrics);

  const sourceInsight = insights.find((i) => i.metric === "sourceQuality");
  assert.ok(sourceInsight !== undefined);
  assert.ok(sourceInsight.message.includes("bad-source"));
});

test("generateInsights flags high drop-off points", () => {
  resetFeedbackStore();
  const metrics = makeMetrics({
    dropOffPoints: [{ step: "payment-form", dropRate: 75 }],
  });
  const insights = generateInsights(metrics);

  const dropInsight = insights.find((i) => i.metric === "dropOffRate");
  assert.ok(dropInsight !== undefined);
  assert.equal(dropInsight.severity, "critical");
  assert.ok(dropInsight.message.includes("payment-form"));
});

// ---------------------------------------------------------------------------
// generateInsights -- opportunity type for above-target metrics
// ---------------------------------------------------------------------------

test("generateInsights returns opportunity type when conversion rate exceeds target by 20%+", () => {
  resetFeedbackStore();
  const metrics = makeMetrics({ conversionRate: 8 });
  const insights = generateInsights(metrics);

  const opportunity = insights.find((i) => i.type === "opportunity" && i.metric === "conversionRate");
  assert.ok(opportunity !== undefined);
  assert.equal(opportunity.severity, "info");
});

test("generateInsights identifies top funnel trend", () => {
  resetFeedbackStore();
  const metrics = makeMetrics({
    topFunnels: [{ funnel: "checkout", conversions: 100, rate: 15 }],
  });
  const insights = generateInsights(metrics);

  const trendInsight = insights.find((i) => i.type === "trend" && i.metric === "topFunnelRate");
  assert.ok(trendInsight !== undefined);
  assert.ok(trendInsight.message.includes("checkout"));
});

test("generateInsights returns no problems when all metrics are on target", () => {
  resetFeedbackStore();
  const metrics = makeMetrics({
    conversionRate: 10,
    avgLeadScore: 55,
    emailPerformance: { openRate: 30, clickRate: 8 },
    scoringAccuracy: 0.85,
    bottomSources: [{ source: "direct", leads: 50, quality: 50 }],
    bottomFunnels: [],
  });
  const insights = generateInsights(metrics);

  const problems = insights.filter((i) => i.type === "problem");
  assert.equal(problems.length, 0);
});

// ---------------------------------------------------------------------------
// proposeAdjustments -- suggests changes for problem insights
// ---------------------------------------------------------------------------

test("proposeAdjustments suggests scoring weight changes for low accuracy", () => {
  resetFeedbackStore();
  const insights: Insight[] = [
    {
      type: "problem",
      severity: "warning",
      message: "Scoring accuracy is below target",
      metric: "scoringAccuracy",
      currentValue: 0.4,
      targetValue: 0.7,
      recommendation: "Recalibrate",
    },
  ];

  const adjustments = proposeAdjustments(insights, { intentWeight: 0.3, fitWeight: 0.25 });
  const scoringAdj = adjustments.filter((a) => a.type === "scoring-weight");
  assert.ok(scoringAdj.length >= 2);
  assert.ok(scoringAdj.some((a) => a.target === "intentWeight"));
  assert.ok(scoringAdj.some((a) => a.target === "fitWeight"));
});

test("proposeAdjustments suggests funnel disable for critically low conversion", () => {
  resetFeedbackStore();
  const insights: Insight[] = [
    {
      type: "problem",
      severity: "warning",
      message: 'Funnel "broken-funnel" has a conversion rate of 0.5%',
      metric: "funnelConversionRate",
      currentValue: 0.5,
      targetValue: 5,
      recommendation: "Disable",
    },
  ];

  const adjustments = proposeAdjustments(insights, {});
  const funnelAdj = adjustments.find((a) => a.type === "funnel-disable");
  assert.ok(funnelAdj !== undefined);
  assert.equal(funnelAdj.target, "broken-funnel");
  assert.equal(funnelAdj.autoApplied, false);
});

test("proposeAdjustments suggests source deprioritization for low quality", () => {
  resetFeedbackStore();
  const insights: Insight[] = [
    {
      type: "problem",
      severity: "warning",
      message: 'Source "spam-source" has low lead quality (15)',
      metric: "sourceQuality",
      currentValue: 15,
      targetValue: 30,
      recommendation: "Deprioritize",
    },
  ];

  const adjustments = proposeAdjustments(insights, {});
  const sourceAdj = adjustments.find((a) => a.type === "source-deprioritize");
  assert.ok(sourceAdj !== undefined);
  assert.equal(sourceAdj.target, "spam-source");
});

// ---------------------------------------------------------------------------
// proposeAdjustments -- marks safe adjustments as autoApplied
// ---------------------------------------------------------------------------

test("proposeAdjustments marks nurture timing as autoApplied for low email open rate", () => {
  resetFeedbackStore();
  const insights: Insight[] = [
    {
      type: "problem",
      severity: "warning",
      message: "Email open rate is below target",
      metric: "emailOpenRate",
      currentValue: 10,
      targetValue: 25,
      recommendation: "Test new subject lines",
    },
  ];

  const adjustments = proposeAdjustments(insights, { emailSendHour: 9 });
  const timingAdj = adjustments.find((a) => a.type === "nurture-timing");
  assert.ok(timingAdj !== undefined);
  assert.equal(timingAdj.autoApplied, true);
});

test("proposeAdjustments marks funnel promotion as autoApplied for top performers", () => {
  resetFeedbackStore();
  const insights: Insight[] = [
    {
      type: "trend",
      severity: "info",
      message: '"qualification" is the top-performing funnel with 12% conversion rate',
      metric: "topFunnelRate",
      currentValue: 12,
      targetValue: 12,
      recommendation: "Route more traffic",
    },
  ];

  const adjustments = proposeAdjustments(insights, {});
  const promoAdj = adjustments.find((a) => a.type === "funnel-promote");
  assert.ok(promoAdj !== undefined);
  assert.equal(promoAdj.target, "qualification");
  assert.equal(promoAdj.autoApplied, true);
});

test("proposeAdjustments suggests psychology triggers for high drop-off", () => {
  resetFeedbackStore();
  const insights: Insight[] = [
    {
      type: "problem",
      severity: "critical",
      message: 'Step "checkout-form" has a 80% drop-off rate',
      metric: "dropOffRate",
      currentValue: 80,
      targetValue: 50,
      recommendation: "Add trust signals",
    },
  ];

  const adjustments = proposeAdjustments(insights, {});
  const psychAdj = adjustments.find((a) => a.type === "psychology-trigger");
  assert.ok(psychAdj !== undefined);
  assert.equal(psychAdj.target, "checkout-form");
  assert.equal(psychAdj.autoApplied, true);
});

// ---------------------------------------------------------------------------
// getScoringAccuracy -- returns number between 0 and 1
// ---------------------------------------------------------------------------

test("getScoringAccuracy returns number between 0 and 1 without DB", async () => {
  resetFeedbackStore();
  const { getScoringAccuracy } = await import("../src/lib/feedback-engine.ts");
  const accuracy = await getScoringAccuracy("no-db-tenant");

  assert.equal(typeof accuracy, "number");
  assert.ok(accuracy >= 0);
  assert.ok(accuracy <= 1);
});

// ---------------------------------------------------------------------------
// runFeedbackCycle -- creates a cycle record
// ---------------------------------------------------------------------------

test("runFeedbackCycle creates a cycle record with required fields", async () => {
  resetFeedbackStore();
  const { runFeedbackCycle } = await import("../src/lib/feedback-engine.ts");

  const cycle = await runFeedbackCycle("cycle-tenant", "daily");
  assert.ok(cycle.id.length > 0);
  assert.equal(cycle.tenantId, "cycle-tenant");
  assert.equal(cycle.type, "daily");
  assert.ok(["analyzed", "applied"].includes(cycle.status));
  assert.ok(cycle.period.length > 0);
  assert.ok(cycle.createdAt.length > 0);
  assert.ok(cycle.metrics !== undefined);
  assert.ok(Array.isArray(cycle.insights));
  assert.ok(Array.isArray(cycle.adjustments));
});

// ---------------------------------------------------------------------------
// getFeedbackHistory -- returns sorted cycles
// ---------------------------------------------------------------------------

test("getFeedbackHistory returns cycles sorted by creation date descending", async () => {
  resetFeedbackStore();
  const { runFeedbackCycle, getFeedbackHistory } = await import("../src/lib/feedback-engine.ts");

  const cycle1 = await runFeedbackCycle("history-tenant", "daily");
  const cycle2 = await runFeedbackCycle("history-tenant", "weekly");

  const history = await getFeedbackHistory("history-tenant");
  assert.ok(history.length >= 2);
  assert.ok(history.some((h) => h.id === cycle1.id));
  assert.ok(history.some((h) => h.id === cycle2.id));

  for (let i = 1; i < history.length; i++) {
    const prev = new Date(history[i - 1].createdAt).getTime();
    const curr = new Date(history[i].createdAt).getTime();
    assert.ok(prev >= curr, "History should be sorted descending by createdAt");
  }
});

// ---------------------------------------------------------------------------
// getDefaultKPITargets
// ---------------------------------------------------------------------------

test("getDefaultKPITargets returns all expected fields with valid values", () => {
  const targets = getDefaultKPITargets();
  assert.equal(typeof targets.conversionRate, "number");
  assert.equal(typeof targets.avgLeadScore, "number");
  assert.equal(typeof targets.avgTimeToConvert, "number");
  assert.equal(typeof targets.emailOpenRate, "number");
  assert.equal(typeof targets.emailClickRate, "number");
  assert.equal(typeof targets.scoringAccuracy, "number");
  assert.equal(typeof targets.maxDropOffRate, "number");
  assert.equal(typeof targets.minSourceQuality, "number");

  assert.ok(targets.conversionRate > 0);
  assert.ok(targets.scoringAccuracy > 0 && targets.scoringAccuracy <= 1);
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  computeIntentScore,
  computeFitScore,
  computeEngagementScore,
  computeUrgencyScore,
  computeCompositeScore,
  classifyLeadTemperature,
  getScoreRecommendation,
  type ScoringContext,
  type LeadScore,
} from "../src/lib/scoring-engine.ts";

// ---------------------------------------------------------------------------
// GET /api/score — scoring dimensions
// ---------------------------------------------------------------------------

test("GET score returns all four scoring dimensions plus composite", () => {
  const ctx: ScoringContext = { source: "organic" };
  const intent = computeIntentScore(ctx);
  const fit = computeFitScore(ctx);
  const engagement = computeEngagementScore(ctx);
  const urgency = computeUrgencyScore(ctx);
  const composite = computeCompositeScore(ctx);

  assert.equal(intent.type, "intent");
  assert.equal(fit.type, "fit");
  assert.equal(engagement.type, "engagement");
  assert.equal(urgency.type, "urgency");
  assert.equal(composite.type, "composite");
});

test("GET score dimensions each have computedAt timestamps", () => {
  const ctx: ScoringContext = { source: "organic" };
  const scores = [
    computeIntentScore(ctx),
    computeFitScore(ctx),
    computeEngagementScore(ctx),
    computeUrgencyScore(ctx),
    computeCompositeScore(ctx),
  ];
  for (const score of scores) {
    assert.ok(score.computedAt.length > 0, `${score.type} missing computedAt`);
  }
});

test("GET score dimensions all include factors array", () => {
  const ctx: ScoringContext = { source: "organic" };
  const scores = [
    computeIntentScore(ctx),
    computeFitScore(ctx),
    computeEngagementScore(ctx),
    computeUrgencyScore(ctx),
    computeCompositeScore(ctx),
  ];
  for (const score of scores) {
    assert.ok(Array.isArray(score.factors), `${score.type} factors not an array`);
  }
});

// ---------------------------------------------------------------------------
// POST /api/score — compute scores from signals
// ---------------------------------------------------------------------------

test("POST score computes from referral source with full signals", () => {
  const ctx: ScoringContext = {
    source: "referral",
    formCompletions: 2,
    assessmentCompleted: true,
    hasCompany: true,
    hasEmail: true,
    emailOpens: 5,
    emailClicks: 3,
    returnVisits: 2,
    lastActivityAt: new Date().toISOString(),
    urgencyIndicators: ["Need ASAP"],
    timeline: "immediate",
  };
  const composite = computeCompositeScore(ctx);
  assert.ok(composite.score > 0, "Composite score should be positive for strong signals");
  assert.equal(composite.factors.length, 4);
});

test("POST score returns bounded 0-100 for minimal signals", () => {
  const ctx: ScoringContext = { source: "direct" };
  const composite = computeCompositeScore(ctx);
  assert.ok(composite.score >= 0, `Score ${composite.score} below 0`);
  assert.ok(composite.score <= 100, `Score ${composite.score} above 100`);
});

test("POST score returns bounded 0-100 for maximum signals", () => {
  const ctx: ScoringContext = {
    source: "referral",
    pagesViewed: 100,
    formCompletions: 10,
    chatMessages: 50,
    assessmentCompleted: true,
    calculatorUsed: true,
    timeOnSite: 5000,
    hasCompany: true,
    hasPhone: true,
    hasEmail: true,
    niche: "construction",
    service: "plumbing",
    companySize: "enterprise",
    budget: "$100k",
    emailOpens: 20,
    emailClicks: 15,
    returnVisits: 10,
    contentEngagement: [{ type: "blog", count: 10 }, { type: "case-study", count: 5 }],
    lastActivityAt: new Date().toISOString(),
    urgencyIndicators: ["ASAP", "urgent", "deadline", "switching from competitor"],
    timeline: "immediate",
  };
  const composite = computeCompositeScore(ctx);
  assert.ok(composite.score >= 0 && composite.score <= 100, `Score out of bounds: ${composite.score}`);
});

// ---------------------------------------------------------------------------
// Error handling — missing leadId
// ---------------------------------------------------------------------------

test("score request with unknown source still returns valid result", () => {
  const ctx: ScoringContext = { source: "unknown" };
  const composite = computeCompositeScore(ctx);
  assert.equal(composite.type, "composite");
  assert.ok(composite.score >= 0);
});

test("score request with empty context returns zero-ish baseline", () => {
  const ctx: ScoringContext = { source: "" as "organic" };
  const composite = computeCompositeScore(ctx);
  assert.ok(composite.score >= 0);
  assert.ok(composite.score <= 100);
});

// ---------------------------------------------------------------------------
// Temperature classification thresholds
// ---------------------------------------------------------------------------

test("temperature classification: cold threshold boundary at 34/35", () => {
  assert.equal(classifyLeadTemperature(34), "cold");
  assert.equal(classifyLeadTemperature(35), "warm");
});

test("temperature classification: warm threshold boundary at 59/60", () => {
  assert.equal(classifyLeadTemperature(59), "warm");
  assert.equal(classifyLeadTemperature(60), "hot");
});

test("temperature classification: hot threshold boundary at 79/80", () => {
  assert.equal(classifyLeadTemperature(79), "hot");
  assert.equal(classifyLeadTemperature(80), "burning");
});

test("temperature classification maps to correct recommendation priority", () => {
  const coldScores: LeadScore[] = [
    { type: "composite", score: 10, factors: [], computedAt: "" },
    { type: "intent", score: 5, factors: [], computedAt: "" },
    { type: "urgency", score: 5, factors: [], computedAt: "" },
    { type: "fit", score: 5, factors: [], computedAt: "" },
    { type: "engagement", score: 5, factors: [], computedAt: "" },
  ];
  const rec = getScoreRecommendation(coldScores);
  assert.equal(rec.priority, "low");

  const burningScores: LeadScore[] = [
    { type: "composite", score: 90, factors: [], computedAt: "" },
    { type: "intent", score: 80, factors: [], computedAt: "" },
    { type: "urgency", score: 70, factors: [], computedAt: "" },
    { type: "fit", score: 80, factors: [], computedAt: "" },
    { type: "engagement", score: 75, factors: [], computedAt: "" },
  ];
  const hotRec = getScoreRecommendation(burningScores);
  assert.equal(hotRec.priority, "critical");
  assert.equal(hotRec.channel, "phone");
});

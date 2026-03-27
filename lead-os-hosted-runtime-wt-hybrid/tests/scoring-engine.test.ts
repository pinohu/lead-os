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
// computeIntentScore
// ---------------------------------------------------------------------------

test("computeIntentScore returns type intent with a score between 0 and 100", () => {
  const ctx: ScoringContext = { source: "organic" };
  const result = computeIntentScore(ctx);
  assert.equal(result.type, "intent");
  assert.ok(result.score >= 0 && result.score <= 100);
  assert.ok(result.computedAt.length > 0);
});

test("computeIntentScore returns 0-ish for empty context with unknown source", () => {
  const ctx: ScoringContext = { source: "unknown" };
  const result = computeIntentScore(ctx);
  assert.ok(result.score >= 0);
  assert.ok(result.factors.length > 0);
});

test("computeIntentScore increases with form completions and assessment", () => {
  const low: ScoringContext = { source: "organic" };
  const high: ScoringContext = {
    source: "referral",
    formCompletions: 3,
    assessmentCompleted: true,
    calculatorUsed: true,
    chatMessages: 5,
    pagesViewed: 10,
    timeOnSite: 600,
  };
  const lowScore = computeIntentScore(low);
  const highScore = computeIntentScore(high);
  assert.ok(highScore.score > lowScore.score, `Expected ${highScore.score} > ${lowScore.score}`);
});

test("computeIntentScore caps page depth and time contributions", () => {
  const ctx: ScoringContext = {
    source: "organic",
    pagesViewed: 999,
    timeOnSite: 99999,
  };
  const result = computeIntentScore(ctx);
  assert.ok(result.score <= 100);
});

test("computeIntentScore recognizes all source types", () => {
  const sources = ["referral", "organic", "paid", "direct", "social", "email"];
  for (const source of sources) {
    const result = computeIntentScore({ source });
    assert.equal(result.type, "intent");
    assert.ok(result.score >= 0);
  }
});

// ---------------------------------------------------------------------------
// computeFitScore
// ---------------------------------------------------------------------------

test("computeFitScore returns type fit", () => {
  const result = computeFitScore({ source: "organic" });
  assert.equal(result.type, "fit");
});

test("computeFitScore returns zero for empty context", () => {
  const result = computeFitScore({ source: "organic" });
  assert.equal(result.score, 0);
});

test("computeFitScore returns max-ish for full profile", () => {
  const ctx: ScoringContext = {
    source: "organic",
    hasCompany: true,
    hasPhone: true,
    hasEmail: true,
    niche: "construction",
    service: "plumbing",
    companySize: "enterprise",
    budget: "$50k",
  };
  const result = computeFitScore(ctx);
  assert.ok(result.score >= 80, `Expected score >= 80 but got ${result.score}`);
});

test("computeFitScore handles unknown company size", () => {
  const ctx: ScoringContext = {
    source: "organic",
    companySize: "mega-corp",
  };
  const result = computeFitScore(ctx);
  assert.ok(result.score >= 0);
});

// ---------------------------------------------------------------------------
// computeEngagementScore
// ---------------------------------------------------------------------------

test("computeEngagementScore returns type engagement", () => {
  const result = computeEngagementScore({ source: "organic" });
  assert.equal(result.type, "engagement");
});

test("computeEngagementScore returns zero for empty context", () => {
  const result = computeEngagementScore({ source: "organic" });
  assert.equal(result.score, 0);
});

test("computeEngagementScore applies recency multiplier", () => {
  const recent: ScoringContext = {
    source: "organic",
    emailOpens: 5,
    emailClicks: 3,
    returnVisits: 3,
    lastActivityAt: new Date().toISOString(),
  };
  const stale: ScoringContext = {
    source: "organic",
    emailOpens: 5,
    emailClicks: 3,
    returnVisits: 3,
    lastActivityAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
  const recentScore = computeEngagementScore(recent);
  const staleScore = computeEngagementScore(stale);
  assert.ok(recentScore.score >= staleScore.score, `Expected recent ${recentScore.score} >= stale ${staleScore.score}`);
});

test("computeEngagementScore accounts for content engagement breadth and depth", () => {
  const ctx: ScoringContext = {
    source: "organic",
    contentEngagement: [
      { type: "blog", count: 5 },
      { type: "case-study", count: 3 },
      { type: "whitepaper", count: 2 },
    ],
    lastActivityAt: new Date().toISOString(),
  };
  const result = computeEngagementScore(ctx);
  assert.ok(result.score > 0);
});

// ---------------------------------------------------------------------------
// computeUrgencyScore
// ---------------------------------------------------------------------------

test("computeUrgencyScore returns type urgency", () => {
  const result = computeUrgencyScore({ source: "organic" });
  assert.equal(result.type, "urgency");
});

test("computeUrgencyScore detects urgency keywords", () => {
  const ctx: ScoringContext = {
    source: "organic",
    urgencyIndicators: ["I need this ASAP", "It is urgent"],
    timeline: "immediate",
    budget: "$5k",
  };
  const result = computeUrgencyScore(ctx);
  assert.ok(result.score > 30, `Expected score > 30 but got ${result.score}`);
});

test("computeUrgencyScore detects competitor and pain keywords", () => {
  const ctx: ScoringContext = {
    source: "organic",
    urgencyIndicators: [
      "We are comparing alternatives",
      "Struggling with current tool",
    ],
  };
  const result = computeUrgencyScore(ctx);
  assert.ok(result.score > 0);
});

test("computeUrgencyScore with no indicators returns baseline from timeline", () => {
  const ctx: ScoringContext = {
    source: "organic",
    timeline: "exploring",
  };
  const result = computeUrgencyScore(ctx);
  assert.ok(result.score >= 0);
});

// ---------------------------------------------------------------------------
// computeCompositeScore
// ---------------------------------------------------------------------------

test("computeCompositeScore returns type composite", () => {
  const ctx: ScoringContext = { source: "organic" };
  const result = computeCompositeScore(ctx);
  assert.equal(result.type, "composite");
  assert.ok(result.factors.length === 4);
});

test("computeCompositeScore combines four sub-scores", () => {
  const ctx: ScoringContext = {
    source: "referral",
    hasCompany: true,
    hasPhone: true,
    hasEmail: true,
    niche: "construction",
    service: "plumbing",
    formCompletions: 3,
    assessmentCompleted: true,
    emailOpens: 5,
    emailClicks: 3,
    returnVisits: 3,
    urgencyIndicators: ["Need this ASAP"],
    timeline: "immediate",
    budget: "$10k",
    lastActivityAt: new Date().toISOString(),
  };
  const result = computeCompositeScore(ctx);
  assert.ok(result.score > 0);
  const factorNames = result.factors.map((f) => f.factor);
  assert.ok(factorNames.includes("intent"));
  assert.ok(factorNames.includes("fit"));
  assert.ok(factorNames.includes("engagement"));
  assert.ok(factorNames.includes("urgency"));
});

test("computeCompositeScore is always between 0 and 100", () => {
  const empty = computeCompositeScore({ source: "unknown" });
  assert.ok(empty.score >= 0 && empty.score <= 100);

  const full = computeCompositeScore({
    source: "referral",
    pagesViewed: 50,
    formCompletions: 10,
    chatMessages: 20,
    assessmentCompleted: true,
    calculatorUsed: true,
    timeOnSite: 1000,
    hasCompany: true,
    hasPhone: true,
    hasEmail: true,
    niche: "x",
    service: "y",
    companySize: "enterprise",
    budget: "$100k",
    emailOpens: 20,
    emailClicks: 15,
    returnVisits: 10,
    contentEngagement: [{ type: "a", count: 10 }, { type: "b", count: 10 }],
    lastActivityAt: new Date().toISOString(),
    urgencyIndicators: ["ASAP", "urgent", "deadline", "switching"],
    timeline: "immediate",
  });
  assert.ok(full.score >= 0 && full.score <= 100);
});

// ---------------------------------------------------------------------------
// classifyLeadTemperature
// ---------------------------------------------------------------------------

test("classifyLeadTemperature returns cold for low scores", () => {
  assert.equal(classifyLeadTemperature(0), "cold");
  assert.equal(classifyLeadTemperature(10), "cold");
  assert.equal(classifyLeadTemperature(34), "cold");
});

test("classifyLeadTemperature returns warm for mid scores", () => {
  assert.equal(classifyLeadTemperature(35), "warm");
  assert.equal(classifyLeadTemperature(50), "warm");
  assert.equal(classifyLeadTemperature(59), "warm");
});

test("classifyLeadTemperature returns hot for high scores", () => {
  assert.equal(classifyLeadTemperature(60), "hot");
  assert.equal(classifyLeadTemperature(70), "hot");
  assert.equal(classifyLeadTemperature(79), "hot");
});

test("classifyLeadTemperature returns burning for very high scores", () => {
  assert.equal(classifyLeadTemperature(80), "burning");
  assert.equal(classifyLeadTemperature(100), "burning");
});

// ---------------------------------------------------------------------------
// getScoreRecommendation
// ---------------------------------------------------------------------------

test("getScoreRecommendation returns critical priority for high composite", () => {
  const scores: LeadScore[] = [
    { type: "composite", score: 85, factors: [], computedAt: "" },
    { type: "intent", score: 50, factors: [], computedAt: "" },
    { type: "urgency", score: 50, factors: [], computedAt: "" },
    { type: "fit", score: 50, factors: [], computedAt: "" },
    { type: "engagement", score: 50, factors: [], computedAt: "" },
  ];
  const rec = getScoreRecommendation(scores);
  assert.equal(rec.priority, "critical");
  assert.equal(rec.channel, "phone");
});

test("getScoreRecommendation returns high priority for strong intent + fit", () => {
  const scores: LeadScore[] = [
    { type: "composite", score: 55, factors: [], computedAt: "" },
    { type: "intent", score: 75, factors: [], computedAt: "" },
    { type: "urgency", score: 30, factors: [], computedAt: "" },
    { type: "fit", score: 60, factors: [], computedAt: "" },
    { type: "engagement", score: 40, factors: [], computedAt: "" },
  ];
  const rec = getScoreRecommendation(scores);
  assert.equal(rec.priority, "high");
  assert.equal(rec.channel, "email");
});

test("getScoreRecommendation returns low priority for cold leads", () => {
  const scores: LeadScore[] = [
    { type: "composite", score: 15, factors: [], computedAt: "" },
    { type: "intent", score: 10, factors: [], computedAt: "" },
    { type: "urgency", score: 5, factors: [], computedAt: "" },
    { type: "fit", score: 10, factors: [], computedAt: "" },
    { type: "engagement", score: 10, factors: [], computedAt: "" },
  ];
  const rec = getScoreRecommendation(scores);
  assert.equal(rec.priority, "low");
});

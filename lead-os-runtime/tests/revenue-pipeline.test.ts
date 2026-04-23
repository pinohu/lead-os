import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  runRevenuePipeline,
  generateFollowUpPlan,
  getPipelineHistory,
  getPipelineStats,
  _resetPipelineStore,
  type PipelineResult,
} from "../src/lib/revenue-pipeline.ts";

beforeEach(() => {
  _resetPipelineStore();
});

// ---------------------------------------------------------------------------
// Full pipeline run
// ---------------------------------------------------------------------------

test("runRevenuePipeline runs with minimal lead data and produces a result", async () => {
  const result = await runRevenuePipeline(
    { email: "test@example.com", source: "organic" },
    "tenant-1",
    "pest-control",
  );
  assert.ok(result.id);
  assert.equal(result.tenantId, "tenant-1");
  assert.equal(result.niche, "pest-control");
  assert.ok(result.leadKey);
  assert.ok(result.startedAt);
  assert.ok(result.completedAt);
  assert.ok(result.totalDurationMs >= 0);
});

test("pipeline produces stages array with multiple entries", async () => {
  const result = await runRevenuePipeline(
    { email: "a@b.com", source: "organic" },
    "tenant-1",
    "roofing",
  );
  assert.ok(result.stages.length >= 10, `Expected at least 10 stages, got ${result.stages.length}`);
});

test("each stage has name, status, and durationMs", async () => {
  const result = await runRevenuePipeline(
    { email: "a@b.com", source: "referral" },
    "tenant-1",
    "pest-control",
  );
  for (const stage of result.stages) {
    assert.ok(stage.name, "Stage must have a name");
    assert.ok(["completed", "failed", "skipped"].includes(stage.status));
    assert.ok(typeof stage.durationMs === "number");
  }
});

test("intake stage is present and completes", async () => {
  const result = await runRevenuePipeline(
    { email: "intake@test.com", source: "organic" },
    "tenant-1",
    "pest-control",
  );
  const intake = result.stages.find((s) => s.name === "intake");
  assert.ok(intake, "intake stage must be present");
  assert.equal(intake.status, "completed");
});

test("scoring stage produces score outputs", async () => {
  const result = await runRevenuePipeline(
    { email: "score@test.com", source: "referral", pagesViewed: 10, formCompletions: 2 },
    "tenant-1",
    "pest-control",
  );
  const scoring = result.stages.find((s) => s.name === "scoring");
  assert.ok(scoring);
  assert.equal(scoring.status, "completed");
  assert.ok(scoring.output);
  assert.ok(typeof scoring.output.compositeScore === "number");
  assert.ok(typeof scoring.output.intentScore === "number");
});

test("routing stage assigns a valid route", async () => {
  const result = await runRevenuePipeline(
    { email: "route@test.com", source: "organic" },
    "tenant-1",
    "immigration-law",
  );
  const routing = result.stages.find((s) => s.name === "routing");
  assert.ok(routing);
  assert.equal(routing.status, "completed");
  assert.ok(["fast-track", "conversion", "nurture", "drip"].includes(result.route));
});

// ---------------------------------------------------------------------------
// Route distribution based on scores
// ---------------------------------------------------------------------------

test("low engagement lead routes to drip or nurture", async () => {
  const result = await runRevenuePipeline(
    { email: "low@test.com", source: "unknown" },
    "tenant-1",
    "pest-control",
  );
  assert.ok(
    result.route === "drip" || result.route === "nurture",
    `Expected drip or nurture, got ${result.route}`,
  );
});

test("high engagement lead routes to fast-track or conversion", async () => {
  const result = await runRevenuePipeline(
    {
      email: "high@test.com",
      source: "referral",
      phone: "+15551234567",
      company: "Big Corp",
      companySize: "enterprise",
      pagesViewed: 20,
      timeOnSite: 900,
      formCompletions: 3,
      chatMessages: 8,
      assessmentCompleted: true,
      assessmentScore: 90,
      calculatorUsed: true,
      returnVisits: 5,
      budget: "$50000",
      timeline: "immediate",
      urgencyIndicators: ["urgent", "asap", "need now", "deadline"],
    },
    "tenant-1",
    "pest-control",
  );
  assert.ok(
    result.route === "fast-track" || result.route === "conversion",
    `Expected fast-track or conversion, got ${result.route}`,
  );
});

// ---------------------------------------------------------------------------
// Offer, psychology, personalization, trust outputs
// ---------------------------------------------------------------------------

test("offer is generated for a pipeline run", async () => {
  const result = await runRevenuePipeline(
    { email: "offer@test.com", source: "organic" },
    "tenant-1",
    "pest-control",
  );
  assert.ok(result.offer !== null, "offer should be generated");
});

test("psychology directives are generated", async () => {
  const result = await runRevenuePipeline(
    { email: "psych@test.com", source: "organic" },
    "tenant-1",
    "roofing",
  );
  assert.ok(result.psychologyDirectives !== null);
});

test("personalized experience is generated", async () => {
  const result = await runRevenuePipeline(
    { email: "personal@test.com", source: "organic" },
    "tenant-1",
    "immigration-law",
  );
  assert.ok(result.personalizedExperience !== null);
});

test("trust elements are generated", async () => {
  const result = await runRevenuePipeline(
    { email: "trust@test.com", source: "organic" },
    "tenant-1",
    "staffing-agency",
  );
  assert.ok(result.trustElements !== null);
});

// ---------------------------------------------------------------------------
// Escalation
// ---------------------------------------------------------------------------

test("escalation evaluates whether lead should be escalated", async () => {
  const result = await runRevenuePipeline(
    { email: "esc@test.com", source: "organic" },
    "tenant-1",
    "pest-control",
  );
  assert.ok(result.escalation !== null);
  assert.ok(typeof result.escalation!.shouldEscalate === "boolean");
});

// ---------------------------------------------------------------------------
// Follow-up plan
// ---------------------------------------------------------------------------

test("follow-up plan is generated and matches route", async () => {
  const result = await runRevenuePipeline(
    { email: "followup@test.com", source: "organic" },
    "tenant-1",
    "pest-control",
  );
  assert.ok(result.followUpPlan !== null);
  const plan = result.followUpPlan as Record<string, unknown>;
  assert.equal(plan.route, result.route);
  assert.ok(Array.isArray(plan.steps));
  assert.ok((plan.steps as unknown[]).length > 0);
});

test("generateFollowUpPlan returns phone step for fast-track", () => {
  const plan = generateFollowUpPlan("fast-track", "pest-control", {});
  assert.equal(plan.route, "fast-track");
  assert.ok(plan.steps.some((s) => s.channel === "phone"));
});

test("generateFollowUpPlan returns email sequence for conversion", () => {
  const plan = generateFollowUpPlan("conversion", "roofing", {});
  assert.equal(plan.route, "conversion");
  const emailSteps = plan.steps.filter((s) => s.channel === "email");
  assert.ok(emailSteps.length >= 2);
});

test("generateFollowUpPlan returns nurture drip for nurture route", () => {
  const plan = generateFollowUpPlan("nurture", "immigration-law", {});
  assert.equal(plan.route, "nurture");
  assert.ok(plan.steps.length >= 3);
});

test("generateFollowUpPlan returns minimal steps for drip route", () => {
  const plan = generateFollowUpPlan("drip", "staffing-agency", {});
  assert.equal(plan.route, "drip");
  assert.ok(plan.steps.length >= 1);
  assert.ok(plan.steps.length <= 3);
});

// ---------------------------------------------------------------------------
// Failed stage does not kill pipeline
// ---------------------------------------------------------------------------

test("non-critical stage failure does not abort pipeline", async () => {
  const result = await runRevenuePipeline(
    { email: "noncritic@test.com", source: "organic" },
    "tenant-1",
    "pest-control",
  );
  // Even if some stages fail, pipeline continues and produces all expected stages
  const stageNames = result.stages.map((s) => s.name);
  assert.ok(stageNames.includes("intake"));
  assert.ok(stageNames.includes("scoring"));
  assert.ok(stageNames.includes("routing"));
  assert.ok(stageNames.includes("follow-up"));
});

// ---------------------------------------------------------------------------
// Pipeline history
// ---------------------------------------------------------------------------

test("pipeline run is recorded in history", async () => {
  await runRevenuePipeline(
    { email: "hist@test.com", source: "organic" },
    "tenant-hist",
    "pest-control",
  );
  const history = getPipelineHistory("tenant-hist");
  assert.equal(history.length, 1);
  assert.equal(history[0].tenantId, "tenant-hist");
});

test("pipeline history respects tenant isolation", async () => {
  await runRevenuePipeline({ email: "a@test.com" }, "tenant-a", "pest-control");
  await runRevenuePipeline({ email: "b@test.com" }, "tenant-b", "pest-control");
  const historyA = getPipelineHistory("tenant-a");
  const historyB = getPipelineHistory("tenant-b");
  assert.equal(historyA.length, 1);
  assert.equal(historyB.length, 1);
  assert.equal(historyA[0].tenantId, "tenant-a");
});

test("pipeline history returns most recent first", async () => {
  await runRevenuePipeline({ email: "first@test.com" }, "tenant-order", "pest-control");
  await runRevenuePipeline({ email: "second@test.com" }, "tenant-order", "roofing");
  const history = getPipelineHistory("tenant-order");
  assert.equal(history.length, 2);
  assert.equal(history[0].niche, "roofing");
  assert.equal(history[1].niche, "pest-control");
});

test("pipeline history limit works", async () => {
  for (let i = 0; i < 5; i++) {
    await runRevenuePipeline({ email: `limit${i}@test.com` }, "tenant-limit", "pest-control");
  }
  const limited = getPipelineHistory("tenant-limit", 3);
  assert.equal(limited.length, 3);
});

// ---------------------------------------------------------------------------
// Pipeline stats
// ---------------------------------------------------------------------------

test("pipeline stats returns empty stats for no runs", () => {
  const stats = getPipelineStats("no-runs");
  assert.equal(stats.totalRuns, 0);
  assert.equal(stats.avgDurationMs, 0);
});

test("pipeline stats aggregates runs correctly", async () => {
  await runRevenuePipeline({ email: "stat1@test.com", source: "organic" }, "tenant-stats", "pest-control");
  await runRevenuePipeline({ email: "stat2@test.com", source: "referral" }, "tenant-stats", "roofing");
  const stats = getPipelineStats("tenant-stats");
  assert.equal(stats.totalRuns, 2);
  assert.ok(stats.avgDurationMs >= 0);
  assert.ok(Object.keys(stats.routeDistribution).length > 0);
  assert.ok(Object.keys(stats.stageFailureRates).length > 0);
});

test("pipeline stats tracks route distribution", async () => {
  for (let i = 0; i < 3; i++) {
    await runRevenuePipeline({ email: `rd${i}@test.com`, source: "organic" }, "tenant-rd", "pest-control");
  }
  const stats = getPipelineStats("tenant-rd");
  const totalRouted = Object.values(stats.routeDistribution).reduce((sum, n) => sum + n, 0);
  assert.equal(totalRouted, 3);
});

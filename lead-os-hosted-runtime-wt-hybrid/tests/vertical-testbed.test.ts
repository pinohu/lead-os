import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  generateSyntheticLeads,
  runTestbed,
  generateCalibrationReport,
  getTestbedReport,
  _resetTestbedStore,
} from "../src/lib/vertical-testbed.ts";
import { _resetPipelineStore } from "../src/lib/revenue-pipeline.ts";

beforeEach(() => {
  _resetTestbedStore();
  _resetPipelineStore();
});

// ---------------------------------------------------------------------------
// Synthetic lead generation
// ---------------------------------------------------------------------------

test("generateSyntheticLeads creates the requested number of leads", () => {
  const leads = generateSyntheticLeads("pest-control", 15);
  assert.equal(leads.length, 15);
});

test("generateSyntheticLeads for pest-control has niche-specific data", () => {
  const leads = generateSyntheticLeads("pest-control", 10);
  for (const lead of leads) {
    assert.equal(lead.niche, "pest-control");
    assert.ok(lead.email);
    assert.ok(lead.firstName);
    assert.ok(lead.source);
  }
});

test("generateSyntheticLeads for immigration-law creates valid leads", () => {
  const leads = generateSyntheticLeads("immigration-law", 10);
  assert.equal(leads.length, 10);
  assert.ok(leads.every((l) => l.niche === "immigration-law"));
});

test("generateSyntheticLeads for roofing creates valid leads", () => {
  const leads = generateSyntheticLeads("roofing", 8);
  assert.equal(leads.length, 8);
  assert.ok(leads.every((l) => l.niche === "roofing"));
});

test("generateSyntheticLeads for real-estate-syndication creates valid leads", () => {
  const leads = generateSyntheticLeads("real-estate-syndication", 5);
  assert.equal(leads.length, 5);
});

test("generateSyntheticLeads for staffing-agency creates valid leads", () => {
  const leads = generateSyntheticLeads("staffing-agency", 6);
  assert.equal(leads.length, 6);
});

test("synthetic leads have varied intent levels", () => {
  const leads = generateSyntheticLeads("pest-control", 30);
  const withAssessment = leads.filter((l) => l.assessmentCompleted).length;
  const withoutAssessment = leads.filter((l) => !l.assessmentCompleted).length;
  assert.ok(withAssessment > 0, "Should have some high-intent leads with assessments");
  assert.ok(withoutAssessment > 0, "Should have some lower-intent leads without assessments");
});

test("synthetic leads have varied sources", () => {
  const leads = generateSyntheticLeads("immigration-law", 30);
  const sources = new Set(leads.map((l) => l.source));
  assert.ok(sources.size >= 2, `Expected at least 2 unique sources, got ${sources.size}`);
});

test("generateSyntheticLeads falls back to generic for unknown niche", () => {
  const leads = generateSyntheticLeads("unknown-niche", 5);
  assert.equal(leads.length, 5);
  assert.ok(leads.every((l) => l.niche === "unknown-niche"));
});

// ---------------------------------------------------------------------------
// Testbed run
// ---------------------------------------------------------------------------

test("runTestbed runs all leads through pipeline", async () => {
  const report = await runTestbed("pest-control", 5);
  assert.equal(report.sampleSize, 5);
  assert.equal(report.results.length, 5);
  assert.equal(report.nicheSlug, "pest-control");
});

test("testbed report has all required sections", async () => {
  const report = await runTestbed("immigration-law", 5);
  assert.ok(report.id);
  assert.ok(report.routeDistribution);
  assert.ok(report.routePercentages);
  assert.ok(report.averageScores);
  assert.ok(typeof report.averageScores.intent === "number");
  assert.ok(typeof report.averageScores.fit === "number");
  assert.ok(typeof report.averageScores.engagement === "number");
  assert.ok(typeof report.averageScores.urgency === "number");
  assert.ok(typeof report.averageScores.composite === "number");
  assert.ok(report.stageFailureRates);
  assert.ok(typeof report.avgPipelineDurationMs === "number");
  assert.ok(typeof report.escalationRate === "number");
  assert.ok(typeof report.estimatedRevenuePotential === "number");
  assert.ok(Array.isArray(report.recommendations));
  assert.ok(report.recommendations.length > 0);
  assert.ok(report.generatedAt);
});

test("testbed route distribution is non-trivial with enough samples", async () => {
  const report = await runTestbed("roofing", 20);
  const routes = Object.keys(report.routeDistribution);
  assert.ok(routes.length >= 2, `Expected at least 2 routes, got ${routes.length}: ${routes.join(", ")}`);
});

test("testbed report is retrievable by id", async () => {
  const report = await runTestbed("pest-control", 3);
  const retrieved = getTestbedReport(report.id);
  assert.ok(retrieved);
  assert.equal(retrieved!.id, report.id);
  assert.equal(retrieved!.nicheSlug, "pest-control");
});

test("testbed generates recommendations", async () => {
  const report = await runTestbed("staffing-agency", 5);
  assert.ok(report.recommendations.length > 0);
  assert.ok(report.recommendations.every((r) => typeof r === "string" && r.length > 0));
});

// ---------------------------------------------------------------------------
// Calibration report from raw results
// ---------------------------------------------------------------------------

test("generateCalibrationReport handles empty results", () => {
  const report = generateCalibrationReport("test-niche", []);
  assert.equal(report.sampleSize, 0);
  assert.equal(report.avgPipelineDurationMs, 0);
  assert.deepEqual(report.routeDistribution, {});
});

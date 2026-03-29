import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveOwoxConfig,
  isOwoxDryRun,
  trackEvent,
  trackBulkEvents,
  listEvents,
  getAttributionReport,
  getCohortAnalysis,
  getFunnelReport,
  calculateRoas,
  getChannelPerformance,
  getOwoxStats,
  owoxResult,
  resetOwoxStore,
} from "../src/lib/integrations/owox-adapter.ts";
import type {
  MarketingEvent,
  AttributionModel,
  AttributionReport,
  CohortAnalysis,
  FunnelReport,
  ChannelAttribution,
  OwoxStats,
} from "../src/lib/integrations/owox-adapter.ts";

test.beforeEach(() => {
  resetOwoxStore();
  delete process.env.OWOX_API_KEY;
  delete process.env.OWOX_PROJECT_ID;
  delete process.env.OWOX_BASE_URL;
});

// ---------------------------------------------------------------------------
// resolveOwoxConfig
// ---------------------------------------------------------------------------

test("resolveOwoxConfig returns null without env vars", () => {
  const cfg = resolveOwoxConfig();
  assert.equal(cfg, null);
});

test("resolveOwoxConfig returns config with env vars", () => {
  process.env.OWOX_API_KEY = "test-key";
  process.env.OWOX_PROJECT_ID = "proj-1";
  const cfg = resolveOwoxConfig();
  assert.ok(cfg);
  assert.equal(cfg.apiKey, "test-key");
  assert.equal(cfg.projectId, "proj-1");
  assert.equal(cfg.baseUrl, "https://api.owox.com/v1");
});

test("resolveOwoxConfig uses custom base URL", () => {
  process.env.OWOX_API_KEY = "test-key";
  process.env.OWOX_BASE_URL = "https://custom.owox.com/v2";
  const cfg = resolveOwoxConfig();
  assert.ok(cfg);
  assert.equal(cfg.baseUrl, "https://custom.owox.com/v2");
});

// ---------------------------------------------------------------------------
// isOwoxDryRun
// ---------------------------------------------------------------------------

test("isOwoxDryRun returns true without API key", () => {
  assert.equal(isOwoxDryRun(), true);
});

test("isOwoxDryRun returns false with API key", () => {
  process.env.OWOX_API_KEY = "test-key";
  assert.equal(isOwoxDryRun(), false);
});

// ---------------------------------------------------------------------------
// trackEvent
// ---------------------------------------------------------------------------

test("trackEvent creates event with generated id", async () => {
  const event = await trackEvent({
    source: "google",
    medium: "cpc",
    campaign: "spring-sale",
    channel: "paid-search",
    action: "click",
    value: 10,
    tenantId: "tenant-1",
    timestamp: new Date().toISOString(),
  });

  assert.ok(event.id);
  assert.ok(event.id.startsWith("owox_"));
  assert.equal(event.source, "google");
  assert.equal(event.medium, "cpc");
  assert.equal(event.campaign, "spring-sale");
  assert.equal(event.channel, "paid-search");
  assert.equal(event.action, "click");
  assert.equal(event.value, 10);
  assert.equal(event.tenantId, "tenant-1");
  assert.ok(event.timestamp);
});

test("trackEvent generates timestamp when not provided", async () => {
  const before = new Date().toISOString();
  const event = await trackEvent({
    source: "facebook",
    medium: "social",
    channel: "social",
    action: "impression",
    timestamp: "",
  });
  assert.ok(event.timestamp);
});

test("trackEvent stores event retrievable via listEvents", async () => {
  await trackEvent({
    source: "google",
    medium: "cpc",
    channel: "paid-search",
    action: "click",
    timestamp: new Date().toISOString(),
  });

  const events = await listEvents();
  assert.equal(events.length, 1);
  assert.equal(events[0].source, "google");
});

// ---------------------------------------------------------------------------
// trackBulkEvents
// ---------------------------------------------------------------------------

test("trackBulkEvents creates multiple events", async () => {
  const results = await trackBulkEvents([
    { source: "google", medium: "cpc", channel: "paid-search", action: "click", timestamp: new Date().toISOString() },
    { source: "facebook", medium: "social", channel: "social", action: "impression", timestamp: new Date().toISOString() },
    { source: "email", medium: "email", channel: "email", action: "open", timestamp: new Date().toISOString() },
  ]);

  assert.equal(results.length, 3);
  assert.equal(results[0].source, "google");
  assert.equal(results[1].source, "facebook");
  assert.equal(results[2].source, "email");
});

test("trackBulkEvents each event has unique id", async () => {
  const results = await trackBulkEvents([
    { source: "a", medium: "a", channel: "a", action: "click", timestamp: new Date().toISOString() },
    { source: "b", medium: "b", channel: "b", action: "click", timestamp: new Date().toISOString() },
  ]);

  assert.notEqual(results[0].id, results[1].id);
});

test("trackBulkEvents empty array returns empty", async () => {
  const results = await trackBulkEvents([]);
  assert.equal(results.length, 0);
});

// ---------------------------------------------------------------------------
// listEvents
// ---------------------------------------------------------------------------

test("listEvents returns all events without filter", async () => {
  await trackEvent({ source: "google", medium: "cpc", channel: "paid-search", action: "click", timestamp: new Date().toISOString() });
  await trackEvent({ source: "facebook", medium: "social", channel: "social", action: "impression", timestamp: new Date().toISOString() });

  const events = await listEvents();
  assert.equal(events.length, 2);
});

test("listEvents filters by source", async () => {
  await trackEvent({ source: "google", medium: "cpc", channel: "paid-search", action: "click", timestamp: new Date().toISOString() });
  await trackEvent({ source: "facebook", medium: "social", channel: "social", action: "impression", timestamp: new Date().toISOString() });

  const events = await listEvents({ source: "google" });
  assert.equal(events.length, 1);
  assert.equal(events[0].source, "google");
});

test("listEvents filters by channel", async () => {
  await trackEvent({ source: "google", medium: "cpc", channel: "paid-search", action: "click", timestamp: new Date().toISOString() });
  await trackEvent({ source: "facebook", medium: "social", channel: "social", action: "impression", timestamp: new Date().toISOString() });

  const events = await listEvents({ channel: "social" });
  assert.equal(events.length, 1);
  assert.equal(events[0].channel, "social");
});

test("listEvents filters by tenantId", async () => {
  await trackEvent({ source: "google", medium: "cpc", channel: "paid-search", action: "click", tenantId: "t1", timestamp: new Date().toISOString() });
  await trackEvent({ source: "facebook", medium: "social", channel: "social", action: "impression", tenantId: "t2", timestamp: new Date().toISOString() });

  const events = await listEvents({ tenantId: "t1" });
  assert.equal(events.length, 1);
  assert.equal(events[0].tenantId, "t1");
});

test("listEvents filters by date range", async () => {
  await trackEvent({ source: "google", medium: "cpc", channel: "paid-search", action: "click", timestamp: "2025-01-01T00:00:00Z" });
  await trackEvent({ source: "facebook", medium: "social", channel: "social", action: "impression", timestamp: "2025-06-15T00:00:00Z" });

  const events = await listEvents({ dateFrom: "2025-06-01T00:00:00Z" });
  assert.equal(events.length, 1);
  assert.equal(events[0].source, "facebook");
});

test("listEvents filters by dateTo", async () => {
  await trackEvent({ source: "google", medium: "cpc", channel: "paid-search", action: "click", timestamp: "2025-01-01T00:00:00Z" });
  await trackEvent({ source: "facebook", medium: "social", channel: "social", action: "impression", timestamp: "2025-06-15T00:00:00Z" });

  const events = await listEvents({ dateTo: "2025-03-01T00:00:00Z" });
  assert.equal(events.length, 1);
  assert.equal(events[0].source, "google");
});

test("listEvents returns empty for no matches", async () => {
  await trackEvent({ source: "google", medium: "cpc", channel: "paid-search", action: "click", timestamp: new Date().toISOString() });

  const events = await listEvents({ source: "nonexistent" });
  assert.equal(events.length, 0);
});

// ---------------------------------------------------------------------------
// getAttributionReport
// ---------------------------------------------------------------------------

test("getAttributionReport last-click gives 100% to last channel", async () => {
  await trackEvent({ source: "google", medium: "cpc", channel: "paid-search", action: "click", value: 100, timestamp: "2025-01-01T00:00:00Z" });
  await trackEvent({ source: "facebook", medium: "social", channel: "social", action: "conversion", value: 200, timestamp: "2025-01-02T00:00:00Z" });

  const report = await getAttributionReport("last-click", "2025-Q1");
  assert.equal(report.model, "last-click");
  assert.equal(report.period, "2025-Q1");
  assert.ok(report.channels.length > 0);

  const lastChannel = report.channels.find((c) => c.contribution === 100);
  assert.ok(lastChannel);
});

test("getAttributionReport first-click gives 100% to first channel", async () => {
  await trackEvent({ source: "google", medium: "cpc", channel: "paid-search", action: "click", value: 100, timestamp: "2025-01-01T00:00:00Z" });
  await trackEvent({ source: "facebook", medium: "social", channel: "social", action: "click", value: 200, timestamp: "2025-01-02T00:00:00Z" });

  const report = await getAttributionReport("first-click", "2025-Q1");
  const firstChannel = report.channels.find((c) => c.contribution === 100);
  assert.ok(firstChannel);
});

test("getAttributionReport linear distributes evenly", async () => {
  await trackEvent({ source: "google", medium: "cpc", channel: "paid-search", action: "click", value: 100, timestamp: "2025-01-01T00:00:00Z" });
  await trackEvent({ source: "facebook", medium: "social", channel: "social", action: "click", value: 200, timestamp: "2025-01-02T00:00:00Z" });

  const report = await getAttributionReport("linear", "2025-Q1");
  assert.equal(report.channels.length, 2);
  assert.equal(report.channels[0].contribution, 50);
  assert.equal(report.channels[1].contribution, 50);
});

test("getAttributionReport position-based gives 40/40 to first/last", async () => {
  await trackEvent({ source: "google", medium: "cpc", channel: "paid-search", action: "click", value: 100, timestamp: "2025-01-01T00:00:00Z" });
  await trackEvent({ source: "email", medium: "email", channel: "email", action: "click", value: 50, timestamp: "2025-01-02T00:00:00Z" });
  await trackEvent({ source: "facebook", medium: "social", channel: "social", action: "click", value: 200, timestamp: "2025-01-03T00:00:00Z" });

  const report = await getAttributionReport("position-based", "2025-Q1");
  assert.equal(report.channels.length, 3);
  assert.equal(report.channels[0].contribution, 40);
  assert.equal(report.channels[2].contribution, 40);
  assert.equal(report.channels[1].contribution, 20);
});

test("getAttributionReport time-decay increases weight over time", async () => {
  await trackEvent({ source: "google", medium: "cpc", channel: "paid-search", action: "click", value: 100, timestamp: "2025-01-01T00:00:00Z" });
  await trackEvent({ source: "facebook", medium: "social", channel: "social", action: "click", value: 200, timestamp: "2025-01-02T00:00:00Z" });

  const report = await getAttributionReport("time-decay", "2025-Q1");
  assert.equal(report.channels.length, 2);
  assert.ok(report.channels[1].contribution > report.channels[0].contribution);
});

test("getAttributionReport empty events returns empty channels", async () => {
  const report = await getAttributionReport("linear", "2025-Q1");
  assert.equal(report.channels.length, 0);
  assert.equal(report.totalConversions, 0);
  assert.equal(report.totalRevenue, 0);
});

test("getAttributionReport calculates totalRevenue", async () => {
  await trackEvent({ source: "google", medium: "cpc", channel: "paid-search", action: "click", value: 100, timestamp: new Date().toISOString() });
  await trackEvent({ source: "facebook", medium: "social", channel: "social", action: "click", value: 200, timestamp: new Date().toISOString() });

  const report = await getAttributionReport("linear", "2025-Q1");
  assert.equal(report.totalRevenue, 300);
});

test("getAttributionReport filters by tenantId", async () => {
  await trackEvent({ source: "google", medium: "cpc", channel: "paid-search", action: "click", value: 100, tenantId: "t1", timestamp: new Date().toISOString() });
  await trackEvent({ source: "facebook", medium: "social", channel: "social", action: "click", value: 200, tenantId: "t2", timestamp: new Date().toISOString() });

  const report = await getAttributionReport("linear", "2025-Q1", "t1");
  assert.equal(report.channels.length, 1);
  assert.equal(report.totalRevenue, 100);
});

// ---------------------------------------------------------------------------
// getCohortAnalysis
// ---------------------------------------------------------------------------

test("getCohortAnalysis returns cohort with retention curve", async () => {
  await trackEvent({ source: "google", medium: "cpc", channel: "paid-search", action: "click", value: 100, leadId: "lead-1", timestamp: "2025-01-15T00:00:00Z" });
  await trackEvent({ source: "facebook", medium: "social", channel: "social", action: "click", value: 200, leadId: "lead-2", timestamp: "2025-01-20T00:00:00Z" });

  const cohorts = await getCohortAnalysis();
  assert.ok(cohorts.length > 0);
  const cohort = cohorts[0];
  assert.ok(cohort.cohort);
  assert.ok(cohort.size > 0);
  assert.equal(cohort.retention.length, 6);
});

test("getCohortAnalysis groups by month", async () => {
  await trackEvent({ source: "google", medium: "cpc", channel: "paid-search", action: "click", leadId: "lead-1", timestamp: "2025-01-15T00:00:00Z" });
  await trackEvent({ source: "facebook", medium: "social", channel: "social", action: "click", leadId: "lead-2", timestamp: "2025-02-15T00:00:00Z" });

  const cohorts = await getCohortAnalysis();
  assert.equal(cohorts.length, 2);
});

test("getCohortAnalysis returns default cohort when empty", async () => {
  const cohorts = await getCohortAnalysis();
  assert.equal(cohorts.length, 1);
  assert.equal(cohorts[0].size, 0);
  assert.equal(cohorts[0].ltv, 0);
});

test("getCohortAnalysis filters by tenantId", async () => {
  await trackEvent({ source: "google", medium: "cpc", channel: "paid-search", action: "click", leadId: "lead-1", tenantId: "t1", timestamp: "2025-01-15T00:00:00Z" });
  await trackEvent({ source: "facebook", medium: "social", channel: "social", action: "click", leadId: "lead-2", tenantId: "t2", timestamp: "2025-01-15T00:00:00Z" });

  const cohorts = await getCohortAnalysis("t1");
  assert.equal(cohorts.length, 1);
  assert.equal(cohorts[0].size, 1);
});

test("getCohortAnalysis calculates ltv", async () => {
  await trackEvent({ source: "google", medium: "cpc", channel: "paid-search", action: "click", value: 100, leadId: "lead-1", timestamp: "2025-01-15T00:00:00Z" });
  await trackEvent({ source: "facebook", medium: "social", channel: "social", action: "click", value: 200, leadId: "lead-2", timestamp: "2025-01-15T00:00:00Z" });

  const cohorts = await getCohortAnalysis();
  assert.equal(cohorts[0].ltv, 150);
});

// ---------------------------------------------------------------------------
// getFunnelReport
// ---------------------------------------------------------------------------

test("getFunnelReport generates funnel with correct steps", async () => {
  const report = await getFunnelReport("signup", ["Visit", "Register", "Verify", "Activate"]);
  assert.equal(report.name, "signup");
  assert.equal(report.steps.length, 4);
  assert.equal(report.steps[0].name, "Visit");
  assert.equal(report.steps[1].name, "Register");
  assert.equal(report.steps[2].name, "Verify");
  assert.equal(report.steps[3].name, "Activate");
});

test("getFunnelReport has decreasing visitors per step", async () => {
  await trackBulkEvents(
    Array.from({ length: 50 }, (_, i) => ({
      source: "google",
      medium: "cpc",
      channel: "paid-search",
      action: "click",
      timestamp: new Date().toISOString(),
    })),
  );

  const report = await getFunnelReport("purchase", ["Browse", "Cart", "Checkout", "Purchase"]);
  for (let i = 1; i < report.steps.length; i++) {
    assert.ok(report.steps[i].visitors <= report.steps[i - 1].visitors);
  }
});

test("getFunnelReport first step has 100% conversion rate", async () => {
  const report = await getFunnelReport("signup", ["Visit", "Register"]);
  assert.equal(report.steps[0].conversionRate, 100);
});

test("getFunnelReport overall conversion rate is last/first", async () => {
  const report = await getFunnelReport("signup", ["Visit", "Register", "Done"]);
  assert.ok(report.overallConversionRate >= 0);
  assert.ok(report.overallConversionRate <= 100);
});

test("getFunnelReport uses event count as base visitors", async () => {
  await trackBulkEvents(
    Array.from({ length: 25 }, () => ({
      source: "google",
      medium: "cpc",
      channel: "paid-search",
      action: "click",
      timestamp: new Date().toISOString(),
    })),
  );

  const report = await getFunnelReport("test", ["Step1", "Step2"]);
  assert.equal(report.steps[0].visitors, 25);
});

// ---------------------------------------------------------------------------
// calculateRoas
// ---------------------------------------------------------------------------

test("calculateRoas returns channel ROAS", async () => {
  await trackEvent({ source: "google", medium: "cpc", channel: "paid-search", action: "click", value: 100, timestamp: new Date().toISOString() });
  await trackEvent({ source: "google", medium: "cpc", channel: "paid-search", action: "conversion", value: 200, timestamp: new Date().toISOString() });

  const result = await calculateRoas("paid-search");
  assert.equal(result.channel, "paid-search");
  assert.equal(result.revenue, 300);
  assert.equal(result.cost, 90);
  assert.ok(result.roas > 0);
});

test("calculateRoas returns zero for unknown channel", async () => {
  const result = await calculateRoas("nonexistent");
  assert.equal(result.revenue, 0);
  assert.equal(result.cost, 0);
  assert.equal(result.roas, 0);
});

// ---------------------------------------------------------------------------
// getChannelPerformance
// ---------------------------------------------------------------------------

test("getChannelPerformance returns all channels sorted by ROAS", async () => {
  await trackEvent({ source: "google", medium: "cpc", channel: "paid-search", action: "click", value: 100, timestamp: new Date().toISOString() });
  await trackEvent({ source: "facebook", medium: "social", channel: "social", action: "click", value: 50, timestamp: new Date().toISOString() });

  const channels = await getChannelPerformance();
  assert.equal(channels.length, 2);
  assert.ok(channels[0].roas >= channels[1].roas);
});

test("getChannelPerformance calculates contribution percentage", async () => {
  await trackEvent({ source: "google", medium: "cpc", channel: "paid-search", action: "click", value: 100, timestamp: new Date().toISOString() });
  await trackEvent({ source: "google", medium: "cpc", channel: "paid-search", action: "click", value: 50, timestamp: new Date().toISOString() });
  await trackEvent({ source: "facebook", medium: "social", channel: "social", action: "click", value: 50, timestamp: new Date().toISOString() });

  const channels = await getChannelPerformance();
  const totalContribution = channels.reduce((sum, c) => sum + c.contribution, 0);
  assert.ok(Math.abs(totalContribution - 100) < 0.1);
});

test("getChannelPerformance returns empty for no events", async () => {
  const channels = await getChannelPerformance();
  assert.equal(channels.length, 0);
});

// ---------------------------------------------------------------------------
// getOwoxStats
// ---------------------------------------------------------------------------

test("getOwoxStats returns aggregate stats", async () => {
  await trackEvent({ source: "google", medium: "cpc", channel: "paid-search", action: "click", value: 100, timestamp: new Date().toISOString() });
  await trackEvent({ source: "facebook", medium: "social", channel: "social", action: "click", value: 200, timestamp: new Date().toISOString() });

  const stats = await getOwoxStats();
  assert.equal(stats.totalEvents, 2);
  assert.equal(stats.totalChannels, 2);
  assert.equal(stats.totalRevenue, 300);
  assert.ok(stats.avgRoas > 0);
  assert.ok(stats.topChannel === "google" || stats.topChannel === "facebook" || stats.topChannel === "paid-search" || stats.topChannel === "social");
});

test("getOwoxStats returns zeros for empty store", async () => {
  const stats = await getOwoxStats();
  assert.equal(stats.totalEvents, 0);
  assert.equal(stats.totalChannels, 0);
  assert.equal(stats.topChannel, "none");
  assert.equal(stats.avgRoas, 0);
  assert.equal(stats.totalRevenue, 0);
  assert.equal(stats.totalCost, 0);
});

test("getOwoxStats filters by tenantId", async () => {
  await trackEvent({ source: "google", medium: "cpc", channel: "paid-search", action: "click", value: 100, tenantId: "t1", timestamp: new Date().toISOString() });
  await trackEvent({ source: "facebook", medium: "social", channel: "social", action: "click", value: 200, tenantId: "t2", timestamp: new Date().toISOString() });

  const stats = await getOwoxStats("t1");
  assert.equal(stats.totalEvents, 1);
  assert.equal(stats.totalRevenue, 100);
});

test("getOwoxStats identifies top channel", async () => {
  await trackEvent({ source: "google", medium: "cpc", channel: "paid-search", action: "click", value: 100, timestamp: new Date().toISOString() });
  await trackEvent({ source: "google", medium: "cpc", channel: "paid-search", action: "click", value: 100, timestamp: new Date().toISOString() });
  await trackEvent({ source: "facebook", medium: "social", channel: "social", action: "click", value: 50, timestamp: new Date().toISOString() });

  const stats = await getOwoxStats();
  assert.equal(stats.topChannel, "paid-search");
});

// ---------------------------------------------------------------------------
// owoxResult
// ---------------------------------------------------------------------------

test("owoxResult returns dry-run mode without env vars", () => {
  const result = owoxResult("track", "Event tracked");
  assert.equal(result.ok, true);
  assert.equal(result.provider, "OWOX BI");
  assert.equal(result.mode, "dry-run");
  assert.equal(result.detail, "Event tracked");
});

test("owoxResult returns live mode with env vars", () => {
  process.env.OWOX_API_KEY = "test-key";
  const result = owoxResult("track", "Event tracked");
  assert.equal(result.mode, "live");
});

// ---------------------------------------------------------------------------
// resetOwoxStore
// ---------------------------------------------------------------------------

test("resetOwoxStore clears all data", async () => {
  await trackEvent({ source: "google", medium: "cpc", channel: "paid-search", action: "click", timestamp: new Date().toISOString() });

  const before = await listEvents();
  assert.equal(before.length, 1);

  resetOwoxStore();

  const after = await listEvents();
  assert.equal(after.length, 0);
});

// ---------------------------------------------------------------------------
// Data-driven attribution model
// ---------------------------------------------------------------------------

test("getAttributionReport data-driven distributes like linear", async () => {
  await trackEvent({ source: "google", medium: "cpc", channel: "paid-search", action: "click", value: 100, timestamp: "2025-01-01T00:00:00Z" });
  await trackEvent({ source: "facebook", medium: "social", channel: "social", action: "click", value: 200, timestamp: "2025-01-02T00:00:00Z" });

  const report = await getAttributionReport("data-driven", "2025-Q1");
  assert.equal(report.channels.length, 2);
  assert.equal(report.channels[0].contribution, 50);
  assert.equal(report.channels[1].contribution, 50);
});

// ---------------------------------------------------------------------------
// Combined filters
// ---------------------------------------------------------------------------

test("listEvents combines source and channel filters", async () => {
  await trackEvent({ source: "google", medium: "cpc", channel: "paid-search", action: "click", timestamp: new Date().toISOString() });
  await trackEvent({ source: "google", medium: "organic", channel: "organic-search", action: "click", timestamp: new Date().toISOString() });
  await trackEvent({ source: "facebook", medium: "social", channel: "social", action: "click", timestamp: new Date().toISOString() });

  const events = await listEvents({ source: "google", channel: "paid-search" });
  assert.equal(events.length, 1);
  assert.equal(events[0].channel, "paid-search");
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  resolvePlerdyConfig,
  isPlerdyDryRun,
  getHeatmapData,
  listSessionRecordings,
  getSessionRecording,
  runSeoAudit,
  getSeoAuditHistory,
  createConversionFunnel,
  getFunnelAnalytics,
  generateTrackingCode,
  auditLandingPage,
  getPlerdyStats,
  plerdyResult,
  resetPlerdyStore,
  _getPlerdyStoreForTesting,
} from "../src/lib/integrations/plerdy-adapter.ts";

// ---------------------------------------------------------------------------
// resolvePlerdyConfig / isPlerdyDryRun
// ---------------------------------------------------------------------------

test("resolvePlerdyConfig returns null without env vars", () => {
  delete process.env.PLERDY_API_KEY;
  delete process.env.PLERDY_SITE_ID;
  assert.equal(resolvePlerdyConfig(), null);
});

test("isPlerdyDryRun returns true without PLERDY_API_KEY", () => {
  delete process.env.PLERDY_API_KEY;
  assert.equal(isPlerdyDryRun(), true);
});

test("resolvePlerdyConfig returns config when env vars set", () => {
  process.env.PLERDY_API_KEY = "test-key";
  process.env.PLERDY_SITE_ID = "test-site";
  const cfg = resolvePlerdyConfig();
  assert.ok(cfg);
  assert.equal(cfg.apiKey, "test-key");
  assert.equal(cfg.siteId, "test-site");
  assert.equal(cfg.baseUrl, "https://api.plerdy.com/v1");
  delete process.env.PLERDY_API_KEY;
  delete process.env.PLERDY_SITE_ID;
});

test("resolvePlerdyConfig uses custom base URL", () => {
  process.env.PLERDY_API_KEY = "test-key";
  process.env.PLERDY_SITE_ID = "test-site";
  process.env.PLERDY_BASE_URL = "https://custom.plerdy.com/api";
  const cfg = resolvePlerdyConfig();
  assert.ok(cfg);
  assert.equal(cfg.baseUrl, "https://custom.plerdy.com/api");
  delete process.env.PLERDY_API_KEY;
  delete process.env.PLERDY_SITE_ID;
  delete process.env.PLERDY_BASE_URL;
});

test("resolvePlerdyConfig returns null if only apiKey set", () => {
  process.env.PLERDY_API_KEY = "test-key";
  delete process.env.PLERDY_SITE_ID;
  assert.equal(resolvePlerdyConfig(), null);
  delete process.env.PLERDY_API_KEY;
});

// ---------------------------------------------------------------------------
// getHeatmapData
// ---------------------------------------------------------------------------

test("getHeatmapData returns heatmap data in dry-run", async () => {
  resetPlerdyStore();
  const heatmap = await getHeatmapData("https://example.com/page");
  assert.equal(heatmap.url, "https://example.com/page");
  assert.equal(heatmap.device, "desktop");
  assert.equal(heatmap.period, "7d");
  assert.ok(heatmap.clicks.length > 0);
  assert.ok(heatmap.scrollDepth.length > 0);
  assert.ok(heatmap.totalSessions > 0);
});

test("getHeatmapData respects device parameter", async () => {
  resetPlerdyStore();
  const mobile = await getHeatmapData("https://example.com", "mobile");
  assert.equal(mobile.device, "mobile");
});

test("getHeatmapData respects period parameter", async () => {
  resetPlerdyStore();
  const monthly = await getHeatmapData("https://example.com", "desktop", "30d");
  assert.equal(monthly.period, "30d");
});

test("getHeatmapData click points have required fields", async () => {
  resetPlerdyStore();
  const heatmap = await getHeatmapData("https://example.com/test");
  for (const click of heatmap.clicks) {
    assert.equal(typeof click.x, "number");
    assert.equal(typeof click.y, "number");
    assert.equal(typeof click.element, "string");
    assert.equal(typeof click.count, "number");
    assert.ok(click.count > 0);
  }
});

test("getHeatmapData scroll depth values are reasonable", async () => {
  resetPlerdyStore();
  const heatmap = await getHeatmapData("https://example.com/scroll");
  for (const depth of heatmap.scrollDepth) {
    assert.ok(depth >= 0 && depth <= 100, `scroll depth ${depth} out of range`);
  }
});

test("getHeatmapData persists to store", async () => {
  resetPlerdyStore();
  await getHeatmapData("https://example.com/stored");
  const store = _getPlerdyStoreForTesting();
  const entries = [...store.values()].filter((e) => e.type === "heatmap");
  assert.ok(entries.length > 0);
});

test("getHeatmapData is deterministic for same inputs", async () => {
  resetPlerdyStore();
  const a = await getHeatmapData("https://example.com/deterministic", "desktop", "7d");
  resetPlerdyStore();
  const b = await getHeatmapData("https://example.com/deterministic", "desktop", "7d");
  assert.equal(a.totalSessions, b.totalSessions);
  assert.equal(a.clicks.length, b.clicks.length);
});

// ---------------------------------------------------------------------------
// listSessionRecordings
// ---------------------------------------------------------------------------

test("listSessionRecordings returns recordings in dry-run", async () => {
  resetPlerdyStore();
  const recordings = await listSessionRecordings();
  assert.ok(recordings.length >= 10);
});

test("listSessionRecordings filters by url", async () => {
  resetPlerdyStore();
  const recordings = await listSessionRecordings({ url: "/pricing" });
  for (const rec of recordings) {
    assert.equal(rec.url, "/pricing");
  }
});

test("listSessionRecordings filters by device", async () => {
  resetPlerdyStore();
  const recordings = await listSessionRecordings({ device: "mobile" });
  for (const rec of recordings) {
    assert.equal(rec.device, "mobile");
  }
});

test("listSessionRecordings recordings have required fields", async () => {
  resetPlerdyStore();
  const recordings = await listSessionRecordings();
  for (const rec of recordings) {
    assert.equal(typeof rec.id, "string");
    assert.equal(typeof rec.visitorId, "string");
    assert.equal(typeof rec.url, "string");
    assert.equal(typeof rec.duration, "number");
    assert.equal(typeof rec.clicks, "number");
    assert.equal(typeof rec.scrollDepth, "number");
    assert.equal(typeof rec.device, "string");
    assert.equal(typeof rec.country, "string");
    assert.equal(typeof rec.recordedAt, "string");
  }
});

test("listSessionRecordings filters by minDuration", async () => {
  resetPlerdyStore();
  const recordings = await listSessionRecordings({ minDuration: 100 });
  for (const rec of recordings) {
    assert.ok(rec.duration >= 100, `duration ${rec.duration} < 100`);
  }
});

// ---------------------------------------------------------------------------
// getSessionRecording
// ---------------------------------------------------------------------------

test("getSessionRecording returns recording for any ID in dry-run", async () => {
  resetPlerdyStore();
  const rec = await getSessionRecording("rec_test_123");
  assert.ok(rec);
  assert.equal(rec.id, "rec_test_123");
  assert.equal(typeof rec.duration, "number");
});

test("getSessionRecording returns null-safe for unknown ID", async () => {
  resetPlerdyStore();
  const rec = await getSessionRecording("nonexistent_xyz");
  assert.ok(rec);
  assert.equal(rec.id, "nonexistent_xyz");
});

// ---------------------------------------------------------------------------
// runSeoAudit
// ---------------------------------------------------------------------------

test("runSeoAudit returns audit with issues in dry-run", async () => {
  resetPlerdyStore();
  const audit = await runSeoAudit("https://example.com");
  assert.equal(audit.url, "https://example.com");
  assert.equal(typeof audit.score, "number");
  assert.ok(audit.score >= 10 && audit.score <= 100);
  assert.ok(audit.issues.length >= 3);
  assert.ok(audit.auditedAt);
});

test("runSeoAudit issues have correct severity values", async () => {
  resetPlerdyStore();
  const audit = await runSeoAudit("https://example.com/seo-test");
  const validSeverities = new Set(["critical", "warning", "info"]);
  for (const issue of audit.issues) {
    assert.ok(validSeverities.has(issue.severity), `invalid severity: ${issue.severity}`);
    assert.equal(typeof issue.type, "string");
    assert.equal(typeof issue.description, "string");
    assert.equal(typeof issue.recommendation, "string");
  }
});

test("runSeoAudit score penalizes critical issues more", async () => {
  resetPlerdyStore();
  const audit = await runSeoAudit("https://example.com/severity-check");
  const criticals = audit.issues.filter((i) => i.severity === "critical").length;
  if (criticals > 0) {
    assert.ok(audit.score < 100);
  }
});

test("runSeoAudit persists to store", async () => {
  resetPlerdyStore();
  await runSeoAudit("https://example.com/persist-seo");
  const store = _getPlerdyStoreForTesting();
  const audits = [...store.values()].filter((e) => e.type === "seo_audit");
  assert.ok(audits.length > 0);
});

// ---------------------------------------------------------------------------
// getSeoAuditHistory
// ---------------------------------------------------------------------------

test("getSeoAuditHistory returns empty when no audits", async () => {
  resetPlerdyStore();
  const history = await getSeoAuditHistory();
  assert.equal(history.length, 0);
});

test("getSeoAuditHistory returns all audits", async () => {
  resetPlerdyStore();
  await runSeoAudit("https://example.com/a");
  await runSeoAudit("https://example.com/b");
  const history = await getSeoAuditHistory();
  assert.equal(history.length, 2);
});

test("getSeoAuditHistory filters by URL", async () => {
  resetPlerdyStore();
  await runSeoAudit("https://example.com/a");
  await runSeoAudit("https://example.com/b");
  const history = await getSeoAuditHistory("https://example.com/a");
  assert.equal(history.length, 1);
  assert.equal(history[0].url, "https://example.com/a");
});

// ---------------------------------------------------------------------------
// createConversionFunnel
// ---------------------------------------------------------------------------

test("createConversionFunnel creates a funnel", async () => {
  resetPlerdyStore();
  const funnel = await createConversionFunnel({
    name: "Signup Funnel",
    steps: [
      { url: "/", name: "Homepage" },
      { url: "/pricing", name: "Pricing" },
      { url: "/signup", name: "Signup" },
    ],
  });
  assert.ok(funnel.id.startsWith("fun_"));
  assert.equal(funnel.name, "Signup Funnel");
  assert.equal(funnel.steps.length, 3);
});

test("createConversionFunnel has realistic dropoff rates", async () => {
  resetPlerdyStore();
  const funnel = await createConversionFunnel({
    name: "Test Funnel",
    steps: [
      { url: "/step1", name: "Step 1" },
      { url: "/step2", name: "Step 2" },
      { url: "/step3", name: "Step 3" },
      { url: "/step4", name: "Step 4" },
    ],
  });

  assert.equal(funnel.steps[0].dropoffRate, 0);
  for (let i = 1; i < funnel.steps.length; i++) {
    assert.ok(funnel.steps[i].dropoffRate >= 20, `step ${i} dropoff too low: ${funnel.steps[i].dropoffRate}`);
    assert.ok(funnel.steps[i].dropoffRate <= 40, `step ${i} dropoff too high: ${funnel.steps[i].dropoffRate}`);
  }
});

test("createConversionFunnel visitors decrease at each step", async () => {
  resetPlerdyStore();
  const funnel = await createConversionFunnel({
    name: "Decreasing",
    steps: [
      { url: "/a", name: "A" },
      { url: "/b", name: "B" },
      { url: "/c", name: "C" },
    ],
  });

  for (let i = 1; i < funnel.steps.length; i++) {
    assert.ok(funnel.steps[i].visitors < funnel.steps[i - 1].visitors);
  }
});

test("createConversionFunnel stores tenantId", async () => {
  resetPlerdyStore();
  const funnel = await createConversionFunnel({
    name: "Tenant Funnel",
    steps: [{ url: "/", name: "Home" }],
    tenantId: "tenant-123",
  });
  assert.equal(funnel.tenantId, "tenant-123");
});

// ---------------------------------------------------------------------------
// getFunnelAnalytics
// ---------------------------------------------------------------------------

test("getFunnelAnalytics retrieves created funnel", async () => {
  resetPlerdyStore();
  const funnel = await createConversionFunnel({
    name: "Analytics Test",
    steps: [
      { url: "/", name: "Home" },
      { url: "/buy", name: "Buy" },
    ],
  });

  const retrieved = await getFunnelAnalytics(funnel.id);
  assert.ok(retrieved);
  assert.equal(retrieved.id, funnel.id);
  assert.equal(retrieved.name, "Analytics Test");
  assert.equal(retrieved.steps.length, 2);
});

test("getFunnelAnalytics returns null for unknown funnel", async () => {
  resetPlerdyStore();
  const result = await getFunnelAnalytics("fun_nonexistent");
  assert.equal(result, null);
});

// ---------------------------------------------------------------------------
// generateTrackingCode
// ---------------------------------------------------------------------------

test("generateTrackingCode returns valid script tag", () => {
  const code = generateTrackingCode("my-site-id");
  assert.ok(code.includes("<script"));
  assert.ok(code.includes("my-site-id"));
  assert.ok(code.includes("plerdy.com"));
});

test("generateTrackingCode uses env var when no siteId given", () => {
  process.env.PLERDY_SITE_ID = "env-site-id";
  const code = generateTrackingCode();
  assert.ok(code.includes("env-site-id"));
  delete process.env.PLERDY_SITE_ID;
});

test("generateTrackingCode uses placeholder when no config", () => {
  delete process.env.PLERDY_SITE_ID;
  const code = generateTrackingCode();
  assert.ok(code.includes("SITE_ID_PLACEHOLDER"));
});

// ---------------------------------------------------------------------------
// auditLandingPage
// ---------------------------------------------------------------------------

test("auditLandingPage audits /lp/{slug} URL", async () => {
  resetPlerdyStore();
  const audit = await auditLandingPage("summer-promo");
  assert.equal(audit.url, "/lp/summer-promo");
  assert.ok(audit.issues.length > 0);
  assert.ok(audit.score >= 10);
});

test("auditLandingPage stores with tenantId", async () => {
  resetPlerdyStore();
  await auditLandingPage("test-page", "tenant-abc");
  const store = _getPlerdyStoreForTesting();
  const entries = [...store.values()].filter(
    (e) => e.type === "landing_page_audit" && e.tenantId === "tenant-abc",
  );
  assert.ok(entries.length > 0);
});

// ---------------------------------------------------------------------------
// getPlerdyStats
// ---------------------------------------------------------------------------

test("getPlerdyStats returns zeroes on empty store", async () => {
  resetPlerdyStore();
  const stats = await getPlerdyStats();
  assert.equal(stats.totalPages, 0);
  assert.equal(stats.totalSessions, 0);
  assert.equal(stats.avgScrollDepth, 0);
  assert.equal(stats.avgSeoScore, 0);
  assert.equal(stats.topClickedElements.length, 0);
  assert.equal(stats.funnelCount, 0);
});

test("getPlerdyStats aggregates heatmap data", async () => {
  resetPlerdyStore();
  await getHeatmapData("https://example.com/page1");
  await getHeatmapData("https://example.com/page2");
  const stats = await getPlerdyStats();
  assert.ok(stats.totalPages >= 2);
  assert.ok(stats.totalSessions > 0);
  assert.ok(stats.avgScrollDepth > 0);
  assert.ok(stats.topClickedElements.length > 0);
});

test("getPlerdyStats aggregates SEO scores", async () => {
  resetPlerdyStore();
  await runSeoAudit("https://example.com/seo1");
  await runSeoAudit("https://example.com/seo2");
  const stats = await getPlerdyStats();
  assert.ok(stats.avgSeoScore > 0);
});

test("getPlerdyStats counts funnels", async () => {
  resetPlerdyStore();
  await createConversionFunnel({
    name: "F1",
    steps: [{ url: "/", name: "Home" }],
  });
  await createConversionFunnel({
    name: "F2",
    steps: [{ url: "/", name: "Home" }],
  });
  const stats = await getPlerdyStats();
  assert.equal(stats.funnelCount, 2);
});

test("getPlerdyStats filters by tenantId", async () => {
  resetPlerdyStore();
  await createConversionFunnel({
    name: "F1",
    steps: [{ url: "/", name: "Home" }],
    tenantId: "t1",
  });
  await createConversionFunnel({
    name: "F2",
    steps: [{ url: "/", name: "Home" }],
    tenantId: "t2",
  });
  const stats = await getPlerdyStats("t1");
  assert.equal(stats.funnelCount, 1);
});

// ---------------------------------------------------------------------------
// plerdyResult
// ---------------------------------------------------------------------------

test("plerdyResult returns ProviderResult with dry-run mode", () => {
  delete process.env.PLERDY_API_KEY;
  const result = plerdyResult("heatmap", "fetched heatmap data");
  assert.equal(result.ok, true);
  assert.equal(result.provider, "Plerdy");
  assert.equal(result.mode, "dry-run");
  assert.ok(result.detail.includes("heatmap"));
  assert.ok(result.detail.includes("fetched heatmap data"));
});

test("plerdyResult includes payload when provided", () => {
  const result = plerdyResult("seo", "audit done", { score: 85 });
  assert.deepEqual(result.payload, { score: 85 });
});

// ---------------------------------------------------------------------------
// resetPlerdyStore
// ---------------------------------------------------------------------------

test("resetPlerdyStore clears all data", async () => {
  resetPlerdyStore();
  await getHeatmapData("https://example.com/to-clear");
  const storeBefore = _getPlerdyStoreForTesting();
  assert.ok(storeBefore.size > 0);

  resetPlerdyStore();
  assert.equal(_getPlerdyStoreForTesting().size, 0);
});

test("topClickedElements are sorted by clicks descending", async () => {
  resetPlerdyStore();
  await getHeatmapData("https://example.com/sorted-clicks");
  const stats = await getPlerdyStats();
  for (let i = 1; i < stats.topClickedElements.length; i++) {
    assert.ok(
      stats.topClickedElements[i].clicks <= stats.topClickedElements[i - 1].clicks,
      "topClickedElements should be sorted descending",
    );
  }
});

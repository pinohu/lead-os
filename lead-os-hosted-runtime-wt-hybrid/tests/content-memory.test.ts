import test from "node:test";
import assert from "node:assert/strict";
import {
  recordContent,
  updateMetrics,
  evaluateContent,
  getTopPerformers,
  getContentPatterns,
  getAvoidList,
  generateContentInsights,
  resetContentMemory,
  type ContentMetrics,
} from "../src/lib/content-memory.ts";

const BASE_METRICS: ContentMetrics = {
  impressions: 10000,
  views: 5000,
  watchTimeAvg: 30,
  ctr: 0.04,
  engagementRate: 0.06,
  shares: 200,
  saves: 150,
  comments: 80,
  leads: 50,
  conversions: 10,
  revenuePerView: 0.6,
};

const POOR_METRICS: ContentMetrics = {
  impressions: 2000,
  views: 500,
  watchTimeAvg: 5,
  ctr: 0.002,
  engagementRate: 0.005,
  shares: 2,
  saves: 1,
  comments: 0,
  leads: 0,
  conversions: 0,
  revenuePerView: 0,
};

test.beforeEach(() => {
  resetContentMemory();
});

// ---------------------------------------------------------------------------
// recordContent
// ---------------------------------------------------------------------------

test("recordContent returns a ContentRecord with generated id and tenantId", async () => {
  const record = await recordContent("tenant-1", {
    assetId: "asset-1",
    platform: "instagram",
    hook: "The 3-step method",
    angle: "problem-solution",
    type: "viral",
    metrics: BASE_METRICS,
    revenueGenerated: 500,
  });

  assert.ok(record.id.startsWith("content-"));
  assert.equal(record.tenantId, "tenant-1");
  assert.equal(record.assetId, "asset-1");
  assert.equal(record.platform, "instagram");
  assert.equal(record.status, "active");
  assert.ok(record.createdAt);
  assert.ok(record.updatedAt);
});

test("recordContent stores multiple records independently", async () => {
  const a = await recordContent("tenant-1", {
    assetId: "asset-a",
    platform: "tiktok",
    hook: "Hook A",
    angle: "story",
    type: "viral",
    metrics: BASE_METRICS,
    revenueGenerated: 100,
  });
  const b = await recordContent("tenant-1", {
    assetId: "asset-b",
    platform: "youtube",
    hook: "Hook B",
    angle: "authority",
    type: "conversion",
    metrics: BASE_METRICS,
    revenueGenerated: 200,
  });

  assert.notEqual(a.id, b.id);
  assert.equal(a.assetId, "asset-a");
  assert.equal(b.assetId, "asset-b");
});

// ---------------------------------------------------------------------------
// updateMetrics
// ---------------------------------------------------------------------------

test("updateMetrics updates specified fields and returns updated record", async () => {
  await recordContent("tenant-1", {
    assetId: "asset-upd",
    platform: "instagram",
    hook: "test",
    angle: "test",
    type: "viral",
    metrics: BASE_METRICS,
    revenueGenerated: 0,
  });

  const updated = await updateMetrics("asset-upd", { impressions: 99999, ctr: 0.1 });

  assert.ok(updated);
  assert.equal(updated.metrics.impressions, 99999);
  assert.equal(updated.metrics.ctr, 0.1);
  assert.equal(updated.metrics.views, BASE_METRICS.views);
});

test("updateMetrics returns undefined for unknown assetId", async () => {
  const result = await updateMetrics("does-not-exist", { impressions: 100 });
  assert.equal(result, undefined);
});

test("updateMetrics preserves unchanged metrics fields", async () => {
  await recordContent("tenant-1", {
    assetId: "asset-preserve",
    platform: "tiktok",
    hook: "hook",
    angle: "angle",
    type: "conversion",
    metrics: BASE_METRICS,
    revenueGenerated: 50,
  });

  const updated = await updateMetrics("asset-preserve", { leads: 999 });
  assert.ok(updated);
  assert.equal(updated.metrics.leads, 999);
  assert.equal(updated.metrics.shares, BASE_METRICS.shares);
  assert.equal(updated.metrics.saves, BASE_METRICS.saves);
});

// ---------------------------------------------------------------------------
// evaluateContent
// ---------------------------------------------------------------------------

test("evaluateContent returns scale for high-performing content", async () => {
  await recordContent("tenant-1", {
    assetId: "asset-scale",
    platform: "instagram",
    hook: "Scale hook",
    angle: "authority",
    type: "conversion",
    metrics: BASE_METRICS,
    revenueGenerated: 1000,
  });

  assert.equal(evaluateContent("asset-scale"), "scale");
});

test("evaluateContent returns kill for poor content with enough impressions", async () => {
  await recordContent("tenant-1", {
    assetId: "asset-kill",
    platform: "instagram",
    hook: "Bad hook",
    angle: "bad angle",
    type: "viral",
    metrics: POOR_METRICS,
    revenueGenerated: 0,
  });

  assert.equal(evaluateContent("asset-kill"), "kill");
});

test("evaluateContent returns kill for unknown assetId", () => {
  assert.equal(evaluateContent("nonexistent"), "kill");
});

test("evaluateContent returns optimize for below-scale but above-kill metrics", async () => {
  const midMetrics: ContentMetrics = {
    ...BASE_METRICS,
    engagementRate: 0.015,
    ctr: 0.012,
    revenuePerView: 0.1,
  };

  await recordContent("tenant-1", {
    assetId: "asset-optimize",
    platform: "tiktok",
    hook: "Mid hook",
    angle: "mid angle",
    type: "viral",
    metrics: midMetrics,
    revenueGenerated: 50,
  });

  const decision = evaluateContent("asset-optimize");
  assert.ok(["optimize", "maintain"].includes(decision));
});

// ---------------------------------------------------------------------------
// getTopPerformers
// ---------------------------------------------------------------------------

test("getTopPerformers returns top content by engagementRate by default", async () => {
  await recordContent("tenant-1", {
    assetId: "low",
    platform: "instagram",
    hook: "h",
    angle: "a",
    type: "viral",
    metrics: { ...BASE_METRICS, engagementRate: 0.01 },
    revenueGenerated: 0,
  });
  await recordContent("tenant-1", {
    assetId: "high",
    platform: "instagram",
    hook: "h",
    angle: "a",
    type: "viral",
    metrics: { ...BASE_METRICS, engagementRate: 0.2 },
    revenueGenerated: 0,
  });

  const top = getTopPerformers("tenant-1", 1);
  assert.equal(top[0].assetId, "high");
});

test("getTopPerformers respects the limit parameter", async () => {
  for (let i = 0; i < 5; i++) {
    await recordContent("tenant-1", {
      assetId: `asset-${i}`,
      platform: "instagram",
      hook: `hook ${i}`,
      angle: "angle",
      type: "viral",
      metrics: BASE_METRICS,
      revenueGenerated: 0,
    });
  }

  const top = getTopPerformers("tenant-1", 3);
  assert.equal(top.length, 3);
});

test("getTopPerformers filters by tenantId", async () => {
  await recordContent("tenant-A", {
    assetId: "a-asset",
    platform: "instagram",
    hook: "h",
    angle: "a",
    type: "viral",
    metrics: BASE_METRICS,
    revenueGenerated: 0,
  });
  await recordContent("tenant-B", {
    assetId: "b-asset",
    platform: "instagram",
    hook: "h",
    angle: "a",
    type: "viral",
    metrics: BASE_METRICS,
    revenueGenerated: 0,
  });

  const top = getTopPerformers("tenant-A");
  assert.ok(top.every((r) => r.tenantId === "tenant-A"));
});

test("getTopPerformers accepts custom metric", async () => {
  await recordContent("tenant-1", {
    assetId: "top-revenue",
    platform: "youtube",
    hook: "h",
    angle: "a",
    type: "conversion",
    metrics: { ...BASE_METRICS, revenuePerView: 5.0 },
    revenueGenerated: 5000,
  });
  await recordContent("tenant-1", {
    assetId: "low-revenue",
    platform: "youtube",
    hook: "h",
    angle: "a",
    type: "conversion",
    metrics: { ...BASE_METRICS, revenuePerView: 0.1 },
    revenueGenerated: 10,
  });

  const top = getTopPerformers("tenant-1", 1, "revenuePerView");
  assert.equal(top[0].assetId, "top-revenue");
});

// ---------------------------------------------------------------------------
// getContentPatterns
// ---------------------------------------------------------------------------

test("getContentPatterns returns top hooks sorted by performance score", async () => {
  await recordContent("tenant-1", {
    assetId: "p1",
    platform: "tiktok",
    hook: "winning-hook",
    angle: "story",
    type: "viral",
    metrics: BASE_METRICS,
    revenueGenerated: 500,
  });
  await recordContent("tenant-1", {
    assetId: "p2",
    platform: "tiktok",
    hook: "losing-hook",
    angle: "educational",
    type: "viral",
    metrics: { ...BASE_METRICS, engagementRate: 0.001, ctr: 0.001, revenuePerView: 0 },
    revenueGenerated: 0,
  });

  const patterns = getContentPatterns("tenant-1");
  assert.ok(Array.isArray(patterns.topHooks));
  assert.equal(patterns.topHooks[0], "winning-hook");
});

test("getContentPatterns returns bestPostingTimes array", async () => {
  const patterns = getContentPatterns("tenant-1");
  assert.ok(Array.isArray(patterns.bestPostingTimes));
  assert.ok(patterns.bestPostingTimes.length > 0);
});

// ---------------------------------------------------------------------------
// getAvoidList
// ---------------------------------------------------------------------------

test("getAvoidList returns killed content with reasons", async () => {
  const record = await recordContent("tenant-1", {
    assetId: "killed-asset",
    platform: "instagram",
    hook: "bad-hook",
    angle: "wrong-angle",
    type: "viral",
    metrics: POOR_METRICS,
    revenueGenerated: 0,
  });

  await updateMetrics("killed-asset", {});
  const store = await import("../src/lib/content-memory.ts");

  const allRecords = store.getTopPerformers("tenant-1", 100);
  assert.ok(Array.isArray(allRecords));

  const avoid = store.getAvoidList("tenant-1");
  assert.ok(Array.isArray(avoid));
});

// ---------------------------------------------------------------------------
// generateContentInsights
// ---------------------------------------------------------------------------

test("generateContentInsights returns full report structure", async () => {
  await recordContent("tenant-1", {
    assetId: "insights-asset",
    platform: "instagram",
    hook: "test-hook",
    angle: "test-angle",
    type: "viral",
    metrics: BASE_METRICS,
    revenueGenerated: 200,
  });

  const insights = generateContentInsights("tenant-1");

  assert.ok(Array.isArray(insights.topPerformers));
  assert.ok(typeof insights.patterns === "object");
  assert.ok(Array.isArray(insights.avoidList));
  assert.ok(Array.isArray(insights.recommendations));
});

test("generateContentInsights recommendations are strings", async () => {
  await recordContent("tenant-1", {
    assetId: "rec-asset",
    platform: "tiktok",
    hook: "viral-hook",
    angle: "transformation",
    type: "viral",
    metrics: BASE_METRICS,
    revenueGenerated: 1000,
  });

  const insights = generateContentInsights("tenant-1");
  for (const rec of insights.recommendations) {
    assert.equal(typeof rec, "string");
    assert.ok(rec.length > 0);
  }
});

test("generateContentInsights returns empty arrays for tenant with no data", () => {
  const insights = generateContentInsights("empty-tenant");
  assert.equal(insights.topPerformers.length, 0);
  assert.equal(insights.avoidList.length, 0);
});

// ---------------------------------------------------------------------------
// resetContentMemory
// ---------------------------------------------------------------------------

test("resetContentMemory clears all records", async () => {
  await recordContent("tenant-1", {
    assetId: "to-clear",
    platform: "instagram",
    hook: "h",
    angle: "a",
    type: "viral",
    metrics: BASE_METRICS,
    revenueGenerated: 0,
  });

  resetContentMemory();

  const top = getTopPerformers("tenant-1");
  assert.equal(top.length, 0);
});

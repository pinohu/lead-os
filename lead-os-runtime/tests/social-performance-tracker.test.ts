import test from "node:test";
import assert from "node:assert/strict";
import {
  trackPost,
  updatePostMetrics,
  getTrackedPosts,
  getPostsByPlatform,
  calculateContentROI,
  identifyWinningPatterns,
  getPerformanceSummary,
  _resetStores,
} from "../src/lib/social-performance-tracker.ts";

test.beforeEach(() => {
  _resetStores();
});

function makePost(overrides: Record<string, unknown> = {}) {
  return {
    platform: "tiktok",
    contentId: `content-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    topic: "pest control",
    hookType: "question",
    metrics: {
      views: 10000,
      likes: 500,
      comments: 50,
      shares: 100,
      saves: 75,
      clickThroughRate: 0.03,
      leadConversions: 5,
      revenue: 500,
    },
    publishedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// trackPost
// ---------------------------------------------------------------------------

test("trackPost creates a tracked post with generated id", () => {
  const tenantId = `perf-track-${Date.now()}`;
  const post = trackPost(tenantId, makePost());
  assert.ok(post.id.length > 0);
  assert.equal(post.tenantId, tenantId);
  assert.equal(post.platform, "tiktok");
  assert.ok(post.lastUpdatedAt.length > 0);
});

test("trackPost stores multiple posts for same tenant", () => {
  const tenantId = `perf-multi-${Date.now()}`;
  trackPost(tenantId, makePost());
  trackPost(tenantId, makePost({ platform: "linkedin" }));
  const posts = getTrackedPosts(tenantId);
  assert.equal(posts.length, 2);
});

// ---------------------------------------------------------------------------
// updatePostMetrics
// ---------------------------------------------------------------------------

test("updatePostMetrics updates specific metrics", () => {
  const tenantId = `perf-update-${Date.now()}`;
  const post = trackPost(tenantId, makePost());
  const updated = updatePostMetrics(tenantId, post.id, { views: 50000, likes: 3000 });
  assert.ok(updated);
  assert.equal(updated.metrics.views, 50000);
  assert.equal(updated.metrics.likes, 3000);
  assert.equal(updated.metrics.comments, 50);
});

test("updatePostMetrics returns undefined for unknown post", () => {
  const tenantId = `perf-noupdate-${Date.now()}`;
  const result = updatePostMetrics(tenantId, "bad-id", { views: 100 });
  assert.equal(result, undefined);
});

// ---------------------------------------------------------------------------
// getPostsByPlatform
// ---------------------------------------------------------------------------

test("getPostsByPlatform filters correctly", () => {
  const tenantId = `perf-plat-${Date.now()}`;
  trackPost(tenantId, makePost({ platform: "tiktok" }));
  trackPost(tenantId, makePost({ platform: "linkedin" }));
  trackPost(tenantId, makePost({ platform: "tiktok" }));
  const tikPosts = getPostsByPlatform(tenantId, "tiktok");
  assert.equal(tikPosts.length, 2);
});

// ---------------------------------------------------------------------------
// calculateContentROI
// ---------------------------------------------------------------------------

test("calculateContentROI computes correct metrics with cost", () => {
  const tenantId = `perf-roi-${Date.now()}`;
  const post = trackPost(tenantId, makePost({ metrics: { views: 10000, likes: 500, comments: 50, shares: 100, saves: 75, clickThroughRate: 0.03, leadConversions: 10, revenue: 1000 } }));
  const roi = calculateContentROI(post, 200);
  assert.equal(roi.leadsPerPost, 10);
  assert.equal(roi.revenuePerPost, 1000);
  assert.equal(roi.roi, 4);
  assert.equal(roi.costPerLead, 20);
});

test("calculateContentROI returns 999 roi for zero cost with revenue", () => {
  const tenantId = `perf-roi-free-${Date.now()}`;
  const post = trackPost(tenantId, makePost({ metrics: { views: 1000, likes: 50, comments: 5, shares: 10, saves: 5, clickThroughRate: 0.02, leadConversions: 2, revenue: 200 } }));
  const roi = calculateContentROI(post, 0);
  assert.equal(roi.roi, 999);
});

test("calculateContentROI returns 0 roi for zero cost and zero revenue", () => {
  const tenantId = `perf-roi-zero-${Date.now()}`;
  const post = trackPost(tenantId, makePost({ metrics: { views: 1000, likes: 50, comments: 5, shares: 10, saves: 5, clickThroughRate: 0.02, leadConversions: 0, revenue: 0 } }));
  const roi = calculateContentROI(post, 0);
  assert.equal(roi.roi, 0);
});

// ---------------------------------------------------------------------------
// identifyWinningPatterns
// ---------------------------------------------------------------------------

test("identifyWinningPatterns groups by hook type", () => {
  const tenantId = `perf-patterns-${Date.now()}`;
  trackPost(tenantId, makePost({ hookType: "question" }));
  trackPost(tenantId, makePost({ hookType: "question" }));
  trackPost(tenantId, makePost({ hookType: "story" }));
  trackPost(tenantId, makePost({ hookType: "story" }));
  const patterns = identifyWinningPatterns(tenantId);
  assert.ok(patterns.length >= 2);
  const questionPattern = patterns.find((p) => p.pattern === "hook-type:question");
  assert.ok(questionPattern);
  assert.equal(questionPattern.occurrences, 2);
});

test("identifyWinningPatterns returns empty for no data", () => {
  const patterns = identifyWinningPatterns(`unknown-${Date.now()}`);
  assert.equal(patterns.length, 0);
});

// ---------------------------------------------------------------------------
// getPerformanceSummary
// ---------------------------------------------------------------------------

test("getPerformanceSummary aggregates all metrics", () => {
  const tenantId = `perf-summary-${Date.now()}`;
  trackPost(tenantId, makePost({ metrics: { views: 10000, likes: 500, comments: 50, shares: 100, saves: 75, clickThroughRate: 0.03, leadConversions: 5, revenue: 500 } }));
  trackPost(tenantId, makePost({ platform: "linkedin", metrics: { views: 5000, likes: 200, comments: 20, shares: 50, saves: 30, clickThroughRate: 0.02, leadConversions: 3, revenue: 300 } }));
  const summary = getPerformanceSummary(tenantId);
  assert.equal(summary.totalPosts, 2);
  assert.equal(summary.totalViews, 15000);
  assert.equal(summary.totalLeads, 8);
  assert.equal(summary.totalRevenue, 800);
  assert.ok(summary.platformBreakdown.tiktok.posts === 1);
  assert.ok(summary.platformBreakdown.linkedin.posts === 1);
});

test("getPerformanceSummary returns zeros for unknown tenant", () => {
  const summary = getPerformanceSummary(`unknown-${Date.now()}`);
  assert.equal(summary.totalPosts, 0);
  assert.equal(summary.totalViews, 0);
  assert.equal(summary.avgEngagementRate, 0);
});

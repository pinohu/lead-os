import test from "node:test";
import assert from "node:assert/strict";
import {
  recordContent,
  getContentByTenant,
  getContentByPlatform,
  updateContentMetrics,
  updateContentStatus,
  isDuplicate,
  isSimilarHook,
  analyzeTopicExhaustion,
  getMemorySummary,
  _resetStores,
} from "../src/lib/social-content-memory.ts";

test.beforeEach(() => {
  _resetStores();
});

function makeEntry(overrides: Record<string, unknown> = {}) {
  return {
    platform: "tiktok",
    topic: "pest control tips",
    hookText: "Nobody tells you this about pest control",
    angleText: "Expose the hidden truth about pest treatments",
    status: "published" as const,
    metrics: {
      views: 10000,
      likes: 500,
      comments: 50,
      shares: 100,
      saves: 75,
      clickThroughRate: 0.03,
      engagementRate: 0.07,
    },
    publishedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// recordContent
// ---------------------------------------------------------------------------

test("recordContent creates an entry with generated id and fingerprint", () => {
  const tenantId = `mem-record-${Date.now()}`;
  const entry = recordContent(tenantId, makeEntry());
  assert.ok(entry.id.length > 0);
  assert.equal(entry.tenantId, tenantId);
  assert.ok(entry.fingerprint.topicHash.length > 0);
  assert.ok(entry.fingerprint.hookHash.length > 0);
  assert.ok(entry.fingerprint.angleHash.length > 0);
});

test("recordContent stores entry retrievable by tenant", () => {
  const tenantId = `mem-retrieve-${Date.now()}`;
  recordContent(tenantId, makeEntry());
  recordContent(tenantId, makeEntry({ hookText: "Different hook" }));
  const entries = getContentByTenant(tenantId);
  assert.equal(entries.length, 2);
});

// ---------------------------------------------------------------------------
// getContentByPlatform
// ---------------------------------------------------------------------------

test("getContentByPlatform filters correctly", () => {
  const tenantId = `mem-platform-${Date.now()}`;
  recordContent(tenantId, makeEntry({ platform: "tiktok" }));
  recordContent(tenantId, makeEntry({ platform: "linkedin" }));
  recordContent(tenantId, makeEntry({ platform: "tiktok" }));
  const tiktok = getContentByPlatform(tenantId, "tiktok");
  assert.equal(tiktok.length, 2);
});

// ---------------------------------------------------------------------------
// updateContentMetrics
// ---------------------------------------------------------------------------

test("updateContentMetrics updates metrics on existing entry", () => {
  const tenantId = `mem-update-${Date.now()}`;
  const entry = recordContent(tenantId, makeEntry());
  const updated = updateContentMetrics(tenantId, entry.id, { views: 50000, likes: 2000 });
  assert.ok(updated);
  assert.equal(updated.metrics.views, 50000);
  assert.equal(updated.metrics.likes, 2000);
  assert.equal(updated.metrics.comments, 50);
});

test("updateContentMetrics returns undefined for non-existent id", () => {
  const tenantId = `mem-missing-${Date.now()}`;
  const result = updateContentMetrics(tenantId, "nope", { views: 100 });
  assert.equal(result, undefined);
});

// ---------------------------------------------------------------------------
// updateContentStatus
// ---------------------------------------------------------------------------

test("updateContentStatus changes status and sets publishedAt", () => {
  const tenantId = `mem-status-${Date.now()}`;
  const entry = recordContent(tenantId, makeEntry({ status: "draft", publishedAt: null }));
  const updated = updateContentStatus(tenantId, entry.id, "published");
  assert.ok(updated);
  assert.equal(updated.status, "published");
  assert.ok(updated.publishedAt !== null);
});

// ---------------------------------------------------------------------------
// Duplicate detection
// ---------------------------------------------------------------------------

test("isDuplicate detects exact duplicate content", () => {
  const tenantId = `mem-dup-${Date.now()}`;
  recordContent(tenantId, makeEntry());
  const result = isDuplicate(tenantId, "pest control tips", "Nobody tells you this about pest control", "Expose the hidden truth about pest treatments");
  assert.equal(result, true);
});

test("isDuplicate returns false for different content", () => {
  const tenantId = `mem-nodup-${Date.now()}`;
  recordContent(tenantId, makeEntry());
  const result = isDuplicate(tenantId, "different topic", "different hook", "different angle");
  assert.equal(result, false);
});

test("isSimilarHook detects matching hook text", () => {
  const tenantId = `mem-simhook-${Date.now()}`;
  recordContent(tenantId, makeEntry());
  const result = isSimilarHook(tenantId, "Nobody tells you this about pest control");
  assert.equal(result, true);
});

// ---------------------------------------------------------------------------
// Topic exhaustion
// ---------------------------------------------------------------------------

test("analyzeTopicExhaustion identifies exhausted topics", () => {
  const tenantId = `mem-exhaust-${Date.now()}`;
  for (let i = 0; i < 6; i++) {
    recordContent(tenantId, makeEntry({
      hookText: `hook ${i}`,
      angleText: `angle ${i}`,
      metrics: { views: 1000, likes: 2, comments: 0, shares: 0, saves: 0, clickThroughRate: 0.001, engagementRate: 0.002 },
    }));
  }
  const exhaustion = analyzeTopicExhaustion(tenantId);
  assert.ok(exhaustion.length > 0);
  const topic = exhaustion.find((t) => t.topic === "pest control tips");
  assert.ok(topic);
  assert.equal(topic.trend, "exhausted");
});

// ---------------------------------------------------------------------------
// Memory summary
// ---------------------------------------------------------------------------

test("getMemorySummary returns correct structure", () => {
  const tenantId = `mem-summary-${Date.now()}`;
  recordContent(tenantId, makeEntry());
  recordContent(tenantId, makeEntry({ platform: "linkedin", hookText: "different hook", angleText: "different angle" }));
  const summary = getMemorySummary(tenantId);
  assert.equal(summary.tenantId, tenantId);
  assert.equal(summary.totalEntries, 2);
  assert.equal(summary.publishedCount, 2);
  assert.ok(summary.platformBreakdown.tiktok === 1);
  assert.ok(summary.platformBreakdown.linkedin === 1);
  assert.ok(Array.isArray(summary.recentEntries));
});

test("getMemorySummary returns empty for unknown tenant", () => {
  const summary = getMemorySummary(`unknown-${Date.now()}`);
  assert.equal(summary.totalEntries, 0);
  assert.equal(summary.publishedCount, 0);
});

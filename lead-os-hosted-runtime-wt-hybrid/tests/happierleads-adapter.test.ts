import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveHappierleadsConfig,
  isHappierleadsDryRun,
  getIdentifiedVisitors,
  getVisitorDetail,
  recordVisitor,
  getVisitorByDomain,
  getHotVisitors,
  getVisitorStats,
  generateTrackingSnippet,
  convertVisitorToLead,
  syncVisitors,
  happierleadsResult,
  resetHappierleadsStore,
  type IdentifiedVisitor,
  type VisitorFilter,
  type VisitorStats,
  type TrackingSnippet,
} from "../src/lib/integrations/happierleads-adapter.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cleanup() {
  resetHappierleadsStore();
  delete process.env.HAPPIERLEADS_API_KEY;
  delete process.env.HAPPIERLEADS_BASE_URL;
  delete process.env.HAPPIERLEADS_SITE_ID;
}

function makeSampleVisitor(overrides: Partial<Omit<IdentifiedVisitor, "id">> = {}): Omit<IdentifiedVisitor, "id"> {
  return {
    companyName: "Test Corp",
    domain: "testcorp.com",
    industry: "Technology",
    size: "51-200",
    location: "New York, NY",
    country: "US",
    pageViews: [
      { url: "/pricing", title: "Pricing", duration: 120, timestamp: "2026-03-28T10:00:00Z" },
    ],
    totalVisits: 5,
    firstVisitAt: "2026-03-20T08:00:00Z",
    lastVisitAt: "2026-03-28T10:00:00Z",
    engagementScore: 75,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

test("resolveHappierleadsConfig returns null when no API key", () => {
  cleanup();
  const cfg = resolveHappierleadsConfig();
  assert.equal(cfg, null);
});

test("resolveHappierleadsConfig returns config when API key set", () => {
  cleanup();
  process.env.HAPPIERLEADS_API_KEY = "test-key-123";
  process.env.HAPPIERLEADS_SITE_ID = "site-abc";
  const cfg = resolveHappierleadsConfig();
  assert.ok(cfg);
  assert.equal(cfg.apiKey, "test-key-123");
  assert.equal(cfg.baseUrl, "https://api.happierleads.com/v1");
  assert.equal(cfg.siteId, "site-abc");
  cleanup();
});

test("resolveHappierleadsConfig uses custom base URL", () => {
  cleanup();
  process.env.HAPPIERLEADS_API_KEY = "key";
  process.env.HAPPIERLEADS_BASE_URL = "https://custom.api.com/v2";
  const cfg = resolveHappierleadsConfig();
  assert.ok(cfg);
  assert.equal(cfg.baseUrl, "https://custom.api.com/v2");
  cleanup();
});

// ---------------------------------------------------------------------------
// Dry-run detection
// ---------------------------------------------------------------------------

test("isHappierleadsDryRun returns true when no API key", () => {
  cleanup();
  assert.equal(isHappierleadsDryRun(), true);
});

test("isHappierleadsDryRun returns false when API key present", () => {
  cleanup();
  process.env.HAPPIERLEADS_API_KEY = "key";
  assert.equal(isHappierleadsDryRun(), false);
  cleanup();
});

// ---------------------------------------------------------------------------
// Dry-run visitor identification
// ---------------------------------------------------------------------------

test("getIdentifiedVisitors returns 10+ visitors in dry-run", async () => {
  cleanup();
  const visitors = await getIdentifiedVisitors();
  assert.ok(visitors.length >= 10, `Expected at least 10 visitors, got ${visitors.length}`);
  cleanup();
});

test("dry-run visitors have realistic company data", async () => {
  cleanup();
  const visitors = await getIdentifiedVisitors();
  for (const v of visitors) {
    assert.ok(v.id.length > 0, "id should not be empty");
    assert.ok(v.companyName.length > 0, "companyName should not be empty");
    assert.ok(v.domain.length > 0, "domain should not be empty");
    assert.ok(v.industry.length > 0, "industry should not be empty");
    assert.ok(v.country.length > 0, "country should not be empty");
    assert.ok(v.pageViews.length > 0, "should have at least one page view");
    assert.ok(v.engagementScore >= 0 && v.engagementScore <= 100, "engagement score in 0-100");
  }
  cleanup();
});

test("dry-run visitors have page views with required fields", async () => {
  cleanup();
  const visitors = await getIdentifiedVisitors();
  for (const v of visitors) {
    for (const pv of v.pageViews) {
      assert.ok(pv.url.length > 0, "page view url required");
      assert.ok(pv.title.length > 0, "page view title required");
      assert.ok(typeof pv.duration === "number", "duration must be number");
      assert.ok(pv.timestamp.length > 0, "timestamp required");
    }
  }
  cleanup();
});

// ---------------------------------------------------------------------------
// Filtering by engagement
// ---------------------------------------------------------------------------

test("filter by minEngagement returns only high-engagement visitors", async () => {
  cleanup();
  const visitors = await getIdentifiedVisitors({ minEngagement: 80 });
  assert.ok(visitors.length > 0, "should have some high-engagement visitors");
  for (const v of visitors) {
    assert.ok(v.engagementScore >= 80, `Expected score >= 80, got ${v.engagementScore}`);
  }
  cleanup();
});

test("filter by minEngagement 100 may return empty", async () => {
  cleanup();
  const visitors = await getIdentifiedVisitors({ minEngagement: 100 });
  for (const v of visitors) {
    assert.ok(v.engagementScore >= 100);
  }
  cleanup();
});

// ---------------------------------------------------------------------------
// Filtering by industry
// ---------------------------------------------------------------------------

test("filter by industry returns matching visitors", async () => {
  cleanup();
  const visitors = await getIdentifiedVisitors({ industry: "Technology" });
  assert.ok(visitors.length > 0, "should have Technology companies");
  for (const v of visitors) {
    assert.equal(v.industry.toLowerCase(), "technology");
  }
  cleanup();
});

test("filter by industry is case insensitive", async () => {
  cleanup();
  const upper = await getIdentifiedVisitors({ industry: "TECHNOLOGY" });
  const lower = await getIdentifiedVisitors({ industry: "technology" });
  assert.equal(upper.length, lower.length);
  cleanup();
});

// ---------------------------------------------------------------------------
// Filtering by location
// ---------------------------------------------------------------------------

test("filter by location returns matching visitors", async () => {
  cleanup();
  const visitors = await getIdentifiedVisitors({ location: "San Francisco" });
  assert.ok(visitors.length > 0, "should have SF visitors");
  for (const v of visitors) {
    assert.ok(v.location.toLowerCase().includes("san francisco"));
  }
  cleanup();
});

// ---------------------------------------------------------------------------
// Filtering by date
// ---------------------------------------------------------------------------

test("filter by dateFrom excludes older visitors", async () => {
  cleanup();
  const all = await getIdentifiedVisitors();
  const filtered = await getIdentifiedVisitors({ dateFrom: "2026-03-28T00:00:00Z" });
  assert.ok(filtered.length < all.length, "dateFrom should reduce the result set");
  for (const v of filtered) {
    assert.ok(new Date(v.lastVisitAt).getTime() >= new Date("2026-03-28T00:00:00Z").getTime());
  }
  cleanup();
});

test("filter by dateTo excludes newer visitors", async () => {
  cleanup();
  const filtered = await getIdentifiedVisitors({ dateTo: "2026-03-25T00:00:00Z" });
  for (const v of filtered) {
    assert.ok(new Date(v.lastVisitAt).getTime() <= new Date("2026-03-25T00:00:00Z").getTime());
  }
  cleanup();
});

// ---------------------------------------------------------------------------
// Filtering by minVisits
// ---------------------------------------------------------------------------

test("filter by minVisits returns visitors with enough visits", async () => {
  cleanup();
  const visitors = await getIdentifiedVisitors({ minVisits: 10 });
  assert.ok(visitors.length > 0);
  for (const v of visitors) {
    assert.ok(v.totalVisits >= 10, `Expected >= 10 visits, got ${v.totalVisits}`);
  }
  cleanup();
});

// ---------------------------------------------------------------------------
// Combined filters
// ---------------------------------------------------------------------------

test("multiple filters combine correctly", async () => {
  cleanup();
  const visitors = await getIdentifiedVisitors({
    minEngagement: 70,
    industry: "Technology",
  });
  assert.ok(visitors.length > 0);
  for (const v of visitors) {
    assert.ok(v.engagementScore >= 70);
    assert.equal(v.industry.toLowerCase(), "technology");
  }
  cleanup();
});

// ---------------------------------------------------------------------------
// Hot Visitors
// ---------------------------------------------------------------------------

test("getHotVisitors returns visitors with engagement >= 70 by default", async () => {
  cleanup();
  const hot = await getHotVisitors();
  assert.ok(hot.length > 0);
  for (const v of hot) {
    assert.ok(v.engagementScore >= 70, `Expected >= 70, got ${v.engagementScore}`);
  }
  cleanup();
});

test("getHotVisitors accepts custom threshold", async () => {
  cleanup();
  const hot = await getHotVisitors(90);
  for (const v of hot) {
    assert.ok(v.engagementScore >= 90, `Expected >= 90, got ${v.engagementScore}`);
  }
  cleanup();
});

// ---------------------------------------------------------------------------
// Visitor Detail
// ---------------------------------------------------------------------------

test("getVisitorDetail returns visitor by id in dry-run", async () => {
  cleanup();
  const visitors = await getIdentifiedVisitors();
  const first = visitors[0];
  const detail = await getVisitorDetail(first.id);
  assert.ok(detail);
  assert.equal(detail.id, first.id);
  assert.equal(detail.companyName, first.companyName);
  cleanup();
});

test("getVisitorDetail returns null for unknown id", async () => {
  cleanup();
  const detail = await getVisitorDetail("nonexistent_id");
  assert.equal(detail, null);
  cleanup();
});

// ---------------------------------------------------------------------------
// Domain Lookup
// ---------------------------------------------------------------------------

test("getVisitorByDomain finds visitor by domain", async () => {
  cleanup();
  await getIdentifiedVisitors();
  const visitor = await getVisitorByDomain("acme.com");
  assert.ok(visitor);
  assert.equal(visitor.domain, "acme.com");
  assert.equal(visitor.companyName, "Acme Corp");
  cleanup();
});

test("getVisitorByDomain is case insensitive", async () => {
  cleanup();
  await getIdentifiedVisitors();
  const visitor = await getVisitorByDomain("ACME.COM");
  assert.ok(visitor);
  assert.equal(visitor.domain, "acme.com");
  cleanup();
});

test("getVisitorByDomain returns null for unknown domain", async () => {
  cleanup();
  const visitor = await getVisitorByDomain("nonexistent.xyz");
  assert.equal(visitor, null);
  cleanup();
});

// ---------------------------------------------------------------------------
// Record Visitor
// ---------------------------------------------------------------------------

test("recordVisitor stores a new visitor and returns it with id", async () => {
  cleanup();
  const input = makeSampleVisitor();
  const recorded = await recordVisitor(input);
  assert.ok(recorded.id.startsWith("hl_"));
  assert.equal(recorded.companyName, "Test Corp");
  assert.equal(recorded.domain, "testcorp.com");

  const retrieved = await getVisitorDetail(recorded.id);
  assert.ok(retrieved);
  assert.equal(retrieved.companyName, "Test Corp");
  cleanup();
});

test("recordVisitor assigns unique ids", async () => {
  cleanup();
  const a = await recordVisitor(makeSampleVisitor({ companyName: "Alpha" }));
  const b = await recordVisitor(makeSampleVisitor({ companyName: "Beta" }));
  assert.notEqual(a.id, b.id);
  cleanup();
});

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

test("getVisitorStats returns correct aggregate data", async () => {
  cleanup();
  const stats = await getVisitorStats();
  assert.ok(stats.totalIdentified >= 10);
  assert.ok(stats.totalPageViews > 0);
  assert.ok(stats.avgEngagement > 0 && stats.avgEngagement <= 100);
  assert.ok(stats.topIndustries.length > 0);
  assert.ok(stats.topPages.length > 0);
  assert.ok(typeof stats.newThisWeek === "number");
  cleanup();
});

test("getVisitorStats topIndustries are sorted descending by count", async () => {
  cleanup();
  const stats = await getVisitorStats();
  for (let i = 1; i < stats.topIndustries.length; i++) {
    assert.ok(
      stats.topIndustries[i - 1].count >= stats.topIndustries[i].count,
      "Industries should be sorted by count descending",
    );
  }
  cleanup();
});

test("getVisitorStats topPages are sorted descending by views", async () => {
  cleanup();
  const stats = await getVisitorStats();
  for (let i = 1; i < stats.topPages.length; i++) {
    assert.ok(
      stats.topPages[i - 1].views >= stats.topPages[i].views,
      "Pages should be sorted by views descending",
    );
  }
  cleanup();
});

test("getVisitorStats with unknown tenantId returns zeros", async () => {
  cleanup();
  await getIdentifiedVisitors();
  const stats = await getVisitorStats("nonexistent-tenant");
  assert.equal(stats.totalIdentified, 0);
  assert.equal(stats.totalPageViews, 0);
  assert.equal(stats.avgEngagement, 0);
  cleanup();
});

// ---------------------------------------------------------------------------
// Tracking Snippet
// ---------------------------------------------------------------------------

test("generateTrackingSnippet returns valid snippet with siteId", () => {
  cleanup();
  const snippet = generateTrackingSnippet("my-site-123");
  assert.equal(snippet.siteId, "my-site-123");
  assert.ok(snippet.script.includes("<script>"));
  assert.ok(snippet.script.includes("my-site-123"));
  assert.ok(snippet.script.includes("happierleads.com/tracker.js"));
});

test("generateTrackingSnippet uses env var when no siteId given", () => {
  cleanup();
  process.env.HAPPIERLEADS_SITE_ID = "env-site-456";
  const snippet = generateTrackingSnippet();
  assert.equal(snippet.siteId, "env-site-456");
  assert.ok(snippet.script.includes("env-site-456"));
  cleanup();
});

test("generateTrackingSnippet uses placeholder when nothing configured", () => {
  cleanup();
  const snippet = generateTrackingSnippet();
  assert.equal(snippet.siteId, "SITE_ID_PLACEHOLDER");
  assert.ok(snippet.script.includes("SITE_ID_PLACEHOLDER"));
});

// ---------------------------------------------------------------------------
// Convert Visitor to Lead
// ---------------------------------------------------------------------------

test("convertVisitorToLead returns lead key and company info", async () => {
  cleanup();
  const visitors = await getIdentifiedVisitors();
  const first = visitors[0];
  const lead = await convertVisitorToLead(first.id);
  assert.ok(lead.leadKey.startsWith("lead_hl_"));
  assert.equal(lead.companyName, first.companyName);
  assert.equal(lead.engagementScore, first.engagementScore);
  cleanup();
});

test("convertVisitorToLead assigns tenantId when provided", async () => {
  cleanup();
  const visitors = await getIdentifiedVisitors();
  const first = visitors[0];
  await convertVisitorToLead(first.id, "tenant-xyz");
  const detail = await getVisitorDetail(first.id);
  assert.ok(detail);
  assert.equal(detail.tenantId, "tenant-xyz");
  cleanup();
});

test("convertVisitorToLead throws for unknown visitor", async () => {
  cleanup();
  await assert.rejects(
    () => convertVisitorToLead("nonexistent"),
    (err: Error) => {
      assert.ok(err.message.includes("Visitor not found"));
      return true;
    },
  );
  cleanup();
});

// ---------------------------------------------------------------------------
// Sync Visitors
// ---------------------------------------------------------------------------

test("syncVisitors seeds visitors in dry-run", async () => {
  cleanup();
  const result = await syncVisitors();
  assert.ok(result.synced >= 10);
  assert.ok(result.total >= 10);
  cleanup();
});

test("syncVisitors assigns tenantId when provided", async () => {
  cleanup();
  await syncVisitors("tenant-sync-test");
  const visitors = await getIdentifiedVisitors();
  for (const v of visitors) {
    assert.equal(v.tenantId, "tenant-sync-test");
  }
  cleanup();
});

// ---------------------------------------------------------------------------
// ProviderResult
// ---------------------------------------------------------------------------

test("happierleadsResult returns correct ProviderResult in dry-run", () => {
  cleanup();
  const result = happierleadsResult("identify", "Found 15 visitors");
  assert.equal(result.ok, true);
  assert.equal(result.provider, "Happierleads");
  assert.equal(result.mode, "dry-run");
  assert.ok(result.detail.includes("identify"));
  assert.ok(result.detail.includes("Found 15 visitors"));
});

test("happierleadsResult returns live mode when API key set", () => {
  cleanup();
  process.env.HAPPIERLEADS_API_KEY = "key";
  const result = happierleadsResult("sync", "Synced 10 visitors");
  assert.equal(result.mode, "live");
  cleanup();
});

// ---------------------------------------------------------------------------
// Edge Cases
// ---------------------------------------------------------------------------

test("empty filter returns all visitors", async () => {
  cleanup();
  const all = await getIdentifiedVisitors();
  const filtered = await getIdentifiedVisitors({});
  assert.equal(all.length, filtered.length);
  cleanup();
});

test("getIdentifiedVisitors is idempotent with seed data", async () => {
  cleanup();
  const first = await getIdentifiedVisitors();
  const second = await getIdentifiedVisitors();
  assert.equal(first.length, second.length);
  cleanup();
});

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

test("resetHappierleadsStore clears all data", async () => {
  cleanup();
  await recordVisitor(makeSampleVisitor({ companyName: "Clearable Corp", domain: "clearable.com" }));
  const before = await getVisitorByDomain("clearable.com");
  assert.ok(before, "visitor should exist before reset");
  resetHappierleadsStore();
  const after = await getVisitorByDomain("clearable.com");
  assert.equal(after, null, "visitor should be gone after reset");
  cleanup();
});

test("after reset, getIdentifiedVisitors re-seeds in dry-run", async () => {
  cleanup();
  resetHappierleadsStore();
  const visitors = await getIdentifiedVisitors();
  assert.ok(visitors.length >= 10);
  cleanup();
});

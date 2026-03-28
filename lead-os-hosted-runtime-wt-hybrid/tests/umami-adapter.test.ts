import test from "node:test";
import assert from "node:assert/strict";
import {
  createSite,
  getSite,
  listSites,
  deleteSite,
  recordPageview,
  getPageviews,
  recordEvent,
  getEvents,
  getMetrics,
  getFunnelAnalytics,
  getRealtimeVisitors,
  trackLeadEvent,
  getLeadConversionMetrics,
  getTrafficSources,
  resetUmamiStore,
  _getSiteStoreForTesting,
} from "../src/lib/integrations/umami-adapter.ts";

const RANGE = { startDate: "2025-01-01", endDate: "2025-12-31" };

// ---------------------------------------------------------------------------
// createSite + getSite
// ---------------------------------------------------------------------------

test("createSite creates a site and getSite retrieves it", async () => {
  resetUmamiStore();
  const tenantId = `um-test-${Date.now()}`;
  const site = await createSite(tenantId, "example.com");

  assert.ok(site.id.startsWith("site-"));
  assert.equal(site.tenantId, tenantId);
  assert.equal(site.domain, "example.com");
  assert.equal(site.name, "example.com");
  assert.ok(site.trackingCode.includes(site.id));
  assert.ok(site.trackingCode.includes("script"));
  assert.ok(site.createdAt);

  const retrieved = await getSite(site.id);
  assert.equal(retrieved.id, site.id);
});

// ---------------------------------------------------------------------------
// listSites scoped to tenant
// ---------------------------------------------------------------------------

test("listSites returns sites scoped to tenant", async () => {
  resetUmamiStore();
  const t1 = `um-t1-${Date.now()}`;
  const t2 = `um-t2-${Date.now()}`;

  await createSite(t1, "a.com");
  await createSite(t2, "b.com");
  await createSite(t1, "c.com");

  const t1Sites = await listSites(t1);
  const t2Sites = await listSites(t2);

  assert.equal(t1Sites.length, 2);
  assert.equal(t2Sites.length, 1);
  assert.equal(t2Sites[0]!.domain, "b.com");
});

// ---------------------------------------------------------------------------
// deleteSite
// ---------------------------------------------------------------------------

test("deleteSite removes a site from the store", async () => {
  resetUmamiStore();
  const tenantId = `um-del-${Date.now()}`;
  const site = await createSite(tenantId, "delete-me.com");

  await deleteSite(site.id);

  assert.equal(_getSiteStoreForTesting().has(site.id), false);
  await assert.rejects(() => getSite(site.id), /not found/);
});

// ---------------------------------------------------------------------------
// Pageviews
// ---------------------------------------------------------------------------

test("recordPageview and getPageviews tracks page views correctly", async () => {
  resetUmamiStore();
  const tenantId = `um-pv-${Date.now()}`;
  const site = await createSite(tenantId, "pv-test.com");

  await recordPageview(site.id, "/", true);
  await recordPageview(site.id, "/", false);
  await recordPageview(site.id, "/about", true);

  const data = await getPageviews(site.id, RANGE);

  assert.equal(data.total, 3);
  assert.equal(data.unique, 2);
  assert.equal(data.pageviews.length, 2);

  const homePv = data.pageviews.find((p) => p.path === "/");
  assert.equal(homePv!.views, 2);
  assert.equal(homePv!.uniqueViews, 1);
});

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

test("recordEvent and getEvents tracks custom events", async () => {
  resetUmamiStore();
  const tenantId = `um-ev-${Date.now()}`;
  const site = await createSite(tenantId, "ev-test.com");

  await recordEvent(site.id, "cta_click", { button: "hero" });
  await recordEvent(site.id, "cta_click");
  await recordEvent(site.id, "form_submit");

  const events = await getEvents(site.id, RANGE);

  assert.equal(events.length, 2);
  const ctaEvent = events.find((e) => e.name === "cta_click");
  assert.equal(ctaEvent!.count, 2);
});

// ---------------------------------------------------------------------------
// Funnel analytics
// ---------------------------------------------------------------------------

test("getFunnelAnalytics calculates funnel dropoff and conversion", async () => {
  resetUmamiStore();
  const tenantId = `um-funnel-${Date.now()}`;
  const site = await createSite(tenantId, "funnel-test.com");

  await recordPageview(site.id, "/landing", true);
  await recordPageview(site.id, "/landing", true);
  await recordPageview(site.id, "/landing", true);
  await recordPageview(site.id, "/pricing", true);
  await recordPageview(site.id, "/pricing", true);
  await recordPageview(site.id, "/checkout", true);

  const funnel = await getFunnelAnalytics(site.id, ["/landing", "/pricing", "/checkout"]);

  assert.equal(funnel.steps.length, 3);
  assert.equal(funnel.steps[0]!.name, "/landing");
  assert.equal(funnel.steps[0]!.visitors, 3);
  assert.equal(funnel.steps[1]!.visitors, 2);
  assert.equal(funnel.steps[1]!.dropoff, 1);
  assert.equal(funnel.steps[2]!.visitors, 1);
  assert.ok(funnel.overallConversion > 0);
  assert.ok(funnel.overallConversion <= 100);
});

// ---------------------------------------------------------------------------
// Lead tracking
// ---------------------------------------------------------------------------

test("trackLeadEvent records lead events and getLeadConversionMetrics calculates conversions", async () => {
  resetUmamiStore();
  const tenantId = `um-lead-${Date.now()}`;
  const site = await createSite(tenantId, "lead-test.com");

  await recordPageview(site.id, "/landing", true);
  await recordPageview(site.id, "/landing", true);
  await recordPageview(site.id, "/landing", true);

  await trackLeadEvent(site.id, {
    visitorId: "v1",
    event: "form_submit",
    metadata: { page: "/landing", referrer: "google" },
  });
  await trackLeadEvent(site.id, {
    visitorId: "v2",
    event: "cta_click",
    metadata: { page: "/landing", referrer: "google" },
  });
  await trackLeadEvent(site.id, {
    visitorId: "v3",
    event: "form_submit",
    metadata: { page: "/landing", referrer: "facebook" },
  });

  const metrics = await getLeadConversionMetrics(site.id, RANGE);

  assert.equal(metrics.totalVisitors, 3);
  assert.equal(metrics.leadsGenerated, 2);
  assert.ok(metrics.conversionRate > 0);
  assert.ok(metrics.topConvertingPages.length > 0);
  assert.equal(metrics.topConvertingPages[0]!.path, "/landing");
});

// ---------------------------------------------------------------------------
// Traffic sources
// ---------------------------------------------------------------------------

test("getTrafficSources returns source breakdown with conversion rates", async () => {
  resetUmamiStore();
  const tenantId = `um-traffic-${Date.now()}`;
  const site = await createSite(tenantId, "traffic-test.com");

  await trackLeadEvent(site.id, {
    visitorId: "v1",
    event: "page_view",
    metadata: { referrer: "google" },
  });
  await trackLeadEvent(site.id, {
    visitorId: "v1",
    event: "form_submit",
    metadata: { referrer: "google" },
  });
  await trackLeadEvent(site.id, {
    visitorId: "v2",
    event: "page_view",
    metadata: { referrer: "facebook" },
  });

  const sources = await getTrafficSources(site.id, RANGE);

  assert.ok(sources.length >= 2);
  const google = sources.find((s) => s.source === "google");
  assert.ok(google);
  assert.equal(google!.visitors, 1);
  assert.equal(google!.leads, 1);
  assert.equal(google!.conversionRate, 100);

  const facebook = sources.find((s) => s.source === "facebook");
  assert.ok(facebook);
  assert.equal(facebook!.leads, 0);
});

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

test("getMetrics returns url metrics based on pageviews", async () => {
  resetUmamiStore();
  const tenantId = `um-metrics-${Date.now()}`;
  const site = await createSite(tenantId, "metrics-test.com");

  await recordPageview(site.id, "/home", true);
  await recordPageview(site.id, "/about", true);

  const metrics = await getMetrics(site.id, RANGE, "url");

  assert.equal(metrics.length, 2);
  assert.ok(metrics.some((m) => m.name === "/home"));
  assert.ok(metrics.some((m) => m.name === "/about"));
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

test("getSite throws for nonexistent site ID", async () => {
  resetUmamiStore();
  await assert.rejects(
    () => getSite("does-not-exist"),
    /not found/,
  );
});

test("recordPageview throws for nonexistent site ID", async () => {
  resetUmamiStore();
  await assert.rejects(
    () => recordPageview("does-not-exist", "/", true),
    /not found/,
  );
});

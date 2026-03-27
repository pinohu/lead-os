import test from "node:test";
import assert from "node:assert/strict";
import {
  trackProductEvent,
  getFeatureUsage,
  calculateHealthScore,
  getAtRiskTenants,
  getProductMetrics,
  resetProductAnalyticsStore,
} from "../src/lib/product-analytics.ts";

test.beforeEach(() => {
  resetProductAnalyticsStore();
});

// ---------------------------------------------------------------------------
// trackProductEvent
// ---------------------------------------------------------------------------

test("trackProductEvent stores event", async () => {
  const event = await trackProductEvent({
    tenantId: "tenant-1",
    userId: "user-1",
    event: "dashboard.viewed",
    properties: { page: "home" },
  });

  assert.ok(event.id);
  assert.equal(event.tenantId, "tenant-1");
  assert.equal(event.userId, "user-1");
  assert.equal(event.event, "dashboard.viewed");
  assert.deepEqual(event.properties, { page: "home" });
  assert.ok(event.timestamp);
});

// ---------------------------------------------------------------------------
// getFeatureUsage
// ---------------------------------------------------------------------------

test("getFeatureUsage aggregates by feature", async () => {
  await trackProductEvent({ tenantId: "tenant-1", userId: "user-1", event: "dashboard.viewed", properties: {} });
  await trackProductEvent({ tenantId: "tenant-1", userId: "user-2", event: "dashboard.viewed", properties: {} });
  await trackProductEvent({ tenantId: "tenant-1", userId: "user-1", event: "lead.captured", properties: {} });
  await trackProductEvent({ tenantId: "tenant-2", userId: "user-3", event: "dashboard.viewed", properties: {} });

  const usage = await getFeatureUsage("tenant-1");

  const dashboardUsage = usage.find((u) => u.feature === "dashboard.viewed");
  const leadUsage = usage.find((u) => u.feature === "lead.captured");

  assert.ok(dashboardUsage);
  assert.equal(dashboardUsage.usageCount, 2);
  assert.equal(dashboardUsage.uniqueUsers, 2);
  assert.equal(dashboardUsage.tenantId, "tenant-1");

  assert.ok(leadUsage);
  assert.equal(leadUsage.usageCount, 1);
  assert.equal(leadUsage.uniqueUsers, 1);
});

// ---------------------------------------------------------------------------
// calculateHealthScore
// ---------------------------------------------------------------------------

test("calculateHealthScore returns 0-100", async () => {
  const score = await calculateHealthScore("tenant-1");

  assert.ok(score.score >= 0);
  assert.ok(score.score <= 100);
  assert.equal(score.tenantId, "tenant-1");
  assert.ok(["healthy", "at-risk", "churning"].includes(score.riskLevel));
  assert.ok(score.lastCalculatedAt);
  assert.ok(score.factors);
  assert.ok(score.factors.loginFrequency >= 0 && score.factors.loginFrequency <= 100);
  assert.ok(score.factors.featureAdoption >= 0 && score.factors.featureAdoption <= 100);
  assert.ok(score.factors.leadVolume >= 0 && score.factors.leadVolume <= 100);
  assert.ok(score.factors.configCompleteness >= 0 && score.factors.configCompleteness <= 100);
  assert.ok(score.factors.integrationCount >= 0 && score.factors.integrationCount <= 100);
});

test("calculateHealthScore with no events returns churning", async () => {
  const score = await calculateHealthScore("empty-tenant");

  assert.equal(score.score, 0);
  assert.equal(score.riskLevel, "churning");
});

// ---------------------------------------------------------------------------
// getAtRiskTenants
// ---------------------------------------------------------------------------

test("getAtRiskTenants returns tenants below threshold", async () => {
  // Tenant with no meaningful activity should score below 40
  await trackProductEvent({ tenantId: "low-activity", event: "dashboard.viewed", properties: {} });

  const atRisk = await getAtRiskTenants();

  // The tenant with minimal activity should be in the at-risk list
  const found = atRisk.find((t) => t.tenantId === "low-activity");
  assert.ok(found);
  assert.ok(found.score < 40);
});

// ---------------------------------------------------------------------------
// getProductMetrics
// ---------------------------------------------------------------------------

test("getProductMetrics returns aggregate data", async () => {
  await trackProductEvent({ tenantId: "tenant-1", userId: "user-1", event: "dashboard.viewed", properties: {} });
  await trackProductEvent({ tenantId: "tenant-1", userId: "user-1", event: "lead.captured", properties: {} });
  await trackProductEvent({ tenantId: "tenant-2", userId: "user-2", event: "dashboard.viewed", properties: {} });

  const metrics = await getProductMetrics();

  assert.equal(metrics.totalEvents, 3);
  assert.equal(metrics.activeTenants, 2);
  assert.ok(Array.isArray(metrics.topFeatures));
  assert.ok(metrics.topFeatures.length > 0);

  const dashboardFeature = metrics.topFeatures.find((f) => f.feature === "dashboard.viewed");
  assert.ok(dashboardFeature);
  assert.equal(dashboardFeature.count, 2);

  assert.equal(typeof metrics.avgHealthScore, "number");
});

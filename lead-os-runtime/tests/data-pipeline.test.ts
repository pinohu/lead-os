import test from "node:test";
import assert from "node:assert/strict";
import {
  exportLeadsToCSV,
  exportLeadsToJSON,
  createExportJob,
  computeAnalyticsSnapshot,
  getAnalyticsTimeSeries,
  resetDataPipelineStore,
} from "../src/lib/data-pipeline.ts";

test.beforeEach(() => {
  resetDataPipelineStore();
});

// ---------------------------------------------------------------------------
// exportLeadsToCSV
// ---------------------------------------------------------------------------

test("exportLeadsToCSV produces valid CSV with header row", async () => {
  const { csv, rowCount } = await exportLeadsToCSV("tenant-1", {});

  const lines = csv.split("\n");
  assert.ok(lines.length >= 1);

  const headers = lines[0].split(",");
  assert.ok(headers.includes("lead_key"));
  assert.ok(headers.includes("first_name"));
  assert.ok(headers.includes("last_name"));
  assert.ok(headers.includes("email"));
  assert.ok(headers.includes("phone"));
  assert.ok(headers.includes("company"));
  assert.ok(headers.includes("niche"));
  assert.ok(headers.includes("source"));
  assert.ok(headers.includes("score"));
  assert.ok(headers.includes("stage"));
  assert.ok(headers.includes("hot"));
  assert.ok(headers.includes("created_at"));

  // Without a pool, rowCount is 0 and only headers are returned
  assert.equal(rowCount, 0);
});

// ---------------------------------------------------------------------------
// exportLeadsToJSON
// ---------------------------------------------------------------------------

test("exportLeadsToJSON produces valid JSON array", async () => {
  const { json, rowCount } = await exportLeadsToJSON("tenant-1", {});

  const parsed = JSON.parse(json);
  assert.ok(Array.isArray(parsed));
  assert.equal(rowCount, 0);
});

// ---------------------------------------------------------------------------
// createExportJob
// ---------------------------------------------------------------------------

test("createExportJob stores job with pending status", async () => {
  const job = await createExportJob("tenant-1", "leads", "csv", { niche: "staffing" });

  assert.ok(job.id);
  assert.equal(job.tenantId, "tenant-1");
  assert.equal(job.type, "leads");
  assert.equal(job.format, "csv");
  assert.equal(job.status, "pending");
  assert.deepEqual(job.filters, { niche: "staffing" });
  assert.ok(job.createdAt);
  assert.equal(job.completedAt, undefined);
  assert.equal(job.downloadUrl, undefined);
});

// ---------------------------------------------------------------------------
// computeAnalyticsSnapshot
// ---------------------------------------------------------------------------

test("computeAnalyticsSnapshot aggregates lead data correctly", async () => {
  const snapshot = await computeAnalyticsSnapshot("tenant-1", "2025-01-15");

  assert.equal(snapshot.tenantId, "tenant-1");
  assert.equal(snapshot.period, "2025-01-15");
  assert.equal(snapshot.leads.total, 0);
  assert.deepEqual(snapshot.leads.bySource, {});
  assert.deepEqual(snapshot.leads.byNiche, {});
  assert.deepEqual(snapshot.leads.byStage, {});
  assert.equal(snapshot.leads.avgScore, 0);
  assert.equal(snapshot.leads.hotCount, 0);
  assert.equal(snapshot.conversions.total, 0);
  assert.equal(snapshot.conversions.rate, 0);
  assert.equal(snapshot.engagement.emailsSent, 0);
  assert.equal(snapshot.engagement.openRate, 0);
  assert.equal(snapshot.revenue.total, 0);
});

// ---------------------------------------------------------------------------
// getAnalyticsTimeSeries
// ---------------------------------------------------------------------------

test("getAnalyticsTimeSeries returns sorted snapshots", async () => {
  // Compute snapshots in non-sequential order
  await computeAnalyticsSnapshot("tenant-1", "2025-01-17");
  await computeAnalyticsSnapshot("tenant-1", "2025-01-15");
  await computeAnalyticsSnapshot("tenant-1", "2025-01-16");

  const series = await getAnalyticsTimeSeries("tenant-1", "2025-01-15", "2025-01-17", "day");

  assert.equal(series.length, 3);
  assert.equal(series[0].period, "2025-01-15");
  assert.equal(series[1].period, "2025-01-16");
  assert.equal(series[2].period, "2025-01-17");
});

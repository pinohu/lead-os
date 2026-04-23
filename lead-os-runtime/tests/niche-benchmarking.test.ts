import test from "node:test";
import assert from "node:assert/strict";
import {
  recordTenantSnapshot,
  getSnapshots,
  computeNicheBenchmark,
  generateBenchmarkReport,
  getNicheBenchmark,
  listAvailableNiches,
  resetBenchmarkStore,
  type TenantMetricsSnapshot,
} from "../src/lib/niche-benchmarking.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let snapshotCounter = 0;

function makeSnapshot(overrides: Partial<TenantMetricsSnapshot> = {}): TenantMetricsSnapshot {
  snapshotCounter += 1;
  return {
    tenantId: `tenant-${snapshotCounter}`,
    niche: "real-estate",
    period: "2026-02",
    leadsCapured: 100,
    leadsConverted: 20,
    conversionRate: 20,
    avgLeadScore: 70,
    avgResponseTimeMinutes: 30,
    activeExperiments: 2,
    emailOpenRate: 25,
    emailClickRate: 5,
    revenuePerLead: 500,
    snapshotAt: new Date().toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

test("benchmarking: reset clears in-memory store", async () => {
  resetBenchmarkStore();
  await recordTenantSnapshot(makeSnapshot({ tenantId: "t-reset", niche: "fitness", period: "2026-01" }));
  resetBenchmarkStore();
  const snapshots = await getSnapshots("t-reset");
  assert.equal(snapshots.length, 0);
});

test("benchmarking: recordTenantSnapshot stores and returns snapshot", async () => {
  resetBenchmarkStore();
  const s = makeSnapshot({ tenantId: "t-record", period: "2026-02" });
  const saved = await recordTenantSnapshot(s);
  assert.equal(saved.tenantId, "t-record");
  assert.equal(saved.period, "2026-02");
});

test("benchmarking: getSnapshots returns stored snapshots for a tenant", async () => {
  resetBenchmarkStore();
  await recordTenantSnapshot(makeSnapshot({ tenantId: "t-get", period: "2026-01" }));
  await recordTenantSnapshot(makeSnapshot({ tenantId: "t-get", period: "2026-02" }));
  const snapshots = await getSnapshots("t-get");
  assert.equal(snapshots.length, 2);
  assert.ok(snapshots.every((s) => s.tenantId === "t-get"));
});

test("benchmarking: getSnapshots respects periods limit", async () => {
  resetBenchmarkStore();
  for (let m = 1; m <= 8; m++) {
    const period = `2026-${String(m).padStart(2, "0")}`;
    await recordTenantSnapshot(makeSnapshot({ tenantId: "t-limit", period }));
  }
  const snapshots = await getSnapshots("t-limit", 3);
  assert.equal(snapshots.length, 3);
});

test("benchmarking: getSnapshots returns most recent periods first", async () => {
  resetBenchmarkStore();
  await recordTenantSnapshot(makeSnapshot({ tenantId: "t-order", period: "2025-11" }));
  await recordTenantSnapshot(makeSnapshot({ tenantId: "t-order", period: "2026-01" }));
  await recordTenantSnapshot(makeSnapshot({ tenantId: "t-order", period: "2025-12" }));
  const snapshots = await getSnapshots("t-order");
  assert.equal(snapshots[0].period, "2026-01");
  assert.equal(snapshots[1].period, "2025-12");
  assert.equal(snapshots[2].period, "2025-11");
});

test("benchmarking: computeNicheBenchmark returns correct tenant count", async () => {
  resetBenchmarkStore();
  for (let i = 0; i < 5; i++) {
    await recordTenantSnapshot(makeSnapshot({ tenantId: `t-count-${i}`, niche: "plumbing", period: "2026-02" }));
  }
  const bench = await computeNicheBenchmark("plumbing", "2026-02");
  assert.equal(bench.tenantCount, 5);
  assert.equal(bench.niche, "plumbing");
  assert.equal(bench.period, "2026-02");
});

test("benchmarking: computeNicheBenchmark computes correct p50 (median)", async () => {
  resetBenchmarkStore();
  // conversionRate values: 10, 20, 30, 40, 50 — median = 30
  const rates = [10, 20, 30, 40, 50];
  for (const [i, rate] of rates.entries()) {
    await recordTenantSnapshot(
      makeSnapshot({ tenantId: `t-median-${i}`, niche: "dentist", period: "2026-02", conversionRate: rate }),
    );
  }
  const bench = await computeNicheBenchmark("dentist", "2026-02");
  assert.equal(bench.metrics.conversionRate.p50, 30);
});

test("benchmarking: computeNicheBenchmark computes correct p25", async () => {
  resetBenchmarkStore();
  // 4 values: 10, 20, 30, 40 — sorted ascending, p25 index = 0.75 => 10 + 0.75*(20-10) = 17.5
  const rates = [10, 20, 30, 40];
  for (const [i, rate] of rates.entries()) {
    await recordTenantSnapshot(
      makeSnapshot({ tenantId: `t-p25-${i}`, niche: "chiro", period: "2026-02", conversionRate: rate }),
    );
  }
  const bench = await computeNicheBenchmark("chiro", "2026-02");
  assert.equal(bench.metrics.conversionRate.p25, 17.5);
});

test("benchmarking: computeNicheBenchmark computes correct p75", async () => {
  resetBenchmarkStore();
  // 4 values: 10, 20, 30, 40 — p75 index = 2.25 => 30 + 0.25*(40-30) = 32.5
  const rates = [10, 20, 30, 40];
  for (const [i, rate] of rates.entries()) {
    await recordTenantSnapshot(
      makeSnapshot({ tenantId: `t-p75-${i}`, niche: "hvac", period: "2026-02", conversionRate: rate }),
    );
  }
  const bench = await computeNicheBenchmark("hvac", "2026-02");
  assert.equal(bench.metrics.conversionRate.p75, 32.5);
});

test("benchmarking: computeNicheBenchmark computes correct p90", async () => {
  resetBenchmarkStore();
  // 10 values: 10..100 step 10 — p90 index = 8.1 => 90 + 0.1*10 = 91
  for (let i = 0; i < 10; i++) {
    await recordTenantSnapshot(
      makeSnapshot({ tenantId: `t-p90-${i}`, niche: "roofing", period: "2026-02", conversionRate: (i + 1) * 10 }),
    );
  }
  const bench = await computeNicheBenchmark("roofing", "2026-02");
  assert.equal(bench.metrics.conversionRate.p90, 91);
});

test("benchmarking: single tenant in niche gets 100th percentile", async () => {
  resetBenchmarkStore();
  await recordTenantSnapshot(makeSnapshot({ tenantId: "solo", niche: "solo-niche", period: "2026-02" }));
  const report = await generateBenchmarkReport("solo", "2026-02");
  assert.ok(report !== null);
  for (const r of report!.rankings) {
    assert.equal(r.percentile, 100, `Expected percentile 100 for metric ${r.metric}`);
  }
  assert.equal(report!.overallPercentile, 100);
});

test("benchmarking: generateBenchmarkReport computes correct percentile rankings", async () => {
  resetBenchmarkStore();
  // 5 tenants with varying conversionRates: 10, 20, 30, 40, 50
  // Tenant with rate=30 is above 2 others → percentile = (2/5)*100 = 40
  for (let i = 0; i < 5; i++) {
    await recordTenantSnapshot(
      makeSnapshot({
        tenantId: `t-rank-${i}`,
        niche: "dental",
        period: "2026-02",
        conversionRate: (i + 1) * 10,
      }),
    );
  }
  const report = await generateBenchmarkReport("t-rank-2", "2026-02");
  assert.ok(report !== null);
  const convRanking = report!.rankings.find((r) => r.metric === "conversionRate");
  assert.ok(convRanking !== undefined);
  assert.equal(convRanking!.value, 30);
  assert.equal(convRanking!.percentile, 40);
});

test("benchmarking: generateBenchmarkReport returns null when no snapshot", async () => {
  resetBenchmarkStore();
  const report = await generateBenchmarkReport("nonexistent", "2026-02");
  assert.equal(report, null);
});

test("benchmarking: generateBenchmarkReport nicheMedian is correct", async () => {
  resetBenchmarkStore();
  const rates = [10, 20, 30, 40, 50];
  for (const [i, rate] of rates.entries()) {
    await recordTenantSnapshot(
      makeSnapshot({ tenantId: `t-nm-${i}`, niche: "legal", period: "2026-02", conversionRate: rate }),
    );
  }
  const report = await generateBenchmarkReport("t-nm-2", "2026-02");
  assert.ok(report !== null);
  const conv = report!.rankings.find((r) => r.metric === "conversionRate");
  assert.equal(conv!.nicheMedian, 30);
});

test("benchmarking: trend is improving when percentile increases by more than 2 points", async () => {
  resetBenchmarkStore();
  const niche = "legal-trend-up";
  const period = "2026-02";
  const prevPeriod = "2026-01";

  // Current period: 5 tenants, target tenant at top (rate=50)
  for (let i = 0; i < 5; i++) {
    await recordTenantSnapshot(
      makeSnapshot({ tenantId: `t-tu-${i}`, niche, period, conversionRate: (i + 1) * 10 }),
    );
  }
  // Previous period: target tenant was in the middle (rate=30, percentile=40)
  // Now same peers, but target is at rate=50 (percentile=80 → delta=40)
  for (let i = 0; i < 5; i++) {
    const rate = i === 4 ? 30 : (i + 1) * 10; // overwrite last with 30
    await recordTenantSnapshot(
      makeSnapshot({ tenantId: `t-tu-${i}`, niche, period: prevPeriod, conversionRate: rate }),
    );
  }

  const report = await generateBenchmarkReport("t-tu-4", period);
  assert.ok(report !== null);
  const conv = report!.rankings.find((r) => r.metric === "conversionRate");
  assert.equal(conv!.trend, "improving");
});

test("benchmarking: trend is declining when percentile drops by more than 2 points", async () => {
  resetBenchmarkStore();
  const niche = "legal-trend-down";
  const period = "2026-02";
  const prevPeriod = "2026-01";

  // Current: target tenant at bottom (rate=10)
  for (let i = 0; i < 5; i++) {
    await recordTenantSnapshot(
      makeSnapshot({ tenantId: `t-td-${i}`, niche, period, conversionRate: (i + 1) * 10 }),
    );
  }
  // Previous: target tenant was at top (rate=50)
  for (let i = 0; i < 5; i++) {
    const rate = i === 0 ? 50 : (i + 1) * 10;
    await recordTenantSnapshot(
      makeSnapshot({ tenantId: `t-td-${i}`, niche, period: prevPeriod, conversionRate: rate }),
    );
  }

  const report = await generateBenchmarkReport("t-td-0", period);
  assert.ok(report !== null);
  const conv = report!.rankings.find((r) => r.metric === "conversionRate");
  assert.equal(conv!.trend, "declining");
});

test("benchmarking: trend is stable when percentile delta is within 2 points", async () => {
  resetBenchmarkStore();
  const niche = "stable-niche";
  const period = "2026-02";
  const prevPeriod = "2026-01";

  // 5 tenants, all with equal conversionRate — every tenant gets percentile 0
  for (let i = 0; i < 5; i++) {
    await recordTenantSnapshot(
      makeSnapshot({ tenantId: `t-stable-${i}`, niche, period, conversionRate: 20 }),
    );
  }
  for (let i = 0; i < 5; i++) {
    await recordTenantSnapshot(
      makeSnapshot({ tenantId: `t-stable-${i}`, niche, period: prevPeriod, conversionRate: 20 }),
    );
  }

  const report = await generateBenchmarkReport("t-stable-0", period);
  assert.ok(report !== null);
  const conv = report!.rankings.find((r) => r.metric === "conversionRate");
  assert.equal(conv!.trend, "stable");
});

test("benchmarking: trend is stable when no previous period data", async () => {
  resetBenchmarkStore();
  await recordTenantSnapshot(makeSnapshot({ tenantId: "t-no-prev", niche: "yoga", period: "2026-02" }));
  const report = await generateBenchmarkReport("t-no-prev", "2026-02");
  assert.ok(report !== null);
  for (const r of report!.rankings) {
    assert.equal(r.trend, "stable", `metric ${r.metric} should be stable with no prior period`);
  }
});

test("benchmarking: recommendation generated for bottom-quartile conversionRate", async () => {
  resetBenchmarkStore();
  // Bottom tenant with rate=10, peers have 20/30/40/50 (below Q1)
  for (let i = 0; i < 5; i++) {
    await recordTenantSnapshot(
      makeSnapshot({ tenantId: `t-rec-${i}`, niche: "coaching", period: "2026-02", conversionRate: (i + 1) * 10 }),
    );
  }
  const report = await generateBenchmarkReport("t-rec-0", "2026-02");
  assert.ok(report !== null);
  const conv = report!.rankings.find((r) => r.metric === "conversionRate");
  assert.ok(conv!.recommendation !== undefined);
  assert.ok(conv!.recommendation!.includes("follow-up speed"));
});

test("benchmarking: recommendation generated for bottom-quartile emailOpenRate", async () => {
  resetBenchmarkStore();
  for (let i = 0; i < 5; i++) {
    await recordTenantSnapshot(
      makeSnapshot({ tenantId: `t-or-${i}`, niche: "fitness", period: "2026-02", emailOpenRate: (i + 1) * 10 }),
    );
  }
  const report = await generateBenchmarkReport("t-or-0", "2026-02");
  assert.ok(report !== null);
  const openRate = report!.rankings.find((r) => r.metric === "emailOpenRate");
  assert.ok(openRate!.recommendation !== undefined);
  assert.ok(openRate!.recommendation!.includes("subject lines"));
});

test("benchmarking: recommendation generated for bottom-quartile revenuePerLead", async () => {
  resetBenchmarkStore();
  for (let i = 0; i < 5; i++) {
    await recordTenantSnapshot(
      makeSnapshot({ tenantId: `t-rpl-${i}`, niche: "law", period: "2026-02", revenuePerLead: (i + 1) * 100 }),
    );
  }
  const report = await generateBenchmarkReport("t-rpl-0", "2026-02");
  assert.ok(report !== null);
  const revRanking = report!.rankings.find((r) => r.metric === "revenuePerLead");
  assert.ok(revRanking!.recommendation !== undefined);
  assert.ok(revRanking!.recommendation!.includes("scoring weights"));
});

test("benchmarking: recommendation generated for high avgResponseTimeMinutes", async () => {
  resetBenchmarkStore();
  // High response time is bad. Give target tenant the worst (highest) response time.
  const times = [5, 10, 15, 20, 120]; // target is 120 — worst performer
  for (const [i, t] of times.entries()) {
    await recordTenantSnapshot(
      makeSnapshot({ tenantId: `t-rt-${i}`, niche: "auto", period: "2026-02", avgResponseTimeMinutes: t }),
    );
  }
  const report = await generateBenchmarkReport("t-rt-4", "2026-02");
  assert.ok(report !== null);
  const respTime = report!.rankings.find((r) => r.metric === "avgResponseTimeMinutes");
  assert.ok(respTime!.recommendation !== undefined);
  assert.ok(respTime!.recommendation!.includes("auto-response"));
});

test("benchmarking: no recommendation for top-quartile metric", async () => {
  resetBenchmarkStore();
  // Give target tenant the best conversionRate
  for (let i = 0; i < 5; i++) {
    await recordTenantSnapshot(
      makeSnapshot({ tenantId: `t-top-${i}`, niche: "spa", period: "2026-02", conversionRate: (i + 1) * 10 }),
    );
  }
  const report = await generateBenchmarkReport("t-top-4", "2026-02");
  assert.ok(report !== null);
  const conv = report!.rankings.find((r) => r.metric === "conversionRate");
  assert.equal(conv!.recommendation, undefined);
});

test("benchmarking: different periods do not mix", async () => {
  resetBenchmarkStore();
  await recordTenantSnapshot(
    makeSnapshot({ tenantId: "t-feb", niche: "roofing-p", period: "2026-02", conversionRate: 50 }),
  );
  await recordTenantSnapshot(
    makeSnapshot({ tenantId: "t-jan", niche: "roofing-p", period: "2026-01", conversionRate: 10 }),
  );
  const bench = await computeNicheBenchmark("roofing-p", "2026-02");
  assert.equal(bench.tenantCount, 1);
  assert.equal(bench.metrics.conversionRate.p50, 50);
});

test("benchmarking: different niches do not mix", async () => {
  resetBenchmarkStore();
  await recordTenantSnapshot(
    makeSnapshot({ tenantId: "t-plumb", niche: "plumbing-x", period: "2026-02", conversionRate: 50 }),
  );
  await recordTenantSnapshot(
    makeSnapshot({ tenantId: "t-hvac", niche: "hvac-x", period: "2026-02", conversionRate: 10 }),
  );
  const bench = await computeNicheBenchmark("plumbing-x", "2026-02");
  assert.equal(bench.tenantCount, 1);
  assert.equal(bench.metrics.conversionRate.p50, 50);
});

test("benchmarking: overallPercentile is average of all individual percentiles", async () => {
  resetBenchmarkStore();
  // 5 tenants, all metrics identical across tenants → all percentiles = 0
  // except target tenant which leads on all metrics
  for (let i = 0; i < 4; i++) {
    await recordTenantSnapshot(
      makeSnapshot({
        tenantId: `t-avg-${i}`,
        niche: "avg-niche",
        period: "2026-02",
        conversionRate: 10,
        avgLeadScore: 10,
        avgResponseTimeMinutes: 60,
        emailOpenRate: 10,
        emailClickRate: 2,
        revenuePerLead: 100,
      }),
    );
  }
  await recordTenantSnapshot(
    makeSnapshot({
      tenantId: "t-avg-top",
      niche: "avg-niche",
      period: "2026-02",
      conversionRate: 90,
      avgLeadScore: 90,
      avgResponseTimeMinutes: 1, // lower is better
      emailOpenRate: 90,
      emailClickRate: 20,
      revenuePerLead: 1000,
    }),
  );

  const report = await generateBenchmarkReport("t-avg-top", "2026-02");
  assert.ok(report !== null);
  const individualSum = report!.rankings.reduce((sum, r) => sum + r.percentile, 0);
  const expectedOverall = Math.round(individualSum / report!.rankings.length);
  assert.equal(report!.overallPercentile, expectedOverall);
});

test("benchmarking: getNicheBenchmark returns null for unknown niche", async () => {
  resetBenchmarkStore();
  const bench = await getNicheBenchmark("unknown-niche-xyz", "2026-02");
  assert.equal(bench, null);
});

test("benchmarking: getNicheBenchmark returns cached result on second call", async () => {
  resetBenchmarkStore();
  await recordTenantSnapshot(makeSnapshot({ tenantId: "t-cache", niche: "cache-niche", period: "2026-02" }));
  const bench1 = await getNicheBenchmark("cache-niche", "2026-02");
  const bench2 = await getNicheBenchmark("cache-niche", "2026-02");
  assert.deepEqual(bench1, bench2);
});

test("benchmarking: listAvailableNiches returns all distinct niches", async () => {
  resetBenchmarkStore();
  await recordTenantSnapshot(makeSnapshot({ tenantId: "t-n1", niche: "niche-alpha", period: "2026-02" }));
  await recordTenantSnapshot(makeSnapshot({ tenantId: "t-n2", niche: "niche-beta", period: "2026-02" }));
  await recordTenantSnapshot(makeSnapshot({ tenantId: "t-n3", niche: "niche-alpha", period: "2026-01" }));
  const niches = await listAvailableNiches();
  assert.ok(niches.includes("niche-alpha"));
  assert.ok(niches.includes("niche-beta"));
  // alpha should appear once even though it has two entries
  assert.equal(niches.filter((n) => n === "niche-alpha").length, 1);
});

test("benchmarking: listAvailableNiches returns empty array when no data", async () => {
  resetBenchmarkStore();
  const niches = await listAvailableNiches();
  assert.equal(niches.length, 0);
});

test("benchmarking: reset also clears benchmark cache", async () => {
  resetBenchmarkStore();
  await recordTenantSnapshot(makeSnapshot({ tenantId: "t-bc", niche: "bc-niche", period: "2026-02" }));
  await getNicheBenchmark("bc-niche", "2026-02"); // populates cache
  resetBenchmarkStore();
  const bench = await getNicheBenchmark("bc-niche", "2026-02");
  assert.equal(bench, null);
});

test("benchmarking: generateBenchmarkReport includes all 6 ranked metrics", async () => {
  resetBenchmarkStore();
  await recordTenantSnapshot(makeSnapshot({ tenantId: "t-6m", niche: "plumbing-6m", period: "2026-02" }));
  const report = await generateBenchmarkReport("t-6m", "2026-02");
  assert.ok(report !== null);
  const metricNames = report!.rankings.map((r) => r.metric);
  for (const expected of [
    "conversionRate",
    "avgLeadScore",
    "avgResponseTimeMinutes",
    "emailOpenRate",
    "emailClickRate",
    "revenuePerLead",
  ]) {
    assert.ok(metricNames.includes(expected), `Missing metric: ${expected}`);
  }
  assert.equal(report!.rankings.length, 6);
});

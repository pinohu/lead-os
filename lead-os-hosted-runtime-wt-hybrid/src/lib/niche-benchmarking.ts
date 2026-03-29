import { type QueryResultRow } from "pg";
import { getPool } from "./db.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TenantMetricsSnapshot {
  tenantId: string;
  niche: string;
  period: string; // "2026-03" format
  leadsCapured: number;
  leadsConverted: number;
  conversionRate: number;
  avgLeadScore: number;
  avgResponseTimeMinutes: number;
  activeExperiments: number;
  emailOpenRate: number;
  emailClickRate: number;
  revenuePerLead: number;
  snapshotAt: string;
}

export interface PercentileSet {
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

export interface NicheBenchmark {
  niche: string;
  period: string;
  tenantCount: number;
  metrics: {
    conversionRate: PercentileSet;
    avgLeadScore: PercentileSet;
    avgResponseTimeMinutes: PercentileSet;
    emailOpenRate: PercentileSet;
    emailClickRate: PercentileSet;
    revenuePerLead: PercentileSet;
  };
}

export interface RankingEntry {
  metric: string;
  value: number;
  percentile: number; // 0-100, where 90 = top 10%
  nicheMedian: number;
  trend: "improving" | "declining" | "stable";
  recommendation?: string;
}

export interface TenantBenchmarkReport {
  tenantId: string;
  niche: string;
  period: string;
  rankings: RankingEntry[];
  overallPercentile: number;
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

// Key: `${tenantId}::${period}`
const snapshotStore = new Map<string, TenantMetricsSnapshot>();
// Key: `${niche}::${period}`
const benchmarkCache = new Map<string, NicheBenchmark>();

// ---------------------------------------------------------------------------
// DB schema
// ---------------------------------------------------------------------------

let schemaReady: Promise<void> | null = null;

async function ensureSchema(): Promise<void> {
  const activePool = getPool();
  if (!activePool) return;
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    try {
      await activePool.query(`
        CREATE TABLE IF NOT EXISTS lead_os_tenant_snapshots (
          id TEXT PRIMARY KEY,
          tenant_id TEXT NOT NULL,
          niche TEXT NOT NULL,
          period TEXT NOT NULL,
          payload JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_lead_os_tenant_snapshots_niche_period
          ON lead_os_tenant_snapshots (niche, period);
        CREATE INDEX IF NOT EXISTS idx_lead_os_tenant_snapshots_tenant
          ON lead_os_tenant_snapshots (tenant_id);
      `);
    } catch (err) {
      schemaReady = null;
      throw err;
    }
  })();

  return schemaReady;
}

function isMissingRelationError(err: unknown): boolean {
  return Boolean(
    err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: string }).code === "42P01",
  );
}

async function querySnapshots<T extends QueryResultRow>(
  text: string,
  values: unknown[] = [],
) {
  const activePool = getPool();
  if (!activePool) throw new Error("Postgres pool is not available");

  await ensureSchema();

  try {
    return await activePool.query<T>(text, values);
  } catch (err) {
    if (!isMissingRelationError(err)) throw err;
    schemaReady = null;
    await ensureSchema();
    return activePool.query<T>(text, values);
  }
}

function hasPostgres(): boolean {
  return getPool() !== null;
}

// ---------------------------------------------------------------------------
// Percentile helpers
// ---------------------------------------------------------------------------

/**
 * Sorts values ascending and returns the value at the given percentile rank.
 * Uses linear interpolation for non-integer positions.
 */
function percentileOf(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];

  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const fraction = index - lower;

  return sorted[lower] + fraction * (sorted[upper] - sorted[lower]);
}

function buildPercentileSet(values: number[]): PercentileSet {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    p25: percentileOf(sorted, 25),
    p50: percentileOf(sorted, 50),
    p75: percentileOf(sorted, 75),
    p90: percentileOf(sorted, 90),
  };
}

/**
 * Returns how many values in the sorted array are strictly below `value`,
 * then computes the percentile rank as (position / total) * 100.
 * A tenant whose value equals or exceeds all others gets 100.
 */
function computePercentileRank(sortedValues: number[], value: number): number {
  const total = sortedValues.length;
  if (total === 0) return 100;
  if (total === 1) return 100;

  const below = sortedValues.filter((v) => v < value).length;
  return Math.round((below / total) * 100);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function recordTenantSnapshot(
  snapshot: TenantMetricsSnapshot,
): Promise<TenantMetricsSnapshot> {
  const key = `${snapshot.tenantId}::${snapshot.period}`;
  snapshotStore.set(key, snapshot);
  // Invalidate benchmark cache for this niche+period so it's recomputed fresh.
  benchmarkCache.delete(`${snapshot.niche}::${snapshot.period}`);

  if (!hasPostgres()) return snapshot;

  const id = `snap_${snapshot.tenantId}_${snapshot.period}`;
  try {
    await querySnapshots(
      `
        INSERT INTO lead_os_tenant_snapshots (id, tenant_id, niche, period, payload, created_at)
        VALUES ($1, $2, $3, $4, $5::jsonb, NOW())
        ON CONFLICT (id)
        DO UPDATE SET
          niche    = EXCLUDED.niche,
          period   = EXCLUDED.period,
          payload  = EXCLUDED.payload
      `,
      [id, snapshot.tenantId, snapshot.niche, snapshot.period, JSON.stringify(snapshot)],
    );
  } catch {
    // DB failure is non-fatal — in-memory write succeeded.
  }

  return snapshot;
}

export async function getSnapshots(
  tenantId: string,
  periods = 6,
): Promise<TenantMetricsSnapshot[]> {
  const effectivePeriods = Math.min(Math.max(periods, 1), 24);

  if (!hasPostgres()) {
    return Array.from(snapshotStore.values())
      .filter((s) => s.tenantId === tenantId)
      .sort((a, b) => b.period.localeCompare(a.period))
      .slice(0, effectivePeriods);
  }

  try {
    const result = await querySnapshots<{ payload: TenantMetricsSnapshot }>(
      `
        SELECT payload
        FROM lead_os_tenant_snapshots
        WHERE tenant_id = $1
        ORDER BY period DESC
        LIMIT $2
      `,
      [tenantId, effectivePeriods],
    );
    const rows = result.rows.map((r) => r.payload);
    for (const s of rows) {
      snapshotStore.set(`${s.tenantId}::${s.period}`, s);
    }
    return rows;
  } catch {
    return Array.from(snapshotStore.values())
      .filter((s) => s.tenantId === tenantId)
      .sort((a, b) => b.period.localeCompare(a.period))
      .slice(0, effectivePeriods);
  }
}

async function loadNicheSnapshots(
  niche: string,
  period: string,
): Promise<TenantMetricsSnapshot[]> {
  if (!hasPostgres()) {
    return Array.from(snapshotStore.values()).filter(
      (s) => s.niche === niche && s.period === period,
    );
  }

  try {
    const result = await querySnapshots<{ payload: TenantMetricsSnapshot }>(
      `
        SELECT DISTINCT ON (tenant_id) payload
        FROM lead_os_tenant_snapshots
        WHERE niche = $1 AND period = $2
        ORDER BY tenant_id, created_at DESC
      `,
      [niche, period],
    );
    const rows = result.rows.map((r) => r.payload);
    for (const s of rows) {
      snapshotStore.set(`${s.tenantId}::${s.period}`, s);
    }
    return rows;
  } catch {
    return Array.from(snapshotStore.values()).filter(
      (s) => s.niche === niche && s.period === period,
    );
  }
}

export async function computeNicheBenchmark(
  niche: string,
  period: string,
): Promise<NicheBenchmark> {
  const snapshots = await loadNicheSnapshots(niche, period);

  const benchmark: NicheBenchmark = {
    niche,
    period,
    tenantCount: snapshots.length,
    metrics: {
      conversionRate: buildPercentileSet(snapshots.map((s) => s.conversionRate)),
      avgLeadScore: buildPercentileSet(snapshots.map((s) => s.avgLeadScore)),
      avgResponseTimeMinutes: buildPercentileSet(
        snapshots.map((s) => s.avgResponseTimeMinutes),
      ),
      emailOpenRate: buildPercentileSet(snapshots.map((s) => s.emailOpenRate)),
      emailClickRate: buildPercentileSet(snapshots.map((s) => s.emailClickRate)),
      revenuePerLead: buildPercentileSet(snapshots.map((s) => s.revenuePerLead)),
    },
  };

  benchmarkCache.set(`${niche}::${period}`, benchmark);
  return benchmark;
}

export async function getNicheBenchmark(
  niche: string,
  period?: string,
): Promise<NicheBenchmark | null> {
  const effectivePeriod = period ?? currentPeriod();
  const cacheKey = `${niche}::${effectivePeriod}`;

  if (benchmarkCache.has(cacheKey)) {
    return benchmarkCache.get(cacheKey)!;
  }

  const snapshots = await loadNicheSnapshots(niche, effectivePeriod);
  if (snapshots.length === 0) return null;

  return computeNicheBenchmark(niche, effectivePeriod);
}

const RANKED_METRICS: Array<{
  key: keyof TenantMetricsSnapshot;
  label: string;
  // For response time, lower is better — flip the sort for percentile rank
  lowerIsBetter?: boolean;
}> = [
  { key: "conversionRate", label: "conversionRate" },
  { key: "avgLeadScore", label: "avgLeadScore" },
  { key: "avgResponseTimeMinutes", label: "avgResponseTimeMinutes", lowerIsBetter: true },
  { key: "emailOpenRate", label: "emailOpenRate" },
  { key: "emailClickRate", label: "emailClickRate" },
  { key: "revenuePerLead", label: "revenuePerLead" },
];

const RECOMMENDATIONS: Partial<Record<keyof TenantMetricsSnapshot, string>> = {
  conversionRate:
    "Improve lead follow-up speed — top performers respond within 5 minutes",
  emailOpenRate:
    "Test different subject lines — use the experiment engine to A/B test",
  avgResponseTimeMinutes:
    "Enable auto-response workflows to reduce response time",
  revenuePerLead:
    "Focus on qualifying higher-value leads — review scoring weights",
};

function previousPeriod(period: string): string {
  const [year, month] = period.split("-").map(Number);
  const date = new Date(year, month - 2, 1); // month - 2 because month is 1-indexed
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function generateBenchmarkReport(
  tenantId: string,
  period?: string,
): Promise<TenantBenchmarkReport | null> {
  const effectivePeriod = period ?? currentPeriod();

  // Load the tenant's own snapshot for the requested period.
  const tenantSnapshotKey = `${tenantId}::${effectivePeriod}`;
  let tenantSnapshot = snapshotStore.get(tenantSnapshotKey);

  if (!tenantSnapshot && hasPostgres()) {
    try {
      const result = await querySnapshots<{ payload: TenantMetricsSnapshot }>(
        `
          SELECT payload
          FROM lead_os_tenant_snapshots
          WHERE tenant_id = $1 AND period = $2
          ORDER BY created_at DESC
          LIMIT 1
        `,
        [tenantId, effectivePeriod],
      );
      if (result.rows.length > 0) {
        tenantSnapshot = result.rows[0].payload;
        snapshotStore.set(tenantSnapshotKey, tenantSnapshot);
      }
    } catch {
      // Fall through to in-memory miss.
    }
  }

  if (!tenantSnapshot) return null;

  const { niche } = tenantSnapshot;

  // Load all snapshots for this niche+period to compute peer rankings.
  const nicheSnapshots = await loadNicheSnapshots(niche, effectivePeriod);

  // Load the previous period snapshot for trend detection.
  const prevPeriod = previousPeriod(effectivePeriod);
  const prevKey = `${tenantId}::${prevPeriod}`;
  let prevSnapshot = snapshotStore.get(prevKey);

  if (!prevSnapshot && hasPostgres()) {
    try {
      const result = await querySnapshots<{ payload: TenantMetricsSnapshot }>(
        `
          SELECT payload
          FROM lead_os_tenant_snapshots
          WHERE tenant_id = $1 AND period = $2
          ORDER BY created_at DESC
          LIMIT 1
        `,
        [tenantId, prevPeriod],
      );
      if (result.rows.length > 0) {
        prevSnapshot = result.rows[0].payload;
        snapshotStore.set(prevKey, prevSnapshot);
      }
    } catch {
      // No previous period data — trends default to stable.
    }
  }

  // Compute per-metric rankings.
  const rankings: RankingEntry[] = RANKED_METRICS.map((m) => {
    const value = tenantSnapshot![m.key] as number;
    const allValues = nicheSnapshots.map((s) => s[m.key] as number);
    const sortedAsc = [...allValues].sort((a, b) => a - b);

    let percentile: number;
    if (sortedAsc.length <= 1) {
      percentile = 100;
    } else if (m.lowerIsBetter) {
      // For response time: fewer minutes = better = higher percentile.
      // Percentile = fraction of peers with a HIGHER (worse) value.
      const above = sortedAsc.filter((v) => v > value).length;
      percentile = Math.round((above / sortedAsc.length) * 100);
    } else {
      percentile = computePercentileRank(sortedAsc, value);
    }

    const nicheMedian = percentileOf(sortedAsc, 50);

    // Trend detection vs previous period.
    let trend: "improving" | "declining" | "stable" = "stable";
    if (prevSnapshot) {
      const prevValue = prevSnapshot[m.key] as number;
      const prevAllValues = nicheSnapshots.map((s) => s[m.key] as number);

      // We'd ideally have the prior period's niche values, but we compute
      // the previous percentile using current niche peers as a proxy (peers
      // are relatively stable month-over-month).
      const prevSortedAsc = [...prevAllValues].sort((a, b) => a - b);
      let prevPercentile: number;
      if (m.lowerIsBetter) {
        const above = prevSortedAsc.filter((v) => v > prevValue).length;
        prevPercentile = Math.round((above / prevSortedAsc.length) * 100);
      } else {
        prevPercentile = computePercentileRank(prevSortedAsc, prevValue);
      }

      const delta = percentile - prevPercentile;
      if (delta > 2) trend = "improving";
      else if (delta < -2) trend = "declining";
    }

    const entry: RankingEntry = {
      metric: m.label,
      value,
      percentile,
      nicheMedian,
      trend,
    };

    // Add recommendation for bottom-quartile metrics (percentile < 25).
    if (percentile < 25 && RECOMMENDATIONS[m.key]) {
      entry.recommendation = RECOMMENDATIONS[m.key];
    }

    return entry;
  });

  const overallPercentile = Math.round(
    rankings.reduce((sum, r) => sum + r.percentile, 0) / rankings.length,
  );

  return {
    tenantId,
    niche,
    period: effectivePeriod,
    rankings,
    overallPercentile,
    generatedAt: new Date().toISOString(),
  };
}

export async function listAvailableNiches(): Promise<string[]> {
  if (!hasPostgres()) {
    const niches = new Set<string>();
    for (const s of snapshotStore.values()) {
      niches.add(s.niche);
    }
    return Array.from(niches).sort();
  }

  try {
    const result = await querySnapshots<{ niche: string }>(
      `SELECT DISTINCT niche FROM lead_os_tenant_snapshots ORDER BY niche`,
    );
    return result.rows.map((r) => r.niche);
  } catch {
    const niches = new Set<string>();
    for (const s of snapshotStore.values()) {
      niches.add(s.niche);
    }
    return Array.from(niches).sort();
  }
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

export function resetBenchmarkStore(): void {
  snapshotStore.clear();
  benchmarkCache.clear();
  schemaReady = null;
}

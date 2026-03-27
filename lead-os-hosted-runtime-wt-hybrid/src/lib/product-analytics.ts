import { randomUUID } from "crypto";
import { getPool } from "./db.ts";
import type { QueryResultRow } from "pg";

export interface ProductEvent {
  id: string;
  tenantId: string;
  userId?: string;
  event: string;
  properties: Record<string, unknown>;
  timestamp: string;
}

export interface FeatureUsage {
  tenantId: string;
  feature: string;
  lastUsedAt: string;
  usageCount: number;
  uniqueUsers: number;
}

export interface TenantHealthScore {
  tenantId: string;
  score: number;
  factors: {
    loginFrequency: number;
    featureAdoption: number;
    leadVolume: number;
    configCompleteness: number;
    integrationCount: number;
  };
  riskLevel: "healthy" | "at-risk" | "churning";
  lastCalculatedAt: string;
}

export interface ProductMetrics {
  totalEvents: number;
  activeTenants: number;
  topFeatures: Array<{ feature: string; count: number }>;
  avgHealthScore: number;
}

const eventStore: ProductEvent[] = [];
const healthScoreCache = new Map<string, TenantHealthScore>();

let schemaReady: Promise<void> | null = null;

async function ensureSchema(): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS lead_os_product_events (
          id TEXT PRIMARY KEY,
          tenant_id TEXT NOT NULL,
          user_id TEXT,
          event TEXT NOT NULL,
          properties JSONB NOT NULL DEFAULT '{}',
          timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_lead_os_product_events_tenant
          ON lead_os_product_events (tenant_id, timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_lead_os_product_events_event
          ON lead_os_product_events (event, timestamp DESC);
      `);
    } catch (error: unknown) {
      console.error("Failed to create product analytics schema:", error);
      schemaReady = null;
    }
  })();

  return schemaReady;
}

export async function trackProductEvent(
  event: Omit<ProductEvent, "id" | "timestamp">,
): Promise<ProductEvent> {
  await ensureSchema();

  const record: ProductEvent = {
    ...event,
    id: randomUUID(),
    timestamp: new Date().toISOString(),
  };

  eventStore.push(record);

  const pool = getPool();
  if (pool) {
    await pool.query(
      `INSERT INTO lead_os_product_events (id, tenant_id, user_id, event, properties, timestamp)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6::timestamptz)`,
      [record.id, record.tenantId, record.userId ?? null, record.event, JSON.stringify(record.properties), record.timestamp],
    ).catch((err: unknown) => {
      console.error("Failed to persist product event:", err);
    });
  }

  return record;
}

export async function getFeatureUsage(tenantId: string): Promise<FeatureUsage[]> {
  await ensureSchema();

  const pool = getPool();
  if (pool) {
    const result = await pool.query<QueryResultRow>(
      `SELECT
         event AS feature,
         MAX(timestamp) AS last_used_at,
         COUNT(*)::int AS usage_count,
         COUNT(DISTINCT user_id)::int AS unique_users
       FROM lead_os_product_events
       WHERE tenant_id = $1
       GROUP BY event
       ORDER BY usage_count DESC`,
      [tenantId],
    );

    return result.rows.map((row) => ({
      tenantId,
      feature: row.feature as string,
      lastUsedAt: new Date(row.last_used_at as string).toISOString(),
      usageCount: row.usage_count as number,
      uniqueUsers: row.unique_users as number,
    }));
  }

  const featureMap = new Map<string, { lastUsedAt: string; count: number; users: Set<string> }>();
  for (const ev of eventStore) {
    if (ev.tenantId !== tenantId) continue;
    const existing = featureMap.get(ev.event);
    if (existing) {
      existing.count++;
      if (ev.timestamp > existing.lastUsedAt) existing.lastUsedAt = ev.timestamp;
      if (ev.userId) existing.users.add(ev.userId);
    } else {
      const users = new Set<string>();
      if (ev.userId) users.add(ev.userId);
      featureMap.set(ev.event, { lastUsedAt: ev.timestamp, count: 1, users });
    }
  }

  return [...featureMap.entries()].map(([feature, data]) => ({
    tenantId,
    feature,
    lastUsedAt: data.lastUsedAt,
    usageCount: data.count,
    uniqueUsers: data.users.size,
  }));
}

const KNOWN_FEATURES = [
  "dashboard.viewed",
  "lead.captured",
  "lead.exported",
  "experiment.created",
  "webhook.configured",
  "email.sent",
  "attribution.viewed",
  "scoring.configured",
  "lead-magnet.created",
  "marketplace.listed",
  "automation.configured",
  "billing.updated",
];

export async function calculateHealthScore(tenantId: string): Promise<TenantHealthScore> {
  await ensureSchema();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();

  let loginFrequency = 0;
  let featureAdoption = 0;
  let leadVolume = 0;
  let configCompleteness = 0;
  let integrationCount = 0;

  const pool = getPool();
  if (pool) {
    const loginResult = await pool.query<QueryResultRow>(
      `SELECT COUNT(DISTINCT DATE(timestamp))::int AS login_days
       FROM lead_os_product_events
       WHERE tenant_id = $1 AND event = 'dashboard.viewed' AND timestamp >= $2::timestamptz`,
      [tenantId, thirtyDaysAgo],
    );
    const loginDays = (loginResult.rows[0]?.login_days as number) ?? 0;
    loginFrequency = Math.min(100, Math.round((loginDays / 30) * 100));

    const featureResult = await pool.query<QueryResultRow>(
      `SELECT COUNT(DISTINCT event)::int AS feature_count
       FROM lead_os_product_events
       WHERE tenant_id = $1 AND timestamp >= $2::timestamptz`,
      [tenantId, thirtyDaysAgo],
    );
    const featureCount = (featureResult.rows[0]?.feature_count as number) ?? 0;
    featureAdoption = Math.min(100, Math.round((featureCount / KNOWN_FEATURES.length) * 100));

    const leadResult = await pool.query<QueryResultRow>(
      `SELECT COUNT(*)::int AS lead_count
       FROM lead_os_leads
       WHERE tenant_id = $1 AND created_at >= $2::timestamptz`,
      [tenantId, sevenDaysAgo],
    );
    const leadCount = (leadResult.rows[0]?.lead_count as number) ?? 0;
    leadVolume = Math.min(100, Math.round(Math.min(leadCount / 10, 1) * 100));

    const configResult = await pool.query<QueryResultRow>(
      `SELECT COUNT(DISTINCT event)::int AS config_count
       FROM lead_os_product_events
       WHERE tenant_id = $1 AND event LIKE '%.configured'`,
      [tenantId],
    );
    const configCount = (configResult.rows[0]?.config_count as number) ?? 0;
    const totalConfigurables = 5;
    configCompleteness = Math.min(100, Math.round((configCount / totalConfigurables) * 100));

    const integrationResult = await pool.query<QueryResultRow>(
      `SELECT COUNT(DISTINCT event)::int AS integration_count
       FROM lead_os_product_events
       WHERE tenant_id = $1
         AND event IN ('webhook.configured', 'automation.configured', 'email.sent')`,
      [tenantId],
    );
    integrationCount = Math.min(100, Math.round(((integrationResult.rows[0]?.integration_count as number) ?? 0) / 3 * 100));
  } else {
    const tenantEvents = eventStore.filter((e) => e.tenantId === tenantId);
    const recentEvents = tenantEvents.filter((e) => e.timestamp >= thirtyDaysAgo);

    const loginDays = new Set(
      recentEvents.filter((e) => e.event === "dashboard.viewed").map((e) => e.timestamp.slice(0, 10)),
    ).size;
    loginFrequency = Math.min(100, Math.round((loginDays / 30) * 100));

    const uniqueFeatures = new Set(recentEvents.map((e) => e.event)).size;
    featureAdoption = Math.min(100, Math.round((uniqueFeatures / KNOWN_FEATURES.length) * 100));

    leadVolume = 0;
    configCompleteness = Math.min(100, Math.round(
      (new Set(tenantEvents.filter((e) => e.event.endsWith(".configured")).map((e) => e.event)).size / 5) * 100,
    ));
    integrationCount = Math.min(100, Math.round(
      (new Set(tenantEvents.filter((e) => ["webhook.configured", "automation.configured", "email.sent"].includes(e.event)).map((e) => e.event)).size / 3) * 100,
    ));
  }

  const weights = {
    loginFrequency: 0.25,
    featureAdoption: 0.25,
    leadVolume: 0.2,
    configCompleteness: 0.15,
    integrationCount: 0.15,
  };

  const score = Math.round(
    loginFrequency * weights.loginFrequency +
    featureAdoption * weights.featureAdoption +
    leadVolume * weights.leadVolume +
    configCompleteness * weights.configCompleteness +
    integrationCount * weights.integrationCount,
  );

  const clampedScore = Math.max(0, Math.min(100, score));

  let riskLevel: TenantHealthScore["riskLevel"];
  if (clampedScore >= 60) riskLevel = "healthy";
  else if (clampedScore >= 40) riskLevel = "at-risk";
  else riskLevel = "churning";

  const healthScore: TenantHealthScore = {
    tenantId,
    score: clampedScore,
    factors: {
      loginFrequency,
      featureAdoption,
      leadVolume,
      configCompleteness,
      integrationCount,
    },
    riskLevel,
    lastCalculatedAt: new Date().toISOString(),
  };

  healthScoreCache.set(tenantId, healthScore);
  return healthScore;
}

export async function getAtRiskTenants(): Promise<TenantHealthScore[]> {
  await ensureSchema();

  const pool = getPool();
  if (pool) {
    const result = await pool.query<QueryResultRow>(
      `SELECT DISTINCT tenant_id FROM lead_os_product_events`,
    );

    const scores: TenantHealthScore[] = [];
    for (const row of result.rows) {
      const score = await calculateHealthScore(row.tenant_id as string);
      if (score.score < 40) {
        scores.push(score);
      }
    }

    return scores.sort((a, b) => a.score - b.score);
  }

  const tenantIds = new Set(eventStore.map((e) => e.tenantId));
  const scores: TenantHealthScore[] = [];
  for (const tenantId of tenantIds) {
    const score = await calculateHealthScore(tenantId);
    if (score.score < 40) {
      scores.push(score);
    }
  }

  return scores.sort((a, b) => a.score - b.score);
}

export async function getProductMetrics(since?: string): Promise<ProductMetrics> {
  await ensureSchema();

  const sinceDate = since ?? new Date(Date.now() - 30 * 86_400_000).toISOString();

  const pool = getPool();
  if (pool) {
    const totalResult = await pool.query<QueryResultRow>(
      `SELECT COUNT(*)::int AS total FROM lead_os_product_events WHERE timestamp >= $1::timestamptz`,
      [sinceDate],
    );
    const totalEvents = (totalResult.rows[0]?.total as number) ?? 0;

    const activeResult = await pool.query<QueryResultRow>(
      `SELECT COUNT(DISTINCT tenant_id)::int AS active FROM lead_os_product_events WHERE timestamp >= $1::timestamptz`,
      [sinceDate],
    );
    const activeTenants = (activeResult.rows[0]?.active as number) ?? 0;

    const topResult = await pool.query<QueryResultRow>(
      `SELECT event AS feature, COUNT(*)::int AS count
       FROM lead_os_product_events
       WHERE timestamp >= $1::timestamptz
       GROUP BY event
       ORDER BY count DESC
       LIMIT 20`,
      [sinceDate],
    );
    const topFeatures = topResult.rows.map((row) => ({
      feature: row.feature as string,
      count: row.count as number,
    }));

    const tenantIds = await pool.query<QueryResultRow>(
      `SELECT DISTINCT tenant_id FROM lead_os_product_events WHERE timestamp >= $1::timestamptz`,
      [sinceDate],
    );

    let healthSum = 0;
    let healthCount = 0;
    for (const row of tenantIds.rows) {
      const score = healthScoreCache.get(row.tenant_id as string);
      if (score) {
        healthSum += score.score;
        healthCount++;
      }
    }

    return {
      totalEvents,
      activeTenants,
      topFeatures,
      avgHealthScore: healthCount > 0 ? Math.round(healthSum / healthCount) : 0,
    };
  }

  const recentEvents = eventStore.filter((e) => e.timestamp >= sinceDate);
  const tenantIds = new Set(recentEvents.map((e) => e.tenantId));

  const featureCounts = new Map<string, number>();
  for (const ev of recentEvents) {
    featureCounts.set(ev.event, (featureCounts.get(ev.event) ?? 0) + 1);
  }

  const topFeatures = [...featureCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([feature, count]) => ({ feature, count }));

  let healthSum = 0;
  let healthCount = 0;
  for (const tid of tenantIds) {
    const score = healthScoreCache.get(tid);
    if (score) {
      healthSum += score.score;
      healthCount++;
    }
  }

  return {
    totalEvents: recentEvents.length,
    activeTenants: tenantIds.size,
    topFeatures,
    avgHealthScore: healthCount > 0 ? Math.round(healthSum / healthCount) : 0,
  };
}

export function resetProductAnalyticsStore(): void {
  eventStore.length = 0;
  healthScoreCache.clear();
  schemaReady = null;
}

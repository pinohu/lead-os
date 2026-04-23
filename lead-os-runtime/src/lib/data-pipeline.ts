import { randomUUID } from "crypto";
import { getPool } from "./db.ts";
import type { QueryResultRow } from "pg";

export interface ExportJob {
  id: string;
  tenantId: string;
  type: "leads" | "events" | "analytics" | "attribution";
  format: "csv" | "json" | "jsonl";
  filters: {
    since?: string;
    until?: string;
    niche?: string;
    stage?: string;
    minScore?: number;
  };
  status: "pending" | "processing" | "completed" | "failed";
  downloadUrl?: string;
  rowCount?: number;
  createdAt: string;
  completedAt?: string;
}

export interface AnalyticsSnapshot {
  tenantId: string;
  period: string;
  leads: {
    total: number;
    bySource: Record<string, number>;
    byNiche: Record<string, number>;
    byStage: Record<string, number>;
    avgScore: number;
    hotCount: number;
  };
  conversions: {
    total: number;
    rate: number;
    avgTimeToConvert: number;
    byFunnel: Record<string, number>;
  };
  engagement: {
    emailsSent: number;
    emailsOpened: number;
    emailsClicked: number;
    openRate: number;
    clickRate: number;
  };
  revenue: {
    total: number;
    byNiche: Record<string, number>;
    avgDealSize: number;
  };
}

const exportJobStore = new Map<string, ExportJob>();
const exportDataStore = new Map<string, string>();
const snapshotStore = new Map<string, AnalyticsSnapshot>();

let schemaReady: Promise<void> | null = null;

async function ensureSchema(): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS lead_os_export_jobs (
          id TEXT PRIMARY KEY,
          tenant_id TEXT NOT NULL,
          type TEXT NOT NULL,
          format TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          row_count INTEGER,
          filters JSONB NOT NULL DEFAULT '{}',
          export_data TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          completed_at TIMESTAMPTZ
        );
        CREATE INDEX IF NOT EXISTS idx_lead_os_export_jobs_tenant
          ON lead_os_export_jobs (tenant_id, created_at DESC);

        CREATE TABLE IF NOT EXISTS lead_os_analytics_snapshots (
          id TEXT PRIMARY KEY,
          tenant_id TEXT NOT NULL,
          period TEXT NOT NULL,
          payload JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_os_analytics_snapshots_unique
          ON lead_os_analytics_snapshots (tenant_id, period);
        CREATE INDEX IF NOT EXISTS idx_lead_os_analytics_snapshots_tenant
          ON lead_os_analytics_snapshots (tenant_id, period);
      `);
    } catch (error: unknown) {
      console.error("Failed to create data pipeline schema:", error);
      schemaReady = null;
    }
  })();

  return schemaReady;
}

export async function createExportJob(
  tenantId: string,
  type: ExportJob["type"],
  format: ExportJob["format"],
  filters: ExportJob["filters"],
): Promise<ExportJob> {
  await ensureSchema();

  const job: ExportJob = {
    id: randomUUID(),
    tenantId,
    type,
    format,
    filters,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  exportJobStore.set(job.id, job);

  const pool = getPool();
  if (pool) {
    await pool.query(
      `INSERT INTO lead_os_export_jobs (id, tenant_id, type, format, status, filters, created_at)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::timestamptz)`,
      [job.id, job.tenantId, job.type, job.format, job.status, JSON.stringify(job.filters), job.createdAt],
    );
  }

  return job;
}

function buildLeadFilterConditions(filters: ExportJob["filters"]): { conditions: string[]; values: unknown[]; paramIndex: number } {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 2;

  if (filters.since) {
    conditions.push(`created_at >= $${paramIndex}::timestamptz`);
    values.push(filters.since);
    paramIndex++;
  }
  if (filters.until) {
    conditions.push(`created_at <= $${paramIndex}::timestamptz`);
    values.push(filters.until);
    paramIndex++;
  }
  if (filters.niche) {
    conditions.push(`payload->>'niche' = $${paramIndex}`);
    values.push(filters.niche);
    paramIndex++;
  }
  if (filters.stage) {
    conditions.push(`payload->>'stage' = $${paramIndex}`);
    values.push(filters.stage);
    paramIndex++;
  }
  if (filters.minScore !== undefined) {
    conditions.push(`(payload->>'score')::numeric >= $${paramIndex}`);
    values.push(filters.minScore);
    paramIndex++;
  }

  return { conditions, values, paramIndex };
}

export async function exportLeadsToCSV(tenantId: string, filters: ExportJob["filters"]): Promise<{ csv: string; rowCount: number }> {
  await ensureSchema();

  const pool = getPool();
  const headers = ["lead_key", "first_name", "last_name", "email", "phone", "company", "niche", "source", "score", "stage", "hot", "created_at"];

  if (pool) {
    const { conditions, values } = buildLeadFilterConditions(filters);
    const where = ["tenant_id = $1", ...conditions].join(" AND ");
    const result = await pool.query<QueryResultRow>(
      `SELECT lead_key, payload, created_at FROM lead_os_leads WHERE ${where} ORDER BY created_at DESC`,
      [tenantId, ...values],
    );

    const rows = result.rows.map((row) => {
      const p = row.payload as Record<string, unknown>;
      return [
        row.lead_key,
        csvEscape(String(p.firstName ?? "")),
        csvEscape(String(p.lastName ?? "")),
        csvEscape(String(p.email ?? "")),
        csvEscape(String(p.phone ?? "")),
        csvEscape(String(p.company ?? "")),
        csvEscape(String(p.niche ?? "")),
        csvEscape(String(p.source ?? "")),
        String(p.score ?? 0),
        csvEscape(String(p.stage ?? "")),
        String(p.hot ?? false),
        row.created_at,
      ].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    return { csv, rowCount: result.rows.length };
  }

  const csv = headers.join(",") + "\n";
  return { csv, rowCount: 0 };
}

export async function exportLeadsToJSON(tenantId: string, filters: ExportJob["filters"]): Promise<{ json: string; rowCount: number }> {
  await ensureSchema();

  const pool = getPool();
  if (pool) {
    const { conditions, values } = buildLeadFilterConditions(filters);
    const where = ["tenant_id = $1", ...conditions].join(" AND ");
    const result = await pool.query<QueryResultRow>(
      `SELECT lead_key, payload, created_at, updated_at FROM lead_os_leads WHERE ${where} ORDER BY created_at DESC`,
      [tenantId, ...values],
    );

    const leads = result.rows.map((row) => ({
      leadKey: row.lead_key,
      ...row.payload,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return { json: JSON.stringify(leads, null, 2), rowCount: leads.length };
  }

  return { json: "[]", rowCount: 0 };
}

export async function exportEventsToJSON(tenantId: string, filters: ExportJob["filters"]): Promise<{ json: string; rowCount: number }> {
  await ensureSchema();

  const pool = getPool();
  if (pool) {
    const conditions: string[] = ["tenant_id = $1"];
    const values: unknown[] = [tenantId];
    let paramIndex = 2;

    if (filters.since) {
      conditions.push(`timestamp >= $${paramIndex}::timestamptz`);
      values.push(filters.since);
      paramIndex++;
    }
    if (filters.until) {
      conditions.push(`timestamp <= $${paramIndex}::timestamptz`);
      values.push(filters.until);
      paramIndex++;
    }

    const where = conditions.join(" AND ");
    const result = await pool.query<QueryResultRow>(
      `SELECT id, lead_key, event_type, timestamp, payload FROM lead_os_events WHERE ${where} ORDER BY timestamp DESC`,
      values,
    );

    const events = result.rows.map((row) => ({
      id: row.id,
      leadKey: row.lead_key,
      eventType: row.event_type,
      timestamp: row.timestamp,
      ...row.payload,
    }));

    return { json: JSON.stringify(events, null, 2), rowCount: events.length };
  }

  return { json: "[]", rowCount: 0 };
}

export async function processExportJob(jobId: string): Promise<ExportJob> {
  await ensureSchema();

  const job = await getExportJob(jobId);
  if (!job) throw new Error(`Export job ${jobId} not found`);
  if (job.status !== "pending") throw new Error(`Export job ${jobId} is not pending`);

  job.status = "processing";
  exportJobStore.set(job.id, job);

  try {
    let data: string;
    let rowCount: number;

    switch (job.type) {
      case "leads": {
        if (job.format === "csv") {
          const result = await exportLeadsToCSV(job.tenantId, job.filters);
          data = result.csv;
          rowCount = result.rowCount;
        } else {
          const result = await exportLeadsToJSON(job.tenantId, job.filters);
          data = result.json;
          rowCount = result.rowCount;
        }
        break;
      }
      case "events": {
        const result = await exportEventsToJSON(job.tenantId, job.filters);
        data = result.json;
        rowCount = result.rowCount;
        break;
      }
      case "analytics": {
        const snapshots = await getAnalyticsTimeSeries(
          job.tenantId,
          job.filters.since ?? new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10),
          job.filters.until ?? new Date().toISOString().slice(0, 10),
          "day",
        );
        data = JSON.stringify(snapshots, null, 2);
        rowCount = snapshots.length;
        break;
      }
      case "attribution": {
        const pool = getPool();
        if (pool) {
          const conditions: string[] = ["tenant_id = $1"];
          const values: unknown[] = [job.tenantId];
          let paramIndex = 2;
          if (job.filters.since) {
            conditions.push(`created_at >= $${paramIndex}::timestamptz`);
            values.push(job.filters.since);
            paramIndex++;
          }
          if (job.filters.until) {
            conditions.push(`created_at <= $${paramIndex}::timestamptz`);
            values.push(job.filters.until);
            paramIndex++;
          }
          const result = await pool.query<QueryResultRow>(
            `SELECT * FROM lead_os_attribution_touches WHERE ${conditions.join(" AND ")} ORDER BY created_at DESC`,
            values,
          );
          data = JSON.stringify(result.rows, null, 2);
          rowCount = result.rows.length;
        } else {
          data = "[]";
          rowCount = 0;
        }
        break;
      }
      default: {
        throw new Error(`Unsupported export type: ${job.type}`);
      }
    }

    job.status = "completed";
    job.rowCount = rowCount;
    job.completedAt = new Date().toISOString();
    job.downloadUrl = `/api/export/${job.id}/download`;

    exportJobStore.set(job.id, job);
    exportDataStore.set(job.id, data);

    const pool = getPool();
    if (pool) {
      await pool.query(
        `UPDATE lead_os_export_jobs SET status = $1, row_count = $2, completed_at = $3::timestamptz, export_data = $4 WHERE id = $5`,
        [job.status, job.rowCount, job.completedAt, data, job.id],
      );
    }

    return job;
  } catch (error: unknown) {
    job.status = "failed";
    job.completedAt = new Date().toISOString();
    exportJobStore.set(job.id, job);

    const pool = getPool();
    if (pool) {
      await pool.query(
        `UPDATE lead_os_export_jobs SET status = $1, completed_at = $2::timestamptz WHERE id = $3`,
        [job.status, job.completedAt, job.id],
      );
    }

    throw error;
  }
}

export async function getExportJob(jobId: string): Promise<ExportJob | null> {
  await ensureSchema();

  const cached = exportJobStore.get(jobId);
  if (cached) return cached;

  const pool = getPool();
  if (!pool) return null;

  const result = await pool.query<QueryResultRow>(
    `SELECT id, tenant_id, type, format, status, row_count, filters, created_at, completed_at
     FROM lead_os_export_jobs WHERE id = $1`,
    [jobId],
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  const job: ExportJob = {
    id: row.id,
    tenantId: row.tenant_id,
    type: row.type,
    format: row.format,
    filters: row.filters ?? {},
    status: row.status,
    rowCount: row.row_count ?? undefined,
    createdAt: new Date(row.created_at).toISOString(),
    completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : undefined,
    downloadUrl: row.status === "completed" ? `/api/export/${row.id}/download` : undefined,
  };

  exportJobStore.set(job.id, job);
  return job;
}

export async function getExportData(jobId: string): Promise<string | null> {
  const cached = exportDataStore.get(jobId);
  if (cached) return cached;

  const pool = getPool();
  if (!pool) return null;

  const result = await pool.query<QueryResultRow>(
    `SELECT export_data FROM lead_os_export_jobs WHERE id = $1`,
    [jobId],
  );

  if (result.rows.length === 0 || !result.rows[0].export_data) return null;

  const data = result.rows[0].export_data as string;
  exportDataStore.set(jobId, data);
  return data;
}

export async function listExportJobs(tenantId: string): Promise<ExportJob[]> {
  await ensureSchema();

  const pool = getPool();
  if (pool) {
    const result = await pool.query<QueryResultRow>(
      `SELECT id, tenant_id, type, format, status, row_count, filters, created_at, completed_at
       FROM lead_os_export_jobs WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [tenantId],
    );

    return result.rows.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      type: row.type,
      format: row.format,
      filters: row.filters ?? {},
      status: row.status,
      rowCount: row.row_count ?? undefined,
      createdAt: new Date(row.created_at).toISOString(),
      completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : undefined,
      downloadUrl: row.status === "completed" ? `/api/export/${row.id}/download` : undefined,
    }));
  }

  return [...exportJobStore.values()]
    .filter((j) => j.tenantId === tenantId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function computeAnalyticsSnapshot(tenantId: string, date: string): Promise<AnalyticsSnapshot> {
  await ensureSchema();

  const dayStart = `${date}T00:00:00.000Z`;
  const dayEnd = `${date}T23:59:59.999Z`;

  const snapshot: AnalyticsSnapshot = {
    tenantId,
    period: date,
    leads: { total: 0, bySource: {}, byNiche: {}, byStage: {}, avgScore: 0, hotCount: 0 },
    conversions: { total: 0, rate: 0, avgTimeToConvert: 0, byFunnel: {} },
    engagement: { emailsSent: 0, emailsOpened: 0, emailsClicked: 0, openRate: 0, clickRate: 0 },
    revenue: { total: 0, byNiche: {}, avgDealSize: 0 },
  };

  const pool = getPool();
  if (!pool) {
    snapshotStore.set(`${tenantId}:${date}`, snapshot);
    return snapshot;
  }

  const leadsResult = await pool.query<QueryResultRow>(
    `SELECT payload FROM lead_os_leads
     WHERE tenant_id = $1 AND created_at >= $2::timestamptz AND created_at <= $3::timestamptz`,
    [tenantId, dayStart, dayEnd],
  );

  let scoreSum = 0;
  for (const row of leadsResult.rows) {
    const p = row.payload as Record<string, unknown>;
    snapshot.leads.total++;

    const source = String(p.source ?? "unknown");
    snapshot.leads.bySource[source] = (snapshot.leads.bySource[source] ?? 0) + 1;

    const niche = String(p.niche ?? "unknown");
    snapshot.leads.byNiche[niche] = (snapshot.leads.byNiche[niche] ?? 0) + 1;

    const stage = String(p.stage ?? "new");
    snapshot.leads.byStage[stage] = (snapshot.leads.byStage[stage] ?? 0) + 1;

    const score = Number(p.score ?? 0);
    scoreSum += score;

    if (p.hot === true) snapshot.leads.hotCount++;

    const family = String(p.family ?? "unknown");
    if (stage === "converted" || stage === "won") {
      snapshot.conversions.total++;
      snapshot.conversions.byFunnel[family] = (snapshot.conversions.byFunnel[family] ?? 0) + 1;
    }
  }

  if (snapshot.leads.total > 0) {
    snapshot.leads.avgScore = Math.round(scoreSum / snapshot.leads.total);
    snapshot.conversions.rate = snapshot.conversions.total / snapshot.leads.total;
  }

  const emailResult = await pool.query<QueryResultRow>(
    `SELECT event_type, COUNT(*)::int as count FROM lead_os_email_tracking
     WHERE lead_key IN (SELECT lead_key FROM lead_os_leads WHERE tenant_id = $1)
       AND created_at >= $2::timestamptz AND created_at <= $3::timestamptz
     GROUP BY event_type`,
    [tenantId, dayStart, dayEnd],
  );

  for (const row of emailResult.rows) {
    const eventType = row.event_type as string;
    const count = row.count as number;
    if (eventType === "sent") snapshot.engagement.emailsSent = count;
    if (eventType === "opened") snapshot.engagement.emailsOpened = count;
    if (eventType === "clicked") snapshot.engagement.emailsClicked = count;
  }

  if (snapshot.engagement.emailsSent > 0) {
    snapshot.engagement.openRate = snapshot.engagement.emailsOpened / snapshot.engagement.emailsSent;
    snapshot.engagement.clickRate = snapshot.engagement.emailsClicked / snapshot.engagement.emailsSent;
  }

  snapshotStore.set(`${tenantId}:${date}`, snapshot);

  await pool.query(
    `INSERT INTO lead_os_analytics_snapshots (id, tenant_id, period, payload, created_at)
     VALUES ($1, $2, $3, $4::jsonb, NOW())
     ON CONFLICT (tenant_id, period) DO UPDATE SET payload = $4::jsonb`,
    [randomUUID(), tenantId, date, JSON.stringify(snapshot)],
  );

  return snapshot;
}

export async function getAnalyticsTimeSeries(
  tenantId: string,
  since: string,
  until: string,
  granularity: "day" | "week" | "month",
): Promise<AnalyticsSnapshot[]> {
  await ensureSchema();

  const pool = getPool();
  if (pool) {
    const result = await pool.query<QueryResultRow>(
      `SELECT tenant_id, period, payload FROM lead_os_analytics_snapshots
       WHERE tenant_id = $1 AND period >= $2 AND period <= $3
       ORDER BY period ASC`,
      [tenantId, since, until],
    );

    const snapshots = result.rows.map((row) => ({
      tenantId: row.tenant_id as string,
      period: row.period as string,
      ...(row.payload as Omit<AnalyticsSnapshot, "tenantId" | "period">),
    }));

    if (granularity === "day") return snapshots;

    return aggregateSnapshots(snapshots, granularity);
  }

  const snapshots: AnalyticsSnapshot[] = [];
  for (const [key, snap] of snapshotStore) {
    if (key.startsWith(`${tenantId}:`) && snap.period >= since && snap.period <= until) {
      snapshots.push(snap);
    }
  }

  snapshots.sort((a, b) => a.period.localeCompare(b.period));

  if (granularity === "day") return snapshots;
  return aggregateSnapshots(snapshots, granularity);
}

function aggregateSnapshots(snapshots: AnalyticsSnapshot[], granularity: "week" | "month"): AnalyticsSnapshot[] {
  const groups = new Map<string, AnalyticsSnapshot[]>();

  for (const snap of snapshots) {
    const d = new Date(snap.period);
    let key: string;

    if (granularity === "week") {
      const dayOfWeek = d.getUTCDay();
      const monday = new Date(d);
      monday.setUTCDate(d.getUTCDate() - ((dayOfWeek + 6) % 7));
      key = monday.toISOString().slice(0, 10);
    } else {
      key = snap.period.slice(0, 7);
    }

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(snap);
  }

  const result: AnalyticsSnapshot[] = [];
  for (const [period, group] of groups) {
    result.push(mergeSnapshots(group[0].tenantId, period, group));
  }

  return result.sort((a, b) => a.period.localeCompare(b.period));
}

function mergeSnapshots(tenantId: string, period: string, group: AnalyticsSnapshot[]): AnalyticsSnapshot {
  const merged: AnalyticsSnapshot = {
    tenantId,
    period,
    leads: { total: 0, bySource: {}, byNiche: {}, byStage: {}, avgScore: 0, hotCount: 0 },
    conversions: { total: 0, rate: 0, avgTimeToConvert: 0, byFunnel: {} },
    engagement: { emailsSent: 0, emailsOpened: 0, emailsClicked: 0, openRate: 0, clickRate: 0 },
    revenue: { total: 0, byNiche: {}, avgDealSize: 0 },
  };

  let scoreSum = 0;
  for (const snap of group) {
    merged.leads.total += snap.leads.total;
    merged.leads.hotCount += snap.leads.hotCount;
    scoreSum += snap.leads.avgScore * snap.leads.total;

    for (const [k, v] of Object.entries(snap.leads.bySource)) {
      merged.leads.bySource[k] = (merged.leads.bySource[k] ?? 0) + v;
    }
    for (const [k, v] of Object.entries(snap.leads.byNiche)) {
      merged.leads.byNiche[k] = (merged.leads.byNiche[k] ?? 0) + v;
    }
    for (const [k, v] of Object.entries(snap.leads.byStage)) {
      merged.leads.byStage[k] = (merged.leads.byStage[k] ?? 0) + v;
    }

    merged.conversions.total += snap.conversions.total;
    for (const [k, v] of Object.entries(snap.conversions.byFunnel)) {
      merged.conversions.byFunnel[k] = (merged.conversions.byFunnel[k] ?? 0) + v;
    }

    merged.engagement.emailsSent += snap.engagement.emailsSent;
    merged.engagement.emailsOpened += snap.engagement.emailsOpened;
    merged.engagement.emailsClicked += snap.engagement.emailsClicked;

    merged.revenue.total += snap.revenue.total;
    for (const [k, v] of Object.entries(snap.revenue.byNiche)) {
      merged.revenue.byNiche[k] = (merged.revenue.byNiche[k] ?? 0) + v;
    }
  }

  if (merged.leads.total > 0) {
    merged.leads.avgScore = Math.round(scoreSum / merged.leads.total);
    merged.conversions.rate = merged.conversions.total / merged.leads.total;
  }
  if (merged.engagement.emailsSent > 0) {
    merged.engagement.openRate = merged.engagement.emailsOpened / merged.engagement.emailsSent;
    merged.engagement.clickRate = merged.engagement.emailsClicked / merged.engagement.emailsSent;
  }
  if (merged.conversions.total > 0) {
    merged.revenue.avgDealSize = merged.revenue.total / merged.conversions.total;
  }

  return merged;
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function resetDataPipelineStore(): void {
  exportJobStore.clear();
  exportDataStore.clear();
  snapshotStore.clear();
  schemaReady = null;
}

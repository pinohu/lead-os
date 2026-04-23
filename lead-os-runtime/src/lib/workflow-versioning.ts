// ---------------------------------------------------------------------------
// Workflow Version History — tracks every change to tenant workflows and
// enables rollback to any prior snapshot.
// Dual-write: in-memory Map + PostgreSQL JSONB. DB failures are silent.
// ---------------------------------------------------------------------------

import { randomUUID } from "crypto";
import type { QueryResultRow } from "pg";
import { getPool } from "./db.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WorkflowVersion {
  id: string;
  tenantId: string;
  workflowSlug: string;
  version: number;
  snapshot: Record<string, unknown>;
  changeType: "created" | "updated" | "activated" | "deactivated" | "deleted" | "rollback";
  changeSummary: string;
  changedBy: string;
  createdAt: string;
}

export interface WorkflowVersionDiff {
  workflowSlug: string;
  fromVersion: number;
  toVersion: number;
  changes: {
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }[];
}

export interface WorkflowInvestmentReport {
  tenantId: string;
  totalWorkflows: number;
  totalVersions: number;
  totalChanges: number;
  oldestWorkflow: string;
  newestWorkflow: string;
  mostModifiedWorkflow: { slug: string; versions: number };
  estimatedHoursInvested: number;
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// In-memory store — keyed by `${tenantId}::${workflowSlug}::${version}`
// ---------------------------------------------------------------------------

// Primary index: all versions in insertion order.
const versionStore = new Map<string, WorkflowVersion>();

// Counter map: `${tenantId}::${workflowSlug}` -> latest version number
const versionCounters = new Map<string, number>();

// ---------------------------------------------------------------------------
// Schema bootstrap
// ---------------------------------------------------------------------------

let schemaReady: Promise<void> | null = null;

async function ensureSchema(): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS lead_os_workflow_versions (
          id TEXT PRIMARY KEY,
          tenant_id TEXT NOT NULL,
          workflow_slug TEXT NOT NULL,
          version INT NOT NULL,
          payload JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE (tenant_id, workflow_slug, version)
        );

        CREATE INDEX IF NOT EXISTS idx_lead_os_wv_tenant_slug
          ON lead_os_workflow_versions (tenant_id, workflow_slug);
      `);
    } catch {
      schemaReady = null;
    }
  })();

  return schemaReady;
}

async function dbQuery<T extends QueryResultRow>(
  text: string,
  values: unknown[] = [],
): Promise<import("pg").QueryResult<T> | null> {
  const pool = getPool();
  if (!pool) return null;
  try {
    await ensureSchema();
    return await pool.query<T>(text, values);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Internal key helpers
// ---------------------------------------------------------------------------

function entryKey(tenantId: string, workflowSlug: string, version: number): string {
  return `${tenantId}::${workflowSlug}::${version}`;
}

function counterKey(tenantId: string, workflowSlug: string): string {
  return `${tenantId}::${workflowSlug}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function recordWorkflowVersion(
  tenantId: string,
  workflowSlug: string,
  snapshot: Record<string, unknown>,
  changeType: WorkflowVersion["changeType"],
  changeSummary: string,
  changedBy: string,
): Promise<WorkflowVersion> {
  const ck = counterKey(tenantId, workflowSlug);
  const nextVersion = (versionCounters.get(ck) ?? 0) + 1;
  versionCounters.set(ck, nextVersion);

  const record: WorkflowVersion = {
    id: randomUUID(),
    tenantId,
    workflowSlug,
    version: nextVersion,
    snapshot,
    changeType,
    changeSummary,
    changedBy,
    createdAt: new Date().toISOString(),
  };

  versionStore.set(entryKey(tenantId, workflowSlug, nextVersion), record);

  await dbQuery(
    `INSERT INTO lead_os_workflow_versions
       (id, tenant_id, workflow_slug, version, payload, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (tenant_id, workflow_slug, version) DO NOTHING`,
    [
      record.id,
      tenantId,
      workflowSlug,
      nextVersion,
      JSON.stringify(record),
      record.createdAt,
    ],
  );

  return record;
}

export async function getWorkflowVersions(
  tenantId: string,
  workflowSlug: string,
): Promise<WorkflowVersion[]> {
  const results: WorkflowVersion[] = [];

  for (const v of versionStore.values()) {
    if (v.tenantId === tenantId && v.workflowSlug === workflowSlug) {
      results.push(v);
    }
  }

  if (results.length > 0) {
    return results.sort((a, b) => b.version - a.version);
  }

  // Fallback to DB
  const rows = await dbQuery<{ payload: WorkflowVersion }>(
    `SELECT payload FROM lead_os_workflow_versions
     WHERE tenant_id = $1 AND workflow_slug = $2
     ORDER BY version DESC`,
    [tenantId, workflowSlug],
  );

  if (!rows) return [];

  const dbResults: WorkflowVersion[] = [];
  for (const row of rows.rows) {
    const record = row.payload as WorkflowVersion;
    dbResults.push(record);
    // Warm the in-memory cache
    versionStore.set(entryKey(tenantId, workflowSlug, record.version), record);
    const ck = counterKey(tenantId, workflowSlug);
    const current = versionCounters.get(ck) ?? 0;
    if (record.version > current) {
      versionCounters.set(ck, record.version);
    }
  }

  return dbResults;
}

export async function getWorkflowVersion(
  tenantId: string,
  workflowSlug: string,
  version: number,
): Promise<WorkflowVersion | null> {
  const cached = versionStore.get(entryKey(tenantId, workflowSlug, version));
  if (cached) return cached;

  const rows = await dbQuery<{ payload: WorkflowVersion }>(
    `SELECT payload FROM lead_os_workflow_versions
     WHERE tenant_id = $1 AND workflow_slug = $2 AND version = $3`,
    [tenantId, workflowSlug, version],
  );

  if (!rows || rows.rows.length === 0) return null;

  const record = rows.rows[0].payload as WorkflowVersion;
  versionStore.set(entryKey(tenantId, workflowSlug, record.version), record);
  return record;
}

export async function getLatestVersion(
  tenantId: string,
  workflowSlug: string,
): Promise<WorkflowVersion | null> {
  const ck = counterKey(tenantId, workflowSlug);
  const latestNum = versionCounters.get(ck);

  if (latestNum !== undefined) {
    return getWorkflowVersion(tenantId, workflowSlug, latestNum);
  }

  // DB fallback
  const rows = await dbQuery<{ payload: WorkflowVersion }>(
    `SELECT payload FROM lead_os_workflow_versions
     WHERE tenant_id = $1 AND workflow_slug = $2
     ORDER BY version DESC
     LIMIT 1`,
    [tenantId, workflowSlug],
  );

  if (!rows || rows.rows.length === 0) return null;

  const record = rows.rows[0].payload as WorkflowVersion;
  versionStore.set(entryKey(tenantId, workflowSlug, record.version), record);
  versionCounters.set(ck, record.version);
  return record;
}

export async function diffVersions(
  tenantId: string,
  workflowSlug: string,
  fromVersion: number,
  toVersion: number,
): Promise<WorkflowVersionDiff> {
  const [from, to] = await Promise.all([
    getWorkflowVersion(tenantId, workflowSlug, fromVersion),
    getWorkflowVersion(tenantId, workflowSlug, toVersion),
  ]);

  if (!from) {
    throw new Error(`Version ${fromVersion} not found for workflow ${workflowSlug}`);
  }
  if (!to) {
    throw new Error(`Version ${toVersion} not found for workflow ${workflowSlug}`);
  }

  const changes: WorkflowVersionDiff["changes"] = [];
  const allKeys = new Set([
    ...Object.keys(from.snapshot),
    ...Object.keys(to.snapshot),
  ]);

  for (const field of allKeys) {
    const oldValue = from.snapshot[field] ?? null;
    const newValue = to.snapshot[field] ?? null;

    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes.push({ field, oldValue, newValue });
    }
  }

  return { workflowSlug, fromVersion, toVersion, changes };
}

export async function rollbackWorkflow(
  tenantId: string,
  workflowSlug: string,
  toVersion: number,
  changedBy: string,
): Promise<WorkflowVersion> {
  const target = await getWorkflowVersion(tenantId, workflowSlug, toVersion);

  if (!target) {
    throw new Error(
      `Cannot rollback: version ${toVersion} not found for workflow ${workflowSlug}`,
    );
  }

  return recordWorkflowVersion(
    tenantId,
    workflowSlug,
    target.snapshot,
    "rollback",
    `Rolled back to version ${toVersion}`,
    changedBy,
  );
}

export async function getWorkflowInvestmentReport(
  tenantId: string,
): Promise<WorkflowInvestmentReport> {
  const allVersions: WorkflowVersion[] = [];

  for (const v of versionStore.values()) {
    if (v.tenantId === tenantId) {
      allVersions.push(v);
    }
  }

  if (allVersions.length === 0) {
    // Try DB
    const rows = await dbQuery<{ payload: WorkflowVersion }>(
      `SELECT payload FROM lead_os_workflow_versions
       WHERE tenant_id = $1
       ORDER BY created_at ASC`,
      [tenantId],
    );

    if (rows) {
      for (const row of rows.rows) {
        const record = row.payload as WorkflowVersion;
        allVersions.push(record);
        versionStore.set(entryKey(tenantId, record.workflowSlug, record.version), record);
        const ck = counterKey(tenantId, record.workflowSlug);
        const current = versionCounters.get(ck) ?? 0;
        if (record.version > current) {
          versionCounters.set(ck, record.version);
        }
      }
    }
  }

  if (allVersions.length === 0) {
    return {
      tenantId,
      totalWorkflows: 0,
      totalVersions: 0,
      totalChanges: 0,
      oldestWorkflow: "",
      newestWorkflow: "",
      mostModifiedWorkflow: { slug: "", versions: 0 },
      estimatedHoursInvested: 0,
      generatedAt: new Date().toISOString(),
    };
  }

  // Build per-slug stats
  const slugVersionCounts = new Map<string, number>();
  for (const v of allVersions) {
    slugVersionCounts.set(v.workflowSlug, (slugVersionCounts.get(v.workflowSlug) ?? 0) + 1);
  }

  const uniqueSlugs = Array.from(slugVersionCounts.keys());

  // Oldest/newest by createdAt of first version per slug
  const firstVersionBySlug = new Map<string, WorkflowVersion>();
  for (const v of allVersions) {
    const existing = firstVersionBySlug.get(v.workflowSlug);
    if (!existing || v.createdAt < existing.createdAt) {
      firstVersionBySlug.set(v.workflowSlug, v);
    }
  }

  const sorted = Array.from(firstVersionBySlug.values()).sort(
    (a, b) => a.createdAt.localeCompare(b.createdAt),
  );

  const oldestWorkflow = sorted[0]?.workflowSlug ?? "";
  const newestWorkflow = sorted[sorted.length - 1]?.workflowSlug ?? "";

  let mostModifiedSlug = uniqueSlugs[0];
  let mostModifiedCount = slugVersionCounts.get(mostModifiedSlug) ?? 0;
  for (const [slug, count] of slugVersionCounts) {
    if (count > mostModifiedCount) {
      mostModifiedSlug = slug;
      mostModifiedCount = count;
    }
  }

  const totalVersions = allVersions.length;

  return {
    tenantId,
    totalWorkflows: uniqueSlugs.length,
    totalVersions,
    totalChanges: totalVersions,
    oldestWorkflow,
    newestWorkflow,
    mostModifiedWorkflow: { slug: mostModifiedSlug, versions: mostModifiedCount },
    estimatedHoursInvested: Math.round(totalVersions * 0.5 * 10) / 10,
    generatedAt: new Date().toISOString(),
  };
}

export async function listTenantWorkflows(
  tenantId: string,
): Promise<{ slug: string; latestVersion: number; lastChangedAt: string }[]> {
  const slugMap = new Map<string, WorkflowVersion>();

  for (const v of versionStore.values()) {
    if (v.tenantId !== tenantId) continue;
    const existing = slugMap.get(v.workflowSlug);
    if (!existing || v.version > existing.version) {
      slugMap.set(v.workflowSlug, v);
    }
  }

  if (slugMap.size === 0) {
    const rows = await dbQuery<{ payload: WorkflowVersion }>(
      `SELECT DISTINCT ON (workflow_slug) payload
       FROM lead_os_workflow_versions
       WHERE tenant_id = $1
       ORDER BY workflow_slug, version DESC`,
      [tenantId],
    );

    if (rows) {
      for (const row of rows.rows) {
        const record = row.payload as WorkflowVersion;
        slugMap.set(record.workflowSlug, record);
        versionStore.set(entryKey(tenantId, record.workflowSlug, record.version), record);
        const ck = counterKey(tenantId, record.workflowSlug);
        versionCounters.set(ck, record.version);
      }
    }
  }

  return Array.from(slugMap.values()).map((v) => ({
    slug: v.workflowSlug,
    latestVersion: v.version,
    lastChangedAt: v.createdAt,
  }));
}

// ---------------------------------------------------------------------------
// Test utilities
// ---------------------------------------------------------------------------

export function resetWorkflowVersionStore(): void {
  versionStore.clear();
  versionCounters.clear();
  schemaReady = null;
}

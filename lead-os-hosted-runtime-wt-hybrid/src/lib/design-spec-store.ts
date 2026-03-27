import { getPool } from "./db.ts";
import type { DesignSpec } from "./design-spec.ts";

export interface StoredDesignSpec {
  id: string;
  tenantId: string;
  version: number;
  spec: DesignSpec;
  status: "draft" | "active" | "archived";
  appliedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const specStore = new Map<string, StoredDesignSpec>();

let schemaReady: Promise<void> | null = null;

async function ensureSchema(): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS lead_os_design_specs (
          id TEXT PRIMARY KEY,
          tenant_id TEXT NOT NULL,
          version INTEGER NOT NULL DEFAULT 1,
          status TEXT NOT NULL DEFAULT 'draft',
          spec JSONB NOT NULL,
          applied_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_design_specs_tenant
          ON lead_os_design_specs (tenant_id);
        CREATE INDEX IF NOT EXISTS idx_design_specs_status
          ON lead_os_design_specs (tenant_id, status);
      `);
    } catch (error) {
      schemaReady = null;
      throw error;
    }
  })();

  return schemaReady;
}

function generateId(): string {
  return `dspec_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export async function createDesignSpec(
  tenantId: string,
  spec: DesignSpec,
): Promise<StoredDesignSpec> {
  await ensureSchema();

  const now = new Date().toISOString();
  const id = generateId();

  const existing = await listSpecs(tenantId);
  const maxVersion = existing.reduce(
    (max, s) => Math.max(max, s.version),
    0,
  );

  const record: StoredDesignSpec = {
    id,
    tenantId,
    version: maxVersion + 1,
    spec,
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };

  const pool = getPool();
  if (pool) {
    await pool.query(
      `INSERT INTO lead_os_design_specs (id, tenant_id, version, status, spec, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, tenantId, record.version, "draft", JSON.stringify(spec), now, now],
    );
  }

  specStore.set(id, record);
  return record;
}

export async function getDesignSpec(
  id: string,
): Promise<StoredDesignSpec | null> {
  const cached = specStore.get(id);
  if (cached) return cached;

  const pool = getPool();
  if (!pool) return null;

  await ensureSchema();
  const result = await pool.query(
    `SELECT * FROM lead_os_design_specs WHERE id = $1`,
    [id],
  );

  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  const record = rowToRecord(row);
  specStore.set(id, record);
  return record;
}

export async function getActiveSpec(
  tenantId: string,
): Promise<StoredDesignSpec | null> {
  for (const record of specStore.values()) {
    if (record.tenantId === tenantId && record.status === "active") {
      return record;
    }
  }

  const pool = getPool();
  if (!pool) return null;

  await ensureSchema();
  const result = await pool.query(
    `SELECT * FROM lead_os_design_specs WHERE tenant_id = $1 AND status = 'active' ORDER BY version DESC LIMIT 1`,
    [tenantId],
  );

  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  const record = rowToRecord(row);
  specStore.set(record.id, record);
  return record;
}

export async function updateDesignSpec(
  id: string,
  updates: { spec?: DesignSpec; status?: StoredDesignSpec["status"] },
): Promise<StoredDesignSpec | null> {
  const existing = await getDesignSpec(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const updated: StoredDesignSpec = {
    ...existing,
    spec: updates.spec ?? existing.spec,
    status: updates.status ?? existing.status,
    updatedAt: now,
  };

  const pool = getPool();
  if (pool) {
    await ensureSchema();
    await pool.query(
      `UPDATE lead_os_design_specs SET spec = $1, status = $2, updated_at = $3 WHERE id = $4`,
      [JSON.stringify(updated.spec), updated.status, now, id],
    );
  }

  specStore.set(id, updated);
  return updated;
}

export async function listSpecs(
  tenantId: string,
): Promise<StoredDesignSpec[]> {
  const memoryResults: StoredDesignSpec[] = [];
  for (const record of specStore.values()) {
    if (record.tenantId === tenantId) {
      memoryResults.push(record);
    }
  }

  const pool = getPool();
  if (!pool) return memoryResults;

  await ensureSchema();
  const result = await pool.query(
    `SELECT * FROM lead_os_design_specs WHERE tenant_id = $1 ORDER BY version DESC`,
    [tenantId],
  );

  const dbRecords = result.rows.map(rowToRecord);
  for (const record of dbRecords) {
    specStore.set(record.id, record);
  }

  const merged = new Map<string, StoredDesignSpec>();
  for (const r of memoryResults) merged.set(r.id, r);
  for (const r of dbRecords) merged.set(r.id, r);
  return Array.from(merged.values()).sort((a, b) => b.version - a.version);
}

export async function activateSpec(
  id: string,
): Promise<StoredDesignSpec | null> {
  const spec = await getDesignSpec(id);
  if (!spec) return null;

  for (const record of specStore.values()) {
    if (
      record.tenantId === spec.tenantId &&
      record.status === "active" &&
      record.id !== id
    ) {
      record.status = "archived";
      record.updatedAt = new Date().toISOString();
    }
  }

  const pool = getPool();
  if (pool) {
    await ensureSchema();
    const now = new Date().toISOString();
    await pool.query(
      `UPDATE lead_os_design_specs SET status = 'archived', updated_at = $1 WHERE tenant_id = $2 AND status = 'active' AND id != $3`,
      [now, spec.tenantId, id],
    );
  }

  return updateDesignSpec(id, { status: "active" });
}

export async function archiveSpec(
  id: string,
): Promise<StoredDesignSpec | null> {
  return updateDesignSpec(id, { status: "archived" });
}

function rowToRecord(row: Record<string, unknown>): StoredDesignSpec {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    version: row.version as number,
    spec: row.spec as DesignSpec,
    status: row.status as StoredDesignSpec["status"],
    appliedAt: row.applied_at
      ? (row.applied_at as Date).toISOString()
      : undefined,
    createdAt: (row.created_at as Date).toISOString(),
    updatedAt: (row.updated_at as Date).toISOString(),
  };
}

export function resetDesignSpecStore(): void {
  specStore.clear();
  schemaReady = null;
}

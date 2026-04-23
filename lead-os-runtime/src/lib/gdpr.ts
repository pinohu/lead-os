import { randomUUID } from "crypto";
import { getPool } from "./db.ts";
import type { QueryResultRow } from "pg";

export interface DeletionRequest {
  id: string;
  tenantId: string;
  email: string;
  leadKey: string;
  status: "pending" | "processing" | "completed" | "failed";
  tablesProcessed: string[];
  createdAt: string;
  completedAt?: string;
}

const deletionRequestStore = new Map<string, DeletionRequest>();

let schemaReady: Promise<void> | null = null;

async function ensureSchema(): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS lead_os_deletion_requests (
          id TEXT PRIMARY KEY,
          tenant_id TEXT NOT NULL,
          email TEXT NOT NULL,
          lead_key TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          tables_processed JSONB NOT NULL DEFAULT '[]',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          completed_at TIMESTAMPTZ
        );
        CREATE INDEX IF NOT EXISTS idx_lead_os_deletion_requests_tenant
          ON lead_os_deletion_requests (tenant_id, created_at DESC);
      `);
    } catch (error: unknown) {
      console.error("Failed to create GDPR schema:", error);
      schemaReady = null;
    }
  })();

  return schemaReady;
}

export async function requestDeletion(tenantId: string, email: string): Promise<DeletionRequest> {
  await ensureSchema();

  const pool = getPool();
  let leadKey = "";

  if (pool) {
    const result = await pool.query<QueryResultRow>(
      `SELECT lead_key FROM lead_os_leads
       WHERE tenant_id = $1 AND payload->>'email' = $2
       LIMIT 1`,
      [tenantId, email],
    );
    if (result.rows.length > 0) {
      leadKey = result.rows[0].lead_key as string;
    }
  }

  if (!leadKey) {
    leadKey = `deleted-${randomUUID().slice(0, 8)}`;
  }

  const request: DeletionRequest = {
    id: randomUUID(),
    tenantId,
    email,
    leadKey,
    status: "pending",
    tablesProcessed: [],
    createdAt: new Date().toISOString(),
  };

  deletionRequestStore.set(request.id, request);

  if (pool) {
    await pool.query(
      `INSERT INTO lead_os_deletion_requests (id, tenant_id, email, lead_key, status, tables_processed, created_at)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::timestamptz)`,
      [request.id, request.tenantId, request.email, request.leadKey, request.status, JSON.stringify(request.tablesProcessed), request.createdAt],
    );
  }

  return request;
}

const DELETED_MARKER = "[DELETED]";

export async function processDeletion(requestId: string): Promise<DeletionRequest> {
  await ensureSchema();

  const request = await getDeletionStatus(requestId);
  if (!request) throw new Error(`Deletion request ${requestId} not found`);
  if (request.status !== "pending") throw new Error(`Deletion request ${requestId} is not pending`);

  request.status = "processing";
  deletionRequestStore.set(request.id, request);

  const pool = getPool();

  try {
    const tablesProcessed: string[] = [];

    if (pool) {
      await pool.query(
        `UPDATE lead_os_leads
         SET payload = jsonb_set(
           jsonb_set(
             jsonb_set(
               jsonb_set(
                 jsonb_set(payload, '{firstName}', $2::jsonb),
                 '{lastName}', $2::jsonb
               ),
               '{email}', $2::jsonb
             ),
             '{phone}', $2::jsonb
           ),
           '{company}', $2::jsonb
         )
         WHERE tenant_id = $1 AND lead_key = $3`,
        [request.tenantId, JSON.stringify(DELETED_MARKER), request.leadKey],
      );
      tablesProcessed.push("lead_os_leads");

      await pool.query(
        `UPDATE lead_os_events
         SET payload = payload - 'email' - 'phone' - 'firstName' - 'lastName' - 'company'
         WHERE tenant_id = $1 AND lead_key = $2`,
        [request.tenantId, request.leadKey],
      );
      tablesProcessed.push("lead_os_events");

      await pool.query(
        `DELETE FROM lead_os_email_tracking WHERE lead_key = $1`,
        [request.leadKey],
      );
      tablesProcessed.push("lead_os_email_tracking");

      await pool.query(
        `UPDATE lead_os_attribution_touches
         SET payload = jsonb_set(payload, '{anonymized}', 'true'::jsonb)
         WHERE lead_key = $1`,
        [request.leadKey],
      );
      tablesProcessed.push("lead_os_attribution_touches");

      await pool.query(
        `UPDATE lead_os_experiment_assignments
         SET payload = jsonb_set(payload, '{visitorId}', $1::jsonb)
         WHERE payload->>'visitorId' IN (
           SELECT payload->>'email' FROM lead_os_leads WHERE lead_key = $2
         )`,
        [JSON.stringify(DELETED_MARKER), request.leadKey],
      );
      tablesProcessed.push("lead_os_experiment_assignments");

      await pool.query(
        `DELETE FROM lead_os_marketplace_leads WHERE lead_key = $1`,
        [request.leadKey],
      );
      tablesProcessed.push("lead_os_marketplace_leads");

      await pool.query(
        `DELETE FROM lead_os_lead_magnet_deliveries WHERE lead_key = $1`,
        [request.leadKey],
      );
      tablesProcessed.push("lead_os_lead_magnet_deliveries");
    }

    request.status = "completed";
    request.tablesProcessed = tablesProcessed;
    request.completedAt = new Date().toISOString();
    deletionRequestStore.set(request.id, request);

    if (pool) {
      await pool.query(
        `UPDATE lead_os_deletion_requests
         SET status = $1, tables_processed = $2::jsonb, completed_at = $3::timestamptz
         WHERE id = $4`,
        [request.status, JSON.stringify(request.tablesProcessed), request.completedAt, request.id],
      );
    }

    return request;
  } catch (error: unknown) {
    request.status = "failed";
    request.completedAt = new Date().toISOString();
    deletionRequestStore.set(request.id, request);

    if (pool) {
      await pool.query(
        `UPDATE lead_os_deletion_requests SET status = $1, completed_at = $2::timestamptz WHERE id = $3`,
        [request.status, request.completedAt, request.id],
      );
    }

    throw error;
  }
}

export async function getDeletionStatus(requestId: string): Promise<DeletionRequest | null> {
  await ensureSchema();

  const cached = deletionRequestStore.get(requestId);
  if (cached) return cached;

  const pool = getPool();
  if (!pool) return null;

  const result = await pool.query<QueryResultRow>(
    `SELECT id, tenant_id, email, lead_key, status, tables_processed, created_at, completed_at
     FROM lead_os_deletion_requests WHERE id = $1`,
    [requestId],
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  const request: DeletionRequest = {
    id: row.id,
    tenantId: row.tenant_id,
    email: row.email,
    leadKey: row.lead_key,
    status: row.status,
    tablesProcessed: row.tables_processed ?? [],
    createdAt: new Date(row.created_at).toISOString(),
    completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : undefined,
  };

  deletionRequestStore.set(request.id, request);
  return request;
}

export async function listDeletionRequests(tenantId: string): Promise<DeletionRequest[]> {
  await ensureSchema();

  const pool = getPool();
  if (pool) {
    const result = await pool.query<QueryResultRow>(
      `SELECT id, tenant_id, email, lead_key, status, tables_processed, created_at, completed_at
       FROM lead_os_deletion_requests WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [tenantId],
    );

    return result.rows.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      email: row.email,
      leadKey: row.lead_key,
      status: row.status,
      tablesProcessed: row.tables_processed ?? [],
      createdAt: new Date(row.created_at).toISOString(),
      completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : undefined,
    }));
  }

  return [...deletionRequestStore.values()]
    .filter((r) => r.tenantId === tenantId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function exportUserData(tenantId: string, email: string): Promise<Record<string, unknown>> {
  await ensureSchema();

  const userData: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    tenantId,
    email,
    leads: [],
    events: [],
    emailTracking: [],
    attributionTouches: [],
    experimentAssignments: [],
    marketplaceLeads: [],
    leadMagnetDeliveries: [],
  };

  const pool = getPool();
  if (!pool) return userData;

  const leadsResult = await pool.query<QueryResultRow>(
    `SELECT lead_key, payload, created_at, updated_at FROM lead_os_leads
     WHERE tenant_id = $1 AND payload->>'email' = $2`,
    [tenantId, email],
  );
  userData.leads = leadsResult.rows.map((r) => ({
    leadKey: r.lead_key,
    ...r.payload,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));

  const leadKeys = leadsResult.rows.map((r) => r.lead_key as string);
  if (leadKeys.length === 0) return userData;

  const placeholders = leadKeys.map((_, i) => `$${i + 1}`).join(",");

  const eventsResult = await pool.query<QueryResultRow>(
    `SELECT id, lead_key, event_type, timestamp, payload FROM lead_os_events
     WHERE lead_key IN (${placeholders}) ORDER BY timestamp DESC`,
    leadKeys,
  );
  userData.events = eventsResult.rows;

  const emailResult = await pool.query<QueryResultRow>(
    `SELECT id, lead_key, email_id, event_type, link_url, metadata, created_at FROM lead_os_email_tracking
     WHERE lead_key IN (${placeholders}) ORDER BY created_at DESC`,
    leadKeys,
  );
  userData.emailTracking = emailResult.rows;

  const attrResult = await pool.query<QueryResultRow>(
    `SELECT * FROM lead_os_attribution_touches
     WHERE lead_key IN (${placeholders}) ORDER BY created_at DESC`,
    leadKeys,
  );
  userData.attributionTouches = attrResult.rows;

  return userData;
}

export function resetGdprStore(): void {
  deletionRequestStore.clear();
  schemaReady = null;
}

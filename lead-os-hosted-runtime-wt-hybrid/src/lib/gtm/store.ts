// src/lib/gtm/store.ts
// Postgres persistence for GTM operator status (per tenant + canonical slug).

import { getPool, queryPostgres } from "../db.ts";
import type { GtmOperatorStatus } from "./status.ts";
import { isGtmOperatorStatus } from "./status.ts";

export interface GtmStatusRow {
  slug: string;
  status: GtmOperatorStatus;
  notes: string;
  updatedAt: string;
  updatedBy: string | null;
}

export async function listGtmStatusRows(tenantId: string): Promise<GtmStatusRow[]> {
  if (!getPool()) return [];
  try {
    const r = await queryPostgres<{
      slug: string;
      status: string;
      notes: string;
      updated_at: string;
      updated_by: string | null;
    }>(
      `SELECT slug, status, notes, updated_at::text, updated_by
       FROM gtm_use_case_statuses
       WHERE tenant_id = $1
       ORDER BY slug ASC`,
      [tenantId],
    );
    return r.rows
      .filter((row) => isGtmOperatorStatus(row.status))
      .map((row) => ({
        slug: row.slug,
        status: row.status as GtmOperatorStatus,
        notes: row.notes ?? "",
        updatedAt: row.updated_at,
        updatedBy: row.updated_by,
      }));
  } catch (err) {
    console.warn("[gtm] listGtmStatusRows failed:", err instanceof Error ? err.message : String(err));
    return [];
  }
}

export async function getGtmStatusRow(
  tenantId: string,
  slug: string,
): Promise<GtmStatusRow | null> {
  if (!getPool()) return null;
  try {
    const r = await queryPostgres<{
      slug: string;
      status: string;
      notes: string;
      updated_at: string;
      updated_by: string | null;
    }>(
      `SELECT slug, status, notes, updated_at::text, updated_by
       FROM gtm_use_case_statuses
       WHERE tenant_id = $1 AND slug = $2`,
      [tenantId, slug],
    );
    const row = r.rows[0];
    if (!row || !isGtmOperatorStatus(row.status)) return null;
    return {
      slug: row.slug,
      status: row.status,
      notes: row.notes ?? "",
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
    };
  } catch (err) {
    console.warn("[gtm] getGtmStatusRow failed:", err instanceof Error ? err.message : String(err));
    return null;
  }
}

export async function upsertGtmStatusRow(input: {
  tenantId: string;
  slug: string;
  status: GtmOperatorStatus;
  notes: string;
  updatedBy: string;
}): Promise<void> {
  await queryPostgres(
    `INSERT INTO gtm_use_case_statuses (tenant_id, slug, status, notes, updated_at, updated_by)
     VALUES ($1, $2, $3, $4, NOW(), $5)
     ON CONFLICT (tenant_id, slug) DO UPDATE SET
       status = EXCLUDED.status,
       notes = EXCLUDED.notes,
       updated_at = NOW(),
       updated_by = EXCLUDED.updated_by`,
    [input.tenantId, input.slug, input.status, input.notes, input.updatedBy],
  );
}

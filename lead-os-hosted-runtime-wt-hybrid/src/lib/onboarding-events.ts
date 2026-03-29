import { getPool } from "./db.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ChecklistEventType =
  | "brand-configured"
  | "email-connected"
  | "widget-configured"
  | "first-lead-captured"
  | "scoring-reviewed"
  | "gone-live";

export interface ChecklistEvent {
  tenantId: string;
  eventType: ChecklistEventType;
  metadata?: Record<string, unknown>;
  occurredAt: string;
}

export interface ChecklistProgress {
  tenantId: string;
  brandConfigured: boolean;
  emailConnected: boolean;
  widgetConfigured: boolean;
  firstLeadCaptured: boolean;
  scoringReviewed: boolean;
  goneLive: boolean;
  completedAt?: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const progressStore = new Map<string, ChecklistProgress>();

let schemaReady: Promise<void> | null = null;

// ---------------------------------------------------------------------------
// Schema bootstrap
// ---------------------------------------------------------------------------

async function ensureChecklistSchema(): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS lead_os_checklist_progress (
          tenant_id TEXT PRIMARY KEY,
          brand_configured BOOLEAN NOT NULL DEFAULT false,
          email_connected BOOLEAN NOT NULL DEFAULT false,
          widget_configured BOOLEAN NOT NULL DEFAULT false,
          first_lead_captured BOOLEAN NOT NULL DEFAULT false,
          scoring_reviewed BOOLEAN NOT NULL DEFAULT false,
          gone_live BOOLEAN NOT NULL DEFAULT false,
          completed_at TIMESTAMPTZ,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);
    } catch (error) {
      schemaReady = null;
      throw error;
    }
  })();

  return schemaReady;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function defaultProgress(tenantId: string): ChecklistProgress {
  return {
    tenantId,
    brandConfigured: false,
    emailConnected: false,
    widgetConfigured: false,
    firstLeadCaptured: false,
    scoringReviewed: false,
    goneLive: false,
    completedAt: undefined,
    updatedAt: new Date().toISOString(),
  };
}

function eventTypeToField(eventType: ChecklistEventType): keyof Omit<ChecklistProgress, "tenantId" | "completedAt" | "updatedAt"> {
  const map: Record<ChecklistEventType, keyof Omit<ChecklistProgress, "tenantId" | "completedAt" | "updatedAt">> = {
    "brand-configured": "brandConfigured",
    "email-connected": "emailConnected",
    "widget-configured": "widgetConfigured",
    "first-lead-captured": "firstLeadCaptured",
    "scoring-reviewed": "scoringReviewed",
    "gone-live": "goneLive",
  };
  return map[eventType];
}

function allStepsComplete(progress: ChecklistProgress): boolean {
  return (
    progress.brandConfigured &&
    progress.emailConnected &&
    progress.widgetConfigured &&
    progress.firstLeadCaptured &&
    progress.scoringReviewed &&
    progress.goneLive
  );
}

function rowToProgress(row: Record<string, unknown>): ChecklistProgress {
  return {
    tenantId: row.tenant_id as string,
    brandConfigured: row.brand_configured as boolean,
    emailConnected: row.email_connected as boolean,
    widgetConfigured: row.widget_configured as boolean,
    firstLeadCaptured: row.first_lead_captured as boolean,
    scoringReviewed: row.scoring_reviewed as boolean,
    goneLive: row.gone_live as boolean,
    completedAt: row.completed_at ? new Date(row.completed_at as string).toISOString() : undefined,
    updatedAt: new Date(row.updated_at as string).toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function emitChecklistEvent(event: ChecklistEvent): Promise<void> {
  const { tenantId, eventType, occurredAt } = event;
  const field = eventTypeToField(eventType);
  const pool = getPool();

  if (pool) {
    try {
      await ensureChecklistSchema();

      // Upsert the row, marking the specific step complete.
      // completedAt is set only when all six flags flip to true for the first time.
      await pool.query(
        `INSERT INTO lead_os_checklist_progress
           (tenant_id, brand_configured, email_connected, widget_configured,
            first_lead_captured, scoring_reviewed, gone_live, updated_at)
         VALUES ($1, false, false, false, false, false, false, $2)
         ON CONFLICT (tenant_id) DO NOTHING`,
        [tenantId, occurredAt],
      );

      await pool.query(
        `UPDATE lead_os_checklist_progress
         SET ${field.replace(/([A-Z])/g, "_$1").toLowerCase()} = true,
             updated_at = $2
         WHERE tenant_id = $1`,
        [tenantId, occurredAt],
      );

      // Conditionally set completed_at when all steps are now true.
      await pool.query(
        `UPDATE lead_os_checklist_progress
         SET completed_at = $2
         WHERE tenant_id = $1
           AND completed_at IS NULL
           AND brand_configured = true
           AND email_connected = true
           AND widget_configured = true
           AND first_lead_captured = true
           AND scoring_reviewed = true
           AND gone_live = true`,
        [tenantId, occurredAt],
      );
    } catch {
      // DB failure — fall through to memory-only update
    }
    return;
  }

  // Memory path
  const existing = progressStore.get(tenantId) ?? defaultProgress(tenantId);
  existing[field] = true;
  existing.updatedAt = occurredAt;
  if (allStepsComplete(existing) && !existing.completedAt) {
    existing.completedAt = occurredAt;
  }
  progressStore.set(tenantId, existing);
}

export async function getChecklistProgress(tenantId: string): Promise<ChecklistProgress> {
  const pool = getPool();

  if (pool) {
    try {
      await ensureChecklistSchema();
      const result = await pool.query(
        `SELECT tenant_id, brand_configured, email_connected, widget_configured,
                first_lead_captured, scoring_reviewed, gone_live,
                completed_at, updated_at
         FROM lead_os_checklist_progress
         WHERE tenant_id = $1`,
        [tenantId],
      );
      if (result.rows.length === 0) return defaultProgress(tenantId);
      return rowToProgress(result.rows[0]);
    } catch {
      // DB failure — fall through to memory
    }
  }

  return progressStore.get(tenantId) ?? defaultProgress(tenantId);
}

export async function isChecklistComplete(tenantId: string): Promise<boolean> {
  const progress = await getChecklistProgress(tenantId);
  return allStepsComplete(progress);
}

export async function resetChecklistProgress(tenantId: string): Promise<void> {
  const pool = getPool();

  if (pool) {
    try {
      await ensureChecklistSchema();
      await pool.query(
        `DELETE FROM lead_os_checklist_progress WHERE tenant_id = $1`,
        [tenantId],
      );
    } catch {
      // DB failure — fall through to memory
    }
    return;
  }

  progressStore.delete(tenantId);
}

/** Clears all in-memory progress. Only for testing. */
export function resetChecklistStore(): void {
  progressStore.clear();
  schemaReady = null;
}

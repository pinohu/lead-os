import { getPool } from "./db.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LeadContextScores {
  intent: number;
  fit: number;
  engagement: number;
  urgency: number;
  composite: number;
  temperature: "cold" | "warm" | "hot" | "burning";
}

export interface PsychologyProfile {
  trustLevel: number;
  fearTriggers: string[];
  desireTriggers: string[];
  objections: string[];
  identityType: string;
  emotionalStage: string;
}

export interface Interaction {
  type: string;
  timestamp: string;
  channel: string;
  metadata: Record<string, unknown>;
}

export interface Touchpoint {
  channel: string;
  source: string;
  timestamp: string;
}

export interface LeadContext {
  leadKey: string;
  tenantId: string;
  niche: string;

  email?: string;
  phone?: string;
  name?: string;
  company?: string;
  source: string;

  scores: LeadContextScores;

  funnelStage: string;
  funnelFamily: string;
  currentRoute: "fast-track" | "conversion" | "nurture" | "drip";

  psychologyProfile: PsychologyProfile;

  interactions: Interaction[];
  touchpoints: Touchpoint[];

  designSpecId?: string;

  offersPresented: string[];
  offersAccepted: string[];

  escalated: boolean;
  assignedRep?: string;

  firstSeen: string;
  lastSeen: string;
  updatedAt: string;
}

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<U>
    : T[P] extends object
      ? DeepPartial<T[P]>
      : T[P];
};

export type LeadContextUpdate = DeepPartial<Omit<LeadContext, "leadKey" | "tenantId" | "firstSeen">>;

export interface ContextListFilters {
  funnelStage?: string;
  currentRoute?: string;
  minCompositeScore?: number;
  maxCompositeScore?: number;
  temperature?: LeadContextScores["temperature"];
  escalated?: boolean;
  limit?: number;
  cursor?: string;
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const store = new Map<string, LeadContext>();

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

function defaultScores(): LeadContextScores {
  return { intent: 0, fit: 0, engagement: 0, urgency: 0, composite: 0, temperature: "cold" };
}

function defaultPsychologyProfile(): PsychologyProfile {
  return {
    trustLevel: 0,
    fearTriggers: [],
    desireTriggers: [],
    objections: [],
    identityType: "unknown",
    emotionalStage: "unaware",
  };
}

// ---------------------------------------------------------------------------
// Deep merge
// ---------------------------------------------------------------------------

function deepMerge<T extends Record<string, unknown>>(target: T, source: Record<string, unknown>): T {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const srcVal = source[key];
    const tgtVal = (target as Record<string, unknown>)[key];

    if (
      srcVal !== undefined &&
      srcVal !== null &&
      typeof srcVal === "object" &&
      !Array.isArray(srcVal) &&
      typeof tgtVal === "object" &&
      tgtVal !== null &&
      !Array.isArray(tgtVal)
    ) {
      (result as Record<string, unknown>)[key] = deepMerge(
        tgtVal as Record<string, unknown>,
        srcVal as Record<string, unknown>,
      );
    } else if (srcVal !== undefined) {
      (result as Record<string, unknown>)[key] = srcVal;
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Postgres persistence helpers
// ---------------------------------------------------------------------------

const TABLE_NAME = "lead_contexts";

async function ensureTable(): Promise<boolean> {
  const pool = getPool();
  if (!pool) return false;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      lead_key   TEXT PRIMARY KEY,
      tenant_id  TEXT NOT NULL,
      data       JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_lead_contexts_tenant_id ON ${TABLE_NAME} (tenant_id)
  `);
  return true;
}

let tableReady: Promise<boolean> | null = null;

function getTableReady(): Promise<boolean> {
  if (!tableReady) {
    tableReady = ensureTable().catch(() => false);
  }
  return tableReady;
}

async function persistToPostgres(ctx: LeadContext): Promise<void> {
  const ready = await getTableReady();
  if (!ready) return;
  const pool = getPool();
  if (!pool) return;
  await pool.query(
    `INSERT INTO ${TABLE_NAME} (lead_key, tenant_id, data, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (lead_key) DO UPDATE SET data = $3, tenant_id = $2, updated_at = NOW()`,
    [ctx.leadKey, ctx.tenantId, JSON.stringify(ctx)],
  );
}

async function loadFromPostgres(leadKey: string): Promise<LeadContext | null> {
  const ready = await getTableReady();
  if (!ready) return null;
  const pool = getPool();
  if (!pool) return null;
  const result = await pool.query<{ data: LeadContext }>(
    `SELECT data FROM ${TABLE_NAME} WHERE lead_key = $1`,
    [leadKey],
  );
  if (result.rows.length === 0) return null;
  return result.rows[0].data;
}

async function loadByTenantFromPostgres(
  tenantId: string,
  filters: ContextListFilters,
): Promise<LeadContext[]> {
  const ready = await getTableReady();
  if (!ready) return [];
  const pool = getPool();
  if (!pool) return [];

  const conditions: string[] = ["tenant_id = $1"];
  const values: unknown[] = [tenantId];
  let paramIdx = 2;

  if (filters.funnelStage) {
    conditions.push(`data->>'funnelStage' = $${paramIdx}`);
    values.push(filters.funnelStage);
    paramIdx++;
  }
  if (filters.currentRoute) {
    conditions.push(`data->>'currentRoute' = $${paramIdx}`);
    values.push(filters.currentRoute);
    paramIdx++;
  }
  if (filters.temperature) {
    conditions.push(`data->'scores'->>'temperature' = $${paramIdx}`);
    values.push(filters.temperature);
    paramIdx++;
  }
  if (typeof filters.escalated === "boolean") {
    conditions.push(`(data->>'escalated')::boolean = $${paramIdx}`);
    values.push(filters.escalated);
    paramIdx++;
  }
  if (typeof filters.minCompositeScore === "number") {
    conditions.push(`(data->'scores'->>'composite')::numeric >= $${paramIdx}`);
    values.push(filters.minCompositeScore);
    paramIdx++;
  }
  if (typeof filters.maxCompositeScore === "number") {
    conditions.push(`(data->'scores'->>'composite')::numeric <= $${paramIdx}`);
    values.push(filters.maxCompositeScore);
    paramIdx++;
  }
  if (filters.cursor) {
    conditions.push(`lead_key > $${paramIdx}`);
    values.push(filters.cursor);
    paramIdx++;
  }

  const limit = Math.min(filters.limit ?? 20, 100);
  const sql = `SELECT data FROM ${TABLE_NAME} WHERE ${conditions.join(" AND ")} ORDER BY lead_key LIMIT ${limit}`;
  const result = await pool.query<{ data: LeadContext }>(sql, values);
  return result.rows.map((r) => r.data);
}

async function deleteFromPostgres(leadKey: string): Promise<void> {
  const ready = await getTableReady();
  if (!ready) return;
  const pool = getPool();
  if (!pool) return;
  await pool.query(`DELETE FROM ${TABLE_NAME} WHERE lead_key = $1`, [leadKey]);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface CreateContextInput {
  niche?: string;
  email?: string;
  phone?: string;
  name?: string;
  company?: string;
  source?: string;
  designSpecId?: string;
}

export function createContext(
  leadKey: string,
  tenantId: string,
  initialData: CreateContextInput = {},
): LeadContext {
  const now = new Date().toISOString();

  const ctx: LeadContext = {
    leadKey,
    tenantId,
    niche: initialData.niche ?? "general",
    email: initialData.email,
    phone: initialData.phone,
    name: initialData.name,
    company: initialData.company,
    source: initialData.source ?? "direct",
    scores: defaultScores(),
    funnelStage: "new",
    funnelFamily: "default",
    currentRoute: "nurture",
    psychologyProfile: defaultPsychologyProfile(),
    interactions: [],
    touchpoints: [],
    designSpecId: initialData.designSpecId,
    offersPresented: [],
    offersAccepted: [],
    escalated: false,
    firstSeen: now,
    lastSeen: now,
    updatedAt: now,
  };

  store.set(leadKey, ctx);
  persistToPostgres(ctx).catch(() => {});
  return ctx;
}

export async function getContext(leadKey: string): Promise<LeadContext | null> {
  const cached = store.get(leadKey);
  if (cached) return cached;

  const persisted = await loadFromPostgres(leadKey);
  if (persisted) {
    store.set(leadKey, persisted);
    return persisted;
  }
  return null;
}

export function getContextSync(leadKey: string): LeadContext | null {
  return store.get(leadKey) ?? null;
}

export function updateContext(leadKey: string, partial: LeadContextUpdate): LeadContext | null {
  const existing = store.get(leadKey);
  if (!existing) return null;

  const merged = deepMerge(existing as unknown as Record<string, unknown>, partial as Record<string, unknown>) as unknown as LeadContext;
  merged.updatedAt = new Date().toISOString();
  merged.lastSeen = merged.updatedAt;

  store.set(leadKey, merged);
  persistToPostgres(merged).catch(() => {});
  return merged;
}

export function addInteraction(leadKey: string, interaction: Interaction): LeadContext | null {
  const existing = store.get(leadKey);
  if (!existing) return null;

  existing.interactions.push(interaction);
  existing.lastSeen = new Date().toISOString();
  existing.updatedAt = existing.lastSeen;

  store.set(leadKey, existing);
  persistToPostgres(existing).catch(() => {});
  return existing;
}

export function addTouchpoint(leadKey: string, touchpoint: Touchpoint): LeadContext | null {
  const existing = store.get(leadKey);
  if (!existing) return null;

  existing.touchpoints.push(touchpoint);
  existing.lastSeen = new Date().toISOString();
  existing.updatedAt = existing.lastSeen;

  store.set(leadKey, existing);
  persistToPostgres(existing).catch(() => {});
  return existing;
}

export function getContextSnapshot(leadKey: string): Readonly<LeadContext> | null {
  const existing = store.get(leadKey);
  if (!existing) return null;
  return Object.freeze(JSON.parse(JSON.stringify(existing)) as LeadContext);
}

export async function getContextsByTenant(
  tenantId: string,
  filters: ContextListFilters = {},
): Promise<LeadContext[]> {
  const limit = Math.min(filters.limit ?? 20, 100);

  // Try in-memory first
  const inMemory: LeadContext[] = [];
  for (const ctx of store.values()) {
    if (ctx.tenantId !== tenantId) continue;
    if (filters.funnelStage && ctx.funnelStage !== filters.funnelStage) continue;
    if (filters.currentRoute && ctx.currentRoute !== filters.currentRoute) continue;
    if (filters.temperature && ctx.scores.temperature !== filters.temperature) continue;
    if (typeof filters.escalated === "boolean" && ctx.escalated !== filters.escalated) continue;
    if (typeof filters.minCompositeScore === "number" && ctx.scores.composite < filters.minCompositeScore) continue;
    if (typeof filters.maxCompositeScore === "number" && ctx.scores.composite > filters.maxCompositeScore) continue;
    if (filters.cursor && ctx.leadKey <= filters.cursor) continue;
    inMemory.push(ctx);
  }

  if (inMemory.length > 0) {
    inMemory.sort((a, b) => a.leadKey.localeCompare(b.leadKey));
    return inMemory.slice(0, limit);
  }

  return loadByTenantFromPostgres(tenantId, { ...filters, limit });
}

export function deleteContext(leadKey: string): boolean {
  const existed = store.delete(leadKey);
  deleteFromPostgres(leadKey).catch(() => {});
  return existed;
}

export function resetContextStore(): void {
  store.clear();
}

export function getContextStoreSize(): number {
  return store.size;
}

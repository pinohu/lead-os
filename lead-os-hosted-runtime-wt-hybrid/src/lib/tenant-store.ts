import { getPool } from "./db.ts";
import type { TenantConfig } from "./tenant.ts";

export type RevenueModel = "managed" | "white-label" | "implementation" | "directory";
export type PlanTier = "starter" | "growth" | "enterprise" | "custom";
export type TenantStatus = "provisioning" | "active" | "suspended" | "cancelled";

export interface TenantRecord {
  tenantId: string;
  slug: string;
  brandName: string;
  siteUrl: string;
  supportEmail: string;
  defaultService: string;
  defaultNiche: string;
  widgetOrigins: string[];
  accent: string;
  enabledFunnels: string[];
  channels: TenantConfig["channels"];
  revenueModel: RevenueModel;
  plan: PlanTier;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  status: TenantStatus;
  operatorEmails: string[];
  providerConfig: Record<string, string>;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

const tenantStore = new Map<string, TenantRecord>();
const slugIndex = new Map<string, string>();

let schemaReady: Promise<void> | null = null;

async function ensureSchema(): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS lead_os_tenants (
          id TEXT PRIMARY KEY,
          slug TEXT UNIQUE NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          payload JSONB NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_lead_os_tenants_slug
          ON lead_os_tenants (slug);
        CREATE INDEX IF NOT EXISTS idx_lead_os_tenants_status
          ON lead_os_tenants ((payload->>'status'));
      `);
    } catch (error) {
      schemaReady = null;
      throw error;
    }
  })();

  return schemaReady;
}

function generateTenantId(): string {
  return crypto.randomUUID();
}

function rowToRecord(row: { id: string; slug: string; created_at: Date; updated_at: Date; payload: Record<string, unknown> }): TenantRecord {
  const p = row.payload;
  return {
    tenantId: row.id,
    slug: row.slug,
    brandName: p.brandName as string,
    siteUrl: p.siteUrl as string,
    supportEmail: p.supportEmail as string,
    defaultService: p.defaultService as string,
    defaultNiche: p.defaultNiche as string,
    widgetOrigins: (p.widgetOrigins as string[]) ?? [],
    accent: p.accent as string,
    enabledFunnels: (p.enabledFunnels as string[]) ?? [],
    channels: p.channels as TenantConfig["channels"],
    revenueModel: p.revenueModel as RevenueModel,
    plan: p.plan as PlanTier,
    stripeCustomerId: p.stripeCustomerId as string | undefined,
    stripeSubscriptionId: p.stripeSubscriptionId as string | undefined,
    status: p.status as TenantStatus,
    operatorEmails: (p.operatorEmails as string[]) ?? [],
    providerConfig: (p.providerConfig as Record<string, string>) ?? {},
    metadata: (p.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function recordToPayload(record: TenantRecord): Record<string, unknown> {
  return {
    brandName: record.brandName,
    siteUrl: record.siteUrl,
    supportEmail: record.supportEmail,
    defaultService: record.defaultService,
    defaultNiche: record.defaultNiche,
    widgetOrigins: record.widgetOrigins,
    accent: record.accent,
    enabledFunnels: record.enabledFunnels,
    channels: record.channels,
    revenueModel: record.revenueModel,
    plan: record.plan,
    stripeCustomerId: record.stripeCustomerId,
    stripeSubscriptionId: record.stripeSubscriptionId,
    status: record.status,
    operatorEmails: record.operatorEmails,
    providerConfig: record.providerConfig,
    metadata: record.metadata,
  };
}

export type CreateTenantInput = Omit<TenantRecord, "tenantId" | "createdAt" | "updatedAt">;

export async function createTenant(input: CreateTenantInput): Promise<TenantRecord> {
  await ensureSchema();

  const now = new Date().toISOString();
  const tenantId = generateTenantId();

  const record: TenantRecord = {
    ...input,
    tenantId,
    createdAt: now,
    updatedAt: now,
  };

  const pool = getPool();
  if (pool) {
    const payload = recordToPayload(record);
    await pool.query(
      `INSERT INTO lead_os_tenants (id, slug, created_at, updated_at, payload)
       VALUES ($1, $2, $3, $4, $5)`,
      [tenantId, record.slug, record.createdAt, record.updatedAt, JSON.stringify(payload)],
    );
  }

  tenantStore.set(tenantId, record);
  slugIndex.set(record.slug, tenantId);

  return record;
}

export async function getTenant(tenantId: string): Promise<TenantRecord | null> {
  await ensureSchema();

  const cached = tenantStore.get(tenantId);
  if (cached) return cached;

  const pool = getPool();
  if (!pool) return null;

  const result = await pool.query(
    `SELECT id, slug, created_at, updated_at, payload FROM lead_os_tenants WHERE id = $1`,
    [tenantId],
  );

  if (result.rows.length === 0) return null;

  const record = rowToRecord(result.rows[0]);
  tenantStore.set(record.tenantId, record);
  slugIndex.set(record.slug, record.tenantId);

  return record;
}

export async function getTenantBySlug(slug: string): Promise<TenantRecord | null> {
  await ensureSchema();

  const cachedId = slugIndex.get(slug);
  if (cachedId) {
    const cached = tenantStore.get(cachedId);
    if (cached) return cached;
  }

  const pool = getPool();
  if (!pool) return null;

  const result = await pool.query(
    `SELECT id, slug, created_at, updated_at, payload FROM lead_os_tenants WHERE slug = $1`,
    [slug],
  );

  if (result.rows.length === 0) return null;

  const record = rowToRecord(result.rows[0]);
  tenantStore.set(record.tenantId, record);
  slugIndex.set(record.slug, record.tenantId);

  return record;
}

export async function updateTenant(tenantId: string, patch: Partial<TenantRecord>): Promise<TenantRecord | null> {
  await ensureSchema();

  const existing = await getTenant(tenantId);
  if (!existing) return null;

  const now = new Date().toISOString();
  const updated: TenantRecord = {
    ...existing,
    ...patch,
    tenantId: existing.tenantId,
    createdAt: existing.createdAt,
    updatedAt: now,
  };

  const pool = getPool();
  if (pool) {
    const payload = recordToPayload(updated);
    await pool.query(
      `UPDATE lead_os_tenants SET slug = $1, updated_at = $2, payload = $3 WHERE id = $4`,
      [updated.slug, updated.updatedAt, JSON.stringify(payload), tenantId],
    );
  }

  if (existing.slug !== updated.slug) {
    slugIndex.delete(existing.slug);
  }
  tenantStore.set(tenantId, updated);
  slugIndex.set(updated.slug, tenantId);

  return updated;
}

export interface ListTenantsFilters {
  status?: TenantStatus;
  revenueModel?: RevenueModel;
}

export async function listTenants(filters?: ListTenantsFilters): Promise<TenantRecord[]> {
  await ensureSchema();

  const pool = getPool();
  if (pool) {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (filters?.status) {
      conditions.push(`payload->>'status' = $${paramIndex}`);
      values.push(filters.status);
      paramIndex++;
    }
    if (filters?.revenueModel) {
      conditions.push(`payload->>'revenueModel' = $${paramIndex}`);
      values.push(filters.revenueModel);
      paramIndex++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await pool.query(
      `SELECT id, slug, created_at, updated_at, payload FROM lead_os_tenants ${where} ORDER BY created_at DESC`,
      values,
    );

    const records = result.rows.map(rowToRecord);
    for (const record of records) {
      tenantStore.set(record.tenantId, record);
      slugIndex.set(record.slug, record.tenantId);
    }
    return records;
  }

  let records = [...tenantStore.values()];
  if (filters?.status) {
    records = records.filter((r) => r.status === filters.status);
  }
  if (filters?.revenueModel) {
    records = records.filter((r) => r.revenueModel === filters.revenueModel);
  }
  return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function suspendTenant(tenantId: string): Promise<TenantRecord | null> {
  return updateTenant(tenantId, { status: "suspended" });
}

export function resetTenantStore(): void {
  tenantStore.clear();
  slugIndex.clear();
  schemaReady = null;
}

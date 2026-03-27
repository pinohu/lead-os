import { getPool } from "./db.ts";

export interface SubscriptionRecord {
  tenantId: string;
  planId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: "active" | "past_due" | "cancelled" | "trialing";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UsageRecord {
  tenantId: string;
  period: string;
  leads: number;
  emails: number;
  sms: number;
  whatsapp: number;
  updatedAt: string;
}

const subscriptionStore = new Map<string, SubscriptionRecord>();
const usageStore = new Map<string, UsageRecord>();

let schemaReady: Promise<void> | null = null;

function usageKey(tenantId: string, period: string): string {
  return `${tenantId}:${period}`;
}

export function getCurrentPeriod(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

async function ensureBillingSchema(): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS lead_os_subscriptions (
          tenant_id TEXT PRIMARY KEY,
          plan_id TEXT NOT NULL,
          stripe_customer_id TEXT NOT NULL,
          stripe_subscription_id TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'active',
          current_period_start TIMESTAMPTZ NOT NULL,
          current_period_end TIMESTAMPTZ NOT NULL,
          cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS lead_os_usage (
          tenant_id TEXT NOT NULL,
          period TEXT NOT NULL,
          leads INT NOT NULL DEFAULT 0,
          emails INT NOT NULL DEFAULT 0,
          sms INT NOT NULL DEFAULT 0,
          whatsapp INT NOT NULL DEFAULT 0,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          PRIMARY KEY (tenant_id, period)
        );

        CREATE INDEX IF NOT EXISTS idx_lead_os_usage_period
          ON lead_os_usage (period);
      `);
    } catch (error) {
      schemaReady = null;
      throw error;
    }
  })();

  return schemaReady;
}

export async function upsertSubscription(record: SubscriptionRecord): Promise<void> {
  const pool = getPool();

  if (pool) {
    await ensureBillingSchema();
    await pool.query(
      `INSERT INTO lead_os_subscriptions
        (tenant_id, plan_id, stripe_customer_id, stripe_subscription_id, status,
         current_period_start, current_period_end, cancel_at_period_end, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (tenant_id) DO UPDATE SET
         plan_id = EXCLUDED.plan_id,
         stripe_customer_id = EXCLUDED.stripe_customer_id,
         stripe_subscription_id = EXCLUDED.stripe_subscription_id,
         status = EXCLUDED.status,
         current_period_start = EXCLUDED.current_period_start,
         current_period_end = EXCLUDED.current_period_end,
         cancel_at_period_end = EXCLUDED.cancel_at_period_end,
         updated_at = EXCLUDED.updated_at`,
      [
        record.tenantId,
        record.planId,
        record.stripeCustomerId,
        record.stripeSubscriptionId,
        record.status,
        record.currentPeriodStart,
        record.currentPeriodEnd,
        record.cancelAtPeriodEnd,
        record.createdAt,
        record.updatedAt,
      ],
    );
    return;
  }

  subscriptionStore.set(record.tenantId, record);
}

export async function getSubscription(tenantId: string): Promise<SubscriptionRecord | null> {
  const pool = getPool();

  if (pool) {
    await ensureBillingSchema();
    const result = await pool.query(
      `SELECT tenant_id, plan_id, stripe_customer_id, stripe_subscription_id, status,
              current_period_start, current_period_end, cancel_at_period_end,
              created_at, updated_at
       FROM lead_os_subscriptions WHERE tenant_id = $1`,
      [tenantId],
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      tenantId: row.tenant_id,
      planId: row.plan_id,
      stripeCustomerId: row.stripe_customer_id,
      stripeSubscriptionId: row.stripe_subscription_id,
      status: row.status,
      currentPeriodStart: new Date(row.current_period_start).toISOString(),
      currentPeriodEnd: new Date(row.current_period_end).toISOString(),
      cancelAtPeriodEnd: row.cancel_at_period_end,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    };
  }

  return subscriptionStore.get(tenantId) ?? null;
}

export async function upsertUsage(record: UsageRecord): Promise<void> {
  const pool = getPool();

  if (pool) {
    await ensureBillingSchema();
    await pool.query(
      `INSERT INTO lead_os_usage (tenant_id, period, leads, emails, sms, whatsapp, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (tenant_id, period) DO UPDATE SET
         leads = EXCLUDED.leads,
         emails = EXCLUDED.emails,
         sms = EXCLUDED.sms,
         whatsapp = EXCLUDED.whatsapp,
         updated_at = EXCLUDED.updated_at`,
      [record.tenantId, record.period, record.leads, record.emails, record.sms, record.whatsapp, record.updatedAt],
    );
    return;
  }

  usageStore.set(usageKey(record.tenantId, record.period), record);
}

export async function getUsage(tenantId: string, period?: string): Promise<UsageRecord | null> {
  const activePeriod = period ?? getCurrentPeriod();
  const pool = getPool();

  if (pool) {
    await ensureBillingSchema();
    const result = await pool.query(
      `SELECT tenant_id, period, leads, emails, sms, whatsapp, updated_at
       FROM lead_os_usage WHERE tenant_id = $1 AND period = $2`,
      [tenantId, activePeriod],
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      tenantId: row.tenant_id,
      period: row.period,
      leads: row.leads,
      emails: row.emails,
      sms: row.sms,
      whatsapp: row.whatsapp,
      updatedAt: new Date(row.updated_at).toISOString(),
    };
  }

  return usageStore.get(usageKey(tenantId, activePeriod)) ?? null;
}

export type UsageMetric = "leads" | "emails" | "sms" | "whatsapp";

export async function incrementUsage(tenantId: string, metric: UsageMetric, amount: number = 1): Promise<UsageRecord> {
  const period = getCurrentPeriod();
  const now = new Date().toISOString();
  const pool = getPool();

  if (pool) {
    await ensureBillingSchema();
    const result = await pool.query(
      `INSERT INTO lead_os_usage (tenant_id, period, leads, emails, sms, whatsapp, updated_at)
       VALUES ($1, $2,
         CASE WHEN $3 = 'leads' THEN $4::int ELSE 0 END,
         CASE WHEN $3 = 'emails' THEN $4::int ELSE 0 END,
         CASE WHEN $3 = 'sms' THEN $4::int ELSE 0 END,
         CASE WHEN $3 = 'whatsapp' THEN $4::int ELSE 0 END,
         $5)
       ON CONFLICT (tenant_id, period) DO UPDATE SET
         leads = lead_os_usage.leads + CASE WHEN $3 = 'leads' THEN $4::int ELSE 0 END,
         emails = lead_os_usage.emails + CASE WHEN $3 = 'emails' THEN $4::int ELSE 0 END,
         sms = lead_os_usage.sms + CASE WHEN $3 = 'sms' THEN $4::int ELSE 0 END,
         whatsapp = lead_os_usage.whatsapp + CASE WHEN $3 = 'whatsapp' THEN $4::int ELSE 0 END,
         updated_at = $5
       RETURNING tenant_id, period, leads, emails, sms, whatsapp, updated_at`,
      [tenantId, period, metric, amount, now],
    );
    const row = result.rows[0];
    return {
      tenantId: row.tenant_id,
      period: row.period,
      leads: row.leads,
      emails: row.emails,
      sms: row.sms,
      whatsapp: row.whatsapp,
      updatedAt: new Date(row.updated_at).toISOString(),
    };
  }

  const key = usageKey(tenantId, period);
  const existing = usageStore.get(key) ?? {
    tenantId,
    period,
    leads: 0,
    emails: 0,
    sms: 0,
    whatsapp: 0,
    updatedAt: now,
  };

  existing[metric] += amount;
  existing.updatedAt = now;
  usageStore.set(key, existing);
  return existing;
}

/** Reset in-memory stores. Only for testing. */
export function _resetBillingStores(): void {
  subscriptionStore.clear();
  usageStore.clear();
}

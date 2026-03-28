import { Pool, type QueryResultRow } from "pg";
import { getPool, queryPostgres } from "./db.ts";

export type LeadStatus = "available" | "claimed" | "sold" | "expired";
export type LeadOutcome = "contacted" | "booked" | "converted" | "no-response";
export type Temperature = "cold" | "warm" | "hot" | "burning";

export interface MarketplaceLead {
  id: string;
  tenantId: string;
  leadKey: string;
  niche: string;
  qualityScore: number;
  temperature: Temperature;
  city?: string;
  state?: string;
  industry: string;
  summary: string;
  contactFields: string[];
  price: number;
  status: LeadStatus;
  claimedBy?: string;
  claimedAt?: string;
  soldAt?: string;
  outcomeReported: boolean;
  outcome?: LeadOutcome;
  createdAt: string;
  updatedAt: string;
}

export interface BuyerAccount {
  id: string;
  email: string;
  company: string;
  nicheSubscriptions: string[];
  monthlyBudget: number;
  totalSpent: number;
  leadsPurchased: number;
  status: "active" | "suspended";
  stripeCustomerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceLeadFilters {
  niche?: string;
  temperature?: Temperature;
  status?: LeadStatus;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  offset?: number;
}

const leadStore = new Map<string, MarketplaceLead>();
const buyerStore = new Map<string, BuyerAccount>();

let schemaReady: Promise<void> | null = null;

async function ensureMarketplaceSchema() {
  const activePool = getPool();
  if (!activePool) return;
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    try {
      await activePool.query(`
        CREATE TABLE IF NOT EXISTS lead_os_marketplace_leads (
          id TEXT PRIMARY KEY,
          tenant_id TEXT NOT NULL,
          lead_key TEXT NOT NULL,
          niche TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'available',
          temperature TEXT NOT NULL,
          price INTEGER NOT NULL,
          quality_score INTEGER NOT NULL,
          created_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL,
          payload JSONB NOT NULL
        );

        CREATE TABLE IF NOT EXISTS lead_os_marketplace_buyers (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          company TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'active',
          created_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL,
          payload JSONB NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_marketplace_leads_niche
          ON lead_os_marketplace_leads (niche);
        CREATE INDEX IF NOT EXISTS idx_marketplace_leads_status
          ON lead_os_marketplace_leads (status);
        CREATE INDEX IF NOT EXISTS idx_marketplace_leads_temperature
          ON lead_os_marketplace_leads (temperature);
        CREATE INDEX IF NOT EXISTS idx_marketplace_leads_price
          ON lead_os_marketplace_leads (price);
        CREATE INDEX IF NOT EXISTS idx_marketplace_buyers_email
          ON lead_os_marketplace_buyers (email);
      `);
    } catch (error) {
      schemaReady = null;
      throw error;
    }
  })();

  return schemaReady;
}

function isMissingRelationError(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "42P01",
  );
}

async function queryMarketplace<T extends QueryResultRow>(text: string, values: unknown[] = []) {
  const activePool = getPool();
  if (!activePool) {
    throw new Error("Postgres pool is not available");
  }

  await ensureMarketplaceSchema();

  try {
    return await activePool.query<T>(text, values);
  } catch (error) {
    if (!isMissingRelationError(error)) {
      throw error;
    }
    schemaReady = null;
    await ensureMarketplaceSchema();
    return activePool.query<T>(text, values);
  }
}

function hasPostgres(): boolean {
  return getPool() !== null;
}

// ---------------------------------------------------------------------------
// Marketplace leads
// ---------------------------------------------------------------------------

export async function publishLead(lead: MarketplaceLead): Promise<MarketplaceLead> {
  leadStore.set(lead.id, lead);

  if (!hasPostgres()) return lead;

  await queryMarketplace(
    `
      INSERT INTO lead_os_marketplace_leads (id, tenant_id, lead_key, niche, status, temperature, price, quality_score, created_at, updated_at, payload)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::timestamptz, $10::timestamptz, $11::jsonb)
      ON CONFLICT (id)
      DO UPDATE SET
        status = EXCLUDED.status,
        updated_at = EXCLUDED.updated_at,
        payload = EXCLUDED.payload
    `,
    [lead.id, lead.tenantId, lead.leadKey, lead.niche, lead.status, lead.temperature, lead.price, lead.qualityScore, lead.createdAt, lead.updatedAt, JSON.stringify(lead)],
  );

  return lead;
}

export async function getMarketplaceLead(id: string): Promise<MarketplaceLead | undefined> {
  if (!hasPostgres()) return leadStore.get(id);

  const result = await queryMarketplace<{ payload: MarketplaceLead }>(
    `SELECT payload FROM lead_os_marketplace_leads WHERE id = $1`,
    [id],
  );

  if (result.rows.length === 0) return undefined;
  const lead = result.rows[0].payload;
  leadStore.set(id, lead);
  return lead;
}

export async function listMarketplaceLeads(filters: MarketplaceLeadFilters = {}): Promise<{ leads: MarketplaceLead[]; total: number }> {
  const limit = Math.min(filters.limit ?? 20, 100);
  const offset = filters.offset ?? 0;

  if (!hasPostgres()) {
    let leads = Array.from(leadStore.values());
    if (filters.niche) leads = leads.filter((l) => l.niche === filters.niche);
    if (filters.temperature) leads = leads.filter((l) => l.temperature === filters.temperature);
    if (filters.status) leads = leads.filter((l) => l.status === filters.status);
    if (filters.minPrice !== undefined) leads = leads.filter((l) => l.price >= filters.minPrice!);
    if (filters.maxPrice !== undefined) leads = leads.filter((l) => l.price <= filters.maxPrice!);
    leads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const total = leads.length;
    return { leads: leads.slice(offset, offset + limit), total };
  }

  const conditions: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (filters.niche) {
    conditions.push(`niche = $${paramIndex++}`);
    values.push(filters.niche);
  }
  if (filters.temperature) {
    conditions.push(`temperature = $${paramIndex++}`);
    values.push(filters.temperature);
  }
  if (filters.status) {
    conditions.push(`status = $${paramIndex++}`);
    values.push(filters.status);
  }
  if (filters.minPrice !== undefined) {
    conditions.push(`price >= $${paramIndex++}`);
    values.push(filters.minPrice);
  }
  if (filters.maxPrice !== undefined) {
    conditions.push(`price <= $${paramIndex++}`);
    values.push(filters.maxPrice);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await queryMarketplace<{ count: string }>(
    `SELECT COUNT(*) as count FROM lead_os_marketplace_leads ${whereClause}`,
    values,
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const dataResult = await queryMarketplace<{ payload: MarketplaceLead }>(
    `SELECT payload FROM lead_os_marketplace_leads ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...values, limit, offset],
  );

  const leads = dataResult.rows.map((r) => r.payload);
  return { leads, total };
}

export async function claimLead(id: string, buyerId: string): Promise<MarketplaceLead | undefined> {
  const lead = await getMarketplaceLead(id);
  if (!lead) return undefined;

  lead.status = "claimed";
  lead.claimedBy = buyerId;
  lead.claimedAt = new Date().toISOString();
  lead.updatedAt = new Date().toISOString();

  return publishLead(lead);
}

export async function updateLeadOutcome(id: string, outcome: LeadOutcome): Promise<MarketplaceLead | undefined> {
  const lead = await getMarketplaceLead(id);
  if (!lead) return undefined;

  lead.outcomeReported = true;
  lead.outcome = outcome;
  lead.status = "sold";
  lead.soldAt = new Date().toISOString();
  lead.updatedAt = new Date().toISOString();

  return publishLead(lead);
}

export async function expireStaleLeads(maxAgeDays: number = 30): Promise<number> {
  const cutoff = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000).toISOString();
  let expiredCount = 0;

  if (!hasPostgres()) {
    for (const lead of leadStore.values()) {
      if (lead.status === "available" && lead.createdAt < cutoff) {
        lead.status = "expired";
        lead.updatedAt = new Date().toISOString();
        expiredCount++;
      }
    }
    return expiredCount;
  }

  const result = await queryMarketplace(
    `
      UPDATE lead_os_marketplace_leads
      SET status = 'expired',
          updated_at = NOW(),
          payload = jsonb_set(jsonb_set(payload, '{status}', '"expired"'), '{updatedAt}', to_jsonb(NOW()::text))
      WHERE status = 'available' AND created_at < $1::timestamptz
    `,
    [cutoff],
  );

  return result.rowCount ?? 0;
}

// ---------------------------------------------------------------------------
// Buyer accounts
// ---------------------------------------------------------------------------

export async function createBuyer(buyer: BuyerAccount): Promise<BuyerAccount> {
  buyerStore.set(buyer.id, buyer);

  if (!hasPostgres()) return buyer;

  await queryMarketplace(
    `
      INSERT INTO lead_os_marketplace_buyers (id, email, company, status, created_at, updated_at, payload)
      VALUES ($1, $2, $3, $4, $5::timestamptz, $6::timestamptz, $7::jsonb)
      ON CONFLICT (id)
      DO UPDATE SET
        email = EXCLUDED.email,
        company = EXCLUDED.company,
        status = EXCLUDED.status,
        updated_at = EXCLUDED.updated_at,
        payload = EXCLUDED.payload
    `,
    [buyer.id, buyer.email, buyer.company, buyer.status, buyer.createdAt, buyer.updatedAt, JSON.stringify(buyer)],
  );

  return buyer;
}

export async function getBuyer(id: string): Promise<BuyerAccount | undefined> {
  if (!hasPostgres()) return buyerStore.get(id);

  const result = await queryMarketplace<{ payload: BuyerAccount }>(
    `SELECT payload FROM lead_os_marketplace_buyers WHERE id = $1`,
    [id],
  );

  if (result.rows.length === 0) return undefined;
  const buyer = result.rows[0].payload;
  buyerStore.set(id, buyer);
  return buyer;
}

export async function getBuyerByEmail(email: string): Promise<BuyerAccount | undefined> {
  if (!hasPostgres()) {
    for (const buyer of buyerStore.values()) {
      if (buyer.email === email) return buyer;
    }
    return undefined;
  }

  const result = await queryMarketplace<{ payload: BuyerAccount }>(
    `SELECT payload FROM lead_os_marketplace_buyers WHERE email = $1`,
    [email],
  );

  if (result.rows.length === 0) return undefined;
  const buyer = result.rows[0].payload;
  buyerStore.set(buyer.id, buyer);
  return buyer;
}

export async function updateBuyer(buyer: BuyerAccount): Promise<BuyerAccount> {
  buyer.updatedAt = new Date().toISOString();
  buyerStore.set(buyer.id, buyer);

  if (!hasPostgres()) return buyer;

  await queryMarketplace(
    `
      UPDATE lead_os_marketplace_buyers
      SET email = $2, company = $3, status = $4, updated_at = $5::timestamptz, payload = $6::jsonb
      WHERE id = $1
    `,
    [buyer.id, buyer.email, buyer.company, buyer.status, buyer.updatedAt, JSON.stringify(buyer)],
  );

  return buyer;
}

export async function listBuyers(limit: number = 100): Promise<BuyerAccount[]> {
  const effectiveLimit = Math.min(limit, 500);

  if (!hasPostgres()) {
    return Array.from(buyerStore.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, effectiveLimit);
  }

  const result = await queryMarketplace<{ payload: BuyerAccount }>(
    `SELECT payload FROM lead_os_marketplace_buyers ORDER BY created_at DESC LIMIT $1`,
    [effectiveLimit],
  );

  return result.rows.map((r) => r.payload);
}

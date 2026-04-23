import { type QueryResultRow } from "pg";
import { getPool } from "./db.ts";
import type { ScoredBusiness } from "./discovery-scout.ts";
import type { ClassificationResult, OpportunityType, OpportunityPriority } from "./opportunity-classifier.ts";

export type ProspectStatus = "new" | "contacted" | "engaged" | "converted" | "rejected" | "deferred";

export interface Prospect {
  id: string;
  tenantId: string;
  businessId: string;
  businessName: string;
  niche: string;
  geo: string;
  website?: string;
  phone?: string;
  email?: string;
  opportunityType: OpportunityType;
  priority: OpportunityPriority;
  confidence: number;
  opportunityScore: number;
  digitalGapScore: number;
  affiliatePotential: number;
  partnerPotential: number;
  estimatedMonthlyValue: number;
  suggestedAction: string;
  outreachTemplate: string;
  reasoning: string[];
  status: ProspectStatus;
  lastContactedAt?: string;
  contactAttempts: number;
  notes?: string;
  pipelineLeadKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProspectFilters {
  tenantId: string;
  status?: ProspectStatus;
  opportunityType?: OpportunityType;
  priority?: OpportunityPriority;
  niche?: string;
  minConfidence?: number;
  limit?: number;
}

const prospectStore = new Map<string, Prospect>();

let schemaReady: Promise<void> | null = null;

async function ensureProspectSchema() {
  const activePool = getPool();
  if (!activePool) return;
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    try {
      await activePool.query(`
        CREATE TABLE IF NOT EXISTS lead_os_prospects (
          id TEXT PRIMARY KEY,
          tenant_id TEXT NOT NULL,
          business_name TEXT NOT NULL,
          niche TEXT NOT NULL,
          geo TEXT NOT NULL,
          opportunity_type TEXT NOT NULL,
          priority TEXT NOT NULL,
          confidence INTEGER NOT NULL DEFAULT 0,
          opportunity_score INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'new',
          estimated_monthly_value INTEGER NOT NULL DEFAULT 0,
          contact_attempts INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL,
          payload JSONB NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_lead_os_prospects_tenant
          ON lead_os_prospects (tenant_id);
        CREATE INDEX IF NOT EXISTS idx_lead_os_prospects_status
          ON lead_os_prospects (tenant_id, status);
        CREATE INDEX IF NOT EXISTS idx_lead_os_prospects_type
          ON lead_os_prospects (tenant_id, opportunity_type);
        CREATE INDEX IF NOT EXISTS idx_lead_os_prospects_priority
          ON lead_os_prospects (tenant_id, priority, confidence DESC);
        CREATE INDEX IF NOT EXISTS idx_lead_os_prospects_niche
          ON lead_os_prospects (tenant_id, niche);
      `);
    } catch (error) {
      schemaReady = null;
      throw error;
    }
  })();

  return schemaReady;
}

function isMissingRelationError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "42P01",
  );
}

async function queryProspects<T extends QueryResultRow>(text: string, values: unknown[] = []) {
  const activePool = getPool();
  if (!activePool) {
    throw new Error("Postgres pool is not available");
  }

  await ensureProspectSchema();

  try {
    return await activePool.query<T>(text, values);
  } catch (error) {
    if (!isMissingRelationError(error)) {
      throw error;
    }
    schemaReady = null;
    await ensureProspectSchema();
    return activePool.query<T>(text, values);
  }
}

function hasPostgres(): boolean {
  return getPool() !== null;
}

function generateProspectRecordId(): string {
  return `prec_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createProspectFromClassification(
  tenantId: string,
  classification: ClassificationResult,
): Prospect {
  const { business, primaryOpportunity } = classification;
  const now = new Date().toISOString();

  return {
    id: generateProspectRecordId(),
    tenantId,
    businessId: business.id,
    businessName: business.name,
    niche: business.niche,
    geo: business.geo,
    website: business.website,
    phone: business.phone,
    email: business.email,
    opportunityType: primaryOpportunity.type,
    priority: primaryOpportunity.priority,
    confidence: primaryOpportunity.confidence,
    opportunityScore: business.opportunityScore,
    digitalGapScore: business.digitalGapScore,
    affiliatePotential: business.affiliatePotential,
    partnerPotential: business.partnerPotential,
    estimatedMonthlyValue: primaryOpportunity.estimatedMonthlyValue,
    suggestedAction: primaryOpportunity.suggestedAction,
    outreachTemplate: primaryOpportunity.outreachTemplate,
    reasoning: primaryOpportunity.reasoning,
    status: "new",
    contactAttempts: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export async function addProspect(prospect: Prospect): Promise<Prospect> {
  prospectStore.set(prospect.id, prospect);

  if (!hasPostgres()) return prospect;

  await queryProspects(
    `INSERT INTO lead_os_prospects (id, tenant_id, business_name, niche, geo, opportunity_type, priority, confidence, opportunity_score, status, estimated_monthly_value, contact_attempts, created_at, updated_at, payload)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::timestamptz, $14::timestamptz, $15::jsonb)
     ON CONFLICT (id)
     DO UPDATE SET status = EXCLUDED.status, updated_at = EXCLUDED.updated_at, payload = EXCLUDED.payload`,
    [
      prospect.id,
      prospect.tenantId,
      prospect.businessName,
      prospect.niche,
      prospect.geo,
      prospect.opportunityType,
      prospect.priority,
      prospect.confidence,
      prospect.opportunityScore,
      prospect.status,
      prospect.estimatedMonthlyValue,
      prospect.contactAttempts,
      prospect.createdAt,
      prospect.updatedAt,
      JSON.stringify(prospect),
    ],
  );

  return prospect;
}

export async function getProspect(id: string): Promise<Prospect | undefined> {
  if (!hasPostgres()) return prospectStore.get(id);

  const result = await queryProspects<{ payload: Prospect }>(
    `SELECT payload FROM lead_os_prospects WHERE id = $1`,
    [id],
  );

  if (result.rows.length === 0) return undefined;
  const prospect = result.rows[0].payload;
  prospectStore.set(id, prospect);
  return prospect;
}

export async function updateProspect(prospect: Prospect): Promise<Prospect> {
  prospect.updatedAt = new Date().toISOString();
  prospectStore.set(prospect.id, prospect);

  if (!hasPostgres()) return prospect;

  await queryProspects(
    `UPDATE lead_os_prospects
     SET status = $2, priority = $3, confidence = $4, contact_attempts = $5, estimated_monthly_value = $6,
         updated_at = $7::timestamptz, payload = $8::jsonb
     WHERE id = $1`,
    [
      prospect.id,
      prospect.status,
      prospect.priority,
      prospect.confidence,
      prospect.contactAttempts,
      prospect.estimatedMonthlyValue,
      prospect.updatedAt,
      JSON.stringify(prospect),
    ],
  );

  return prospect;
}

export async function listProspects(filters: ProspectFilters): Promise<Prospect[]> {
  const effectiveLimit = Math.min(filters.limit ?? 50, 200);

  if (!hasPostgres()) {
    return Array.from(prospectStore.values())
      .filter((p) => {
        if (p.tenantId !== filters.tenantId) return false;
        if (filters.status && p.status !== filters.status) return false;
        if (filters.opportunityType && p.opportunityType !== filters.opportunityType) return false;
        if (filters.priority && p.priority !== filters.priority) return false;
        if (filters.niche && p.niche !== filters.niche) return false;
        if (filters.minConfidence && p.confidence < filters.minConfidence) return false;
        return true;
      })
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, effectiveLimit);
  }

  const conditions = ["tenant_id = $1"];
  const values: unknown[] = [filters.tenantId];
  let paramIndex = 2;

  if (filters.status) {
    conditions.push(`status = $${paramIndex}`);
    values.push(filters.status);
    paramIndex++;
  }
  if (filters.opportunityType) {
    conditions.push(`opportunity_type = $${paramIndex}`);
    values.push(filters.opportunityType);
    paramIndex++;
  }
  if (filters.priority) {
    conditions.push(`priority = $${paramIndex}`);
    values.push(filters.priority);
    paramIndex++;
  }
  if (filters.niche) {
    conditions.push(`niche = $${paramIndex}`);
    values.push(filters.niche);
    paramIndex++;
  }
  if (filters.minConfidence) {
    conditions.push(`confidence >= $${paramIndex}`);
    values.push(filters.minConfidence);
    paramIndex++;
  }

  values.push(effectiveLimit);

  const result = await queryProspects<{ payload: Prospect }>(
    `SELECT payload FROM lead_os_prospects
     WHERE ${conditions.join(" AND ")}
     ORDER BY confidence DESC
     LIMIT $${paramIndex}`,
    values,
  );

  const prospects = result.rows.map((r) => r.payload);
  for (const p of prospects) {
    prospectStore.set(p.id, p);
  }
  return prospects;
}

export async function removeProspect(id: string): Promise<void> {
  prospectStore.delete(id);

  if (!hasPostgres()) return;

  await queryProspects(`DELETE FROM lead_os_prospects WHERE id = $1`, [id]);
}

export async function getProspectStats(tenantId: string): Promise<{
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  totalEstimatedValue: number;
}> {
  if (!hasPostgres()) {
    const all = Array.from(prospectStore.values()).filter((p) => p.tenantId === tenantId);
    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    let totalValue = 0;

    for (const p of all) {
      byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;
      byType[p.opportunityType] = (byType[p.opportunityType] ?? 0) + 1;
      byPriority[p.priority] = (byPriority[p.priority] ?? 0) + 1;
      totalValue += p.estimatedMonthlyValue;
    }

    return { total: all.length, byStatus, byType, byPriority, totalEstimatedValue: totalValue };
  }

  const result = await queryProspects<{
    status: string;
    opportunity_type: string;
    priority: string;
    cnt: string;
    total_value: string;
  }>(
    `SELECT status, opportunity_type, priority, COUNT(*) AS cnt, COALESCE(SUM(estimated_monthly_value), 0) AS total_value
     FROM lead_os_prospects WHERE tenant_id = $1
     GROUP BY status, opportunity_type, priority`,
    [tenantId],
  );

  const byStatus: Record<string, number> = {};
  const byType: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  let total = 0;
  let totalValue = 0;

  for (const row of result.rows) {
    const cnt = parseInt(row.cnt, 10);
    total += cnt;
    byStatus[row.status] = (byStatus[row.status] ?? 0) + cnt;
    byType[row.opportunity_type] = (byType[row.opportunity_type] ?? 0) + cnt;
    byPriority[row.priority] = (byPriority[row.priority] ?? 0) + cnt;
    totalValue += parseInt(row.total_value, 10);
  }

  return { total, byStatus, byType, byPriority, totalEstimatedValue: totalValue };
}

export function resetProspectStore(): void {
  prospectStore.clear();
  schemaReady = null;
}

export { generateProspectRecordId };

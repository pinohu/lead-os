import { type QueryResultRow } from "pg";
import { getPool } from "./db.ts";

export interface TrackedCompetitor {
  id: string;
  tenantId: string;
  url: string;
  name: string;
  nicheSlug?: string;
  lastScrapedAt?: string;
  scrapeCount: number;
  status: "active" | "paused" | "error";
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompetitorSnapshot {
  id: string;
  competitorId: string;
  tenantId: string;
  scrapedAt: string;
  colorCount: number;
  sectionCount: number;
  headlineCount: number;
  ctaCount: number;
  hasChat: boolean;
  hasBooking: boolean;
  hasPricing: boolean;
  hasTestimonials: boolean;
  confidence: number;
  summary: string;
}

const competitorStore = new Map<string, TrackedCompetitor>();
const snapshotStore = new Map<string, CompetitorSnapshot[]>();

let schemaReady: Promise<void> | null = null;

async function ensureCompetitorSchema() {
  const activePool = getPool();
  if (!activePool) return;
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    try {
      await activePool.query(`
        CREATE TABLE IF NOT EXISTS lead_os_competitors (
          id TEXT PRIMARY KEY,
          tenant_id TEXT NOT NULL,
          url TEXT NOT NULL,
          name TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'active',
          scrape_count INTEGER NOT NULL DEFAULT 0,
          last_scraped_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL,
          payload JSONB NOT NULL
        );

        CREATE TABLE IF NOT EXISTS lead_os_competitor_snapshots (
          id TEXT PRIMARY KEY,
          competitor_id TEXT NOT NULL,
          tenant_id TEXT NOT NULL,
          scraped_at TIMESTAMPTZ NOT NULL,
          confidence INTEGER NOT NULL DEFAULT 0,
          payload JSONB NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_lead_os_competitors_tenant
          ON lead_os_competitors (tenant_id);
        CREATE INDEX IF NOT EXISTS idx_lead_os_competitors_status
          ON lead_os_competitors (tenant_id, status);
        CREATE INDEX IF NOT EXISTS idx_lead_os_competitor_snapshots_competitor
          ON lead_os_competitor_snapshots (competitor_id, scraped_at DESC);
        CREATE INDEX IF NOT EXISTS idx_lead_os_competitor_snapshots_tenant
          ON lead_os_competitor_snapshots (tenant_id);
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

async function queryCompetitors<T extends QueryResultRow>(text: string, values: unknown[] = []) {
  const activePool = getPool();
  if (!activePool) {
    throw new Error("Postgres pool is not available");
  }

  await ensureCompetitorSchema();

  try {
    return await activePool.query<T>(text, values);
  } catch (error) {
    if (!isMissingRelationError(error)) {
      throw error;
    }
    schemaReady = null;
    await ensureCompetitorSchema();
    return activePool.query<T>(text, values);
  }
}

function hasPostgres(): boolean {
  return getPool() !== null;
}

function generateCompetitorId(): string {
  return `comp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function generateSnapshotId(): string {
  return `snap_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ---------------------------------------------------------------------------
// Competitors
// ---------------------------------------------------------------------------

export async function addCompetitor(competitor: TrackedCompetitor): Promise<TrackedCompetitor> {
  competitorStore.set(competitor.id, competitor);

  if (!hasPostgres()) return competitor;

  await queryCompetitors(
    `
      INSERT INTO lead_os_competitors (id, tenant_id, url, name, status, scrape_count, last_scraped_at, created_at, updated_at, payload)
      VALUES ($1, $2, $3, $4, $5, $6, $7::timestamptz, $8::timestamptz, $9::timestamptz, $10::jsonb)
      ON CONFLICT (id)
      DO UPDATE SET
        url = EXCLUDED.url,
        name = EXCLUDED.name,
        status = EXCLUDED.status,
        scrape_count = EXCLUDED.scrape_count,
        last_scraped_at = EXCLUDED.last_scraped_at,
        updated_at = EXCLUDED.updated_at,
        payload = EXCLUDED.payload
    `,
    [
      competitor.id,
      competitor.tenantId,
      competitor.url,
      competitor.name,
      competitor.status,
      competitor.scrapeCount,
      competitor.lastScrapedAt ?? null,
      competitor.createdAt,
      competitor.updatedAt,
      JSON.stringify(competitor),
    ],
  );

  return competitor;
}

export async function getCompetitor(id: string): Promise<TrackedCompetitor | undefined> {
  if (!hasPostgres()) return competitorStore.get(id);

  const result = await queryCompetitors<{ payload: TrackedCompetitor }>(
    `SELECT payload FROM lead_os_competitors WHERE id = $1`,
    [id],
  );

  if (result.rows.length === 0) return undefined;
  const competitor = result.rows[0].payload;
  competitorStore.set(id, competitor);
  return competitor;
}

export async function listCompetitors(tenantId: string): Promise<TrackedCompetitor[]> {
  if (!hasPostgres()) {
    return Array.from(competitorStore.values())
      .filter((c) => c.tenantId === tenantId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const result = await queryCompetitors<{ payload: TrackedCompetitor }>(
    `SELECT payload FROM lead_os_competitors WHERE tenant_id = $1 ORDER BY created_at DESC`,
    [tenantId],
  );

  const competitors = result.rows.map((r) => r.payload);
  for (const competitor of competitors) {
    competitorStore.set(competitor.id, competitor);
  }
  return competitors;
}

export async function updateCompetitor(competitor: TrackedCompetitor): Promise<TrackedCompetitor> {
  competitor.updatedAt = new Date().toISOString();
  competitorStore.set(competitor.id, competitor);

  if (!hasPostgres()) return competitor;

  await queryCompetitors(
    `
      UPDATE lead_os_competitors
      SET url = $2, name = $3, status = $4, scrape_count = $5, last_scraped_at = $6::timestamptz,
          updated_at = $7::timestamptz, payload = $8::jsonb
      WHERE id = $1
    `,
    [
      competitor.id,
      competitor.url,
      competitor.name,
      competitor.status,
      competitor.scrapeCount,
      competitor.lastScrapedAt ?? null,
      competitor.updatedAt,
      JSON.stringify(competitor),
    ],
  );

  return competitor;
}

export async function removeCompetitor(id: string): Promise<void> {
  competitorStore.delete(id);

  if (!hasPostgres()) return;

  await queryCompetitors(`DELETE FROM lead_os_competitors WHERE id = $1`, [id]);
}

// ---------------------------------------------------------------------------
// Snapshots
// ---------------------------------------------------------------------------

export async function addSnapshot(snapshot: CompetitorSnapshot): Promise<CompetitorSnapshot> {
  const existing = snapshotStore.get(snapshot.competitorId) ?? [];
  existing.push(snapshot);
  snapshotStore.set(snapshot.competitorId, existing);

  if (!hasPostgres()) return snapshot;

  await queryCompetitors(
    `
      INSERT INTO lead_os_competitor_snapshots (id, competitor_id, tenant_id, scraped_at, confidence, payload)
      VALUES ($1, $2, $3, $4::timestamptz, $5, $6::jsonb)
      ON CONFLICT (id) DO NOTHING
    `,
    [
      snapshot.id,
      snapshot.competitorId,
      snapshot.tenantId,
      snapshot.scrapedAt,
      snapshot.confidence,
      JSON.stringify(snapshot),
    ],
  );

  return snapshot;
}

export async function listSnapshots(competitorId: string, limit = 20): Promise<CompetitorSnapshot[]> {
  const effectiveLimit = Math.min(limit, 100);

  if (!hasPostgres()) {
    const snapshots = snapshotStore.get(competitorId) ?? [];
    return [...snapshots]
      .sort((a, b) => new Date(b.scrapedAt).getTime() - new Date(a.scrapedAt).getTime())
      .slice(0, effectiveLimit);
  }

  const result = await queryCompetitors<{ payload: CompetitorSnapshot }>(
    `SELECT payload FROM lead_os_competitor_snapshots WHERE competitor_id = $1 ORDER BY scraped_at DESC LIMIT $2`,
    [competitorId, effectiveLimit],
  );

  return result.rows.map((r) => r.payload);
}

export async function getLatestSnapshot(competitorId: string): Promise<CompetitorSnapshot | undefined> {
  if (!hasPostgres()) {
    const snapshots = snapshotStore.get(competitorId) ?? [];
    if (snapshots.length === 0) return undefined;
    return snapshots.reduce((latest, s) =>
      new Date(s.scrapedAt) > new Date(latest.scrapedAt) ? s : latest,
    );
  }

  const result = await queryCompetitors<{ payload: CompetitorSnapshot }>(
    `SELECT payload FROM lead_os_competitor_snapshots WHERE competitor_id = $1 ORDER BY scraped_at DESC LIMIT 1`,
    [competitorId],
  );

  if (result.rows.length === 0) return undefined;
  return result.rows[0].payload;
}

// ---------------------------------------------------------------------------
// ID generators (exported for route use)
// ---------------------------------------------------------------------------

export { generateCompetitorId, generateSnapshotId };

// ---------------------------------------------------------------------------
// Test reset helper
// ---------------------------------------------------------------------------

export function resetCompetitorStore(): void {
  competitorStore.clear();
  snapshotStore.clear();
  schemaReady = null;
}

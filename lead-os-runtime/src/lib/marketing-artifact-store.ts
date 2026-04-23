import { type QueryResultRow } from "pg";
import { getPool } from "./db.ts";
import type { MarketingArtifact } from "./marketing-ingestion.ts";

const artifactStore = new Map<string, MarketingArtifact>();

let schemaReady: Promise<void> | null = null;

async function ensureArtifactSchema() {
  const activePool = getPool();
  if (!activePool) return;
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    try {
      await activePool.query(`
        CREATE TABLE IF NOT EXISTS lead_os_marketing_artifacts (
          id TEXT PRIMARY KEY,
          tenant_id TEXT NOT NULL,
          source_type TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL,
          confidence INTEGER NOT NULL DEFAULT 0,
          payload JSONB NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_lead_os_marketing_artifacts_tenant
          ON lead_os_marketing_artifacts (tenant_id);
        CREATE INDEX IF NOT EXISTS idx_lead_os_marketing_artifacts_created
          ON lead_os_marketing_artifacts (tenant_id, created_at DESC);
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

async function queryArtifacts<T extends QueryResultRow>(text: string, values: unknown[] = []) {
  const activePool = getPool();
  if (!activePool) {
    throw new Error("Postgres pool is not available");
  }

  await ensureArtifactSchema();

  try {
    return await activePool.query<T>(text, values);
  } catch (error) {
    if (!isMissingRelationError(error)) {
      throw error;
    }
    schemaReady = null;
    await ensureArtifactSchema();
    return activePool.query<T>(text, values);
  }
}

function hasPostgres(): boolean {
  return getPool() !== null;
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function addArtifact(artifact: MarketingArtifact): Promise<MarketingArtifact> {
  artifactStore.set(artifact.id, artifact);

  if (!hasPostgres()) return artifact;

  await queryArtifacts(
    `
      INSERT INTO lead_os_marketing_artifacts (id, tenant_id, source_type, created_at, confidence, payload)
      VALUES ($1, $2, $3, $4::timestamptz, $5, $6::jsonb)
      ON CONFLICT (id)
      DO UPDATE SET
        confidence = EXCLUDED.confidence,
        payload = EXCLUDED.payload
    `,
    [
      artifact.id,
      artifact.tenantId,
      artifact.sourceType,
      artifact.createdAt,
      artifact.confidence,
      JSON.stringify(artifact),
    ],
  );

  return artifact;
}

export async function getArtifact(id: string): Promise<MarketingArtifact | undefined> {
  if (!hasPostgres()) return artifactStore.get(id);

  const result = await queryArtifacts<{ payload: MarketingArtifact }>(
    `SELECT payload FROM lead_os_marketing_artifacts WHERE id = $1`,
    [id],
  );

  if (result.rows.length === 0) return undefined;
  const artifact = result.rows[0].payload;
  artifactStore.set(id, artifact);
  return artifact;
}

export async function listArtifacts(tenantId: string): Promise<MarketingArtifact[]> {
  if (!hasPostgres()) {
    return Array.from(artifactStore.values())
      .filter((a) => a.tenantId === tenantId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const result = await queryArtifacts<{ payload: MarketingArtifact }>(
    `SELECT payload FROM lead_os_marketing_artifacts WHERE tenant_id = $1 ORDER BY created_at DESC`,
    [tenantId],
  );

  const artifacts = result.rows.map((r) => r.payload);
  for (const artifact of artifacts) {
    artifactStore.set(artifact.id, artifact);
  }
  return artifacts;
}

export async function removeArtifact(id: string): Promise<void> {
  artifactStore.delete(id);

  if (!hasPostgres()) return;

  await queryArtifacts(`DELETE FROM lead_os_marketing_artifacts WHERE id = $1`, [id]);
}

// ---------------------------------------------------------------------------
// Test reset helper
// ---------------------------------------------------------------------------

export function resetArtifactStore(): void {
  artifactStore.clear();
  schemaReady = null;
}

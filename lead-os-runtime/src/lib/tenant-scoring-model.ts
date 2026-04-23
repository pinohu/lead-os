import { randomUUID } from "crypto";
import { type QueryResultRow } from "pg";
import { getPool } from "./db.ts";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface ScoringWeightOverrides {
  intentWeight?: number;
  fitWeight?: number;
  engagementWeight?: number;
  urgencyWeight?: number;
  sourceWeights?: Record<string, number>;
  customFactors?: Array<{ name: string; weight: number; signal: string }>;
}

export interface ConversionOutcome {
  leadKey: string;
  tenantId: string;
  converted: boolean;
  revenue?: number;
  scoringContext: Record<string, unknown>;
  compositeScoreAtCapture: number;
  outcomeAt: string;
}

export interface ScoringModelVersion {
  tenantId: string;
  version: number;
  weights: ScoringWeightOverrides;
  accuracy: number;
  totalOutcomes: number;
  convertedOutcomes: number;
  trainedAt: string;
  appliedAt?: string;
}

export interface ModelDriftAlert {
  tenantId: string;
  currentAccuracy: number;
  previousAccuracy: number;
  drift: number;
  recommendation: string;
  alertedAt: string;
}

// ---------------------------------------------------------------------------
// Internal record types for DB rows
// ---------------------------------------------------------------------------

interface OutcomeRow extends QueryResultRow {
  id: string;
  tenant_id: string;
  payload: ConversionOutcome;
  created_at: string;
}

interface ModelRow extends QueryResultRow {
  tenant_id: string;
  version: number;
  payload: ScoringModelVersion;
  created_at: string;
}

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

const outcomeStore = new Map<string, ConversionOutcome[]>();
const modelStore = new Map<string, ScoringModelVersion[]>();

// ---------------------------------------------------------------------------
// Schema management
// ---------------------------------------------------------------------------

let schemaReady: Promise<void> | null = null;

async function ensureSchema(): Promise<void> {
  const activePool = getPool();
  if (!activePool) return;
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    try {
      await activePool.query(`
        CREATE TABLE IF NOT EXISTS lead_os_conversion_outcomes (
          id TEXT PRIMARY KEY,
          tenant_id TEXT NOT NULL,
          payload JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_lead_os_conversion_outcomes_tenant
          ON lead_os_conversion_outcomes (tenant_id);
        CREATE INDEX IF NOT EXISTS idx_lead_os_conversion_outcomes_tenant_created
          ON lead_os_conversion_outcomes (tenant_id, created_at DESC);

        CREATE TABLE IF NOT EXISTS lead_os_scoring_models (
          tenant_id TEXT NOT NULL,
          version INT NOT NULL,
          payload JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (tenant_id, version)
        );

        CREATE INDEX IF NOT EXISTS idx_lead_os_scoring_models_tenant
          ON lead_os_scoring_models (tenant_id, version DESC);
      `);
    } catch (err) {
      schemaReady = null;
      throw err;
    }
  })();

  return schemaReady;
}

function isMissingRelationError(err: unknown): boolean {
  return Boolean(
    err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: string }).code === "42P01",
  );
}

async function queryDb<T extends QueryResultRow>(
  text: string,
  values: unknown[] = [],
): Promise<import("pg").QueryResult<T>> {
  const activePool = getPool();
  if (!activePool) throw new Error("Postgres pool not available");

  await ensureSchema();

  try {
    return await activePool.query<T>(text, values);
  } catch (err) {
    if (!isMissingRelationError(err)) throw err;
    schemaReady = null;
    await ensureSchema();
    return activePool.query<T>(text, values);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_WEIGHTS: Required<
  Pick<ScoringWeightOverrides, "intentWeight" | "fitWeight" | "engagementWeight" | "urgencyWeight">
> = {
  intentWeight: 0.3,
  fitWeight: 0.25,
  engagementWeight: 0.25,
  urgencyWeight: 0.2,
};

const MINIMUM_OUTCOMES = 20;
const LEARNING_RATE = 0.1;
const DRIFT_THRESHOLD = 5;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeWeights(iw: number, fw: number, ew: number, uw: number): {
  intentWeight: number;
  fitWeight: number;
  engagementWeight: number;
  urgencyWeight: number;
} {
  const total = iw + fw + ew + uw;
  if (total === 0) return DEFAULT_WEIGHTS;
  return {
    intentWeight: iw / total,
    fitWeight: fw / total,
    engagementWeight: ew / total,
    urgencyWeight: uw / total,
  };
}

// Point-biserial correlation between a continuous predictor and a binary outcome.
// Returns a value in [-1, 1]; higher magnitude means stronger predictive power.
function pointBiserialCorrelation(values: number[], labels: number[]): number {
  const n = values.length;
  if (n < 2) return 0;

  const n1 = labels.reduce((s, l) => s + l, 0);
  const n0 = n - n1;
  if (n1 === 0 || n0 === 0) return 0;

  const mean = values.reduce((s, v) => s + v, 0) / n;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const stdDev = Math.sqrt(variance);
  if (stdDev === 0) return 0;

  const mean1 = values.reduce((s, v, i) => s + (labels[i] === 1 ? v : 0), 0) / n1;
  return ((mean1 - mean) / stdDev) * Math.sqrt((n1 * n0) / (n * n));
}

// Compute accuracy for a given set of outcomes + weights by predicting conversion
// as composite_score >= threshold and comparing to actual outcomes.
function computeModelAccuracy(
  outcomes: ConversionOutcome[],
  threshold: number = 50,
): number {
  if (outcomes.length === 0) return 0;
  const correct = outcomes.filter((o) => {
    const predicted = o.compositeScoreAtCapture >= threshold;
    return predicted === o.converted;
  }).length;
  return (correct / outcomes.length) * 100;
}

// Determine the best threshold for the given outcomes.
function findBestThreshold(outcomes: ConversionOutcome[]): number {
  let bestThreshold = 50;
  let bestAccuracy = 0;
  for (let t = 10; t <= 90; t += 5) {
    const acc = computeModelAccuracy(outcomes, t);
    if (acc > bestAccuracy) {
      bestAccuracy = acc;
      bestThreshold = t;
    }
  }
  return bestThreshold;
}

// Extract sub-scores from scoringContext if they were captured there.
// Falls back to compositeScoreAtCapture scaled by global default weights.
function extractSubScore(
  outcome: ConversionOutcome,
  dimension: "intent" | "fit" | "engagement" | "urgency",
): number {
  const ctx = outcome.scoringContext;
  const key = `${dimension}Score`;
  if (typeof ctx[key] === "number") return ctx[key] as number;

  // Derive from composite using default proportional weights.
  const weightMap: Record<string, number> = {
    intent: DEFAULT_WEIGHTS.intentWeight,
    fit: DEFAULT_WEIGHTS.fitWeight,
    engagement: DEFAULT_WEIGHTS.engagementWeight,
    urgency: DEFAULT_WEIGHTS.urgencyWeight,
  };
  return outcome.compositeScoreAtCapture * (weightMap[dimension] / 0.25);
}

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

export async function recordConversionOutcome(outcome: ConversionOutcome): Promise<void> {
  const id = `co_${randomUUID()}`;
  const tenantId = outcome.tenantId;

  const existing = outcomeStore.get(tenantId) ?? [];
  existing.push(outcome);
  outcomeStore.set(tenantId, existing);

  const activePool = getPool();
  if (!activePool) return;

  try {
    await ensureSchema();
    await activePool.query(
      `INSERT INTO lead_os_conversion_outcomes (id, tenant_id, payload, created_at)
       VALUES ($1, $2, $3::jsonb, $4::timestamptz)
       ON CONFLICT (id) DO NOTHING`,
      [id, tenantId, JSON.stringify(outcome), outcome.outcomeAt],
    );
  } catch (err) {
    // Silently absorb DB failures — memory store is the source of truth.
    console.error("[tenant-scoring-model] outcome insert failed:", err instanceof Error ? err.message : String(err));
  }
}

export async function getConversionOutcomes(
  tenantId: string,
  since?: string,
): Promise<ConversionOutcome[]> {
  const activePool = getPool();

  if (activePool) {
    try {
      await ensureSchema();
      let result;
      if (since) {
        result = await activePool.query<OutcomeRow>(
          `SELECT payload FROM lead_os_conversion_outcomes
           WHERE tenant_id = $1 AND created_at >= $2::timestamptz
           ORDER BY created_at DESC`,
          [tenantId, since],
        );
      } else {
        result = await activePool.query<OutcomeRow>(
          `SELECT payload FROM lead_os_conversion_outcomes
           WHERE tenant_id = $1
           ORDER BY created_at DESC`,
          [tenantId],
        );
      }
      return result.rows.map((r) => r.payload as ConversionOutcome);
    } catch (err) {
      console.error("[tenant-scoring-model] outcome fetch failed:", err instanceof Error ? err.message : String(err));
    }
  }

  const all = outcomeStore.get(tenantId) ?? [];
  if (!since) return all;
  const sinceDate = new Date(since).getTime();
  return all.filter((o) => new Date(o.outcomeAt).getTime() >= sinceDate);
}

export async function trainScoringModel(tenantId: string): Promise<ScoringModelVersion | null> {
  const outcomes = await getConversionOutcomes(tenantId);
  if (outcomes.length < MINIMUM_OUTCOMES) return null;

  const labels = outcomes.map((o) => (o.converted ? 1 : 0));

  const intentValues = outcomes.map((o) => extractSubScore(o, "intent"));
  const fitValues = outcomes.map((o) => extractSubScore(o, "fit"));
  const engagementValues = outcomes.map((o) => extractSubScore(o, "engagement"));
  const urgencyValues = outcomes.map((o) => extractSubScore(o, "urgency"));

  const intentCorr = Math.abs(pointBiserialCorrelation(intentValues, labels));
  const fitCorr = Math.abs(pointBiserialCorrelation(fitValues, labels));
  const engagementCorr = Math.abs(pointBiserialCorrelation(engagementValues, labels));
  const urgencyCorr = Math.abs(pointBiserialCorrelation(urgencyValues, labels));

  const existingVersions = modelStore.get(tenantId) ?? [];
  const currentWeights =
    existingVersions.length > 0
      ? existingVersions[existingVersions.length - 1].weights
      : DEFAULT_WEIGHTS;

  const iw = currentWeights.intentWeight ?? DEFAULT_WEIGHTS.intentWeight;
  const fw = currentWeights.fitWeight ?? DEFAULT_WEIGHTS.fitWeight;
  const ew = currentWeights.engagementWeight ?? DEFAULT_WEIGHTS.engagementWeight;
  const uw = currentWeights.urgencyWeight ?? DEFAULT_WEIGHTS.urgencyWeight;

  const corrTotal = intentCorr + fitCorr + engagementCorr + urgencyCorr;
  const targetIw = corrTotal > 0 ? intentCorr / corrTotal : 0.25;
  const targetFw = corrTotal > 0 ? fitCorr / corrTotal : 0.25;
  const targetEw = corrTotal > 0 ? engagementCorr / corrTotal : 0.25;
  const targetUw = corrTotal > 0 ? urgencyCorr / corrTotal : 0.25;

  const newIw = clamp(iw + LEARNING_RATE * (targetIw - iw), 0.05, 0.7);
  const newFw = clamp(fw + LEARNING_RATE * (targetFw - fw), 0.05, 0.7);
  const newEw = clamp(ew + LEARNING_RATE * (targetEw - ew), 0.05, 0.7);
  const newUw = clamp(uw + LEARNING_RATE * (targetUw - uw), 0.05, 0.7);

  const normalized = normalizeWeights(newIw, newFw, newEw, newUw);
  const convertedCount = outcomes.filter((o) => o.converted).length;
  const bestThreshold = findBestThreshold(outcomes);
  const accuracy = computeModelAccuracy(outcomes, bestThreshold);
  const nextVersion = existingVersions.length + 1;
  const now = new Date().toISOString();

  const model: ScoringModelVersion = {
    tenantId,
    version: nextVersion,
    weights: normalized,
    accuracy,
    totalOutcomes: outcomes.length,
    convertedOutcomes: convertedCount,
    trainedAt: now,
  };

  const updated = [...existingVersions, model];
  modelStore.set(tenantId, updated);

  const activePool = getPool();
  if (activePool) {
    try {
      await ensureSchema();
      await activePool.query(
        `INSERT INTO lead_os_scoring_models (tenant_id, version, payload, created_at)
         VALUES ($1, $2, $3::jsonb, $4::timestamptz)
         ON CONFLICT (tenant_id, version) DO UPDATE SET payload = EXCLUDED.payload`,
        [tenantId, nextVersion, JSON.stringify(model), now],
      );
    } catch (err) {
      console.error("[tenant-scoring-model] model insert failed:", err instanceof Error ? err.message : String(err));
    }
  }

  return model;
}

export async function getCurrentModel(tenantId: string): Promise<ScoringModelVersion | null> {
  const activePool = getPool();

  if (activePool) {
    try {
      await ensureSchema();
      const result = await activePool.query<ModelRow>(
        `SELECT payload FROM lead_os_scoring_models
         WHERE tenant_id = $1
         ORDER BY version DESC
         LIMIT 1`,
        [tenantId],
      );
      if (result.rows.length > 0) {
        return result.rows[0].payload as ScoringModelVersion;
      }
      return null;
    } catch (err) {
      console.error("[tenant-scoring-model] model fetch failed:", err instanceof Error ? err.message : String(err));
    }
  }

  const versions = modelStore.get(tenantId);
  if (!versions || versions.length === 0) return null;
  return versions[versions.length - 1];
}

export async function getModelHistory(tenantId: string): Promise<ScoringModelVersion[]> {
  const activePool = getPool();

  if (activePool) {
    try {
      await ensureSchema();
      const result = await activePool.query<ModelRow>(
        `SELECT payload FROM lead_os_scoring_models
         WHERE tenant_id = $1
         ORDER BY version DESC`,
        [tenantId],
      );
      return result.rows.map((r) => r.payload as ScoringModelVersion);
    } catch (err) {
      console.error("[tenant-scoring-model] model history fetch failed:", err instanceof Error ? err.message : String(err));
    }
  }

  const versions = modelStore.get(tenantId) ?? [];
  return [...versions].reverse();
}

export async function detectModelDrift(tenantId: string): Promise<ModelDriftAlert | null> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();

  const [recentOutcomes, olderOutcomes] = await Promise.all([
    getConversionOutcomes(tenantId, thirtyDaysAgo),
    getConversionOutcomes(tenantId, sixtyDaysAgo),
  ]);

  const priorOutcomes = olderOutcomes.filter(
    (o) => new Date(o.outcomeAt).getTime() < new Date(thirtyDaysAgo).getTime(),
  );

  if (recentOutcomes.length === 0 || priorOutcomes.length === 0) return null;

  const recentThreshold = findBestThreshold(recentOutcomes);
  const priorThreshold = findBestThreshold(priorOutcomes);

  const currentAccuracy = computeModelAccuracy(recentOutcomes, recentThreshold);
  const previousAccuracy = computeModelAccuracy(priorOutcomes, priorThreshold);
  const drift = currentAccuracy - previousAccuracy;

  if (Math.abs(drift) <= DRIFT_THRESHOLD) return null;

  let recommendation: string;
  if (drift < -DRIFT_THRESHOLD) {
    recommendation =
      "Model accuracy has degraded significantly. Retrain the scoring model with recent conversion data to restore predictive performance.";
  } else {
    recommendation =
      "Model accuracy has improved over the last 30 days. Consider applying the latest trained weights as the active model.";
  }

  return {
    tenantId,
    currentAccuracy: Math.round(currentAccuracy * 100) / 100,
    previousAccuracy: Math.round(previousAccuracy * 100) / 100,
    drift: Math.round(drift * 100) / 100,
    recommendation,
    alertedAt: now.toISOString(),
  };
}

export async function getScoringWeightsForTenant(
  tenantId: string,
): Promise<ScoringWeightOverrides | null> {
  const model = await getCurrentModel(tenantId);
  if (!model) return null;
  return model.weights;
}

export function resetScoringModelStore(): void {
  outcomeStore.clear();
  modelStore.clear();
  schemaReady = null;
}

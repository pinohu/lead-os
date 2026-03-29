import { randomUUID } from "crypto";
import { getPool } from "./db.ts";
import type { QueryResultRow } from "pg";

export type ExperimentSurface =
  | "email-subject"
  | "cta-copy"
  | "lead-magnet-offer"
  | "scoring-weights"
  | "funnel-step-order";

export interface ExperimentVariant {
  id: string;
  name: string;
  weight: number;
  isControl: boolean;
  config?: Record<string, unknown>;
}

export interface Experiment {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  hypothesis: string;
  surface: ExperimentSurface;
  status: "draft" | "running" | "paused" | "completed" | "stopped";
  variants: ExperimentVariant[];
  targetMetric: string;
  minimumSampleSize: number;
  rollbackThreshold: number;
  winnerId?: string;
  winnerLift?: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExperimentAssignment {
  experimentId: string;
  visitorId: string;
  variantId: string;
  createdAt: string;
}

export interface ExperimentConversion {
  experimentId: string;
  visitorId: string;
  variantId: string;
  conversionType: string;
  value: number;
  createdAt: string;
}

export interface VariantAnalysis {
  variantId: string;
  name: string;
  visitors: number;
  conversions: number;
  conversionRate: number;
  averageValue: number;
  improvement: number;
}

export interface ExperimentAnalysis {
  experimentId: string;
  sampleSize: number;
  variants: VariantAnalysis[];
  winner: string | null;
  confidence: number;
  isSignificant: boolean;
  recommendation: string;
}

const MAX_STORE_SIZE = 10_000;

const experimentStore = new Map<string, Experiment>();
const assignmentStore: ExperimentAssignment[] = [];
const conversionStore: ExperimentConversion[] = [];

let schemaReady: Promise<void> | null = null;

const CONFIDENCE_THRESHOLD = 0.95;
const MINIMUM_VISITORS_PER_VARIANT = 100;

async function ensureSchema(): Promise<void> {
  const activePool = getPool();
  if (!activePool) return;
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    try {
      await activePool.query(`
        CREATE TABLE IF NOT EXISTS lead_os_experiments (
          id TEXT PRIMARY KEY,
          tenant_id TEXT NOT NULL DEFAULT 'default-tenant',
          name TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          hypothesis TEXT NOT NULL DEFAULT '',
          surface TEXT NOT NULL DEFAULT 'email-subject',
          status TEXT NOT NULL DEFAULT 'running',
          target_metric TEXT NOT NULL DEFAULT 'conversion',
          minimum_sample_size INTEGER NOT NULL DEFAULT 100,
          rollback_threshold DOUBLE PRECISION NOT NULL DEFAULT 0.2,
          winner_id TEXT,
          winner_lift DOUBLE PRECISION,
          variants JSONB NOT NULL DEFAULT '[]'::jsonb,
          started_at TIMESTAMPTZ,
          completed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS lead_os_experiment_assignments (
          id TEXT PRIMARY KEY,
          experiment_id TEXT NOT NULL REFERENCES lead_os_experiments(id) ON DELETE CASCADE,
          visitor_id TEXT NOT NULL,
          variant_id TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_os_experiment_assignments_unique
          ON lead_os_experiment_assignments (experiment_id, visitor_id);
        CREATE TABLE IF NOT EXISTS lead_os_experiment_conversions (
          id TEXT PRIMARY KEY,
          experiment_id TEXT NOT NULL REFERENCES lead_os_experiments(id) ON DELETE CASCADE,
          visitor_id TEXT NOT NULL,
          variant_id TEXT NOT NULL,
          conversion_type TEXT NOT NULL,
          value NUMERIC NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS idx_lead_os_experiment_conversions_experiment
          ON lead_os_experiment_conversions (experiment_id);
        CREATE INDEX IF NOT EXISTS idx_lead_os_experiments_tenant_surface
          ON lead_os_experiments (tenant_id, surface, status);
      `);
    } catch (error: unknown) {
      console.error("Failed to create experiment schema:", error);
      schemaReady = null;
    }
  })();

  return schemaReady;
}

async function queryPostgres<T extends QueryResultRow>(
  text: string,
  values: unknown[] = [],
): Promise<{ rows: T[] }> {
  const activePool = getPool();
  if (!activePool) {
    throw new Error("Postgres pool is not available");
  }

  await ensureSchema();
  return activePool.query<T>(text, values);
}

export async function createExperiment(
  input: Omit<Experiment, "id" | "createdAt" | "updatedAt" | "tenantId" | "hypothesis" | "surface" | "rollbackThreshold"> & {
    tenantId?: string;
    hypothesis?: string;
    surface?: ExperimentSurface;
    rollbackThreshold?: number;
  },
): Promise<Experiment> {
  const now = new Date().toISOString();
  const experiment: Experiment = {
    tenantId: "default-tenant",
    hypothesis: "",
    surface: "email-subject",
    rollbackThreshold: 0.2,
    ...input,
    id: randomUUID(),
    startedAt: input.status === "running" ? now : input.startedAt,
    createdAt: now,
    updatedAt: now,
  };

  experimentStore.set(experiment.id, experiment);

  const activePool = getPool();
  if (activePool) {
    await queryPostgres(
      `INSERT INTO lead_os_experiments (id, tenant_id, name, description, hypothesis, surface, status, target_metric, minimum_sample_size, rollback_threshold, winner_id, winner_lift, variants, started_at, completed_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14::timestamptz, $15::timestamptz, $16::timestamptz, $17::timestamptz)`,
      [
        experiment.id,
        experiment.tenantId,
        experiment.name,
        experiment.description,
        experiment.hypothesis,
        experiment.surface,
        experiment.status,
        experiment.targetMetric,
        experiment.minimumSampleSize,
        experiment.rollbackThreshold,
        experiment.winnerId ?? null,
        experiment.winnerLift ?? null,
        JSON.stringify(experiment.variants),
        experiment.startedAt ?? null,
        experiment.completedAt ?? null,
        experiment.createdAt,
        experiment.updatedAt,
      ],
    );
  }

  return experiment;
}

export async function getExperiment(experimentId: string): Promise<Experiment | null> {
  const cached = experimentStore.get(experimentId);
  if (cached) return cached;

  const activePool = getPool();
  if (!activePool) return null;

  const result = await queryPostgres<{
    id: string;
    tenant_id: string;
    name: string;
    description: string;
    hypothesis: string;
    surface: string;
    status: string;
    target_metric: string;
    minimum_sample_size: number;
    rollback_threshold: number;
    winner_id: string | null;
    winner_lift: number | null;
    variants: ExperimentVariant[];
    started_at: string | null;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
  }>(
    `SELECT id, tenant_id, name, description, hypothesis, surface, status, target_metric,
            minimum_sample_size, rollback_threshold, winner_id, winner_lift, variants,
            started_at, completed_at, created_at, updated_at
     FROM lead_os_experiments WHERE id = $1`,
    [experimentId],
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  const experiment: Experiment = {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    description: row.description,
    hypothesis: row.hypothesis ?? "",
    surface: (row.surface ?? "email-subject") as ExperimentSurface,
    status: row.status as Experiment["status"],
    variants: row.variants,
    targetMetric: row.target_metric ?? "conversion",
    minimumSampleSize: row.minimum_sample_size ?? MINIMUM_VISITORS_PER_VARIANT,
    rollbackThreshold: row.rollback_threshold ?? 0.2,
    winnerId: row.winner_id ?? undefined,
    winnerLift: row.winner_lift ?? undefined,
    startedAt: row.started_at ? new Date(row.started_at).toISOString() : undefined,
    completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : undefined,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };

  experimentStore.set(experiment.id, experiment);
  return experiment;
}

export async function listRunningExperiments(tenantId?: string): Promise<Experiment[]> {
  const fromMemory = [...experimentStore.values()].filter(
    (e) => e.status === "running" && (!tenantId || e.tenantId === tenantId),
  );

  const activePool = getPool();
  if (!activePool) return fromMemory;

  const query = tenantId
    ? `SELECT id FROM lead_os_experiments WHERE status = 'running' AND tenant_id = $1`
    : `SELECT id FROM lead_os_experiments WHERE status = 'running'`;
  const values = tenantId ? [tenantId] : [];

  const result = await queryPostgres<{ id: string }>(query, values);

  const experiments: Experiment[] = [];
  for (const row of result.rows) {
    const exp = await getExperiment(row.id);
    if (exp) experiments.push(exp);
  }
  return experiments;
}

export async function listExperimentsByTenant(tenantId: string): Promise<Experiment[]> {
  const fromMemory = [...experimentStore.values()]
    .filter((e) => e.tenantId === tenantId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const activePool = getPool();
  if (!activePool) return fromMemory;

  const result = await queryPostgres<{ id: string }>(
    `SELECT id FROM lead_os_experiments WHERE tenant_id = $1 ORDER BY created_at DESC`,
    [tenantId],
  );

  const experiments: Experiment[] = [];
  for (const row of result.rows) {
    const exp = await getExperiment(row.id);
    if (exp) experiments.push(exp);
  }
  return experiments;
}

function selectVariantByWeight(variants: ExperimentVariant[]): ExperimentVariant {
  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  let random = Math.random() * totalWeight;

  for (const variant of variants) {
    random -= variant.weight;
    if (random <= 0) return variant;
  }

  return variants[variants.length - 1];
}

export async function assignVariant(
  experimentId: string,
  visitorId: string,
): Promise<ExperimentAssignment> {
  const existing = assignmentStore.find(
    (a) => a.experimentId === experimentId && a.visitorId === visitorId,
  );
  if (existing) return existing;

  const activePool = getPool();
  if (activePool) {
    const existingResult = await queryPostgres<{
      experiment_id: string;
      visitor_id: string;
      variant_id: string;
      created_at: string;
    }>(
      `SELECT experiment_id, visitor_id, variant_id, created_at
       FROM lead_os_experiment_assignments
       WHERE experiment_id = $1 AND visitor_id = $2`,
      [experimentId, visitorId],
    );

    if (existingResult.rows.length > 0) {
      const row = existingResult.rows[0];
      const assignment: ExperimentAssignment = {
        experimentId: row.experiment_id,
        visitorId: row.visitor_id,
        variantId: row.variant_id,
        createdAt: new Date(row.created_at).toISOString(),
      };
      assignmentStore.push(assignment);
      if (assignmentStore.length > MAX_STORE_SIZE) { assignmentStore.splice(0, assignmentStore.length - MAX_STORE_SIZE); }
      return assignment;
    }
  }

  const experiment = await getExperiment(experimentId);
  if (!experiment) {
    throw new Error(`Experiment ${experimentId} not found`);
  }

  if (experiment.status !== "running") {
    throw new Error(`Experiment ${experimentId} is not running (status: ${experiment.status})`);
  }

  const variant = selectVariantByWeight(experiment.variants);
  const assignment: ExperimentAssignment = {
    experimentId,
    visitorId,
    variantId: variant.id,
    createdAt: new Date().toISOString(),
  };

  assignmentStore.push(assignment);
  if (assignmentStore.length > MAX_STORE_SIZE) { assignmentStore.splice(0, assignmentStore.length - MAX_STORE_SIZE); }

  if (activePool) {
    await queryPostgres(
      `INSERT INTO lead_os_experiment_assignments (id, experiment_id, visitor_id, variant_id, created_at)
       VALUES ($1, $2, $3, $4, $5::timestamptz)
       ON CONFLICT (experiment_id, visitor_id) DO NOTHING`,
      [randomUUID(), experimentId, visitorId, variant.id, assignment.createdAt],
    );
  }

  return assignment;
}

export async function recordConversion(
  conversion: Omit<ExperimentConversion, "createdAt">,
): Promise<void> {
  const record: ExperimentConversion = {
    ...conversion,
    createdAt: new Date().toISOString(),
  };

  conversionStore.push(record);
  if (conversionStore.length > MAX_STORE_SIZE) { conversionStore.splice(0, conversionStore.length - MAX_STORE_SIZE); }

  const activePool = getPool();
  if (activePool) {
    await queryPostgres(
      `INSERT INTO lead_os_experiment_conversions (id, experiment_id, visitor_id, variant_id, conversion_type, value, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7::timestamptz)`,
      [
        randomUUID(),
        record.experimentId,
        record.visitorId,
        record.variantId,
        record.conversionType,
        record.value,
        record.createdAt,
      ],
    );
  }
}

export function computeZScore(
  controlRate: number,
  variantRate: number,
  controlSize: number,
  variantSize: number,
): number {
  if (controlSize === 0 || variantSize === 0) return 0;

  const pooledRate =
    (controlRate * controlSize + variantRate * variantSize) / (controlSize + variantSize);

  if (pooledRate === 0 || pooledRate === 1) return 0;

  const standardError = Math.sqrt(
    pooledRate * (1 - pooledRate) * (1 / controlSize + 1 / variantSize),
  );

  if (standardError === 0) return 0;

  return (variantRate - controlRate) / standardError;
}

export function computeConfidence(zScore: number): number {
  const absZ = Math.abs(zScore);

  // Approximation of the standard normal CDF using the Abramowitz and Stegun formula
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1.0 / (1.0 + p * absZ);
  const poly = t * (a1 + t * (a2 + t * (a3 + t * (a4 + t * a5))));
  const cdf = 1.0 - poly * Math.exp(-absZ * absZ / 2);

  // Two-tailed confidence
  return 2 * cdf - 1;
}

async function getAssignments(experimentId: string): Promise<ExperimentAssignment[]> {
  const activePool = getPool();
  if (activePool) {
    const result = await queryPostgres<{
      experiment_id: string;
      visitor_id: string;
      variant_id: string;
      created_at: string;
    }>(
      `SELECT experiment_id, visitor_id, variant_id, created_at
       FROM lead_os_experiment_assignments
       WHERE experiment_id = $1`,
      [experimentId],
    );

    return result.rows.map((row) => ({
      experimentId: row.experiment_id,
      visitorId: row.visitor_id,
      variantId: row.variant_id,
      createdAt: new Date(row.created_at).toISOString(),
    }));
  }

  return assignmentStore.filter((a) => a.experimentId === experimentId);
}

async function getConversions(experimentId: string): Promise<ExperimentConversion[]> {
  const activePool = getPool();
  if (activePool) {
    const result = await queryPostgres<{
      experiment_id: string;
      visitor_id: string;
      variant_id: string;
      conversion_type: string;
      value: string;
      created_at: string;
    }>(
      `SELECT experiment_id, visitor_id, variant_id, conversion_type, value, created_at
       FROM lead_os_experiment_conversions
       WHERE experiment_id = $1`,
      [experimentId],
    );

    return result.rows.map((row) => ({
      experimentId: row.experiment_id,
      visitorId: row.visitor_id,
      variantId: row.variant_id,
      conversionType: row.conversion_type,
      value: Number(row.value),
      createdAt: new Date(row.created_at).toISOString(),
    }));
  }

  return conversionStore.filter((c) => c.experimentId === experimentId);
}

export async function analyzeExperiment(experimentId: string): Promise<ExperimentAnalysis> {
  const experiment = await getExperiment(experimentId);
  if (!experiment) {
    throw new Error(`Experiment ${experimentId} not found`);
  }

  const assignments = await getAssignments(experimentId);
  const conversions = await getConversions(experimentId);

  const controlVariant = experiment.variants.find((v) => v.isControl);
  if (!controlVariant) {
    throw new Error(`Experiment ${experimentId} has no control variant`);
  }

  const variantAnalyses: VariantAnalysis[] = [];

  for (const variant of experiment.variants) {
    const variantVisitors = assignments.filter((a) => a.variantId === variant.id);
    const variantConversions = conversions.filter((c) => c.variantId === variant.id);
    const uniqueConverters = new Set(variantConversions.map((c) => c.visitorId));
    const totalValue = variantConversions.reduce((sum, c) => sum + c.value, 0);

    const visitors = variantVisitors.length;
    const conversionCount = uniqueConverters.size;
    const conversionRate = visitors > 0 ? conversionCount / visitors : 0;
    const averageValue = conversionCount > 0 ? totalValue / conversionCount : 0;

    variantAnalyses.push({
      variantId: variant.id,
      name: variant.name,
      visitors,
      conversions: conversionCount,
      conversionRate,
      averageValue,
      improvement: 0,
    });
  }

  const controlAnalysis = variantAnalyses.find((v) => v.variantId === controlVariant.id);
  const controlRate = controlAnalysis?.conversionRate ?? 0;

  for (const analysis of variantAnalyses) {
    if (analysis.variantId === controlVariant.id) {
      analysis.improvement = 0;
    } else {
      analysis.improvement =
        controlRate > 0 ? ((analysis.conversionRate - controlRate) / controlRate) * 100 : 0;
    }
  }

  const sampleSize = assignments.length;
  let bestConfidence = 0;
  let bestVariantId: string | null = null;

  for (const analysis of variantAnalyses) {
    if (analysis.variantId === controlVariant.id) continue;
    if (analysis.visitors < MINIMUM_VISITORS_PER_VARIANT) continue;
    if ((controlAnalysis?.visitors ?? 0) < MINIMUM_VISITORS_PER_VARIANT) continue;

    const zScore = computeZScore(
      controlRate,
      analysis.conversionRate,
      controlAnalysis?.visitors ?? 0,
      analysis.visitors,
    );

    const confidence = computeConfidence(zScore);

    if (confidence > bestConfidence && analysis.improvement > 0) {
      bestConfidence = confidence;
      bestVariantId = analysis.variantId;
    }
  }

  const isSignificant = bestConfidence >= CONFIDENCE_THRESHOLD;
  const winner = isSignificant ? bestVariantId : null;

  let recommendation: string;
  if (sampleSize < MINIMUM_VISITORS_PER_VARIANT * experiment.variants.length) {
    recommendation = `Insufficient data. Need at least ${MINIMUM_VISITORS_PER_VARIANT} visitors per variant (${MINIMUM_VISITORS_PER_VARIANT * experiment.variants.length} total). Currently have ${sampleSize}.`;
  } else if (isSignificant && winner) {
    const winnerAnalysis = variantAnalyses.find((v) => v.variantId === winner);
    recommendation = `Variant "${winnerAnalysis?.name}" wins with ${(bestConfidence * 100).toFixed(1)}% confidence and ${winnerAnalysis?.improvement.toFixed(1)}% improvement. Promote this variant.`;
  } else {
    recommendation = `No statistically significant winner at ${(CONFIDENCE_THRESHOLD * 100).toFixed(0)}% confidence. Continue collecting data or consider ending the experiment if the difference is too small to matter.`;
  }

  return {
    experimentId,
    sampleSize,
    variants: variantAnalyses,
    winner,
    confidence: bestConfidence,
    isSignificant,
    recommendation,
  };
}

export async function promoteWinner(experimentId: string, variantId: string, lift?: number): Promise<void> {
  const experiment = await getExperiment(experimentId);
  if (!experiment) {
    throw new Error(`Experiment ${experimentId} not found`);
  }

  const variant = experiment.variants.find((v) => v.id === variantId);
  if (!variant) {
    throw new Error(`Variant ${variantId} not found in experiment ${experimentId}`);
  }

  const now = new Date().toISOString();
  const updatedExperiment: Experiment = {
    ...experiment,
    status: "completed",
    winnerId: variantId,
    winnerLift: lift,
    completedAt: now,
    updatedAt: now,
  };

  experimentStore.set(experimentId, updatedExperiment);

  const activePool = getPool();
  if (activePool) {
    await queryPostgres(
      `UPDATE lead_os_experiments
       SET status = 'completed', winner_id = $2, winner_lift = $3, completed_at = $4::timestamptz, updated_at = $4::timestamptz
       WHERE id = $1`,
      [experimentId, variantId, lift ?? null, now],
    );
  }
}

export async function stopExperiment(experimentId: string, reason: string): Promise<void> {
  const experiment = await getExperiment(experimentId);
  if (!experiment) {
    throw new Error(`Experiment ${experimentId} not found`);
  }

  const now = new Date().toISOString();
  const updatedExperiment: Experiment = {
    ...experiment,
    status: "stopped",
    description: `${experiment.description}\n[AUTO-STOPPED] ${reason}`,
    completedAt: now,
    updatedAt: now,
  };

  experimentStore.set(experimentId, updatedExperiment);

  const activePool = getPool();
  if (activePool) {
    await queryPostgres(
      `UPDATE lead_os_experiments
       SET status = 'stopped', description = $2, completed_at = $3::timestamptz, updated_at = $3::timestamptz
       WHERE id = $1`,
      [experimentId, updatedExperiment.description, now],
    );
  }
}

export async function getRunningExperimentForSurface(
  tenantId: string,
  surface: ExperimentSurface,
): Promise<Experiment | null> {
  const running = [...experimentStore.values()].find(
    (e) => e.tenantId === tenantId && e.surface === surface && e.status === "running",
  );
  if (running) return running;

  const activePool = getPool();
  if (!activePool) return null;

  const result = await queryPostgres<{ id: string }>(
    `SELECT id FROM lead_os_experiments WHERE tenant_id = $1 AND surface = $2 AND status = 'running' LIMIT 1`,
    [tenantId, surface],
  );

  if (result.rows.length === 0) return null;
  return getExperiment(result.rows[0].id);
}

export function resetExperimentEngine(): void {
  experimentStore.clear();
  assignmentStore.length = 0;
  conversionStore.length = 0;
  schemaReady = null;
}

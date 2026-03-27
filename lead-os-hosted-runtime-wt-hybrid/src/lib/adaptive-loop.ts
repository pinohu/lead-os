import { randomUUID } from "crypto";
import { getPool } from "./db.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Observation {
  conversionRate: number;
  avgScore: number;
  avgTimeToConvert: number;
  topChannel: string;
  topFunnel: string;
  dropOffStage: string;
  leadVolume: number;
  revenueThisPeriod: number;
  period: string;
}

export interface Evaluation {
  performanceTrend: "improving" | "stable" | "declining";
  conversionVsTarget: number;
  bottleneck: string;
  opportunity: string;
  urgency: "low" | "medium" | "high" | "critical";
}

export interface Adjustment {
  type: string;
  target: string;
  from: unknown;
  to: unknown;
  expectedImpact: string;
  autoApplied: boolean;
}

export interface Deployment {
  adjustmentsApplied: number;
  adjustmentsSkipped: number;
  timestamp: string;
}

export interface LoopState {
  tenantId: string;
  cycleCount: number;
  lastObservation: Observation;
  lastEvaluation: Evaluation;
  lastAdjustment: Adjustment[];
  lastDeployment: Deployment;
  health: "healthy" | "degraded" | "stale";
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

const loopStateStore = new Map<string, LoopState>();
const loopHistoryStore = new Map<string, LoopState[]>();
const conversionCounters = new Map<string, number>();
const dropOffCounters = new Map<string, Map<string, number>>();

const CONVERSION_TARGET = 5; // percent
const MINI_CYCLE_THRESHOLD = 10;
const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000;
const SAFE_CHANGE_THRESHOLD = 0.1;

// ---------------------------------------------------------------------------
// Schema bootstrap
// ---------------------------------------------------------------------------

let schemaReady: Promise<void> | null = null;

async function ensureSchema(): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS lead_os_adaptive_loop_state (
          tenant_id TEXT PRIMARY KEY,
          cycle_count INT NOT NULL DEFAULT 0,
          last_observation JSONB NOT NULL DEFAULT '{}',
          last_evaluation JSONB NOT NULL DEFAULT '{}',
          last_adjustment JSONB NOT NULL DEFAULT '[]',
          last_deployment JSONB NOT NULL DEFAULT '{}',
          health TEXT NOT NULL DEFAULT 'healthy',
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS lead_os_adaptive_loop_history (
          id TEXT PRIMARY KEY,
          tenant_id TEXT NOT NULL,
          cycle_count INT NOT NULL,
          state JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_adaptive_loop_history_tenant
          ON lead_os_adaptive_loop_history (tenant_id, created_at DESC);
      `);
    } catch (error: unknown) {
      console.error("Failed to create adaptive loop schema:", error);
      schemaReady = null;
    }
  })();

  return schemaReady;
}

// ---------------------------------------------------------------------------
// Observe
// ---------------------------------------------------------------------------

export async function observe(tenantId: string): Promise<Observation> {
  await ensureSchema();
  const pool = getPool();

  const defaultObservation: Observation = {
    conversionRate: 0,
    avgScore: 0,
    avgTimeToConvert: 0,
    topChannel: "unknown",
    topFunnel: "unknown",
    dropOffStage: "unknown",
    leadVolume: 0,
    revenueThisPeriod: 0,
    period: "last-24h",
  };

  if (!pool) return defaultObservation;

  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const leadsResult = await pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status = 'converted')::int AS conversions,
         COALESCE(ROUND(AVG(score)::numeric, 1), 0) AS avg_score
       FROM lead_os_leads
       WHERE tenant_id = $1 AND created_at >= $2::timestamptz`,
      [tenantId, since],
    );

    const total = leadsResult.rows[0]?.total ?? 0;
    const conversions = leadsResult.rows[0]?.conversions ?? 0;
    const avgScore = Number(leadsResult.rows[0]?.avg_score ?? 0);
    const conversionRate = total > 0 ? (conversions / total) * 100 : 0;

    const channelResult = await pool.query(
      `SELECT source, COUNT(*)::int AS cnt
       FROM lead_os_leads
       WHERE tenant_id = $1 AND created_at >= $2::timestamptz
       GROUP BY source
       ORDER BY cnt DESC
       LIMIT 1`,
      [tenantId, since],
    );
    const topChannel = channelResult.rows[0]?.source ?? "unknown";

    const funnelResult = await pool.query(
      `SELECT family, COUNT(*)::int AS cnt
       FROM lead_os_leads
       WHERE tenant_id = $1 AND created_at >= $2::timestamptz
       GROUP BY family
       ORDER BY cnt DESC
       LIMIT 1`,
      [tenantId, since],
    );
    const topFunnel = funnelResult.rows[0]?.family ?? "unknown";

    const stageResult = await pool.query(
      `SELECT stage, COUNT(*)::int AS cnt
       FROM lead_os_leads
       WHERE tenant_id = $1 AND created_at >= $2::timestamptz
         AND status != 'converted'
       GROUP BY stage
       ORDER BY cnt DESC
       LIMIT 1`,
      [tenantId, since],
    );
    const dropOffStage = stageResult.rows[0]?.stage ?? "unknown";

    const timeResult = await pool.query(
      `SELECT COALESCE(
         ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600)::numeric, 1),
         0
       ) AS avg_hours
       FROM lead_os_leads
       WHERE tenant_id = $1 AND created_at >= $2::timestamptz AND status = 'converted'`,
      [tenantId, since],
    );
    const avgTimeToConvert = Number(timeResult.rows[0]?.avg_hours ?? 0);

    let revenueThisPeriod = 0;
    try {
      const revenueResult = await pool.query(
        `SELECT COALESCE(SUM(amount), 0)::numeric AS total_revenue
         FROM lead_os_revenue_events
         WHERE tenant_id = $1 AND recorded_at >= $2::timestamptz`,
        [tenantId, since],
      );
      revenueThisPeriod = Number(revenueResult.rows[0]?.total_revenue ?? 0);
    } catch {
      // revenue table may not exist yet
    }

    return {
      conversionRate: Math.round(conversionRate * 10) / 10,
      avgScore,
      avgTimeToConvert,
      topChannel,
      topFunnel,
      dropOffStage,
      leadVolume: total,
      revenueThisPeriod,
      period: "last-24h",
    };
  } catch {
    return defaultObservation;
  }
}

// ---------------------------------------------------------------------------
// Evaluate
// ---------------------------------------------------------------------------

export function evaluate(
  observation: Observation,
  previousObservation?: Observation,
): Evaluation {
  let performanceTrend: Evaluation["performanceTrend"] = "stable";
  if (previousObservation) {
    const convDelta = observation.conversionRate - previousObservation.conversionRate;
    if (convDelta > 0.5) performanceTrend = "improving";
    else if (convDelta < -0.5) performanceTrend = "declining";
  }

  const conversionVsTarget = CONVERSION_TARGET > 0
    ? Math.round((observation.conversionRate / CONVERSION_TARGET) * 100) / 100
    : 0;

  const bottleneck = observation.dropOffStage;

  let opportunity = "maintain current performance";
  if (observation.conversionRate < CONVERSION_TARGET * 0.8) {
    opportunity = "scoring recalibration to improve lead quality";
  } else if (bottleneck === "offer") {
    opportunity = "rotate offer variants for better conversion";
  } else if (bottleneck === "trust") {
    opportunity = "add social proof elements";
  } else if (bottleneck === "follow-up") {
    opportunity = "reduce response time on follow-ups";
  } else if (observation.leadVolume > 0 && observation.conversionRate > CONVERSION_TARGET * 1.2) {
    opportunity = "double down on top channel";
  }

  let urgency: Evaluation["urgency"] = "low";
  if (conversionVsTarget < 0.5) urgency = "critical";
  else if (conversionVsTarget < 0.7) urgency = "high";
  else if (conversionVsTarget < 0.9) urgency = "medium";

  return {
    performanceTrend,
    conversionVsTarget,
    bottleneck,
    opportunity,
    urgency,
  };
}

// ---------------------------------------------------------------------------
// Adjust
// ---------------------------------------------------------------------------

export function adjust(evaluation: Evaluation, tenantId: string): Adjustment[] {
  const adjustments: Adjustment[] = [];

  if (evaluation.conversionVsTarget < 0.8) {
    adjustments.push({
      type: "scoring-recalibration",
      target: "scoring-config",
      from: "current-weights",
      to: "recalibrated-weights",
      expectedImpact: "improve lead quality by filtering low-intent leads",
      autoApplied: true,
    });
  }

  if (evaluation.bottleneck === "offer") {
    adjustments.push({
      type: "offer-rotation",
      target: "offer-engine",
      from: "current-variant",
      to: "next-variant",
      expectedImpact: "test alternative offers to reduce drop-off at offer stage",
      autoApplied: true,
    });
  }

  if (evaluation.bottleneck === "trust") {
    adjustments.push({
      type: "social-proof-injection",
      target: "trust-engine",
      from: "current-proof-level",
      to: "enhanced-proof-level",
      expectedImpact: "increase trust signals to reduce drop-off at trust stage",
      autoApplied: true,
    });
  }

  if (evaluation.bottleneck === "follow-up") {
    adjustments.push({
      type: "response-time-reduction",
      target: "follow-up-config",
      from: "current-delay",
      to: "reduced-delay",
      expectedImpact: "faster follow-up to capture leads before they go cold",
      autoApplied: true,
    });
  }

  if (evaluation.performanceTrend === "declining" && evaluation.urgency !== "low") {
    adjustments.push({
      type: "channel-reallocation",
      target: "distribution-engine",
      from: "current-allocation",
      to: "rebalanced-allocation",
      expectedImpact: "shift budget from underperforming to top channels",
      autoApplied: false,
    });
  }

  if (evaluation.conversionVsTarget > 1.2) {
    adjustments.push({
      type: "channel-scale-up",
      target: "distribution-engine",
      from: "current-budget",
      to: "increased-budget",
      expectedImpact: "capitalize on overperformance by scaling top channel",
      autoApplied: false,
    });
  }

  return adjustments;
}

// ---------------------------------------------------------------------------
// Deploy
// ---------------------------------------------------------------------------

export async function deploy(
  adjustments: Adjustment[],
  tenantId: string,
): Promise<Deployment> {
  let applied = 0;
  let skipped = 0;

  for (const adj of adjustments) {
    if (adj.autoApplied) {
      applied++;
    } else {
      skipped++;
    }
  }

  const deployment: Deployment = {
    adjustmentsApplied: applied,
    adjustmentsSkipped: skipped,
    timestamp: new Date().toISOString(),
  };

  await persistDeployment(tenantId, deployment);
  return deployment;
}

async function persistDeployment(
  tenantId: string,
  deployment: Deployment,
): Promise<void> {
  const pool = getPool();
  if (!pool) return;

  try {
    await pool.query(
      `INSERT INTO lead_os_adaptive_loop_history (id, tenant_id, cycle_count, state, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [
        randomUUID(),
        tenantId,
        loopStateStore.get(tenantId)?.cycleCount ?? 0,
        JSON.stringify(deployment),
      ],
    );
  } catch {
    // postgres optional
  }
}

// ---------------------------------------------------------------------------
// Run Adaptive Cycle
// ---------------------------------------------------------------------------

export async function runAdaptiveCycle(tenantId: string): Promise<LoopState> {
  const previousState = loopStateStore.get(tenantId);
  const previousObservation = previousState?.lastObservation;

  const observation = await observe(tenantId);
  const evaluation = evaluate(observation, previousObservation);
  const adjustments = adjust(evaluation, tenantId);
  const deployment = await deploy(adjustments, tenantId);

  const cycleCount = (previousState?.cycleCount ?? 0) + 1;

  let health: LoopState["health"] = "healthy";
  if (evaluation.urgency === "critical") health = "degraded";

  const state: LoopState = {
    tenantId,
    cycleCount,
    lastObservation: observation,
    lastEvaluation: evaluation,
    lastAdjustment: adjustments,
    lastDeployment: deployment,
    health,
    updatedAt: new Date().toISOString(),
  };

  loopStateStore.set(tenantId, state);

  const history = loopHistoryStore.get(tenantId) ?? [];
  history.push(state);
  loopHistoryStore.set(tenantId, history);

  await persistLoopState(state);

  return state;
}

async function persistLoopState(state: LoopState): Promise<void> {
  const pool = getPool();
  if (!pool) return;

  try {
    await pool.query(
      `INSERT INTO lead_os_adaptive_loop_state
         (tenant_id, cycle_count, last_observation, last_evaluation, last_adjustment, last_deployment, health, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (tenant_id)
       DO UPDATE SET
         cycle_count = EXCLUDED.cycle_count,
         last_observation = EXCLUDED.last_observation,
         last_evaluation = EXCLUDED.last_evaluation,
         last_adjustment = EXCLUDED.last_adjustment,
         last_deployment = EXCLUDED.last_deployment,
         health = EXCLUDED.health,
         updated_at = NOW()`,
      [
        state.tenantId,
        state.cycleCount,
        JSON.stringify(state.lastObservation),
        JSON.stringify(state.lastEvaluation),
        JSON.stringify(state.lastAdjustment),
        JSON.stringify(state.lastDeployment),
        state.health,
      ],
    );
  } catch {
    // postgres optional
  }
}

// ---------------------------------------------------------------------------
// State access
// ---------------------------------------------------------------------------

export function getLoopState(tenantId: string): LoopState | undefined {
  return loopStateStore.get(tenantId);
}

export function getLoopHistory(tenantId: string, limit?: number): LoopState[] {
  const history = loopHistoryStore.get(tenantId) ?? [];
  if (limit !== undefined && limit > 0) {
    return history.slice(-limit);
  }
  return [...history];
}

export function isLoopHealthy(tenantId: string): boolean {
  const state = loopStateStore.get(tenantId);
  if (!state) return false;

  const timeSinceUpdate = Date.now() - new Date(state.updatedAt).getTime();
  if (timeSinceUpdate > STALE_THRESHOLD_MS) return false;

  return state.health !== "stale";
}

// ---------------------------------------------------------------------------
// Event-driven triggers
// ---------------------------------------------------------------------------

export async function onConversion(
  tenantId: string,
  lead: { leadKey: string; score: number },
): Promise<void> {
  const count = (conversionCounters.get(tenantId) ?? 0) + 1;
  conversionCounters.set(tenantId, count);

  if (count >= MINI_CYCLE_THRESHOLD) {
    conversionCounters.set(tenantId, 0);
    await runAdaptiveCycle(tenantId);
  }
}

export async function onDropOff(
  tenantId: string,
  lead: { leadKey: string; score: number },
  stage: string,
): Promise<void> {
  const stageMap = dropOffCounters.get(tenantId) ?? new Map<string, number>();
  const stageCount = (stageMap.get(stage) ?? 0) + 1;
  stageMap.set(stage, stageCount);
  dropOffCounters.set(tenantId, stageMap);

  const totalDropOffs = Array.from(stageMap.values()).reduce((a, b) => a + b, 0);
  if (totalDropOffs >= MINI_CYCLE_THRESHOLD) {
    for (const key of stageMap.keys()) {
      stageMap.set(key, 0);
    }
    await runAdaptiveCycle(tenantId);
  }
}

// ---------------------------------------------------------------------------
// Reset (for tests)
// ---------------------------------------------------------------------------

export function resetAdaptiveLoopStore(): void {
  loopStateStore.clear();
  loopHistoryStore.clear();
  conversionCounters.clear();
  dropOffCounters.clear();
  schemaReady = null;
}

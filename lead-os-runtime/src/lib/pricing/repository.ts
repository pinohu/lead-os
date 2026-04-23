// src/lib/pricing/repository.ts
// PostgreSQL persistence (primary) with optional Supabase mirror.

import { queryPostgres } from "@/lib/db.ts";
import { getSupabaseAdmin } from "@/lib/supabase/admin.ts";
import type { PricingNodeRow, PricingSkuRow } from "./types.ts";

interface SkuRowDb {
  id: string;
  tenant_id: string;
  sku_key: string;
  label: string;
  currency: string;
  base_price_cents: number;
  current_price_cents: number;
  demand_score: string;
  last_changed_at: Date | null;
  updated_at: Date;
}

interface NodeRowDb {
  id: string;
  tenant_id: string;
  node_key: string;
  sku_key: string;
  status: string;
  learning_bias: string;
  last_scan_at: Date | null;
}

function mapSku(row: SkuRowDb): PricingSkuRow {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    skuKey: row.sku_key,
    label: row.label,
    currency: row.currency,
    basePriceCents: row.base_price_cents,
    currentPriceCents: row.current_price_cents,
    demandScore: Number(row.demand_score),
    lastChangedAt: row.last_changed_at ? row.last_changed_at.toISOString() : null,
    updatedAt: row.updated_at.toISOString(),
  };
}

function mapNode(row: NodeRowDb): PricingNodeRow {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    nodeKey: row.node_key,
    skuKey: row.sku_key,
    status: row.status,
    learningBias: Number(row.learning_bias),
    lastScanAt: row.last_scan_at ? row.last_scan_at.toISOString() : null,
  };
}

async function mirrorSkuRow(row: PricingSkuRow): Promise<void> {
  const supa = getSupabaseAdmin();
  if (!supa) return;
  const { error } = await supa.from("pricing_sku").upsert(
    {
      tenant_id: row.tenantId,
      sku_key: row.skuKey,
      label: row.label,
      currency: row.currency,
      base_price_cents: row.basePriceCents,
      current_price_cents: row.currentPriceCents,
      demand_score: row.demandScore,
      last_changed_at: row.lastChangedAt,
      updated_at: row.updatedAt,
    },
    { onConflict: "tenant_id,sku_key" },
  );
  if (error) console.error("[pricing] supabase mirror pricing_sku failed:", error.message);
}

export async function listSkusForTenant(tenantId: string): Promise<PricingSkuRow[]> {
  const res = await queryPostgres<SkuRowDb>(
    `SELECT id, tenant_id, sku_key, label, currency, base_price_cents, current_price_cents,
            demand_score, last_changed_at, updated_at
       FROM pricing_sku
      WHERE tenant_id = $1
      ORDER BY sku_key ASC`,
    [tenantId],
  );
  return res.rows.map(mapSku);
}

export async function ensureNodesForTenant(tenantId: string): Promise<void> {
  await queryPostgres(
    `INSERT INTO nodes (tenant_id, node_key, sku_key, last_applied_price_cents, status)
     SELECT ps.tenant_id, ps.sku_key, ps.sku_key, ps.current_price_cents, 'active'
       FROM pricing_sku ps
      WHERE ps.tenant_id = $1
        AND NOT EXISTS (
          SELECT 1 FROM nodes n WHERE n.tenant_id = ps.tenant_id AND n.node_key = ps.sku_key
        )`,
    [tenantId],
  );
}

export async function listActiveNodes(tenantId: string): Promise<PricingNodeRow[]> {
  const res = await queryPostgres<NodeRowDb>(
    `SELECT id::text AS id, tenant_id, node_key, sku_key, status, learning_bias::text, last_scan_at
       FROM nodes
      WHERE tenant_id = $1 AND status = 'active'
      ORDER BY node_key ASC`,
    [tenantId],
  );
  return res.rows.map(mapNode);
}

export async function updateNodeScan(nodeId: string): Promise<void> {
  await queryPostgres(
    `UPDATE nodes SET last_scan_at = NOW(), updated_at = NOW() WHERE id = $1::bigint`,
    [nodeId],
  );
}

export async function updateSkuPriceAndDemand(input: {
  tenantId: string;
  skuKey: string;
  newPriceCents: number;
  newDemandScore: number;
  nowIso: string;
}): Promise<PricingSkuRow> {
  const res = await queryPostgres<SkuRowDb>(
    `UPDATE pricing_sku
        SET current_price_cents = $3,
            demand_score = $4,
            last_changed_at = $5::timestamptz,
            updated_at = NOW()
      WHERE tenant_id = $1 AND sku_key = $2
  RETURNING id, tenant_id, sku_key, label, currency, base_price_cents, current_price_cents,
            demand_score, last_changed_at, updated_at`,
    [input.tenantId, input.skuKey, input.newPriceCents, input.newDemandScore, input.nowIso],
  );
  const row = res.rows[0];
  if (!row) throw new Error(`pricing_sku not found: ${input.tenantId}/${input.skuKey}`);
  const mapped = mapSku(row);
  await mirrorSkuRow(mapped);
  await queryPostgres(
    `UPDATE nodes SET last_applied_price_cents = $3, updated_at = NOW()
      WHERE tenant_id = $1 AND sku_key = $2`,
    [input.tenantId, input.skuKey, input.newPriceCents],
  );
  return mapped;
}

export async function insertChangeLog(input: {
  tenantId: string;
  skuKey: string;
  oldPriceCents: number;
  newPriceCents: number;
  reason: string;
  policySnapshot: Record<string, unknown>;
  bullmqJobId: string | undefined;
}): Promise<string> {
  const res = await queryPostgres<{ id: string }>(
    `INSERT INTO pricing_change_log
      (tenant_id, sku_key, old_price_cents, new_price_cents, reason, policy_snapshot, bullmq_job_id)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
     RETURNING id::text AS id`,
    [
      input.tenantId,
      input.skuKey,
      input.oldPriceCents,
      input.newPriceCents,
      input.reason,
      JSON.stringify(input.policySnapshot),
      input.bullmqJobId ?? null,
    ],
  );
  const id = res.rows[0]?.id;
  if (!id) throw new Error("insertChangeLog failed");
  return id;
}

export async function insertPricingHistory(input: {
  tenantId: string;
  skuKey: string;
  nodeId: string | null;
  oldPriceCents: number;
  newPriceCents: number;
  applied: boolean;
  reason: string;
  simulation: Record<string, unknown>;
  policySnapshot: Record<string, unknown>;
  changeLogId: string | null;
  bullmqJobId: string | undefined;
}): Promise<string> {
  const res = await queryPostgres<{ id: string }>(
    `INSERT INTO pricing_history
      (tenant_id, sku_key, node_id, old_price_cents, new_price_cents, applied, reason,
       simulation, policy_snapshot, change_log_id, bullmq_job_id)
     VALUES ($1, $2, $3::bigint, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10::bigint, $11)
     RETURNING id::text AS id`,
    [
      input.tenantId,
      input.skuKey,
      input.nodeId,
      input.oldPriceCents,
      input.newPriceCents,
      input.applied,
      input.reason,
      JSON.stringify(input.simulation),
      JSON.stringify(input.policySnapshot),
      input.changeLogId,
      input.bullmqJobId ?? null,
    ],
  );
  const id = res.rows[0]?.id;
  if (!id) throw new Error("insertPricingHistory failed");
  return id;
}

export async function insertPendingRecommendation(input: {
  tenantId: string;
  skuKey: string;
  nodeId: string | null;
  recommendedPriceCents: number;
  simulatedLift: number;
  confidence: number;
  policySnapshot: Record<string, unknown>;
  metadata: Record<string, unknown>;
}): Promise<string> {
  const res = await queryPostgres<{ id: string }>(
    `INSERT INTO pricing_recommendations
      (tenant_id, sku_key, node_id, recommended_price_cents, simulated_lift, confidence,
       status, policy_snapshot, metadata)
     VALUES ($1, $2, $3::bigint, $4, $5, $6, 'pending', $7::jsonb, $8::jsonb)
     RETURNING id::text AS id`,
    [
      input.tenantId,
      input.skuKey,
      input.nodeId,
      input.recommendedPriceCents,
      input.simulatedLift,
      input.confidence,
      JSON.stringify(input.policySnapshot),
      JSON.stringify(input.metadata),
    ],
  );
  const id = res.rows[0]?.id;
  if (!id) throw new Error("insertPendingRecommendation failed");
  return id;
}

export async function updateRecommendationStatus(input: {
  recommendationId: string;
  status: "pending" | "applied" | "rejected" | "expired";
  appliedHistoryId?: string | null;
  metadataPatch?: Record<string, unknown>;
}): Promise<void> {
  const metaJson = input.metadataPatch ? JSON.stringify(input.metadataPatch) : null;
  await queryPostgres(
    `UPDATE pricing_recommendations
        SET status = $2,
            applied_history_id = COALESCE($3::bigint, applied_history_id),
            metadata = CASE WHEN $4 IS NULL THEN metadata ELSE metadata || $4::jsonb END
      WHERE id = $1::bigint`,
    [input.recommendationId, input.status, input.appliedHistoryId ?? null, metaJson],
  );
}

export async function insertDeadLetterJob(input: {
  sourceQueue: string;
  jobName: string;
  jobId: string | undefined;
  payload: Record<string, unknown>;
  errorMessage: string;
  attempts: number;
}): Promise<void> {
  await queryPostgres(
    `INSERT INTO dead_letter_jobs (source_queue, job_name, job_id, payload, error_message, attempts)
     VALUES ($1, $2, $3, $4::jsonb, $5, $6)`,
    [
      input.sourceQueue,
      input.jobName,
      input.jobId ?? null,
      JSON.stringify(input.payload),
      input.errorMessage,
      input.attempts,
    ],
  );
}

export async function insertPendingOutcome(input: {
  changeLogId: string;
  tenantId: string;
  skuKey: string;
  windowHours: number;
  dueAtIso: string;
  metricBefore: number;
}): Promise<string> {
  const res = await queryPostgres<{ id: string }>(
    `INSERT INTO pricing_outcomes
      (change_log_id, tenant_id, sku_key, window_hours, due_at, status, metric_conversion_rate_before, detail)
     VALUES ($1::bigint, $2, $3, $4, $5::timestamptz, 'pending', $6, '{}'::jsonb)
     RETURNING id::text AS id`,
    [input.changeLogId, input.tenantId, input.skuKey, input.windowHours, input.dueAtIso, input.metricBefore],
  );
  const id = res.rows[0]?.id;
  if (!id) throw new Error("insertPendingOutcome failed");
  return id;
}

interface OutcomePendingRow {
  id: string;
  change_log_id: string;
  tenant_id: string;
  sku_key: string;
  metric_conversion_rate_before: string | null;
}

export async function listDueOutcomes(limit: number): Promise<OutcomePendingRow[]> {
  const res = await queryPostgres<OutcomePendingRow>(
    `SELECT id::text AS id, change_log_id::text AS change_log_id, tenant_id, sku_key,
            metric_conversion_rate_before
       FROM pricing_outcomes
      WHERE status = 'pending' AND due_at <= NOW()
      ORDER BY due_at ASC
      LIMIT $1`,
    [limit],
  );
  return res.rows;
}

export async function getSkuRow(tenantId: string, skuKey: string): Promise<PricingSkuRow | undefined> {
  const res = await queryPostgres<SkuRowDb>(
    `SELECT id, tenant_id, sku_key, label, currency, base_price_cents, current_price_cents,
            demand_score, last_changed_at, updated_at
       FROM pricing_sku WHERE tenant_id = $1 AND sku_key = $2 LIMIT 1`,
    [tenantId, skuKey],
  );
  const row = res.rows[0];
  return row ? mapSku(row) : undefined;
}

export async function finalizeOutcomeMeasured(input: {
  outcomeId: string;
  metricAfter: number;
  revenueDeltaEstimateCents: number;
  detail: Record<string, unknown>;
}): Promise<void> {
  await queryPostgres(
    `UPDATE pricing_outcomes
        SET status = 'measured',
            measured_at = NOW(),
            metric_conversion_rate_after = $2,
            revenue_delta_estimate_cents = $3,
            detail = $4::jsonb
      WHERE id = $1::bigint AND status = 'pending'`,
    [input.outcomeId, input.metricAfter, input.revenueDeltaEstimateCents, JSON.stringify(input.detail)],
  );
}

export async function markOutcomeFailed(outcomeId: string, detail: Record<string, unknown>): Promise<void> {
  await queryPostgres(
    `UPDATE pricing_outcomes
        SET status = 'failed',
            measured_at = NOW(),
            detail = $2::jsonb
      WHERE id = $1::bigint AND status = 'pending'`,
    [outcomeId, JSON.stringify(detail)],
  );
}

interface OutcomeDetailRow {
  id: string;
  tenant_id: string;
  sku_key: string;
  status: string;
  due_at: Date;
  metric_conversion_rate_before: string | null;
  change_log_id: string;
}

export async function getOutcomeById(outcomeId: string): Promise<OutcomeDetailRow | undefined> {
  const res = await queryPostgres<OutcomeDetailRow>(
    `SELECT o.id::text AS id, o.tenant_id, o.sku_key, o.status, o.due_at,
            o.metric_conversion_rate_before, o.change_log_id::text AS change_log_id
       FROM pricing_outcomes o
      WHERE o.id = $1::bigint
      LIMIT 1`,
    [outcomeId],
  );
  return res.rows[0];
}

export async function countDeadLetterJobs(): Promise<number> {
  try {
    const res = await queryPostgres<{ c: string }>(
      `SELECT COUNT(*)::text AS c FROM dead_letter_jobs`,
    );
    return Number(res.rows[0]?.c ?? 0);
  } catch {
    return 0;
  }
}

export async function applyLearningAfterOutcome(input: {
  tenantId: string;
  skuKey: string;
  revenueDeltaEstimateCents: number;
}): Promise<void> {
  const capped = Math.max(-5_000_000, Math.min(5_000_000, input.revenueDeltaEstimateCents));
  const deltaBias = Number((Math.sign(capped) * Math.min(0.003, Math.abs(capped) / 5e8)).toFixed(6));
  await queryPostgres(
    `UPDATE nodes
        SET learning_bias = LEAST(0.05::numeric, GREATEST(-0.05::numeric, learning_bias + $3::numeric)),
            updated_at = NOW()
      WHERE tenant_id = $1 AND sku_key = $2`,
    [input.tenantId, input.skuKey, deltaBias],
  );
}

export interface DeadLetterRow {
  id: string;
  sourceQueue: string;
  jobName: string;
  jobId: string | null;
  payload: Record<string, unknown>;
  errorMessage: string;
  attempts: number;
}

export async function getDeadLetterJobById(id: string): Promise<DeadLetterRow | undefined> {
  const res = await queryPostgres<{
    id: string;
    source_queue: string;
    job_name: string;
    job_id: string | null;
    payload: Record<string, unknown>;
    error_message: string;
    attempts: number;
  }>(
    `SELECT id::text, source_queue, job_name, job_id, payload, error_message, attempts
       FROM dead_letter_jobs WHERE id = $1::bigint LIMIT 1`,
    [id],
  );
  const r = res.rows[0];
  if (!r) return undefined;
  return {
    id: r.id,
    sourceQueue: r.source_queue,
    jobName: r.job_name,
    jobId: r.job_id,
    payload: r.payload,
    errorMessage: r.error_message,
    attempts: r.attempts,
  };
}

export async function deleteDeadLetterJobById(id: string): Promise<boolean> {
  const res = await queryPostgres(`DELETE FROM dead_letter_jobs WHERE id = $1::bigint`, [id]);
  return res.rowCount !== null && res.rowCount > 0;
}

export async function updateNodeStatusByNodeKey(input: {
  tenantId: string;
  nodeKey: string;
  status: "active" | "paused" | "disabled";
}): Promise<boolean> {
  const res = await queryPostgres(
    `UPDATE nodes SET status = $3, updated_at = NOW()
      WHERE tenant_id = $1 AND node_key = $2`,
    [input.tenantId, input.nodeKey, input.status],
  );
  return res.rowCount !== null && res.rowCount > 0;
}

export interface RecommendationRow {
  id: string;
  tenantId: string;
  skuKey: string;
  nodeId: string | null;
  status: string;
  recommendedPriceCents: number;
  simulatedLift: number | null;
  confidence: number;
}

export async function getRecommendationForTenant(
  recommendationId: string,
  tenantId: string,
): Promise<RecommendationRow | undefined> {
  const res = await queryPostgres<{
    id: string;
    tenant_id: string;
    sku_key: string;
    node_id: string | null;
    status: string;
    recommended_price_cents: number;
    simulated_lift: string | null;
    confidence: string;
  }>(
    `SELECT id::text, tenant_id, sku_key, node_id::text, status, recommended_price_cents,
            simulated_lift::text, confidence::text
       FROM pricing_recommendations
      WHERE id = $1::bigint AND tenant_id = $2
      LIMIT 1`,
    [recommendationId, tenantId],
  );
  const r = res.rows[0];
  if (!r) return undefined;
  return {
    id: r.id,
    tenantId: r.tenant_id,
    skuKey: r.sku_key,
    nodeId: r.node_id,
    status: r.status,
    recommendedPriceCents: r.recommended_price_cents,
    simulatedLift: r.simulated_lift != null ? Number(r.simulated_lift) : null,
    confidence: Number(r.confidence),
  };
}

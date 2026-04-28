// src/lib/pricing/operator-recommendation-apply.ts
// Operator-initiated apply for a single pending recommendation (same safety gates as tick).

import { evolveDemandScore, runPriceSimulation } from "./autopilot-engine.ts";
import { evaluateSafety, evaluateShadowStructuralSafety } from "./safety-policy.ts";
import {
  getRecommendationForTenant,
  getSkuRow,
  insertChangeLog,
  insertPendingOutcome,
  insertPricingHistory,
  updateRecommendationStatus,
  updateSkuPriceAndDemand,
} from "./repository.ts";
import { enqueueMeasureJob } from "./queue-client.ts";
import { getPricingMeasurementDelayMs, isLivePricingEnabled } from "./env.ts";
import { pricingLog } from "./logger.ts";
import { initializeDatabase, queryPostgres } from "../db.ts";
import type { PricingNodeRow } from "./types.ts";

async function getNodeForTenant(tenantId: string, nodeId: string): Promise<PricingNodeRow | undefined> {
  const res = await queryPostgres<{
    id: string;
    tenant_id: string;
    node_key: string;
    sku_key: string;
    status: string;
    learning_bias: string;
    last_scan_at: Date | null;
  }>(
    `SELECT id::text, tenant_id, node_key, sku_key, status, learning_bias::text, last_scan_at
       FROM nodes WHERE tenant_id = $1 AND id = $2::bigint LIMIT 1`,
    [tenantId, nodeId],
  );
  const r = res.rows[0];
  if (!r) return undefined;
  return {
    id: r.id,
    tenantId: r.tenant_id,
    nodeKey: r.node_key,
    skuKey: r.sku_key,
    status: r.status,
    learningBias: Number(r.learning_bias),
    lastScanAt: r.last_scan_at ? r.last_scan_at.toISOString() : null,
  };
}

export async function operatorForceApplyRecommendation(input: {
  recommendationId: string;
  tenantId: string;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  await initializeDatabase();
  const reco = await getRecommendationForTenant(input.recommendationId, input.tenantId);
  if (!reco || reco.status !== "pending") {
    return { ok: false, reason: "invalid_or_not_pending" };
  }
  if (!reco.nodeId) {
    return { ok: false, reason: "missing_node" };
  }

  const node = await getNodeForTenant(input.tenantId, reco.nodeId);
  if (!node || node.status !== "active") {
    return { ok: false, reason: "node_not_active" };
  }

  const sku = await getSkuRow(input.tenantId, reco.skuKey);
  if (!sku) return { ok: false, reason: "sku_missing" };

  const now = new Date();
  const nowIso = now.toISOString();
  const live = isLivePricingEnabled();

  const simulation = runPriceSimulation({
    basePriceCents: sku.basePriceCents,
    currentPriceCents: sku.currentPriceCents,
    demandScore: sku.demandScore,
    learningBias: node.learningBias,
  });

  const shadow = evaluateShadowStructuralSafety({
    tenantId: input.tenantId,
    skuKey: reco.skuKey,
    currentPriceCents: sku.currentPriceCents,
    proposedPriceCents: reco.recommendedPriceCents,
    basePriceCents: sku.basePriceCents,
    lastChangedAt: sku.lastChangedAt ? new Date(sku.lastChangedAt) : null,
    now,
  });

  if (!shadow.allowed) {
    await updateRecommendationStatus({
      recommendationId: reco.id,
      status: "rejected",
      metadataPatch: { phase: "operator_apply_structural", reasons: shadow.blockedReasons },
    });
    return { ok: false, reason: `structural: ${shadow.blockedReasons.join(";")}` };
  }

  if (!live) {
    await updateRecommendationStatus({
      recommendationId: reco.id,
      status: "rejected",
      metadataPatch: {
        phase: "operator_apply_shadow_only",
        wouldApplyPriceCents: shadow.finalPriceCents,
      },
    });
    return { ok: false, reason: "live_pricing_disabled" };
  }

  const applySafety = evaluateSafety({
    tenantId: input.tenantId,
    skuKey: reco.skuKey,
    currentPriceCents: sku.currentPriceCents,
    proposedPriceCents: shadow.finalPriceCents,
    basePriceCents: sku.basePriceCents,
    lastChangedAt: sku.lastChangedAt ? new Date(sku.lastChangedAt) : null,
    now,
    livePricingEnabled: true,
  });

  if (!applySafety.allowed) {
    await updateRecommendationStatus({
      recommendationId: reco.id,
      status: "rejected",
      metadataPatch: { phase: "operator_apply_live_gate", reasons: applySafety.blockedReasons },
    });
    return { ok: false, reason: `live_policy: ${applySafety.blockedReasons.join(";")}` };
  }

  const newDemand = evolveDemandScore(sku.demandScore, now.getTime());
  await updateSkuPriceAndDemand({
    tenantId: input.tenantId,
    skuKey: reco.skuKey,
    newPriceCents: applySafety.finalPriceCents,
    newDemandScore: newDemand,
    nowIso,
  });

  const changeId = await insertChangeLog({
    tenantId: input.tenantId,
    skuKey: reco.skuKey,
    oldPriceCents: sku.currentPriceCents,
    newPriceCents: applySafety.finalPriceCents,
    reason: "operator_force_apply",
    policySnapshot: applySafety.policySnapshot,
    bullmqJobId: undefined,
  });

  const historyId = await insertPricingHistory({
    tenantId: input.tenantId,
    skuKey: reco.skuKey,
    nodeId: reco.nodeId,
    oldPriceCents: sku.currentPriceCents,
    newPriceCents: applySafety.finalPriceCents,
    applied: true,
    reason: "operator_force_apply",
    simulation: { ...simulation } as unknown as Record<string, unknown>,
    policySnapshot: applySafety.policySnapshot,
    changeLogId: changeId,
    bullmqJobId: undefined,
  });

  await updateRecommendationStatus({
    recommendationId: reco.id,
    status: "applied",
    appliedHistoryId: historyId,
    metadataPatch: { changeLogId: changeId, historyId, source: "operator" },
  });

  const delayMs = getPricingMeasurementDelayMs();
  const dueAt = new Date(now.getTime() + delayMs).toISOString();
  const outcomeId = await insertPendingOutcome({
    changeLogId: changeId,
    tenantId: input.tenantId,
    skuKey: reco.skuKey,
    windowHours: Math.max(1, Math.round(delayMs / 3_600_000)),
    dueAtIso: dueAt,
    metricBefore: sku.demandScore,
  });

  await enqueueMeasureJob(
    { kind: "measure", outcomeId },
    { delayMs, jobId: `measure-${outcomeId}` },
  );

  pricingLog("info", "operator_price_applied", {
    recommendationId: reco.id,
    skuKey: reco.skuKey,
    newCents: applySafety.finalPriceCents,
  });

  return { ok: true };
}

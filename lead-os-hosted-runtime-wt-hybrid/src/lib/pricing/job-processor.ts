// src/lib/pricing/job-processor.ts
// Node scan → simulation → recommendations → safety → history / outcomes / apply.

import { initializeDatabase } from "@/lib/db.ts";
import { assertPricingExecutionAllowed } from "@/lib/billing/entitlements";
import { evolveDemandScore, runPriceSimulation } from "./autopilot-engine.ts";
import { evaluateSafety, evaluateShadowStructuralSafety } from "./safety-policy.ts";
import {
  ensureNodesForTenant,
  insertChangeLog,
  insertPendingOutcome,
  insertPendingRecommendation,
  insertPricingHistory,
  listActiveNodes,
  updateNodeScan,
  updateRecommendationStatus,
  updateSkuPriceAndDemand,
  getSkuRow,
} from "./repository.ts";
import type { PricingTickJobData } from "./types.ts";
import { flushDueOutcomesFromDb } from "./outcome-tracker.ts";
import { markTickError, markTickStart, markTickSuccess } from "./runtime-state.ts";
import {
  getDefaultTenantId,
  getPricingMeasurementDelayMs,
  isLivePricingEnabled,
} from "./env.ts";
import { enqueueMeasureJob } from "./queue-client.ts";
import { pricingLog } from "./logger.ts";

export { runPricingMeasureJob } from "./outcome-tracker.ts";

export async function runPricingTickJob(
  data: PricingTickJobData,
  bullmqJobId: string | undefined,
): Promise<{ updated: number; outcomesFlushed: number; nodesScanned: number }> {
  markTickStart();
  try {
    await initializeDatabase();
    const tenantId = data.tenantId || getDefaultTenantId();
    pricingLog("info", "tick_start", { tenantId, source: data.source ?? "unknown", bullmqJobId });

    const outcomesFlushed = await flushDueOutcomesFromDb();
    if (outcomesFlushed > 0) {
      pricingLog("info", "outcomes_flushed", { count: outcomesFlushed });
    }

    const billingGate = await assertPricingExecutionAllowed(tenantId);
    if (!billingGate.allowed) {
      pricingLog("warn", "pricing_tick_blocked_billing", {
        tenantId,
        reason: billingGate.blockReason,
        planKey: billingGate.state.planKey,
        nodes: billingGate.state.nodeCount,
        maxNodes: billingGate.state.maxNodes,
      });
      markTickSuccess();
      return { updated: 0, outcomesFlushed, nodesScanned: 0 };
    }

    await ensureNodesForTenant(tenantId);
    const nodes = await listActiveNodes(tenantId);
    let updated = 0;
    const now = new Date();
    const nowIso = now.toISOString();
    const live = isLivePricingEnabled();

    for (const node of nodes) {
      await updateNodeScan(node.id);
      const sku = await getSkuRow(tenantId, node.skuKey);
      if (!sku) {
        pricingLog("warn", "node_sku_missing", { tenantId, skuKey: node.skuKey, nodeId: node.id });
        continue;
      }

      const simulation = runPriceSimulation({
        basePriceCents: sku.basePriceCents,
        currentPriceCents: sku.currentPriceCents,
        demandScore: sku.demandScore,
        learningBias: node.learningBias,
      });

      const recommendationId = await insertPendingRecommendation({
        tenantId,
        skuKey: node.skuKey,
        nodeId: node.id,
        recommendedPriceCents: simulation.simulatedPriceCents,
        simulatedLift: simulation.expectedRelativeLift,
        confidence: simulation.confidence,
        policySnapshot: { scenario: simulation.scenario },
        metadata: { source: data.source ?? "tick" },
      });

      const shadow = evaluateShadowStructuralSafety({
        tenantId,
        skuKey: node.skuKey,
        currentPriceCents: sku.currentPriceCents,
        proposedPriceCents: simulation.simulatedPriceCents,
        basePriceCents: sku.basePriceCents,
        lastChangedAt: sku.lastChangedAt ? new Date(sku.lastChangedAt) : null,
        now,
      });

      if (!shadow.allowed) {
        await updateRecommendationStatus({
          recommendationId,
          status: "rejected",
          metadataPatch: { phase: "structural", reasons: shadow.blockedReasons },
        });
        await insertPricingHistory({
          tenantId,
          skuKey: node.skuKey,
          nodeId: node.id,
          oldPriceCents: sku.currentPriceCents,
          newPriceCents: shadow.finalPriceCents,
          applied: false,
          reason: "structural_block",
          simulation: { ...simulation } as unknown as Record<string, unknown>,
          policySnapshot: shadow.policySnapshot,
          changeLogId: null,
          bullmqJobId,
        });
        pricingLog("info", "recommendation_rejected_structural", {
          skuKey: node.skuKey,
          reasons: shadow.blockedReasons,
        });
        continue;
      }

      if (!live) {
        await updateRecommendationStatus({
          recommendationId,
          status: "rejected",
          metadataPatch: {
            phase: "shadow_only",
            wouldApplyPriceCents: shadow.finalPriceCents,
            enableLivePricing: false,
          },
        });
        await insertPricingHistory({
          tenantId,
          skuKey: node.skuKey,
          nodeId: node.id,
          oldPriceCents: sku.currentPriceCents,
          newPriceCents: shadow.finalPriceCents,
          applied: false,
          reason: "ENABLE_LIVE_PRICING_off",
          simulation: { ...simulation } as unknown as Record<string, unknown>,
          policySnapshot: shadow.policySnapshot,
          changeLogId: null,
          bullmqJobId,
        });
        pricingLog("info", "shadow_recorded", { skuKey: node.skuKey, recommendationId });
        continue;
      }

      const applySafety = evaluateSafety({
        tenantId,
        skuKey: node.skuKey,
        currentPriceCents: sku.currentPriceCents,
        proposedPriceCents: shadow.finalPriceCents,
        basePriceCents: sku.basePriceCents,
        lastChangedAt: sku.lastChangedAt ? new Date(sku.lastChangedAt) : null,
        now,
        livePricingEnabled: true,
      });

      if (!applySafety.allowed) {
        await updateRecommendationStatus({
          recommendationId,
          status: "rejected",
          metadataPatch: { phase: "live_gate", reasons: applySafety.blockedReasons },
        });
        await insertPricingHistory({
          tenantId,
          skuKey: node.skuKey,
          nodeId: node.id,
          oldPriceCents: sku.currentPriceCents,
          newPriceCents: applySafety.finalPriceCents,
          applied: false,
          reason: "live_policy_block",
          simulation: { ...simulation } as unknown as Record<string, unknown>,
          policySnapshot: applySafety.policySnapshot,
          changeLogId: null,
          bullmqJobId,
        });
        pricingLog("info", "recommendation_rejected_live_policy", {
          skuKey: node.skuKey,
          reasons: applySafety.blockedReasons,
        });
        continue;
      }

      const newDemand = evolveDemandScore(sku.demandScore, now.getTime());
      await updateSkuPriceAndDemand({
        tenantId,
        skuKey: node.skuKey,
        newPriceCents: applySafety.finalPriceCents,
        newDemandScore: newDemand,
        nowIso,
      });

      const changeId = await insertChangeLog({
        tenantId,
        skuKey: node.skuKey,
        oldPriceCents: sku.currentPriceCents,
        newPriceCents: applySafety.finalPriceCents,
        reason: "autopilot_tick",
        policySnapshot: applySafety.policySnapshot,
        bullmqJobId,
      });

      const historyId = await insertPricingHistory({
        tenantId,
        skuKey: node.skuKey,
        nodeId: node.id,
        oldPriceCents: sku.currentPriceCents,
        newPriceCents: applySafety.finalPriceCents,
        applied: true,
        reason: "autopilot_applied",
        simulation: { ...simulation } as unknown as Record<string, unknown>,
        policySnapshot: applySafety.policySnapshot,
        changeLogId: changeId,
        bullmqJobId,
      });

      await updateRecommendationStatus({
        recommendationId,
        status: "applied",
        appliedHistoryId: historyId,
        metadataPatch: { changeLogId: changeId, historyId },
      });

      const delayMs = getPricingMeasurementDelayMs();
      const dueAt = new Date(now.getTime() + delayMs).toISOString();
      const outcomeId = await insertPendingOutcome({
        changeLogId: changeId,
        tenantId,
        skuKey: node.skuKey,
        windowHours: Math.max(1, Math.round(delayMs / 3_600_000)),
        dueAtIso: dueAt,
        metricBefore: sku.demandScore,
      });

      await enqueueMeasureJob(
        { kind: "measure", outcomeId },
        { delayMs, jobId: `measure-${outcomeId}` },
      );

      updated += 1;
      pricingLog("info", "price_applied", {
        skuKey: node.skuKey,
        oldCents: sku.currentPriceCents,
        newCents: applySafety.finalPriceCents,
        outcomeId,
      });
    }

    markTickSuccess();
    pricingLog("info", "tick_complete", { updated, outcomesFlushed, nodesScanned: nodes.length });
    return { updated, outcomesFlushed, nodesScanned: nodes.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    markTickError(message);
    pricingLog("error", "tick_failed", { message });
    throw err;
  }
}

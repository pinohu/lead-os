// src/lib/pricing/outcome-tracker.ts
// Delayed outcome measurement: compares pre-change demand proxy to post-window demand.

import { queryPostgres } from "../db.ts";
import {
  applyLearningAfterOutcome,
  finalizeOutcomeMeasured,
  getOutcomeById,
  getSkuRow,
  listDueOutcomes,
  markOutcomeFailed,
} from "./repository.ts";
import type { PricingMeasureJobData } from "./types.ts";
import { markMeasurementSuccess } from "./runtime-state.ts";
import { pricingLog } from "./logger.ts";

export async function runPricingMeasureJob(data: PricingMeasureJobData): Promise<void> {
  const detail = await getOutcomeById(data.outcomeId);
  if (!detail) return;
  if (detail.status !== "pending") return;
  if (detail.due_at > new Date()) return;

  const sku = await getSkuRow(detail.tenant_id, detail.sku_key);
  if (!sku) {
    await markOutcomeFailed(data.outcomeId, { reason: "sku_missing" });
    return;
  }

  const metricBefore = detail.metric_conversion_rate_before
    ? Number(detail.metric_conversion_rate_before)
    : 0.5;
  const metricAfter = sku.demandScore;
  const changeRes = await queryPostgres<{ new_price_cents: number }>(
    `SELECT new_price_cents FROM pricing_change_log WHERE id = $1::bigint`,
    [detail.change_log_id],
  );
  const change = changeRes.rows[0]?.new_price_cents ?? sku.currentPriceCents;
  const revenueDelta = Math.round((metricAfter - metricBefore) * change * 100);

  await finalizeOutcomeMeasured({
    outcomeId: data.outcomeId,
    metricAfter,
    revenueDeltaEstimateCents: revenueDelta,
    detail: {
      engine: "pricing-autopilot-v1",
      changeLogId: detail.change_log_id,
    },
  });
  await applyLearningAfterOutcome({
    tenantId: detail.tenant_id,
    skuKey: detail.sku_key,
    revenueDeltaEstimateCents: revenueDelta,
  });
  pricingLog("info", "outcome_measured", {
    outcomeId: data.outcomeId,
    tenantId: detail.tenant_id,
    skuKey: detail.sku_key,
    revenueDeltaEstimateCents: revenueDelta,
  });
  markMeasurementSuccess();
}

export async function flushDueOutcomesFromDb(): Promise<number> {
  const due = await listDueOutcomes(100);
  for (const row of due) {
    await runPricingMeasureJob({ kind: "measure", outcomeId: row.id });
  }
  return due.length;
}

// src/agents/optimization-engine.ts
import { logger } from "@/lib/logger"
import {
  ensureDefaultFunnelVariant,
  getRecentPerformanceHistory,
  listLatestFunnelMetrics,
} from "./repository"
import type {
  AgentId,
  AutonomyMode,
  DecisionContext,
  DecisionResult,
  OptimizationResult,
} from "./types"

function computeConfidence(values: number[]): number {
  if (values.length === 0) return 0
  const avg = values.reduce((acc, value) => acc + value, 0) / values.length
  return Math.max(0, Math.min(1, Number(avg.toFixed(3))))
}

export async function optimize(input: {
  tenantId: string
  agentId: AgentId
  mode: AutonomyMode
  context: DecisionContext
}): Promise<OptimizationResult> {
  const measuredAt = new Date().toISOString()
  const category =
    String(input.context.leadData.category ?? "general").trim().toLowerCase() ||
    "general"

  await ensureDefaultFunnelVariant({ tenantId: input.tenantId, category })
  const history = await getRecentPerformanceHistory({ tenantId: input.tenantId, category })
  const latestFunnelMetrics = await listLatestFunnelMetrics({
    tenantId: input.tenantId,
    category,
  })

  const recommendations: OptimizationResult["recommendations"] = []
  if ((history.deliverySuccessRate ?? 0) < 0.65) {
    recommendations.push({
      type: "routing",
      confidence: 0.74,
      detail: {
        reason: "delivery_success_below_target",
        deliverySuccessRate: history.deliverySuccessRate ?? 0,
      },
    })
  }
  if ((history.engagementRate ?? 0) < 0.5) {
    recommendations.push({
      type: "messaging",
      confidence: 0.7,
      detail: {
        reason: "engagement_below_target",
        engagementRate: history.engagementRate ?? 0,
      },
    })
  }
  if (
    latestFunnelMetrics.length > 0 &&
    latestFunnelMetrics[0] &&
    latestFunnelMetrics[0].conversionRate > 0
  ) {
    recommendations.push({
      type: "funnel",
      confidence: 0.78,
      detail: {
        reason: "high_performing_variant_detected",
        variantName: latestFunnelMetrics[0].variantName,
        conversionRate: latestFunnelMetrics[0].conversionRate,
      },
    })
  }

  const decision: DecisionResult = {
    agentId: input.agentId,
    funnelSelection: {
      category,
      variantName: latestFunnelMetrics[0]?.variantName ?? "default",
    },
    confidenceScore: computeConfidence(recommendations.map((item) => item.confidence)),
    reasoningMetadata: {
      measuredAt,
      recommendationsCount: recommendations.length,
      shadowMode: input.mode === "shadow",
    },
  }

  logger.info("autonomy.optimize", {
    tenantId: input.tenantId,
    agentId: input.agentId,
    mode: input.mode,
    measuredAt,
    recommendationsCount: recommendations.length,
    confidence: decision.confidenceScore,
  })

  return {
    mode: input.mode,
    measuredAt,
    recommendations,
    recommendedDecision: decision,
  }
}

// src/agents/decision-engine.ts
import {
  ensureDefaultFunnelVariant,
  getRecentPerformanceHistory,
  insertAgentDecisionRow,
  listActiveFunnelVariants,
} from "./repository"
import { logger } from "@/lib/logger"
import type { AgentId, DecisionContext, DecisionResult } from "./types"

const DEFAULT_CATEGORY = "general"

function clampConfidence(value: number): number {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 0.5
  if (value < 0) return 0
  if (value > 1) return 1
  return Number(value.toFixed(4))
}

function toCategory(leadData: Record<string, unknown>): string {
  const value = leadData.category
  if (typeof value !== "string") return DEFAULT_CATEGORY
  const normalized = value.trim().toLowerCase()
  return normalized || DEFAULT_CATEGORY
}

function toLeadKey(leadData: Record<string, unknown>): string {
  const leadKey = leadData.leadKey
  if (typeof leadKey === "string" && leadKey.trim()) return leadKey.trim()
  return "unknown-lead"
}

function pickVariantDeterministic(input: {
  category: string
  leadKey: string
  variants: Array<{
    variantName: string
    conversionRate: number
    selectionProbability: number
    isDefault: boolean
  }>
}): string {
  if (input.variants.length === 0) return "default"
  const hashSource = `${input.category}:${input.leadKey}`
  let hash = 0
  for (let i = 0; i < hashSource.length; i += 1)
    hash = (hash * 31 + hashSource.charCodeAt(i)) >>> 0
  const sorted = [...input.variants].sort((a, b) => {
    if (b.selectionProbability !== a.selectionProbability)
      return b.selectionProbability - a.selectionProbability
    if (b.conversionRate !== a.conversionRate)
      return b.conversionRate - a.conversionRate
    if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1
    return a.variantName.localeCompare(b.variantName)
  })
  const index = hash % sorted.length
  return sorted[index]?.variantName ?? "default"
}

function computeConfidence(input: {
  deliverySuccessRate?: number
  conversionRate?: number
  engagementRate?: number
  gtmStatus?: string
}): number {
  const delivery = input.deliverySuccessRate ?? 0.5
  const conversion = input.conversionRate ?? 0.3
  const engagement = input.engagementRate ?? 0.4
  const gtmBoost = input.gtmStatus === "live" ? 0.1 : 0
  return clampConfidence(
    delivery * 0.4 + conversion * 0.35 + engagement * 0.25 + gtmBoost,
  )
}

export async function decide(input: {
  tenantId: string
  agentId: AgentId
  context: DecisionContext
}): Promise<DecisionResult> {
  const category = toCategory(input.context.leadData)
  const leadKey = toLeadKey(input.context.leadData)
  await ensureDefaultFunnelVariant({ tenantId: input.tenantId, category })
  const [runtimeHistory, variants] = await Promise.all([
    getRecentPerformanceHistory({ tenantId: input.tenantId, category }),
    listActiveFunnelVariants({ tenantId: input.tenantId, category }),
  ])
  const selectedVariant = pickVariantDeterministic({
    category,
    leadKey,
    variants,
  })

  const topNodeKey =
    runtimeHistory.topNodeKey ??
    input.context.performanceHistory.topNodeKey ??
    "node-default"
  const confidenceScore = computeConfidence({
    deliverySuccessRate:
      runtimeHistory.deliverySuccessRate ??
      input.context.performanceHistory.deliverySuccessRate,
    conversionRate:
      runtimeHistory.conversionRate ??
      input.context.performanceHistory.conversionRate,
    engagementRate:
      runtimeHistory.engagementRate ??
      input.context.performanceHistory.engagementRate,
    gtmStatus: input.context.gtmState.status,
  })

  const decision: DecisionResult = {
    agentId: input.agentId,
    routingOverride: {
      category,
      targetNodeKey: topNodeKey,
      weight: confidenceScore >= 0.7 ? 1.3 : 1,
    },
    messagingVariation:
      selectedVariant === "default" ? "baseline" : `variant:${selectedVariant}`,
    funnelSelection: {
      category,
      variantName: selectedVariant,
    },
    deliveryPath: {
      category,
      channel: confidenceScore >= 0.75 ? "webhook_priority" : "webhook_standard",
      config: {
        source: "autonomy-decision-engine",
      },
    },
    followUp: {
      leadKey,
      followUpType: confidenceScore < 0.55 ? "accelerated_follow_up" : "standard",
      scheduledForIso: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      payload: {
        category,
        selectedVariant,
        confidenceScore,
      },
    },
    confidenceScore,
    reasoningMetadata: {
      decisionType: "routing_override",
      selectedNode: topNodeKey,
      category,
      selectedVariant,
      gtmState: input.context.gtmState,
      performanceHistory: {
        ...input.context.performanceHistory,
        ...runtimeHistory,
      },
      deterministicSelection: true,
    },
  }
  const reasoning = `selected_node=${topNodeKey};variant=${selectedVariant};category=${category};deterministic=true`
  const decisionId = await insertAgentDecisionRow({
    agentId: input.agentId,
    context: {
      tenantId: input.tenantId,
      ...input.context,
    },
    decision: {
      decisionType: "routing_override",
      selectedNode: topNodeKey,
      confidence: confidenceScore,
      reasoning,
    },
    confidence: confidenceScore,
    reasoning,
  })
  decision.reasoningMetadata.decisionId = decisionId
  logger.info("autonomy.decision.recorded", {
    tenantId: input.tenantId,
    agentId: input.agentId,
    decisionId,
    selectedNode: topNodeKey,
    confidence: confidenceScore,
    reasoning,
  })
  return decision
}

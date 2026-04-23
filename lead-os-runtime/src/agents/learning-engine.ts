// src/agents/learning-engine.ts
import { logger } from "@/lib/logger"
import { appendLearningRows, insertAgentLearningRow } from "./repository"
import type { AgentId, LearningOutcome, LearningResult } from "./types"

function summarizeOutcomes(outcomes: LearningOutcome[]): LearningResult["summary"] {
  const total = outcomes.length
  if (total === 0) {
    return {
      deliverySuccessRate: 0,
      conversionRate: 0,
      engagementRate: 0,
      failurePattern: "none",
    }
  }
  const delivered = outcomes.filter((outcome) => outcome.delivered).length
  const converted = outcomes.filter((outcome) => outcome.converted).length
  const engagementSum = outcomes.reduce(
    (acc, outcome) => acc + Number(outcome.engagementScore ?? 0),
    0,
  )
  const failurePattern = outcomes.find((outcome) => outcome.failurePattern)
    ?.failurePattern
  return {
    deliverySuccessRate: delivered / total,
    conversionRate: converted / total,
    engagementRate: engagementSum / total,
    failurePattern: failurePattern ?? "none",
  }
}

export async function learn(input: {
  tenantId: string
  agentId: AgentId
  outcomes: LearningOutcome[]
}): Promise<LearningResult> {
  const summary = summarizeOutcomes(input.outcomes)
  const agentLearningIds: number[] = []
  for (const outcome of input.outcomes) {
    const rowId = await insertAgentLearningRow({
      agentId: input.agentId,
      learningInput: {
        tenantId: input.tenantId,
        leadKey: outcome.leadKey,
        nodeKey: outcome.nodeKey ?? null,
        category: outcome.category ?? null,
      },
      outcome: {
        delivered: Boolean(outcome.delivered),
        converted: Boolean(outcome.converted),
        engagementScore: Number(outcome.engagementScore ?? 0),
        failurePattern: outcome.failurePattern ?? null,
        metadata: outcome.metadata ?? {},
      },
    })
    if (rowId > 0) agentLearningIds.push(rowId)
  }
  const learning = await appendLearningRows({
    tenantId: input.tenantId,
    agentId: input.agentId,
    outcomes: input.outcomes,
    summary,
  })
  logger.info("autonomy.learn.completed", {
    tenantId: input.tenantId,
    agentId: input.agentId,
    rowsWritten: learning.rowsWritten,
    agentLearningRows: agentLearningIds.length,
    nodeMetricRows: learning.nodeMetricRows,
    funnelMetricRows: learning.funnelMetricRows,
    summary,
  })
  return learning
}

// src/agents/agent-runner.ts
import { logger } from "@/lib/logger"
import { isAgentKillSwitchEnabled, isAutonomyEnabled } from "@/lib/autonomy-config"
import { executeAutonomyCycle } from "./execution-engine"
import type { AgentContext, AgentLearningEvent } from "./agent-types"
import type { AgentId, LearningOutcome } from "./types"

function toLeadKey(lead: Record<string, unknown>): string {
  const id = lead.id
  if (typeof id === "number" && Number.isFinite(id)) return `lead:${id}`
  const email = lead.email
  if (typeof email === "string" && email.trim()) return `email:${email.trim().toLowerCase()}`
  return "lead:unknown"
}

function toCategory(lead: Record<string, unknown>): string {
  const category = lead.category
  if (typeof category === "string" && category.trim())
    return category.trim().toLowerCase()
  return "general"
}

function buildContext(input: AgentContext) {
  const category = toCategory(input.lead)
  const topNodeKey =
    typeof input.routingResult.channel === "string" && input.routingResult.channel.trim()
      ? `node-${input.routingResult.channel.trim().toLowerCase()}`
      : "node-default"
  return {
    leadData: {
      ...input.lead,
      leadKey: toLeadKey(input.lead),
      category,
    },
    tenantConfig: {
      tenantId: input.tenantId,
    },
    performanceHistory: {
      topNodeKey,
      deliverySuccessRate: input.deliveryResult ? 1 : 0,
      conversionRate: 0,
      engagementRate: input.deliveryResult ? 0.5 : 0,
    },
    gtmState: {
      status: "live",
      activeUseCase: category,
    },
  }
}

function buildOutcomes(input: AgentContext): LearningOutcome[] {
  const leadKey = toLeadKey(input.lead)
  const category = toCategory(input.lead)
  const deliverySuccess = Boolean(input.deliveryResult)
  const routingSuccess = Boolean(input.routingResult.channel)
  return [
    {
      leadKey,
      category,
      delivered: deliverySuccess,
      converted: false,
      engagementScore: deliverySuccess ? 0.5 : 0,
      failurePattern: routingSuccess ? undefined : "routing_missing",
      metadata: {
        routingResult: input.routingResult,
        deliveryResult: input.deliveryResult ?? null,
      },
    },
  ]
}

function toLearningEvent(input: {
  context: AgentContext
  decision: Record<string, unknown>
  action: Record<string, unknown>
}): AgentLearningEvent {
  return {
    context: input.context,
    decision: {
      decisionType: "routing_override",
      selectedNode:
        typeof input.decision.routingOverride === "object" &&
        input.decision.routingOverride &&
        "targetNodeKey" in (input.decision.routingOverride as Record<string, unknown>) &&
        typeof (input.decision.routingOverride as Record<string, unknown>).targetNodeKey === "string"
          ? String((input.decision.routingOverride as Record<string, unknown>).targetNodeKey)
          : "node-default",
      confidence:
        typeof input.decision.confidenceScore === "number"
          ? Number(input.decision.confidenceScore)
          : 0.5,
      reasoning: "runner_flow",
      context: input.context,
    },
    action: {
      status:
        typeof input.action.status === "string" &&
        (input.action.status === "simulated" || input.action.status === "applied")
          ? (input.action.status as "simulated" | "applied")
          : "failed",
      reversible: true,
      action: input.action,
    },
    outcome: {
      deliverySuccess: Boolean(input.context.deliveryResult),
      routingSuccess: Boolean(input.context.routingResult.channel),
    },
  }
}

export async function runAgents(input: AgentContext): Promise<void> {
  if (!isAutonomyEnabled()) return
  if (isAgentKillSwitchEnabled()) return
  if (!input.tenantId) return
  try {
    const result = await executeAutonomyCycle({
      tenantId: input.tenantId,
      agentId: (input.agentId as AgentId) || "routing-agent",
      context: buildContext(input),
      outcomes: buildOutcomes(input),
      idempotencyKey: `runner:${toLeadKey(input.lead)}:${Date.now()}`,
    })
    const learningEvent = toLearningEvent({
      context: input,
      decision: (result.decision ?? {}) as Record<string, unknown>,
      action: (result.action ?? {}) as Record<string, unknown>,
    })
    logger.info("autonomy.runner.completed", {
      tenantId: input.tenantId,
      agentId: input.agentId,
      ok: result.ok,
      reason: result.reason ?? null,
      mode: result.mode,
      learningEvent,
    })
  } catch (error) {
    logger.error("autonomy.runner.failed", {
      tenantId: input.tenantId,
      agentId: input.agentId,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

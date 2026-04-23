// src/agents/multi-agent-engine.ts
import { logger } from "@/lib/logger"
import { addJob, registerWorker } from "@/lib/integrations/job-queue"
import { executeAutonomyCycle } from "./execution-engine"
import type {
  AgentId,
  AutonomyExecutionResult,
  DecisionContext,
  LearningOutcome,
} from "./types"

export interface AgentDescriptor {
  agentId: AgentId
  scope: string
  permissions: string[]
  enabled: boolean
}

export const AUTONOMY_AGENT_DESCRIPTORS: AgentDescriptor[] = [
  {
    agentId: "routing-agent",
    scope: "routing",
    permissions: ["routing_weights", "delivery_paths"],
    enabled: true,
  },
  {
    agentId: "pricing-agent",
    scope: "pricing",
    permissions: ["routing_weights"],
    enabled: true,
  },
  {
    agentId: "messaging-agent",
    scope: "messaging",
    permissions: ["funnel_variants", "follow_ups"],
    enabled: true,
  },
  {
    agentId: "gtm-agent",
    scope: "gtm",
    permissions: ["funnel_variants", "delivery_paths", "follow_ups"],
    enabled: true,
  },
]

export interface MultiAgentExecutionResult {
  tenantId: string
  mode: "shadow" | "active"
  ok: boolean
  results: AutonomyExecutionResult[]
  summary: {
    totalAgents: number
    succeeded: number
    failed: number
    blocked: number
  }
}

export async function executeMultiAgentCycle(input: {
  tenantId: string
  agentIds?: AgentId[]
  context: DecisionContext
  outcomes: LearningOutcome[]
  modeOverride?: "shadow" | "active"
  idempotencyPrefix?: string
}): Promise<MultiAgentExecutionResult> {
  const idempotencyPrefix = input.idempotencyPrefix ?? `multi-agent:${Date.now()}`
  const requested = input.agentIds ?? AUTONOMY_AGENT_DESCRIPTORS.map((item) => item.agentId)
  const descriptors = AUTONOMY_AGENT_DESCRIPTORS.filter(
    (item) => item.enabled && requested.includes(item.agentId),
  )
  const results: AutonomyExecutionResult[] = []
  for (const descriptor of descriptors) {
    const result = await executeAutonomyCycle({
      tenantId: input.tenantId,
      agentId: descriptor.agentId,
      context: input.context,
      outcomes: input.outcomes,
      modeOverride: input.modeOverride,
      idempotencyKey: `${idempotencyPrefix}:${descriptor.agentId}`,
    })
    results.push(result)
  }
  const succeeded = results.filter((item) => item.ok).length
  const blocked = results.filter((item) => !item.ok && item.reason?.includes("kill_switch")).length
  const failed = results.filter((item) => !item.ok).length
  const ok = failed === 0
  const resolvedMode =
    input.modeOverride ??
    (process.env.AUTONOMY_MODE === "active" ? "active" : "shadow")
  return {
    tenantId: input.tenantId,
    mode: resolvedMode,
    ok,
    results,
    summary: {
      totalAgents: results.length,
      succeeded,
      failed,
      blocked,
    },
  }
}

export async function runEnabledAgents(input: {
  tenantId: string
  context: DecisionContext
  outcomes: LearningOutcome[]
  modeOverride?: "shadow" | "active"
}): Promise<MultiAgentExecutionResult> {
  return executeMultiAgentCycle({
    tenantId: input.tenantId,
    context: input.context,
    outcomes: input.outcomes,
    modeOverride: input.modeOverride,
  })
}

export async function enqueueMultiAgentExecution(input: {
  tenantId: string
  context: DecisionContext
  outcomes: LearningOutcome[]
  modeOverride?: "shadow" | "active"
  idempotencyPrefix?: string
}): Promise<{
  tenantId: string
  queued: true
  jobIds: string[]
}> {
  const idempotencyPrefix =
    input.idempotencyPrefix ?? `queued-multi-agent:${Date.now()}`
  const descriptors = AUTONOMY_AGENT_DESCRIPTORS.filter((item) => item.enabled)
  const jobIds: string[] = []
  for (const descriptor of descriptors) {
    const jobId = await addJob("autonomy-agents", {
      name: `autonomy:${descriptor.agentId}`,
      data: {
        tenantId: input.tenantId,
        agentId: descriptor.agentId,
        context: input.context,
        outcomes: input.outcomes,
        idempotencyKey: `${idempotencyPrefix}:${descriptor.agentId}`,
        modeOverride: input.modeOverride,
      },
    })
    jobIds.push(jobId)
  }
  return { tenantId: input.tenantId, queued: true, jobIds }
}

export function registerAutonomyQueueWorker(): void {
  registerWorker("autonomy-agents", async (job) => {
    const data = job.data as {
      tenantId?: string
      agentId?: AgentId
      context?: DecisionContext
      outcomes?: LearningOutcome[]
      idempotencyKey?: string
      modeOverride?: "shadow" | "active"
    }
    if (!data.tenantId || !data.agentId || !data.context) return
    const result = await executeAutonomyCycle({
      tenantId: data.tenantId,
      agentId: data.agentId,
      context: data.context,
      outcomes: data.outcomes ?? [],
      idempotencyKey: data.idempotencyKey,
      modeOverride: data.modeOverride,
    })
    logger.info("autonomy.worker.job_completed", {
      tenantId: data.tenantId,
      agentId: data.agentId,
      ok: result.ok,
      reason: result.reason ?? null,
    })
  })
}

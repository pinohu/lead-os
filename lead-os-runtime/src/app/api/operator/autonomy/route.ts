import { NextResponse } from "next/server"
import { requireOperatorApiSession } from "@/lib/operator-auth"
import { requireAlignedTenant } from "@/lib/api-mutation-guard"
import { tenantConfig } from "@/lib/tenant"
import { logOperatorAudit } from "@/lib/operator-audit"
import { z } from "zod"
import {
  executeAutonomyCycle,
  revertAutonomyActionForTenant,
} from "@/agents/execution-engine"
import { executeMultiAgentCycle } from "@/agents/multi-agent-engine"
import type { AgentId, AutonomyMode, LearningOutcome } from "@/agents/types"

const AgentIdSchema = z.enum([
  "routing-agent",
  "pricing-agent",
  "messaging-agent",
  "gtm-agent",
])

const DecisionContextSchema = z.object({
  leadData: z.record(z.string(), z.unknown()),
  tenantConfig: z.record(z.string(), z.unknown()),
  performanceHistory: z
    .object({
      topNodeKey: z.string().optional(),
      deliverySuccessRate: z.number().optional(),
      conversionRate: z.number().optional(),
      engagementRate: z.number().optional(),
      failPattern: z.string().optional(),
    })
    .default({}),
  gtmState: z
    .object({
      activeUseCase: z.string().optional(),
      status: z.string().optional(),
      notes: z.string().optional(),
    })
    .default({}),
})

const LearningOutcomeSchema = z.object({
  leadKey: z.string(),
  nodeKey: z.string().optional(),
  category: z.string().optional(),
  funnelVariant: z.string().optional(),
  delivered: z.boolean().optional(),
  converted: z.boolean().optional(),
  engagementScore: z.number().optional(),
  failurePattern: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

const ModeSchema = z.enum(["shadow", "active"]).optional()

const ExecuteSchema = z.object({
  operation: z.literal("execute"),
  agentId: AgentIdSchema,
  context: DecisionContextSchema,
  outcomes: z.array(LearningOutcomeSchema),
  mode: ModeSchema,
  idempotencyKey: z.string().min(1).max(256).optional(),
})

const ExecuteMultiSchema = z.object({
  operation: z.literal("execute_multi"),
  agentIds: z.array(AgentIdSchema).min(1),
  context: DecisionContextSchema,
  outcomes: z.array(LearningOutcomeSchema),
  mode: ModeSchema,
  idempotencyKey: z.string().min(1).max(256).optional(),
})

const RevertSchema = z.object({
  operation: z.literal("revert"),
  actionId: z.string().min(1),
})

const RequestSchema = z.union([ExecuteSchema, ExecuteMultiSchema, RevertSchema])

function toMode(value: string | undefined): AutonomyMode | undefined {
  if (value === "shadow" || value === "active") return value
  return undefined
}

function toAgentIds(values: string[]): AgentId[] {
  return values.filter(
    (item): item is AgentId =>
      item === "routing-agent" ||
      item === "pricing-agent" ||
      item === "messaging-agent" ||
      item === "gtm-agent",
  )
}

function toContext(
  value: z.infer<typeof DecisionContextSchema>,
): {
  leadData: Record<string, unknown>
  tenantConfig: Record<string, unknown>
  performanceHistory: {
    topNodeKey?: string
    deliverySuccessRate?: number
    conversionRate?: number
    engagementRate?: number
    failPattern?: string
  }
  gtmState: {
    activeUseCase?: string
    status?: string
    notes?: string
  }
} {
  return {
    leadData: value.leadData,
    tenantConfig: value.tenantConfig,
    performanceHistory: value.performanceHistory,
    gtmState: value.gtmState,
  }
}

function toLearningOutcomes(
  outcomes: Array<z.infer<typeof LearningOutcomeSchema>>,
): LearningOutcome[] {
  return outcomes.map((item) => ({
    leadKey: item.leadKey,
    nodeKey: item.nodeKey,
    category: item.category,
    funnelVariant: item.funnelVariant,
    delivered: item.delivered,
    converted: item.converted,
    engagementScore: item.engagementScore,
    failurePattern: item.failurePattern,
    metadata: item.metadata,
  }))
}

export async function POST(request: Request) {
  const { session, response } = await requireOperatorApiSession(request)
  if (!session?.email) {
    return response ?? NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }
  const aligned = requireAlignedTenant(request)
  if (!aligned.ok)
    return NextResponse.json(
      { ok: false, error: aligned.message },
      { status: aligned.status },
    )

  let payloadRaw: unknown
  try {
    payloadRaw = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 })
  }
  const parsed = RequestSchema.safeParse(payloadRaw)
  if (!parsed.success)
    return NextResponse.json(
      { ok: false, error: "validation_failed", details: parsed.error.flatten() },
      { status: 422 },
    )

  if (parsed.data.operation === "execute") {
    const result = await executeAutonomyCycle({
      tenantId: tenantConfig.tenantId,
      agentId: parsed.data.agentId,
      context: toContext(parsed.data.context),
      outcomes: toLearningOutcomes(parsed.data.outcomes),
      modeOverride: toMode(parsed.data.mode),
      idempotencyKey: parsed.data.idempotencyKey,
    })
    await logOperatorAudit({
      actorEmail: session.email,
      tenantId: tenantConfig.tenantId,
      action: "autonomy_execute",
      resourceType: "autonomy_agent",
      resourceId: parsed.data.agentId,
      detail: {
        mode: parsed.data.mode ?? "env_default",
        ok: result.ok,
        reason: result.reason ?? null,
        runId: result.runId ?? null,
      },
    })
    return NextResponse.json({ ok: result.ok, data: result }, { status: result.ok ? 200 : 400 })
  }

  if (parsed.data.operation === "execute_multi") {
    const result = await executeMultiAgentCycle({
      tenantId: tenantConfig.tenantId,
      agentIds: toAgentIds(parsed.data.agentIds),
      context: toContext(parsed.data.context),
      outcomes: toLearningOutcomes(parsed.data.outcomes),
      modeOverride: toMode(parsed.data.mode),
      idempotencyPrefix: parsed.data.idempotencyKey,
    })
    await logOperatorAudit({
      actorEmail: session.email,
      tenantId: tenantConfig.tenantId,
      action: "autonomy_execute_multi",
      resourceType: "autonomy_agent",
      detail: {
        mode: parsed.data.mode ?? "env_default",
        requested: parsed.data.agentIds,
        successCount: result.summary.succeeded,
        failureCount: result.summary.failed,
      },
    })
    return NextResponse.json(
      {
        ok: result.ok,
        data: result,
      },
      { status: result.ok ? 200 : 207 },
    )
  }

  const revert = await revertAutonomyActionForTenant({
    tenantId: tenantConfig.tenantId,
    actionId: parsed.data.actionId,
  })
  await logOperatorAudit({
    actorEmail: session.email,
    tenantId: tenantConfig.tenantId,
    action: "autonomy_revert",
    resourceType: "autonomy_action",
    resourceId: parsed.data.actionId,
    detail: revert,
  })
  return NextResponse.json(
    { ok: revert.ok, data: revert },
    { status: revert.ok ? 200 : 400 },
  )
}

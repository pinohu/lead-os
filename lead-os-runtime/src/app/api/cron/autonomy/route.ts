import { NextResponse } from "next/server"
import { buildCorsHeaders } from "@/lib/cors"
import {
  requireCronAuthOrFail,
  requireDeployTenantIdOrFail,
} from "@/lib/api/cron-public-guards"
import { executeMultiAgentCycle } from "@/agents/multi-agent-engine"
import { resolveAutonomyMode } from "@/agents/repository"
import type { AgentId, DecisionContext, LearningOutcome } from "@/agents/types"
import { logApiMutationAudit } from "@/lib/api/api-mutation-audit"
import { tenantConfig } from "@/lib/tenant"

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"))
  const authFail = requireCronAuthOrFail(request)
  if (authFail) return authFail

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "invalid_json",
      },
      { status: 400, headers },
    )
  }

  const payload = body as {
    tenantId?: string
    agents?: AgentId[]
    context?: DecisionContext
    outcomes?: LearningOutcome[]
    mode?: "shadow" | "active"
  }
  const tenantId = payload.tenantId ?? tenantConfig.tenantId
  const tenantFail = requireDeployTenantIdOrFail(tenantId, "cron_autonomy")
  if (tenantFail) return tenantFail

  const context: DecisionContext =
    payload.context ??
    ({
      leadData: { category: "general", leadKey: "cron-autonomy" },
      tenantConfig: { tenantId },
      performanceHistory: {},
      gtmState: {},
    } as DecisionContext)
  const outcomes = Array.isArray(payload.outcomes) ? payload.outcomes : []
  const mode = resolveAutonomyMode(payload.mode)
  const agents = Array.isArray(payload.agents) ? payload.agents : undefined

  const result = await executeMultiAgentCycle({
    tenantId,
    modeOverride: mode,
    agentIds: agents,
    context,
    outcomes,
    idempotencyPrefix: `cron:${Date.now()}`,
  })

  await logApiMutationAudit({
    route: "/api/cron/autonomy",
    method: "POST",
    actorHint: "cron@system",
    tenantId,
    outcome: result.ok ? "success" : "failure",
    detail: {
      mode,
      totalAgents: result.summary.totalAgents,
      succeeded: result.summary.succeeded,
      failed: result.summary.failed,
      blocked: result.summary.blocked,
    },
  })

  return NextResponse.json(
    {
      ok: result.ok,
      data: result,
    },
    { status: result.ok ? 200 : 207, headers },
  )
}

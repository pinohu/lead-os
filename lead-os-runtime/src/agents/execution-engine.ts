// src/agents/execution-engine.ts
import { logger } from "@/lib/logger"
import { getTenantIdFromRequest } from "@/lib/tenant-context"
import { requireAlignedTenant } from "@/lib/api-mutation-guard"
import { requireSafePublicExecution } from "@/lib/api/cron-public-guards"
import { decide } from "./decision-engine"
import { act, revertAutonomyAction } from "./action-engine"
import { learn } from "./learning-engine"
import { optimize } from "./optimization-engine"
import {
  getOrCreateAgentRegistration,
  insertExecutionRunStart,
  finishExecutionRun,
  insertAutonomyAuditRow,
  isAutonomyEnabled,
  isAgentKillSwitchEnabled,
  isPricingKillSwitchEnabled,
  resolveAutonomyMode,
} from "./repository"
import type {
  AgentId,
  AutonomyExecutionResult,
  AutonomyMode,
  DecisionContext,
  LearningOutcome,
} from "./types"
import { getBillingGateState } from "@/lib/billing/entitlements"

export interface ExecuteAutonomyCycleInput {
  tenantId: string
  agentId: AgentId
  context: DecisionContext
  outcomes: LearningOutcome[]
  modeOverride?: AutonomyMode
  idempotencyKey?: string
}

function normalizeAgentId(value: string): AgentId | null {
  if (
    value === "routing-agent" ||
    value === "pricing-agent" ||
    value === "messaging-agent" ||
    value === "gtm-agent"
  )
    return value
  return null
}

function ensureNoBypassTenant(input: {
  request?: Request
  tenantId: string
}): { ok: true } | { ok: false; response: Response } {
  if (!input.request) return { ok: true }
  const aligned = requireAlignedTenant(input.request)
  if (!aligned.ok)
    return {
      ok: false,
      response: Response.json(
        {
          ok: false,
          error: aligned.message,
        },
        { status: aligned.status },
      ),
    }
  const requestedTenantId = getTenantIdFromRequest(input.request)
  if (requestedTenantId && requestedTenantId !== input.tenantId)
    return {
      ok: false,
      response: Response.json(
        {
          ok: false,
          error: "tenant_mismatch",
        },
        { status: 403 },
      ),
    }
  const publicGuard = requireSafePublicExecution({
    resolvedTenantId: input.tenantId,
    pathname: new URL(input.request.url).pathname,
    method: input.request.method,
  })
  if (publicGuard)
    return {
      ok: false,
      response: publicGuard,
    }
  return { ok: true }
}

function blockedResult(input: {
  agentId: AgentId
  tenantId: string
  mode: AutonomyMode
  reason: string
}): AutonomyExecutionResult {
  return {
    ok: false,
    agentId: input.agentId,
    tenantId: input.tenantId,
    mode: input.mode,
    reason: input.reason,
  }
}

export async function executeAutonomyCycle(
  input: ExecuteAutonomyCycleInput,
): Promise<AutonomyExecutionResult> {
  const mode = resolveAutonomyMode(input.modeOverride)
  if (!isAutonomyEnabled())
    return blockedResult({
      agentId: input.agentId,
      tenantId: input.tenantId,
      mode,
      reason: "autonomy_disabled",
    })
  if (isAgentKillSwitchEnabled())
    return blockedResult({
      agentId: input.agentId,
      tenantId: input.tenantId,
      mode,
      reason: "agent_kill_switch_enabled",
    })
  if (input.agentId === "pricing-agent" && isPricingKillSwitchEnabled())
    return blockedResult({
      agentId: input.agentId,
      tenantId: input.tenantId,
      mode,
      reason: "pricing_kill_switch_enabled",
    })

  const registration = await getOrCreateAgentRegistration({
    tenantId: input.tenantId,
    agentId: input.agentId,
  })
  if (!registration.enabled)
    return blockedResult({
      agentId: input.agentId,
      tenantId: input.tenantId,
      mode,
      reason: "agent_disabled",
    })

  const billing = await getBillingGateState(input.tenantId)
  if (!billing.subscriptionActive)
    return blockedResult({
      agentId: input.agentId,
      tenantId: input.tenantId,
      mode,
      reason: "billing_inactive",
    })

  const decision = await decide({
    tenantId: input.tenantId,
    agentId: input.agentId,
    context: input.context,
  })
  const runId = await insertExecutionRunStart({
    tenantId: input.tenantId,
    agentId: input.agentId,
    mode,
    decision,
    detail: {
      phase: "start",
    },
  })

  try {
    const optimization = await optimize({
      tenantId: input.tenantId,
      agentId: input.agentId,
      mode,
      context: input.context,
    })
    const action = await act({
      tenantId: input.tenantId,
      agentId: input.agentId,
      mode,
      decision,
      permissions: registration.permissions,
      idempotencyKey: input.idempotencyKey,
    })
    if (action.status === "failed") {
      await finishExecutionRun({
        runId,
        status: "failed",
        actionResult: action,
        optimizationResult: optimization,
        detail: { reason: "action_failed" },
      })
      return {
        ok: false,
        tenantId: input.tenantId,
        agentId: input.agentId,
        mode,
        runId,
        reason: "action_failed",
        decision,
        action,
        optimization,
      }
    }
    const learning = await learn({
      tenantId: input.tenantId,
      agentId: input.agentId,
      outcomes: input.outcomes,
    })
    await finishExecutionRun({
      runId,
      status: "completed",
      actionResult: action,
      learningResult: learning,
      optimizationResult: optimization,
      detail: { phase: "complete" },
    })
    return {
      ok: true,
      tenantId: input.tenantId,
      agentId: input.agentId,
      mode,
      runId,
      decision,
      action,
      learning,
      optimization,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await insertAutonomyAuditRow({
      tenantId: input.tenantId,
      agentId: input.agentId,
      mode,
      status: "failed",
      decision: decision as unknown as Record<string, unknown>,
      action: { error: message },
      affectedEntities: [],
    })
    await finishExecutionRun({
      runId,
      status: "failed",
      detail: { error: message },
    })
    logger.error("autonomy.execution.failed", {
      tenantId: input.tenantId,
      agentId: input.agentId,
      mode,
      error: message,
    })
    return {
      ok: false,
      tenantId: input.tenantId,
      agentId: input.agentId,
      mode,
      runId,
      reason: message,
      decision,
    }
  }
}

export async function executeAutonomyFromRequest(input: {
  request: Request
  tenantId: string
  agentId: string
  context: DecisionContext
  outcomes: LearningOutcome[]
  modeOverride?: AutonomyMode
  idempotencyKey?: string
}): Promise<{ result: AutonomyExecutionResult; response?: Response }> {
  const parsedAgentId = normalizeAgentId(input.agentId)
  if (!parsedAgentId)
    return {
      result: {
        ok: false,
        tenantId: input.tenantId,
        agentId: "routing-agent",
        mode: resolveAutonomyMode(input.modeOverride),
        reason: "invalid_agent_id",
      },
      response: Response.json(
        { ok: false, error: "invalid_agent_id" },
        { status: 400 },
      ),
    }
  const tenantCheck = ensureNoBypassTenant({
    request: input.request,
    tenantId: input.tenantId,
  })
  if (!tenantCheck.ok)
    return {
      result: {
        ok: false,
        tenantId: input.tenantId,
        agentId: parsedAgentId,
        mode: resolveAutonomyMode(input.modeOverride),
        reason: "tenant_mismatch",
      },
      response: tenantCheck.response,
    }
  const result = await executeAutonomyCycle({
    tenantId: input.tenantId,
    agentId: parsedAgentId,
    context: input.context,
    outcomes: input.outcomes,
    modeOverride: input.modeOverride,
    idempotencyKey: input.idempotencyKey,
  })
  return { result }
}

export async function revertAutonomyActionForTenant(input: {
  tenantId: string
  actionId: string
}): Promise<{
  ok: boolean
  status: string
  detail: Record<string, unknown>
}> {
  const reverted = await revertAutonomyAction({
    tenantId: input.tenantId,
    actionId: input.actionId,
  })
  return {
    ok: reverted.ok,
    status: reverted.status,
    detail: reverted.detail,
  }
}

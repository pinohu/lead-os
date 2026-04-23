// src/agents/action-engine.ts
import { randomUUID } from "crypto"
import { logger } from "@/lib/logger"
import { assertPricingExecutionAllowed } from "@/lib/billing/entitlements"
import {
  cancelFollowUpsByActionId,
  createDeliveryOverride,
  createRoutingOverride,
  getActionLogByActionId,
  getFunnelVariantUsageCount,
  incrementFunnelVariantUsage,
  insertAgentActionRow,
  insertActionLog,
  insertAutonomyAuditRow,
  restoreFunnelVariantUsageCount,
  revertDeliveryOverride,
  revertRoutingOverride,
  scheduleFollowUp,
  updateActionLogStatus,
} from "./repository"
import type {
  ActionResult,
  AgentPermission,
  AutonomyMode,
  DecisionResult,
} from "./types"

function hasPermission(
  permissions: AgentPermission[],
  permission: AgentPermission,
): boolean {
  return permissions.includes(permission)
}

function toActionResult(input: {
  actionId: string
  mode: AutonomyMode
  status: ActionResult["status"]
  replayed?: boolean
  affectedEntities?: Array<Record<string, unknown>>
  detail?: Record<string, unknown>
}): ActionResult {
  return {
    actionId: input.actionId,
    mode: input.mode,
    status: input.status,
    reversible: true,
    replayed: Boolean(input.replayed),
    affectedEntities: input.affectedEntities ?? [],
    detail: input.detail ?? {},
  }
}

export async function act(input: {
  tenantId: string
  agentId: DecisionResult["agentId"]
  mode: AutonomyMode
  decision: DecisionResult
  permissions: AgentPermission[]
  idempotencyKey?: string
}): Promise<ActionResult> {
  const actionId = input.idempotencyKey?.trim() || `autonomy-${randomUUID()}`
  const existing = await getActionLogByActionId({
    tenantId: input.tenantId,
    actionId,
  })
  if (existing) {
    await insertAutonomyAuditRow({
      tenantId: input.tenantId,
      agentId: input.agentId,
      actionId,
      mode: existing.mode,
      status: "replayed",
      decision: { replay: true, priorStatus: existing.status },
      action: existing.payload,
      affectedEntities: [],
    })
    return toActionResult({
      actionId,
      mode: existing.mode,
      status: "replayed",
      replayed: true,
      detail: { replayOf: existing.actionType },
    })
  }

  if (input.agentId === "pricing-agent") {
    const gate = await assertPricingExecutionAllowed(input.tenantId)
    if (!gate.allowed) {
      await insertActionLog({
        tenantId: input.tenantId,
        actionId,
        agentId: input.agentId,
        actionType: "blocked_by_billing",
        mode: input.mode,
        payload: { blockReason: gate.blockReason, state: gate.state },
        reversePayload: {},
        status: "blocked",
        reversible: true,
      })
      await insertAutonomyAuditRow({
        tenantId: input.tenantId,
        agentId: input.agentId,
        actionId,
        mode: input.mode,
        status: "blocked",
        decision: input.decision as unknown as Record<string, unknown>,
        action: { blockReason: gate.blockReason },
        affectedEntities: [],
      })
      return toActionResult({
        actionId,
        mode: input.mode,
        status: "blocked",
        detail: {
          reason: gate.blockReason ?? "billing_blocked",
          billingState: gate.state,
        },
      })
    }
  }

  const affectedEntities: Array<Record<string, unknown>> = []
  const reversePayload: Record<string, unknown> = {}
  let actionType = "no_op"
  const payload: Record<string, unknown> = {
    decision: input.decision,
  }

  try {
    if (
      input.decision.routingOverride &&
      hasPermission(input.permissions, "routing_weights")
    ) {
      actionType = "routing_override"
      payload.routingOverride = input.decision.routingOverride
      if (input.mode === "active") {
        const created = await createRoutingOverride({
          tenantId: input.tenantId,
          category: input.decision.routingOverride.category,
          targetNodeKey: input.decision.routingOverride.targetNodeKey,
          weight: input.decision.routingOverride.weight,
          sourceActionId: actionId,
        })
        reversePayload.previousRoutingOverrideIds = created.previousOverrideIds
      }
      affectedEntities.push({
        type: "routing_override",
        category: input.decision.routingOverride.category,
        nodeKey: input.decision.routingOverride.targetNodeKey,
      })
    }

    if (input.decision.deliveryPath && hasPermission(input.permissions, "delivery_paths")) {
      actionType = actionType === "no_op" ? "delivery_override" : "compound_action"
      payload.deliveryPath = input.decision.deliveryPath
      if (input.mode === "active") {
        const created = await createDeliveryOverride({
          tenantId: input.tenantId,
          category: input.decision.deliveryPath.category,
          deliveryChannel: input.decision.deliveryPath.channel,
          config: input.decision.deliveryPath.config,
          sourceActionId: actionId,
        })
        reversePayload.previousDeliveryOverrideIds = created.previousOverrideIds
      }
      affectedEntities.push({
        type: "delivery_override",
        category: input.decision.deliveryPath.category,
        channel: input.decision.deliveryPath.channel,
      })
    }

    if (input.decision.funnelSelection && hasPermission(input.permissions, "funnel_variants")) {
      actionType = actionType === "no_op" ? "funnel_variant_selection" : "compound_action"
      payload.funnelSelection = input.decision.funnelSelection
      if (input.mode === "active") {
        const previousUsage = await getFunnelVariantUsageCount({
          tenantId: input.tenantId,
          category: input.decision.funnelSelection.category,
          variantName: input.decision.funnelSelection.variantName,
        })
        await incrementFunnelVariantUsage({
          tenantId: input.tenantId,
          category: input.decision.funnelSelection.category,
          variantName: input.decision.funnelSelection.variantName,
        })
        reversePayload.funnelUsageBefore = previousUsage
      }
      affectedEntities.push({
        type: "funnel_variant",
        category: input.decision.funnelSelection.category,
        variantName: input.decision.funnelSelection.variantName,
      })
    }

    if (input.decision.followUp && hasPermission(input.permissions, "follow_ups")) {
      actionType = actionType === "no_op" ? "follow_up_schedule" : "compound_action"
      payload.followUp = input.decision.followUp
      if (input.mode === "active") {
        const followUpId = await scheduleFollowUp({
          tenantId: input.tenantId,
          leadKey: input.decision.followUp.leadKey,
          followUpType: input.decision.followUp.followUpType,
          scheduledForIso: input.decision.followUp.scheduledForIso,
          payload: input.decision.followUp.payload,
          sourceActionId: actionId,
        })
        reversePayload.followUpId = followUpId
      }
      affectedEntities.push({
        type: "follow_up",
        leadKey: input.decision.followUp.leadKey,
        followUpType: input.decision.followUp.followUpType,
      })
    }

    const status: ActionResult["status"] =
      input.mode === "shadow" ? "simulated" : "applied"
    const rawDecisionId = input.decision.reasoningMetadata.decisionId
    const decisionId =
      typeof rawDecisionId === "number"
        ? rawDecisionId
        : typeof rawDecisionId === "string" && rawDecisionId.trim()
          ? Number(rawDecisionId)
          : null
    const actionRowId = await insertAgentActionRow({
      agentId: input.agentId,
      decisionId: Number.isFinite(decisionId ?? NaN) ? decisionId : null,
      action: payload,
      status,
      reversible: true,
    })
    await insertActionLog({
      tenantId: input.tenantId,
      actionId,
      agentId: input.agentId,
      actionType,
      mode: input.mode,
      payload,
      reversePayload,
      status,
      reversible: true,
    })
    await insertAutonomyAuditRow({
      tenantId: input.tenantId,
      agentId: input.agentId,
      actionId,
      mode: input.mode,
      status,
      decision: input.decision as unknown as Record<string, unknown>,
      action: payload,
      affectedEntities,
    })
    logger.info("autonomy.action.executed", {
      tenantId: input.tenantId,
      agentId: input.agentId,
      actionId,
      actionRowId,
      mode: input.mode,
      status,
      actionType,
    })
    return toActionResult({
      actionId,
      mode: input.mode,
      status,
      affectedEntities,
      detail: {
        actionType,
        confidenceScore: input.decision.confidenceScore,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await insertActionLog({
      tenantId: input.tenantId,
      actionId,
      agentId: input.agentId,
      actionType,
      mode: input.mode,
      payload,
      reversePayload,
      status: "failed",
      reversible: true,
    })
    await insertAutonomyAuditRow({
      tenantId: input.tenantId,
      agentId: input.agentId,
      actionId,
      mode: input.mode,
      status: "failed",
      decision: input.decision as unknown as Record<string, unknown>,
      action: { ...payload, error: message },
      affectedEntities,
    })
    logger.error("autonomy.action.failed", {
      tenantId: input.tenantId,
      agentId: input.agentId,
      actionId,
      error: message,
    })
    return toActionResult({
      actionId,
      mode: input.mode,
      status: "failed",
      affectedEntities,
      detail: { error: message },
    })
  }
}

export async function revertAutonomyAction(input: {
  tenantId: string
  actionId: string
}): Promise<{
  ok: boolean
  status: ActionResult["status"]
  detail: Record<string, unknown>
}> {
  const existing = await getActionLogByActionId({
    tenantId: input.tenantId,
    actionId: input.actionId,
  })
  if (!existing)
    return {
      ok: false,
      status: "failed",
      detail: { reason: "action_not_found" },
    }
  if (!existing.reversible)
    return {
      ok: false,
      status: "failed",
      detail: { reason: "action_not_reversible" },
    }
  if (existing.status === "reverted")
    return {
      ok: true,
      status: "reverted",
      detail: { replay: true },
    }
  try {
    if (existing.actionType === "routing_override" || existing.actionType === "compound_action") {
      const previousIds = Array.isArray(existing.reversePayload.previousRoutingOverrideIds)
        ? (existing.reversePayload.previousRoutingOverrideIds as number[])
        : []
      await revertRoutingOverride({
        sourceActionId: existing.actionId,
        previousOverrideIds: previousIds,
      })
    }
    if (existing.actionType === "delivery_override" || existing.actionType === "compound_action") {
      const previousIds = Array.isArray(existing.reversePayload.previousDeliveryOverrideIds)
        ? (existing.reversePayload.previousDeliveryOverrideIds as number[])
        : []
      await revertDeliveryOverride({
        sourceActionId: existing.actionId,
        previousOverrideIds: previousIds,
      })
    }
    if (existing.actionType === "follow_up_schedule" || existing.actionType === "compound_action") {
      await cancelFollowUpsByActionId(existing.actionId)
    }
    if (existing.actionType === "funnel_variant_selection" || existing.actionType === "compound_action") {
      const decision = existing.payload.decision as
        | { funnelSelection?: { category: string; variantName: string } }
        | undefined
      const funnel = decision?.funnelSelection
      if (
        funnel &&
        typeof existing.reversePayload.funnelUsageBefore === "number"
      ) {
        await restoreFunnelVariantUsageCount({
          tenantId: existing.tenantId,
          category: funnel.category,
          variantName: funnel.variantName,
          usageCount: existing.reversePayload.funnelUsageBefore as number,
        })
      }
    }
    await updateActionLogStatus({
      tenantId: input.tenantId,
      actionId: input.actionId,
      status: "reverted",
    })
    await insertAutonomyAuditRow({
      tenantId: existing.tenantId,
      agentId: existing.agentId,
      actionId: existing.actionId,
      mode: existing.mode,
      status: "reverted",
      decision: { reverted: true },
      action: existing.payload,
      affectedEntities: [],
    })
    return {
      ok: true,
      status: "reverted",
      detail: { reverted: true },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await updateActionLogStatus({
      tenantId: input.tenantId,
      actionId: input.actionId,
      status: "failed",
    })
    return {
      ok: false,
      status: "failed",
      detail: { error: message },
    }
  }
}

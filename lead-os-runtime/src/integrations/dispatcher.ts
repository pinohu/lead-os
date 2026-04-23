import { logger } from "@/lib/logger"
import type { AgentId } from "@/agents/types"
import { getIntegrationDefinition, type IntegrationName } from "./registry"
import { canAgentUse } from "./permissions"
import { callSuiteDash } from "./adapters/suitedash"
import { callWebhook } from "./adapters/webhook"
import { callEmail } from "./adapters/email"
import { callStripe } from "./adapters/stripe"

interface IntegrationCallInput {
  agent: AgentId
  integration: string
  action: string
  payload: Record<string, unknown>
}

interface IntegrationCallResult {
  ok: boolean
  status: number
  data: Record<string, unknown>
  blocked?: boolean
}

function toIntegrationName(value: string): IntegrationName | null {
  if (
    value === "suitedash" ||
    value === "webhook" ||
    value === "email" ||
    value === "stripe"
  )
    return value
  return null
}

function blockedResult(status: number, error: string): IntegrationCallResult {
  return {
    ok: false,
    status,
    blocked: true,
    data: { error },
  }
}

export async function callIntegration(
  input: IntegrationCallInput,
): Promise<IntegrationCallResult> {
  const integrationName = toIntegrationName(input.integration)
  if (!integrationName) {
    logger.warn("integration.dispatch.blocked", {
      reason: "unknown_integration",
      agent: input.agent,
      integration: input.integration,
      action: input.action,
    })
    return blockedResult(403, "unknown_integration")
  }
  const definition = getIntegrationDefinition(integrationName)
  if (!definition) {
    logger.warn("integration.dispatch.blocked", {
      reason: "unknown_integration",
      agent: input.agent,
      integration: integrationName,
      action: input.action,
    })
    return blockedResult(403, "unknown_integration")
  }
  if (!definition.allowedActions.includes(input.action)) {
    logger.warn("integration.dispatch.blocked", {
      reason: "action_not_allowed",
      agent: input.agent,
      integration: integrationName,
      action: input.action,
    })
    return blockedResult(403, "integration_action_not_allowed")
  }
  if (!canAgentUse(input.agent, integrationName, input.action)) {
    logger.warn("integration.dispatch.blocked", {
      reason: "permission_denied",
      agent: input.agent,
      integration: integrationName,
      action: input.action,
    })
    return blockedResult(403, "agent_permission_denied")
  }

  logger.info("integration.dispatch.request", {
    agent: input.agent,
    integration: integrationName,
    action: input.action,
    requiresAuth: Boolean(definition.requiresAuth),
  })

  let result: IntegrationCallResult
  if (integrationName === "suitedash") {
    result = await callSuiteDash({ action: input.action, payload: input.payload })
  } else if (integrationName === "webhook") {
    result = await callWebhook({ action: input.action, payload: input.payload })
  } else if (integrationName === "email") {
    result = await callEmail({ action: input.action, payload: input.payload })
  } else {
    result = await callStripe({ action: input.action, payload: input.payload })
  }

  logger.info("integration.dispatch.response", {
    agent: input.agent,
    integration: integrationName,
    action: input.action,
    ok: result.ok,
    status: result.status,
    blocked: Boolean(result.blocked),
  })
  return result
}

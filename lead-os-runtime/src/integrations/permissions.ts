import type { AgentId } from "@/agents/types"
import type { IntegrationName } from "./registry"

const AGENT_PERMISSION_MAP: Record<
  AgentId,
  Partial<Record<IntegrationName, string[]>>
> = {
  "routing-agent": {
    webhook: ["post"],
  },
  "pricing-agent": {},
  "messaging-agent": {
    email: ["send"],
  },
  "gtm-agent": {
    suitedash: ["create_contact", "send_lead"],
    webhook: ["post"],
  },
}

export function canAgentUse(
  agent: AgentId,
  integration: IntegrationName,
  action: string,
): boolean {
  const integrationActions = AGENT_PERMISSION_MAP[agent][integration]
  if (!integrationActions) return false
  return integrationActions.includes(action)
}

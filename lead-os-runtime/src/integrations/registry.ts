export type IntegrationName = "suitedash" | "webhook" | "email" | "stripe"

export type IntegrationType = "crm" | "delivery" | "communication" | "billing"

export interface IntegrationDefinition {
  type: IntegrationType
  allowedActions: string[]
  requiresAuth?: boolean
}

export const INTEGRATION_REGISTRY: Record<IntegrationName, IntegrationDefinition> = {
  suitedash: {
    type: "crm",
    allowedActions: ["create_contact", "send_lead"],
    requiresAuth: true,
  },
  webhook: {
    type: "delivery",
    allowedActions: ["post"],
    requiresAuth: false,
  },
  email: {
    type: "communication",
    allowedActions: ["send"],
    requiresAuth: true,
  },
  stripe: {
    type: "billing",
    allowedActions: [],
    requiresAuth: true,
  },
}

export function getIntegrationDefinition(
  integration: string,
): IntegrationDefinition | null {
  if (
    integration !== "suitedash" &&
    integration !== "webhook" &&
    integration !== "email" &&
    integration !== "stripe"
  )
    return null
  return INTEGRATION_REGISTRY[integration]
}

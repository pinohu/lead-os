export type DecisionType = "routing_override" | "default_routing"

export interface AgentContext {
  tenantId: string
  agentId: string
  lead: Record<string, unknown>
  routingResult: {
    channel?: string
    intentLevel?: string
    funnelType?: string
    scoreBoost?: number
  }
  deliveryResult?: unknown
}

export interface AgentDecision {
  decisionType: DecisionType
  selectedNode: string
  confidence: number
  reasoning: string
  context: AgentContext
  decisionId?: number
}

export interface AgentActionResult {
  actionId?: number
  status: "simulated" | "applied" | "failed"
  reversible: boolean
  action: Record<string, unknown>
}

export interface AgentLearningEvent {
  context: AgentContext
  decision: AgentDecision
  action: AgentActionResult
  outcome: {
    deliverySuccess: boolean
    routingSuccess: boolean
    failureCase?: string
  }
}

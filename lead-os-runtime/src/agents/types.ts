export type AutonomyMode = "shadow" | "active"

export type AgentId =
  | "routing-agent"
  | "pricing-agent"
  | "messaging-agent"
  | "gtm-agent"

export type AgentScope = "routing" | "pricing" | "messaging" | "gtm"

export type AgentPermission =
  | "routing_weights"
  | "delivery_paths"
  | "funnel_variants"
  | "follow_ups"

export interface DecisionContext {
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
}

export interface RoutingOverrideDecision {
  category: string
  targetNodeKey: string
  weight: number
}

export interface DeliveryPathDecision {
  category: string
  channel: string
  config: Record<string, unknown>
}

export interface FollowUpDecision {
  leadKey: string
  followUpType: string
  scheduledForIso: string
  payload: Record<string, unknown>
}

export interface DecisionResult {
  agentId: AgentId
  routingOverride?: RoutingOverrideDecision
  messagingVariation?: string
  funnelSelection?: {
    category: string
    variantName: string
  }
  deliveryPath?: DeliveryPathDecision
  followUp?: FollowUpDecision
  confidenceScore: number
  reasoningMetadata: Record<string, unknown>
}

export interface ActionResult {
  actionId: string
  mode: AutonomyMode
  status:
    | "simulated"
    | "applied"
    | "replayed"
    | "blocked"
    | "failed"
    | "reverted"
  reversible: boolean
  replayed: boolean
  affectedEntities: Array<Record<string, unknown>>
  detail: Record<string, unknown>
}

export interface LearningOutcome {
  leadKey: string
  nodeKey?: string
  category?: string
  funnelVariant?: string
  delivered?: boolean
  converted?: boolean
  engagementScore?: number
  failurePattern?: string
  metadata?: Record<string, unknown>
}

export interface LearningResult {
  rowsWritten: number
  nodeMetricRows: number
  funnelMetricRows: number
  summary: {
    deliverySuccessRate: number
    conversionRate: number
    engagementRate: number
    failurePattern: string
  }
}

export interface OptimizationResult {
  mode: AutonomyMode
  measuredAt: string
  recommendations: Array<{
    type: "routing" | "funnel" | "messaging"
    confidence: number
    detail: Record<string, unknown>
  }>
  recommendedDecision?: DecisionResult
}

export interface AutonomyExecutionResult {
  ok: boolean
  mode: AutonomyMode
  agentId: AgentId
  tenantId: string
  runId?: string
  reason?: string
  decision?: DecisionResult
  action?: ActionResult
  learning?: LearningResult
  optimization?: OptimizationResult
}

export type { AgentActionResult, AgentContext, AgentDecision, AgentLearningEvent } from "./agent-types"


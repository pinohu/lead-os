// src/agents/repository.ts
import { queryPostgres } from "@/lib/db"
import {
  isAgentKillSwitchEnabled as readAgentKillSwitch,
  isAutonomyEnabled as readAutonomyEnabled,
  resolveAutonomyMode as readAutonomyMode,
} from "@/lib/autonomy-config"
import type {
  AgentId,
  AgentPermission,
  AgentScope,
  AutonomyMode,
  DecisionResult,
  LearningOutcome,
  LearningResult,
  OptimizationResult,
} from "./types"

export interface AgentRegistration {
  tenantId: string
  agentId: AgentId
  scope: AgentScope
  permissions: AgentPermission[]
  enabled: boolean
}

export interface ActionLogRow {
  tenantId: string
  actionId: string
  agentId: AgentId
  actionType: string
  mode: AutonomyMode
  payload: Record<string, unknown>
  reversePayload: Record<string, unknown>
  status:
    | "simulated"
    | "applied"
    | "replayed"
    | "blocked"
    | "failed"
    | "reverted"
  reversible: boolean
}

const DEFAULT_AGENT_CONFIG: Record<
  AgentId,
  {
    scope: AgentScope
    permissions: AgentPermission[]
  }
> = {
  "routing-agent": {
    scope: "routing",
    permissions: ["routing_weights", "delivery_paths"],
  },
  "pricing-agent": {
    scope: "pricing",
    permissions: ["routing_weights"],
  },
  "messaging-agent": {
    scope: "messaging",
    permissions: ["funnel_variants", "follow_ups"],
  },
  "gtm-agent": {
    scope: "gtm",
    permissions: ["funnel_variants", "delivery_paths", "follow_ups"],
  },
}

function toJson(value: unknown): string {
  return JSON.stringify(value ?? {})
}

function parsePermissions(raw: unknown): AgentPermission[] {
  if (!Array.isArray(raw)) return []
  const allowed = new Set<AgentPermission>([
    "routing_weights",
    "delivery_paths",
    "funnel_variants",
    "follow_ups",
  ])
  return raw.filter((item): item is AgentPermission =>
    typeof item === "string" && allowed.has(item as AgentPermission),
  )
}

export function isAutonomyEnabled(): boolean {
  return readAutonomyEnabled()
}

export function isAgentKillSwitchEnabled(): boolean {
  return readAgentKillSwitch()
}

export function isPricingKillSwitchEnabled(): boolean {
  return process.env.PRICING_KILL_SWITCH === "true"
}

export function resolveAutonomyMode(
  modeOverride?: AutonomyMode,
): AutonomyMode {
  if (modeOverride) return modeOverride
  return readAutonomyMode()
}

export async function getOrCreateAgentRegistration(input: {
  tenantId: string
  agentId: AgentId
}): Promise<AgentRegistration> {
  const defaults = DEFAULT_AGENT_CONFIG[input.agentId]
  const existing = await queryPostgres<{
    tenant_id: string
    agent_id: AgentId
    scope: AgentScope
    permissions: unknown
    enabled: boolean
  }>(
    `SELECT tenant_id, agent_id, scope, permissions, enabled
       FROM autonomy_agent_registry
      WHERE tenant_id = $1 AND agent_id = $2
      LIMIT 1`,
    [input.tenantId, input.agentId],
  )
  const row = existing.rows[0]
  if (row) {
    return {
      tenantId: row.tenant_id,
      agentId: row.agent_id,
      scope: row.scope,
      permissions: parsePermissions(row.permissions),
      enabled: row.enabled,
    }
  }

  await queryPostgres(
    `INSERT INTO autonomy_agent_registry
      (tenant_id, agent_id, scope, permissions, enabled, updated_at)
     VALUES ($1, $2, $3, $4::jsonb, true, NOW())
     ON CONFLICT (tenant_id, agent_id) DO UPDATE
       SET scope = EXCLUDED.scope,
           permissions = EXCLUDED.permissions,
           updated_at = NOW()`,
    [input.tenantId, input.agentId, defaults.scope, toJson(defaults.permissions)],
  )
  return {
    tenantId: input.tenantId,
    agentId: input.agentId,
    scope: defaults.scope,
    permissions: defaults.permissions,
    enabled: true,
  }
}

export async function listAgentRegistrations(
  tenantId: string,
): Promise<AgentRegistration[]> {
  const rows = await queryPostgres<{
    tenant_id: string
    agent_id: AgentId
    scope: AgentScope
    permissions: unknown
    enabled: boolean
  }>(
    `SELECT tenant_id, agent_id, scope, permissions, enabled
       FROM autonomy_agent_registry
      WHERE tenant_id = $1
      ORDER BY agent_id ASC`,
    [tenantId],
  )
  return rows.rows.map((row) => ({
    tenantId: row.tenant_id,
    agentId: row.agent_id,
    scope: row.scope,
    permissions: parsePermissions(row.permissions),
    enabled: row.enabled,
  }))
}

export async function updateAgentEnabled(input: {
  tenantId: string
  agentId: AgentId
  enabled: boolean
}): Promise<void> {
  await queryPostgres(
    `UPDATE autonomy_agent_registry
        SET enabled = $3,
            updated_at = NOW()
      WHERE tenant_id = $1 AND agent_id = $2`,
    [input.tenantId, input.agentId, input.enabled],
  )
}

export async function insertExecutionRunStart(input: {
  tenantId: string
  agentId: AgentId
  mode: AutonomyMode
  decision: DecisionResult | null
  detail: Record<string, unknown>
}): Promise<string> {
  const result = await queryPostgres<{ id: string }>(
    `INSERT INTO autonomy_execution_runs
      (tenant_id, agent_id, mode, status, decision, detail)
     VALUES ($1, $2, $3, 'started', $4::jsonb, $5::jsonb)
     RETURNING id::text AS id`,
    [
      input.tenantId,
      input.agentId,
      input.mode,
      toJson(input.decision ?? {}),
      toJson(input.detail),
    ],
  )
  return result.rows[0]?.id ?? ""
}

export async function finishExecutionRun(input: {
  runId: string
  status: "completed" | "failed"
  actionResult?: unknown
  learningResult?: LearningResult
  optimizationResult?: unknown
  detail?: Record<string, unknown>
}): Promise<void> {
  await queryPostgres(
    `UPDATE autonomy_execution_runs
        SET status = $2,
            action_result = $3::jsonb,
            learning_result = $4::jsonb,
            detail = detail || $5::jsonb
      WHERE id = $1::bigint`,
    [
      input.runId,
      input.status,
      toJson(input.actionResult ?? {}),
      toJson(input.learningResult ?? {}),
      toJson({
        optimizationResult: input.optimizationResult ?? {},
        ...input.detail,
      }),
    ],
  )
}

export async function insertAutonomyAuditRow(input: {
  tenantId: string
  agentId: AgentId
  actionId?: string
  mode: AutonomyMode
  status:
    | "simulated"
    | "applied"
    | "replayed"
    | "blocked"
    | "failed"
    | "reverted"
  decision: Record<string, unknown>
  action: Record<string, unknown>
  affectedEntities: Array<Record<string, unknown>>
}): Promise<void> {
  await queryPostgres(
    `INSERT INTO autonomy_agent_audit_log
      (tenant_id, agent_id, action_id, mode, status, decision, action, affected_entities)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb)`,
    [
      input.tenantId,
      input.agentId,
      input.actionId ?? null,
      input.mode,
      input.status,
      toJson(input.decision),
      toJson(input.action),
      toJson(input.affectedEntities),
    ],
  )
}

export async function insertAgentDecisionRow(input: {
  agentId: string
  context: Record<string, unknown>
  decision: Record<string, unknown>
  confidence: number
  reasoning: string
}): Promise<number> {
  const result = await queryPostgres<{ id: number }>(
    `INSERT INTO agent_decisions (agent_id, context, decision, confidence, reasoning)
     VALUES ($1, $2::jsonb, $3::jsonb, $4, $5)
     RETURNING id`,
    [
      input.agentId,
      toJson(input.context),
      toJson(input.decision),
      input.confidence,
      input.reasoning,
    ],
  )
  return result.rows[0]?.id ?? 0
}

export async function insertAgentActionRow(input: {
  agentId: string
  decisionId?: number | null
  action: Record<string, unknown>
  status: string
  reversible: boolean
}): Promise<number> {
  const result = await queryPostgres<{ id: number }>(
    `INSERT INTO agent_actions (agent_id, decision_id, action, status, reversible)
     VALUES ($1, $2, $3::jsonb, $4, $5)
     RETURNING id`,
    [
      input.agentId,
      input.decisionId ?? null,
      toJson(input.action),
      input.status,
      input.reversible,
    ],
  )
  return result.rows[0]?.id ?? 0
}

export async function insertAgentLearningRow(input: {
  agentId: string
  learningInput: Record<string, unknown>
  outcome: Record<string, unknown>
}): Promise<number> {
  const result = await queryPostgres<{ id: number }>(
    `INSERT INTO agent_learning (agent_id, input, outcome)
     VALUES ($1, $2::jsonb, $3::jsonb)
     RETURNING id`,
    [input.agentId, toJson(input.learningInput), toJson(input.outcome)],
  )
  return result.rows[0]?.id ?? 0
}

export async function getActionLogByActionId(input: {
  tenantId: string
  actionId: string
}): Promise<ActionLogRow | null> {
  const result = await queryPostgres<{
    tenant_id: string
    action_id: string
    agent_id: AgentId
    action_type: string
    mode: AutonomyMode
    payload: Record<string, unknown>
    reverse_payload: Record<string, unknown>
    status: ActionLogRow["status"]
    reversible: boolean
  }>(
    `SELECT tenant_id, action_id, agent_id, action_type, mode, payload, reverse_payload, status, reversible
       FROM autonomy_action_log
      WHERE tenant_id = $1 AND action_id = $2
      LIMIT 1`,
    [input.tenantId, input.actionId],
  )
  const row = result.rows[0]
  if (!row) return null
  return {
    tenantId: row.tenant_id,
    actionId: row.action_id,
    agentId: row.agent_id,
    actionType: row.action_type,
    mode: row.mode,
    payload: row.payload,
    reversePayload: row.reverse_payload,
    status: row.status,
    reversible: row.reversible,
  }
}

export async function insertActionLog(input: ActionLogRow): Promise<void> {
  await queryPostgres(
    `INSERT INTO autonomy_action_log
      (tenant_id, action_id, agent_id, action_type, mode, payload, reverse_payload, status, reversible)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, $9)
     ON CONFLICT (tenant_id, action_id) DO NOTHING`,
    [
      input.tenantId,
      input.actionId,
      input.agentId,
      input.actionType,
      input.mode,
      toJson(input.payload),
      toJson(input.reversePayload),
      input.status,
      input.reversible,
    ],
  )
}

export async function updateActionLogStatus(input: {
  tenantId: string
  actionId: string
  status: ActionLogRow["status"]
}): Promise<void> {
  await queryPostgres(
    `UPDATE autonomy_action_log
        SET status = $3,
            updated_at = NOW()
      WHERE tenant_id = $1 AND action_id = $2`,
    [input.tenantId, input.actionId, input.status],
  )
}

export async function listActiveFunnelVariants(input: {
  tenantId: string
  category: string
}): Promise<
  Array<{
    variantName: string
    conversionRate: number
    usageCount: number
    selectionProbability: number
    isDefault: boolean
  }>
> {
  const result = await queryPostgres<{
    variant_name: string
    conversion_rate: string
    usage_count: number
    selection_probability: string
    is_default: boolean
  }>(
    `SELECT variant_name, conversion_rate::text, usage_count, selection_probability::text, is_default
       FROM funnel_variants
      WHERE tenant_id = $1 AND category = $2 AND active = true
      ORDER BY is_default DESC, conversion_rate DESC, variant_name ASC`,
    [input.tenantId, input.category],
  )
  return result.rows.map((row) => ({
    variantName: row.variant_name,
    conversionRate: Number(row.conversion_rate),
    usageCount: row.usage_count,
    selectionProbability: Number(row.selection_probability),
    isDefault: row.is_default,
  }))
}

export async function ensureDefaultFunnelVariant(input: {
  tenantId: string
  category: string
}): Promise<void> {
  await queryPostgres(
    `INSERT INTO funnel_variants
      (tenant_id, category, variant_name, conversion_rate, usage_count, selection_probability, is_default, active)
     VALUES ($1, $2, 'default', 0, 0, 1, true, true)
     ON CONFLICT (tenant_id, category, variant_name) DO UPDATE
       SET active = true,
           is_default = CASE
             WHEN funnel_variants.is_default = true THEN true
             ELSE EXCLUDED.is_default
           END,
           updated_at = NOW()`,
    [input.tenantId, input.category],
  )
}

export async function incrementFunnelVariantUsage(input: {
  tenantId: string
  category: string
  variantName: string
}): Promise<number> {
  const result = await queryPostgres<{ usage_count: number }>(
    `UPDATE funnel_variants
        SET usage_count = usage_count + 1,
            updated_at = NOW()
      WHERE tenant_id = $1 AND category = $2 AND variant_name = $3
      RETURNING usage_count`,
    [input.tenantId, input.category, input.variantName],
  )
  return result.rows[0]?.usage_count ?? 0
}

export async function getFunnelVariantUsageCount(input: {
  tenantId: string
  category: string
  variantName: string
}): Promise<number> {
  const result = await queryPostgres<{ usage_count: number }>(
    `SELECT usage_count
       FROM funnel_variants
      WHERE tenant_id = $1 AND category = $2 AND variant_name = $3
      LIMIT 1`,
    [input.tenantId, input.category, input.variantName],
  )
  return result.rows[0]?.usage_count ?? 0
}

export async function restoreFunnelVariantUsageCount(input: {
  tenantId: string
  category: string
  variantName: string
  usageCount: number
}): Promise<void> {
  await queryPostgres(
    `UPDATE funnel_variants
        SET usage_count = $4,
            updated_at = NOW()
      WHERE tenant_id = $1 AND category = $2 AND variant_name = $3`,
    [input.tenantId, input.category, input.variantName, input.usageCount],
  )
}

export async function createRoutingOverride(input: {
  tenantId: string
  category: string
  targetNodeKey: string
  weight: number
  sourceActionId: string
}): Promise<{ previousOverrideIds: number[] }> {
  const existing = await queryPostgres<{ id: number }>(
    `SELECT id
       FROM autonomy_routing_overrides
      WHERE tenant_id = $1 AND category = $2 AND active = true`,
    [input.tenantId, input.category],
  )
  const previousOverrideIds = existing.rows.map((row) => row.id)
  if (previousOverrideIds.length > 0) {
    await queryPostgres(
      `UPDATE autonomy_routing_overrides
          SET active = false,
              updated_at = NOW()
        WHERE id = ANY($1::bigint[])`,
      [previousOverrideIds],
    )
  }
  await queryPostgres(
    `INSERT INTO autonomy_routing_overrides
      (tenant_id, category, target_node_key, weight, source_action_id, active)
     VALUES ($1, $2, $3, $4, $5, true)`,
    [
      input.tenantId,
      input.category,
      input.targetNodeKey,
      input.weight,
      input.sourceActionId,
    ],
  )
  return { previousOverrideIds }
}

export async function revertRoutingOverride(input: {
  sourceActionId: string
  previousOverrideIds: number[]
}): Promise<void> {
  await queryPostgres(
    `UPDATE autonomy_routing_overrides
        SET active = false,
            updated_at = NOW()
      WHERE source_action_id = $1`,
    [input.sourceActionId],
  )
  if (input.previousOverrideIds.length > 0) {
    await queryPostgres(
      `UPDATE autonomy_routing_overrides
          SET active = true,
              updated_at = NOW()
        WHERE id = ANY($1::bigint[])`,
      [input.previousOverrideIds],
    )
  }
}

export async function createDeliveryOverride(input: {
  tenantId: string
  category: string
  deliveryChannel: string
  config: Record<string, unknown>
  sourceActionId: string
}): Promise<{ previousOverrideIds: number[] }> {
  const existing = await queryPostgres<{ id: number }>(
    `SELECT id
       FROM autonomy_delivery_overrides
      WHERE tenant_id = $1 AND category = $2 AND active = true`,
    [input.tenantId, input.category],
  )
  const previousOverrideIds = existing.rows.map((row) => row.id)
  if (previousOverrideIds.length > 0) {
    await queryPostgres(
      `UPDATE autonomy_delivery_overrides
          SET active = false,
              updated_at = NOW()
        WHERE id = ANY($1::bigint[])`,
      [previousOverrideIds],
    )
  }
  await queryPostgres(
    `INSERT INTO autonomy_delivery_overrides
      (tenant_id, category, delivery_channel, config, source_action_id, active)
     VALUES ($1, $2, $3, $4::jsonb, $5, true)`,
    [
      input.tenantId,
      input.category,
      input.deliveryChannel,
      toJson(input.config),
      input.sourceActionId,
    ],
  )
  return { previousOverrideIds }
}

export async function revertDeliveryOverride(input: {
  sourceActionId: string
  previousOverrideIds: number[]
}): Promise<void> {
  await queryPostgres(
    `UPDATE autonomy_delivery_overrides
        SET active = false,
            updated_at = NOW()
      WHERE source_action_id = $1`,
    [input.sourceActionId],
  )
  if (input.previousOverrideIds.length > 0) {
    await queryPostgres(
      `UPDATE autonomy_delivery_overrides
          SET active = true,
              updated_at = NOW()
        WHERE id = ANY($1::bigint[])`,
      [input.previousOverrideIds],
    )
  }
}

export async function scheduleFollowUp(input: {
  tenantId: string
  leadKey: string
  followUpType: string
  scheduledForIso: string
  payload: Record<string, unknown>
  sourceActionId: string
}): Promise<number> {
  const result = await queryPostgres<{ id: number }>(
    `INSERT INTO autonomy_follow_up_jobs
      (tenant_id, lead_key, follow_up_type, scheduled_for, payload, source_action_id, status)
     VALUES ($1, $2, $3, $4::timestamptz, $5::jsonb, $6, 'scheduled')
     RETURNING id`,
    [
      input.tenantId,
      input.leadKey,
      input.followUpType,
      input.scheduledForIso,
      toJson(input.payload),
      input.sourceActionId,
    ],
  )
  return result.rows[0]?.id ?? 0
}

export async function cancelFollowUpsByActionId(sourceActionId: string): Promise<void> {
  await queryPostgres(
    `UPDATE autonomy_follow_up_jobs
        SET status = 'cancelled',
            updated_at = NOW()
      WHERE source_action_id = $1
        AND status = 'scheduled'`,
    [sourceActionId],
  )
}

export async function appendLearningRows(input: {
  tenantId: string
  agentId: AgentId
  outcomes: LearningOutcome[]
  summary: LearningResult["summary"]
}): Promise<LearningResult> {
  let rowsWritten = 0
  let nodeMetricRows = 0
  let funnelMetricRows = 0

  for (const outcome of input.outcomes) {
    await queryPostgres(
      `INSERT INTO learning_state (tenant_id, agent_id, outcome)
       VALUES ($1, $2, $3::jsonb)`,
      [input.tenantId, input.agentId, toJson(outcome)],
    )
    rowsWritten += 1
  }

  const groupedNodeOutcomes = new Map<string, LearningOutcome[]>()
  for (const outcome of input.outcomes) {
    const nodeKey = outcome.nodeKey?.trim()
    if (!nodeKey) continue
    const group = groupedNodeOutcomes.get(nodeKey) ?? []
    group.push(outcome)
    groupedNodeOutcomes.set(nodeKey, group)
  }
  for (const [nodeKey, outcomes] of groupedNodeOutcomes.entries()) {
    const sampleSize = outcomes.length
    const deliveredCount = outcomes.filter((outcome) => outcome.delivered).length
    const convertedCount = outcomes.filter((outcome) => outcome.converted).length
    const engagementTotal = outcomes.reduce(
      (acc, outcome) => acc + Number(outcome.engagementScore ?? 0),
      0,
    )
    const failurePattern = outcomes.find((outcome) => outcome.failurePattern)
      ?.failurePattern
    await queryPostgres(
      `INSERT INTO node_performance_metrics
        (tenant_id, node_key, success_rate, conversion_rate, engagement_score, failure_pattern, sample_size, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`,
      [
        input.tenantId,
        nodeKey,
        sampleSize > 0 ? deliveredCount / sampleSize : 0,
        sampleSize > 0 ? convertedCount / sampleSize : 0,
        sampleSize > 0 ? engagementTotal / sampleSize : 0,
        failurePattern ?? null,
        sampleSize,
        toJson({ source: "learning-engine" }),
      ],
    )
    nodeMetricRows += 1
  }

  const groupedFunnelOutcomes = new Map<string, LearningOutcome[]>()
  for (const outcome of input.outcomes) {
    const category = outcome.category?.trim()
    const variant = outcome.funnelVariant?.trim()
    if (!category || !variant) continue
    const key = `${category}::${variant}`
    const group = groupedFunnelOutcomes.get(key) ?? []
    group.push(outcome)
    groupedFunnelOutcomes.set(key, group)
  }
  for (const [groupKey, outcomes] of groupedFunnelOutcomes.entries()) {
    const [category, variantName] = groupKey.split("::")
    const sampleSize = outcomes.length
    const convertedCount = outcomes.filter((outcome) => outcome.converted).length
    await queryPostgres(
      `INSERT INTO funnel_performance_metrics
        (tenant_id, category, variant_name, conversion_rate, usage_count, metadata)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
      [
        input.tenantId,
        category,
        variantName,
        sampleSize > 0 ? convertedCount / sampleSize : 0,
        sampleSize,
        toJson({ source: "learning-engine" }),
      ],
    )
    funnelMetricRows += 1
  }

  return {
    rowsWritten,
    nodeMetricRows,
    funnelMetricRows,
    summary: input.summary,
  }
}

export async function getRecentPerformanceHistory(input: {
  tenantId: string
  category?: string
}): Promise<{
  topNodeKey?: string
  deliverySuccessRate?: number
  conversionRate?: number
  engagementRate?: number
  failPattern?: string
}> {
  const nodeMetric = await queryPostgres<{
    node_key: string
    success_rate: string
    conversion_rate: string
    engagement_score: string
    failure_pattern: string | null
  }>(
    `SELECT node_key, success_rate::text, conversion_rate::text, engagement_score::text, failure_pattern
       FROM node_performance_metrics
      WHERE tenant_id = $1
      ORDER BY created_at DESC
      LIMIT 1`,
    [input.tenantId],
  )
  const row = nodeMetric.rows[0]
  return row
    ? {
        topNodeKey: row.node_key,
        deliverySuccessRate: Number(row.success_rate),
        conversionRate: Number(row.conversion_rate),
        engagementRate: Number(row.engagement_score),
        failPattern: row.failure_pattern ?? undefined,
      }
    : {}
}

export async function listActiveNodeKeys(input: {
  tenantId: string
}): Promise<string[]> {
  try {
    const result = await queryPostgres<{ node_key: string }>(
      `SELECT node_key
         FROM nodes
        WHERE tenant_id = $1
          AND status = 'active'
        ORDER BY node_key ASC`,
      [input.tenantId],
    )
    return result.rows.map((row) => row.node_key)
  } catch {
    return []
  }
}

export async function listLatestFunnelMetrics(input: {
  tenantId: string
  category: string
}): Promise<
  Array<{
    variantName: string
    conversionRate: number
    usageCount: number
  }>
> {
  const result = await queryPostgres<{
    variant_name: string
    conversion_rate: string
    usage_count: number
  }>(
    `SELECT variant_name, conversion_rate::text, usage_count
       FROM funnel_performance_metrics
      WHERE tenant_id = $1 AND category = $2
      ORDER BY created_at DESC
      LIMIT 10`,
    [input.tenantId, input.category],
  )
  return result.rows.map((row) => ({
    variantName: row.variant_name,
    conversionRate: Number(row.conversion_rate),
    usageCount: row.usage_count,
  }))
}

export async function getLatestAgentDecisionRows(input: {
  agentId: string
  limit?: number
}): Promise<Array<{ id: number; confidence: number; reasoning: string }>> {
  const result = await queryPostgres<{
    id: number
    confidence: number
    reasoning: string
  }>(
    `SELECT id, confidence, reasoning
       FROM agent_decisions
      WHERE agent_id = $1
      ORDER BY created_at DESC
      LIMIT $2`,
    [input.agentId, input.limit ?? 10],
  )
  return result.rows
}

export async function getLatestAgentActionRows(input: {
  agentId: string
  limit?: number
}): Promise<Array<{ id: number; status: string; reversible: boolean }>> {
  const result = await queryPostgres<{
    id: number
    status: string
    reversible: boolean
  }>(
    `SELECT id, status, reversible
       FROM agent_actions
      WHERE agent_id = $1
      ORDER BY created_at DESC
      LIMIT $2`,
    [input.agentId, input.limit ?? 10],
  )
  return result.rows
}

export async function getLatestAgentLearningRows(input: {
  agentId: string
  limit?: number
}): Promise<Array<{ id: number }>> {
  const result = await queryPostgres<{ id: number }>(
    `SELECT id
       FROM agent_learning
      WHERE agent_id = $1
      ORDER BY created_at DESC
      LIMIT $2`,
    [input.agentId, input.limit ?? 10],
  )
  return result.rows
}


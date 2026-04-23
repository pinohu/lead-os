import test from "node:test"
import assert from "node:assert/strict"
import { withEnv } from "./test-helpers.ts"
import { setupIntegrationEnvironment } from "./helpers/integration-db.ts"
import { queryPostgres } from "../src/lib/db.ts"
import {
  executeAutonomyCycle,
  revertAutonomyActionForTenant,
} from "../src/agents/execution-engine.ts"
import {
  getActionLogByActionId,
  getLatestAgentActionRows,
  getLatestAgentDecisionRows,
  getLatestAgentLearningRows,
  getFunnelVariantUsageCount,
  listAgentRegistrations,
  updateAgentEnabled,
} from "../src/agents/repository.ts"

function buildContext() {
  return {
    leadData: {
      category: "general",
      leadKey: "lead-autonomy-1",
    },
    tenantConfig: {
      tenantId: "default-tenant",
    },
    performanceHistory: {
      topNodeKey: "node-alpha",
      deliverySuccessRate: 0.72,
      conversionRate: 0.42,
      engagementRate: 0.58,
    },
    gtmState: {
      status: "live",
      activeUseCase: "erie-exclusive-niche",
    },
  }
}

test("autonomy stays disabled by default", async () => {
  const restoreDb = await setupIntegrationEnvironment({
    LEAD_OS_BILLING_ENFORCE: "false",
  })
  try {
    const result = await executeAutonomyCycle({
      tenantId: "default-tenant",
      agentId: "routing-agent",
      context: buildContext(),
      outcomes: [],
    })
    assert.equal(result.ok, false)
    assert.equal(result.reason, "autonomy_disabled")
  } finally {
    restoreDb()
  }
})

test("autonomy shadow mode logs simulated idempotent action", async () => {
  const restoreDb = await setupIntegrationEnvironment({
    LEAD_OS_BILLING_ENFORCE: "false",
  })
  const restoreEnv = withEnv({
    AUTONOMY_ENABLED: "true",
    AUTONOMY_MODE: "shadow",
    AGENT_KILL_SWITCH: "false",
    PRICING_KILL_SWITCH: "false",
  })
  try {
    const beforeRoutingOverrides = await queryPostgres<{ c: string }>(
      "SELECT COUNT(*)::text AS c FROM autonomy_routing_overrides WHERE tenant_id = $1",
      ["default-tenant"],
    )
    const first = await executeAutonomyCycle({
      tenantId: "default-tenant",
      agentId: "routing-agent",
      context: buildContext(),
      outcomes: [],
      idempotencyKey: "autonomy-shadow-idem-1",
    })
    assert.equal(first.ok, true)
    assert.equal(first.mode, "shadow")
    assert.equal(first.action?.status, "simulated")
    assert.ok(first.action?.actionId)

    const second = await executeAutonomyCycle({
      tenantId: "default-tenant",
      agentId: "routing-agent",
      context: buildContext(),
      outcomes: [],
      idempotencyKey: "autonomy-shadow-idem-1",
    })
    assert.equal(second.ok, true)
    assert.equal(second.action?.status, "replayed")
    assert.equal(second.action?.replayed, true)

    const afterRoutingOverrides = await queryPostgres<{ c: string }>(
      "SELECT COUNT(*)::text AS c FROM autonomy_routing_overrides WHERE tenant_id = $1",
      ["default-tenant"],
    )
    assert.equal(
      Number(afterRoutingOverrides.rows[0]?.c ?? "0"),
      Number(beforeRoutingOverrides.rows[0]?.c ?? "0"),
      "shadow mode must not create routing override mutations",
    )
  } finally {
    restoreEnv()
    restoreDb()
  }
})

test("autonomy active mode can be reverted", async () => {
  const restoreDb = await setupIntegrationEnvironment({
    LEAD_OS_BILLING_ENFORCE: "false",
  })
  const restoreEnv = withEnv({
    AUTONOMY_ENABLED: "true",
    AUTONOMY_MODE: "active",
    AGENT_KILL_SWITCH: "false",
  })
  try {
    const usageBefore = await getFunnelVariantUsageCount({
      tenantId: "default-tenant",
      category: "general",
      variantName: "default",
    })
    const execution = await executeAutonomyCycle({
      tenantId: "default-tenant",
      agentId: "messaging-agent",
      context: buildContext(),
      outcomes: [],
      idempotencyKey: "autonomy-active-revert-1",
    })
    assert.equal(execution.ok, true)
    assert.equal(execution.mode, "active")
    assert.equal(execution.action?.status, "applied")
    assert.ok(execution.action?.actionId)

    const usageAfterApply = await getFunnelVariantUsageCount({
      tenantId: "default-tenant",
      category: "general",
      variantName: execution.decision?.funnelSelection?.variantName ?? "default",
    })
    assert.ok(usageAfterApply >= usageBefore)

    const reverted = await revertAutonomyActionForTenant({
      tenantId: "default-tenant",
      actionId: execution.action?.actionId ?? "",
    })
    assert.equal(reverted.ok, true)
    assert.equal(reverted.status, "reverted")
  } finally {
    restoreEnv()
    restoreDb()
  }
})

test("pricing agent respects pricing kill switch", async () => {
  const restoreDb = await setupIntegrationEnvironment({
    LEAD_OS_BILLING_ENFORCE: "false",
  })
  const restoreEnv = withEnv({
    AUTONOMY_ENABLED: "true",
    AUTONOMY_MODE: "active",
    PRICING_KILL_SWITCH: "true",
  })
  try {
    const result = await executeAutonomyCycle({
      tenantId: "default-tenant",
      agentId: "pricing-agent",
      context: buildContext(),
      outcomes: [],
    })
    assert.equal(result.ok, false)
    assert.equal(result.reason, "pricing_kill_switch_enabled")
  } finally {
    restoreEnv()
    restoreDb()
  }
})

test("agent disable blocks execution and preserves deterministic core", async () => {
  const restoreDb = await setupIntegrationEnvironment({
    LEAD_OS_BILLING_ENFORCE: "false",
  })
  const restoreEnv = withEnv({
    AUTONOMY_ENABLED: "true",
    AUTONOMY_MODE: "active",
  })
  try {
    const regs = await listAgentRegistrations("default-tenant")
    if (regs.length === 0)
      await executeAutonomyCycle({
        tenantId: "default-tenant",
        agentId: "routing-agent",
        context: buildContext(),
        outcomes: [],
        idempotencyKey: "autonomy-register-agent-before-disable",
      })
    const refreshed = await listAgentRegistrations("default-tenant")
    assert.ok(refreshed.length > 0)
    await updateAgentEnabled({
      tenantId: "default-tenant",
      agentId: "routing-agent",
      enabled: false,
    })

    const result = await executeAutonomyCycle({
      tenantId: "default-tenant",
      agentId: "routing-agent",
      context: buildContext(),
      outcomes: [],
      idempotencyKey: "autonomy-disabled-agent-1",
    })
    assert.equal(result.ok, false)
    assert.equal(result.reason, "agent_disabled")

    await updateAgentEnabled({
      tenantId: "default-tenant",
      agentId: "routing-agent",
      enabled: true,
    })
  } finally {
    restoreEnv()
    restoreDb()
  }
})

test("billing inactive blocks autonomy actions", async () => {
  const restoreDb = await setupIntegrationEnvironment()
  const restoreEnv = withEnv({
    AUTONOMY_ENABLED: "true",
    AUTONOMY_MODE: "active",
    LEAD_OS_BILLING_ENFORCE: "true",
  })
  try {
    const { queryPostgres } = await import("../src/lib/db.ts")
    await queryPostgres(
      `INSERT INTO billing_subscriptions (tenant_id, plan_key, status, current_period_end, updated_at)
       VALUES ($1, 'enterprise', 'canceled', NOW(), NOW())
       ON CONFLICT (tenant_id) DO UPDATE SET
         status = EXCLUDED.status,
         updated_at = NOW()`,
      ["default-tenant"],
    )

    const result = await executeAutonomyCycle({
      tenantId: "default-tenant",
      agentId: "routing-agent",
      context: buildContext(),
      outcomes: [],
      idempotencyKey: "autonomy-billing-block-1",
    })
    assert.equal(result.ok, false)
    assert.equal(result.reason, "billing_inactive")

    const action = await getActionLogByActionId({
      tenantId: "default-tenant",
      actionId: "autonomy-billing-block-1",
    })
    assert.equal(action, null)
  } finally {
    restoreEnv()
    restoreDb()
  }
})

test("decisions, actions, and learning rows are persisted", async () => {
  const restoreDb = await setupIntegrationEnvironment({
    LEAD_OS_BILLING_ENFORCE: "false",
  })
  const restoreEnv = withEnv({
    AUTONOMY_ENABLED: "true",
    AUTONOMY_MODE: "active",
    AGENT_KILL_SWITCH: "false",
  })
  try {
    const result = await executeAutonomyCycle({
      tenantId: "default-tenant",
      agentId: "routing-agent",
      context: buildContext(),
      outcomes: [
        {
          leadKey: "lead-autonomy-rows",
          category: "general",
          delivered: true,
          converted: false,
          engagementScore: 0.6,
        },
      ],
      idempotencyKey: "autonomy-row-validation",
    })
    assert.equal(result.ok, true)

    const decisions = await getLatestAgentDecisionRows({ agentId: "routing-agent" })
    const actions = await getLatestAgentActionRows({ agentId: "routing-agent" })
    const learning = await getLatestAgentLearningRows({ agentId: "routing-agent" })

    assert.ok(decisions.length > 0, "decision row should exist")
    assert.ok(actions.length > 0, "action row should exist")
    assert.ok(learning.length > 0, "learning row should exist")
  } finally {
    restoreEnv()
    restoreDb()
  }
})

import test from "node:test"
import assert from "node:assert/strict"
import { withEnv } from "./test-helpers.ts"
import { setupIntegrationEnvironment } from "./helpers/integration-db.ts"
import { runAgents } from "../src/agents/agent-runner.ts"
import { queryPostgres } from "../src/lib/db.ts"

async function countRows(tableName: string): Promise<number> {
  const result = await queryPostgres<{ c: string }>(
    `SELECT COUNT(*)::text AS c FROM ${tableName}`,
  )
  return Number(result.rows[0]?.c ?? "0")
}

function buildRunnerContext() {
  return {
    tenantId: "default-tenant",
    agentId: "routing-agent",
    lead: {
      id: 321,
      email: "runner@example.com",
      category: "general",
    },
    routingResult: {
      channel: "direct",
      intentLevel: "medium",
      funnelType: "local",
      scoreBoost: 10,
    },
    deliveryResult: {
      provider: "internal-runtime",
      ok: true,
    },
  }
}

test("runAgents no-ops when autonomy is disabled", async () => {
  const restoreDb = await setupIntegrationEnvironment({ LEAD_OS_BILLING_ENFORCE: "false" })
  const restoreEnv = withEnv({
    AUTONOMY_ENABLED: "false",
    AGENT_KILL_SWITCH: "false",
  })
  try {
    const beforeDecisions = await countRows("agent_decisions")
    await runAgents(buildRunnerContext())
    const afterDecisions = await countRows("agent_decisions")
    assert.equal(afterDecisions, beforeDecisions)
  } finally {
    restoreEnv()
    restoreDb()
  }
})

test("runAgents records activity in shadow mode without overrides", async () => {
  const restoreDb = await setupIntegrationEnvironment({ LEAD_OS_BILLING_ENFORCE: "false" })
  const restoreEnv = withEnv({
    AUTONOMY_ENABLED: "true",
    AUTONOMY_MODE: "shadow",
    AGENT_KILL_SWITCH: "false",
  })
  try {
    const beforeRoutingOverrides = await countRows("autonomy_routing_overrides")
    await runAgents(buildRunnerContext())
    const decisionRows = await countRows("agent_decisions")
    const actionRows = await countRows("agent_actions")
    const learningRows = await countRows("agent_learning")
    const afterRoutingOverrides = await countRows("autonomy_routing_overrides")
    assert.ok(decisionRows > 0)
    assert.ok(actionRows > 0)
    assert.ok(learningRows > 0)
    assert.equal(afterRoutingOverrides, beforeRoutingOverrides)
  } finally {
    restoreEnv()
    restoreDb()
  }
})

test("runAgents failure does not throw to caller", async () => {
  const restoreDb = await setupIntegrationEnvironment({ LEAD_OS_BILLING_ENFORCE: "false" })
  const restoreEnv = withEnv({
    AUTONOMY_ENABLED: "true",
    AUTONOMY_MODE: "active",
    AGENT_KILL_SWITCH: "false",
  })
  try {
    let thrown: unknown = null
    try {
      await runAgents({
        ...buildRunnerContext(),
        tenantId: "",
      })
    } catch (error) {
      thrown = error
    }
    assert.equal(thrown, null)
  } finally {
    restoreEnv()
    restoreDb()
  }
})

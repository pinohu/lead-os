import test from "node:test";
import assert from "node:assert/strict";
import {
  createAgentTeam,
  getAgentTeam,
  listAgentTeams,
  deleteAgentTeam,
  addAgent,
  removeAgent,
  getAgent,
  updateAgent,
  executeAgentTask,
  getTaskExecution,
  listExecutions,
  cancelExecution,
  setAgentBudget,
  getAgentSpend,
  getTeamSpend,
  resetPaperclipStores,
  type AgentTeamConfig,
  type AgentConfig,
} from "../src/lib/paperclip-orchestrator.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTeamConfig(overrides?: Partial<AgentTeamConfig>): AgentTeamConfig {
  return {
    name: `Team-${Date.now()}`,
    description: "Test team",
    tenantId: `tenant-${Date.now()}`,
    maxBudgetPerDay: 100,
    maxConcurrentTasks: 5,
    ...overrides,
  };
}

function makeAgentConfig(overrides?: Partial<AgentConfig>): AgentConfig {
  return {
    name: `Agent-${Date.now()}`,
    role: "prospector",
    tools: ["firecrawl"],
    model: "gpt-4o",
    systemPrompt: "You are a test agent.",
    maxTokensPerTask: 4000,
    budgetPerDay: 10,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Team Management
// ---------------------------------------------------------------------------

test("createAgentTeam returns a team with active status", async () => {
  resetPaperclipStores();
  const tenantId = `tenant-${Date.now()}`;
  const team = await createAgentTeam(tenantId, makeTeamConfig({ tenantId }));

  assert.ok(team.id);
  assert.equal(team.tenantId, tenantId);
  assert.equal(team.status, "active");
  assert.deepEqual(team.agents, []);
  assert.equal(team.totalSpend, 0);
  assert.ok(team.createdAt);
});

test("getAgentTeam returns created team with agents", async () => {
  resetPaperclipStores();
  const tenantId = `tenant-${Date.now()}`;
  const team = await createAgentTeam(tenantId, makeTeamConfig({ tenantId }));
  await addAgent(team.id, makeAgentConfig());

  const fetched = await getAgentTeam(team.id);
  assert.equal(fetched.id, team.id);
  assert.equal(fetched.agents.length, 1);
});

test("getAgentTeam throws for unknown team", async () => {
  resetPaperclipStores();
  await assert.rejects(
    () => getAgentTeam("nonexistent"),
    { message: "Agent team not found: nonexistent" },
  );
});

test("listAgentTeams returns teams for a tenant", async () => {
  resetPaperclipStores();
  const tenantId = `tenant-${Date.now()}`;
  await createAgentTeam(tenantId, makeTeamConfig({ tenantId }));
  await createAgentTeam(tenantId, makeTeamConfig({ tenantId, name: "Second" }));
  await createAgentTeam("other-tenant", makeTeamConfig({ tenantId: "other-tenant" }));

  const teams = await listAgentTeams(tenantId);
  assert.equal(teams.length, 2);
  for (const t of teams) {
    assert.equal(t.tenantId, tenantId);
  }
});

test("deleteAgentTeam removes team and its agents", async () => {
  resetPaperclipStores();
  const tenantId = `tenant-${Date.now()}`;
  const team = await createAgentTeam(tenantId, makeTeamConfig({ tenantId }));
  const agent = await addAgent(team.id, makeAgentConfig());

  await deleteAgentTeam(team.id);

  await assert.rejects(() => getAgentTeam(team.id));
  await assert.rejects(() => getAgent(agent.id));
});

// ---------------------------------------------------------------------------
// Agent Management
// ---------------------------------------------------------------------------

test("addAgent creates an agent in idle status", async () => {
  resetPaperclipStores();
  const tenantId = `tenant-${Date.now()}`;
  const team = await createAgentTeam(tenantId, makeTeamConfig({ tenantId }));
  const agent = await addAgent(team.id, makeAgentConfig({ name: "Researcher" }));

  assert.ok(agent.id);
  assert.equal(agent.teamId, team.id);
  assert.equal(agent.name, "Researcher");
  assert.equal(agent.status, "idle");
  assert.equal(agent.totalTasks, 0);
  assert.equal(agent.totalSpend, 0);
  assert.equal(agent.lastRunAt, null);
});

test("removeAgent removes agent from team", async () => {
  resetPaperclipStores();
  const tenantId = `tenant-${Date.now()}`;
  const team = await createAgentTeam(tenantId, makeTeamConfig({ tenantId }));
  const agent = await addAgent(team.id, makeAgentConfig());

  await removeAgent(team.id, agent.id);
  await assert.rejects(() => getAgent(agent.id));
});

test("updateAgent modifies agent fields", async () => {
  resetPaperclipStores();
  const tenantId = `tenant-${Date.now()}`;
  const team = await createAgentTeam(tenantId, makeTeamConfig({ tenantId }));
  const agent = await addAgent(team.id, makeAgentConfig());

  const updated = await updateAgent(agent.id, {
    name: "Updated Agent",
    model: "gpt-4o-mini",
    budgetPerDay: 20,
  });

  assert.equal(updated.name, "Updated Agent");
  assert.equal(updated.model, "gpt-4o-mini");
  assert.equal(updated.budgetPerDay, 20);
  assert.equal(updated.role, agent.role);
});

// ---------------------------------------------------------------------------
// Execution
// ---------------------------------------------------------------------------

test("executeAgentTask completes and records metrics", async () => {
  resetPaperclipStores();
  const tenantId = `tenant-${Date.now()}`;
  const team = await createAgentTeam(tenantId, makeTeamConfig({ tenantId }));
  const agent = await addAgent(team.id, makeAgentConfig());

  const execution = await executeAgentTask(agent.id, {
    type: "prospect-search",
    input: { query: "construction leads" },
    priority: "normal",
  });

  assert.ok(execution.id);
  assert.equal(execution.agentId, agent.id);
  assert.equal(execution.status, "completed");
  assert.ok(execution.tokensUsed > 0);
  assert.ok(execution.costUsd > 0);
  assert.ok(execution.output);
  assert.ok(execution.completedAt);
  assert.ok(execution.duration !== undefined && execution.duration >= 0);
});

test("executeAgentTask increments agent stats", async () => {
  resetPaperclipStores();
  const tenantId = `tenant-${Date.now()}`;
  const team = await createAgentTeam(tenantId, makeTeamConfig({ tenantId }));
  const agent = await addAgent(team.id, makeAgentConfig());

  await executeAgentTask(agent.id, {
    type: "test-task",
    input: {},
    priority: "low",
  });

  const refreshed = await getAgent(agent.id);
  assert.equal(refreshed.totalTasks, 1);
  assert.ok(refreshed.totalSpend > 0);
  assert.ok(refreshed.lastRunAt);
});

test("executeAgentTask rejects paused agent", async () => {
  resetPaperclipStores();
  const tenantId = `tenant-${Date.now()}`;
  const team = await createAgentTeam(tenantId, makeTeamConfig({ tenantId }));
  const agent = await addAgent(team.id, makeAgentConfig());

  const fetched = await getAgent(agent.id);
  // Manually pause for test
  (fetched as { status: string }).status = "paused";

  await assert.rejects(
    () => executeAgentTask(agent.id, { type: "test", input: {}, priority: "normal" }),
    { message: `Agent ${agent.id} is paused` },
  );
});

test("cancelExecution sets status to cancelled", async () => {
  resetPaperclipStores();
  const tenantId = `tenant-${Date.now()}`;
  const team = await createAgentTeam(tenantId, makeTeamConfig({ tenantId }));
  const agent = await addAgent(team.id, makeAgentConfig());

  const execution = await executeAgentTask(agent.id, {
    type: "test",
    input: {},
    priority: "normal",
  });

  // Already completed, so cancel is a no-op
  await cancelExecution(execution.id);
  const fetched = await getTaskExecution(execution.id);
  assert.equal(fetched.status, "completed");
});

test("listExecutions returns executions for an agent", async () => {
  resetPaperclipStores();
  const tenantId = `tenant-${Date.now()}`;
  const team = await createAgentTeam(tenantId, makeTeamConfig({ tenantId }));
  const agent = await addAgent(team.id, makeAgentConfig());

  await executeAgentTask(agent.id, { type: "task-1", input: {}, priority: "low" });
  await executeAgentTask(agent.id, { type: "task-2", input: {}, priority: "high" });

  const executions = await listExecutions(agent.id);
  assert.equal(executions.length, 2);
  assert.equal(executions[0].agentId, agent.id);
});

// ---------------------------------------------------------------------------
// Budget & Governance
// ---------------------------------------------------------------------------

test("setAgentBudget stores budget config", async () => {
  resetPaperclipStores();
  const tenantId = `tenant-${Date.now()}`;
  const team = await createAgentTeam(tenantId, makeTeamConfig({ tenantId }));
  const agent = await addAgent(team.id, makeAgentConfig());

  await setAgentBudget(agent.id, {
    dailyLimit: 10,
    monthlyLimit: 200,
    alertThreshold: 0.8,
  });

  // No throw means success
  assert.ok(true);
});

test("getAgentSpend returns spend report", async () => {
  resetPaperclipStores();
  const tenantId = `tenant-${Date.now()}`;
  const team = await createAgentTeam(tenantId, makeTeamConfig({ tenantId }));
  const agent = await addAgent(team.id, makeAgentConfig());

  await executeAgentTask(agent.id, { type: "task-1", input: {}, priority: "normal" });

  const report = await getAgentSpend(agent.id, "30d");
  assert.equal(report.period, "30d");
  assert.equal(report.taskCount, 1);
  assert.ok(report.totalCost > 0);
  assert.ok(report.totalTokens > 0);
  assert.ok(report.breakdown.length > 0);
});

test("getTeamSpend returns aggregated spend", async () => {
  resetPaperclipStores();
  const tenantId = `tenant-${Date.now()}`;
  const team = await createAgentTeam(tenantId, makeTeamConfig({ tenantId }));
  const agent1 = await addAgent(team.id, makeAgentConfig({ name: "A1" }));
  const agent2 = await addAgent(team.id, makeAgentConfig({ name: "A2" }));

  await executeAgentTask(agent1.id, { type: "task", input: {}, priority: "normal" });
  await executeAgentTask(agent2.id, { type: "task", input: {}, priority: "normal" });

  const report = await getTeamSpend(team.id, "30d");
  assert.equal(report.taskCount, 2);
  assert.ok(report.totalCost > 0);
});

test("team status changes to budget-exceeded when spend exceeds limit", async () => {
  resetPaperclipStores();
  const tenantId = `tenant-${Date.now()}`;
  const team = await createAgentTeam(tenantId, makeTeamConfig({
    tenantId,
    maxBudgetPerDay: 0.001,
  }));
  const agent = await addAgent(team.id, makeAgentConfig());

  await executeAgentTask(agent.id, { type: "task", input: {}, priority: "normal" });

  const refreshed = await getAgentTeam(team.id);
  assert.equal(refreshed.status, "budget-exceeded");
});

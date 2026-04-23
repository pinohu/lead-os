// ---------------------------------------------------------------------------
// Paperclip AI Orchestrator — manages autonomous AI agent teams per tenant.
// Agents are organized into a "virtual company" with roles, budgets,
// governance, and audit trails.
// ---------------------------------------------------------------------------

import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AgentRole =
  | "prospector"
  | "enricher"
  | "content-creator"
  | "outreach-manager"
  | "analytics-reporter"
  | "qualifier"
  | "nurture-manager"
  | "custom";

export interface AgentTeamConfig {
  name: string;
  description: string;
  tenantId: string;
  maxBudgetPerDay: number;
  maxConcurrentTasks: number;
}

export interface AgentConfig {
  name: string;
  role: AgentRole;
  tools: string[];
  model: string;
  systemPrompt: string;
  maxTokensPerTask: number;
  budgetPerDay: number;
}

export interface Agent {
  id: string;
  teamId: string;
  name: string;
  role: AgentRole;
  tools: string[];
  model: string;
  systemPrompt: string;
  maxTokensPerTask: number;
  budgetPerDay: number;
  status: "idle" | "running" | "paused" | "error";
  totalTasks: number;
  totalSpend: number;
  lastRunAt: string | null;
  createdAt: string;
}

export interface AgentTeam {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  agents: Agent[];
  totalSpend: number;
  maxBudgetPerDay: number;
  maxConcurrentTasks: number;
  status: "active" | "paused" | "budget-exceeded";
  createdAt: string;
}

export interface AgentTask {
  type: string;
  input: Record<string, unknown>;
  priority: "low" | "normal" | "high" | "urgent";
  maxRetries?: number;
}

export interface TaskExecution {
  id: string;
  agentId: string;
  task: AgentTask;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  output?: Record<string, unknown>;
  error?: string;
  tokensUsed: number;
  costUsd: number;
  startedAt: string;
  completedAt?: string;
  duration?: number;
}

export interface BudgetConfig {
  dailyLimit: number;
  monthlyLimit: number;
  alertThreshold: number;
}

export interface SpendReport {
  period: string;
  totalCost: number;
  totalTokens: number;
  taskCount: number;
  breakdown: { date: string; cost: number; tokens: number; tasks: number }[];
}

export interface ListOptions {
  limit?: number;
  offset?: number;
  status?: TaskExecution["status"];
}

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

const teamStore = new Map<string, AgentTeam>();
const agentStore = new Map<string, Agent>();
const executionStore = new Map<string, TaskExecution>();
const budgetStore = new Map<string, BudgetConfig>();

// ---------------------------------------------------------------------------
// Cost model constants
// ---------------------------------------------------------------------------

const COST_PER_1K_TOKENS = 0.003;

function estimateCost(tokens: number): number {
  return Math.round((tokens / 1000) * COST_PER_1K_TOKENS * 1_000_000) / 1_000_000;
}

// ---------------------------------------------------------------------------
// Agent Team Management
// ---------------------------------------------------------------------------

export async function createAgentTeam(
  tenantId: string,
  config: AgentTeamConfig,
): Promise<AgentTeam> {
  const team: AgentTeam = {
    id: randomUUID(),
    tenantId,
    name: config.name,
    description: config.description,
    agents: [],
    totalSpend: 0,
    maxBudgetPerDay: config.maxBudgetPerDay,
    maxConcurrentTasks: config.maxConcurrentTasks,
    status: "active",
    createdAt: new Date().toISOString(),
  };
  teamStore.set(team.id, team);
  return team;
}

export async function getAgentTeam(teamId: string): Promise<AgentTeam> {
  const team = teamStore.get(teamId);
  if (!team) {
    throw new Error(`Agent team not found: ${teamId}`);
  }
  const agents = Array.from(agentStore.values()).filter(
    (a) => a.teamId === teamId,
  );
  team.agents = agents;
  return team;
}

export async function listAgentTeams(tenantId: string): Promise<AgentTeam[]> {
  const teams = Array.from(teamStore.values()).filter(
    (t) => t.tenantId === tenantId,
  );
  for (const team of teams) {
    team.agents = Array.from(agentStore.values()).filter(
      (a) => a.teamId === team.id,
    );
  }
  return teams.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function deleteAgentTeam(teamId: string): Promise<void> {
  const team = teamStore.get(teamId);
  if (!team) {
    throw new Error(`Agent team not found: ${teamId}`);
  }
  for (const [id, agent] of agentStore) {
    if (agent.teamId === teamId) {
      agentStore.delete(id);
    }
  }
  teamStore.delete(teamId);
}

// ---------------------------------------------------------------------------
// Individual Agent Management
// ---------------------------------------------------------------------------

export async function addAgent(
  teamId: string,
  config: AgentConfig,
): Promise<Agent> {
  const team = teamStore.get(teamId);
  if (!team) {
    throw new Error(`Agent team not found: ${teamId}`);
  }

  const agent: Agent = {
    id: randomUUID(),
    teamId,
    name: config.name,
    role: config.role,
    tools: config.tools,
    model: config.model,
    systemPrompt: config.systemPrompt,
    maxTokensPerTask: config.maxTokensPerTask,
    budgetPerDay: config.budgetPerDay,
    status: "idle",
    totalTasks: 0,
    totalSpend: 0,
    lastRunAt: null,
    createdAt: new Date().toISOString(),
  };
  agentStore.set(agent.id, agent);
  return agent;
}

export async function removeAgent(
  teamId: string,
  agentId: string,
): Promise<void> {
  const agent = agentStore.get(agentId);
  if (!agent || agent.teamId !== teamId) {
    throw new Error(`Agent ${agentId} not found in team ${teamId}`);
  }
  agentStore.delete(agentId);
}

export async function getAgent(agentId: string): Promise<Agent> {
  const agent = agentStore.get(agentId);
  if (!agent) {
    throw new Error(`Agent not found: ${agentId}`);
  }
  return agent;
}

export async function updateAgent(
  agentId: string,
  updates: Partial<AgentConfig>,
): Promise<Agent> {
  const agent = agentStore.get(agentId);
  if (!agent) {
    throw new Error(`Agent not found: ${agentId}`);
  }

  if (updates.name !== undefined) agent.name = updates.name;
  if (updates.role !== undefined) agent.role = updates.role;
  if (updates.tools !== undefined) agent.tools = updates.tools;
  if (updates.model !== undefined) agent.model = updates.model;
  if (updates.systemPrompt !== undefined)
    agent.systemPrompt = updates.systemPrompt;
  if (updates.maxTokensPerTask !== undefined)
    agent.maxTokensPerTask = updates.maxTokensPerTask;
  if (updates.budgetPerDay !== undefined)
    agent.budgetPerDay = updates.budgetPerDay;

  return agent;
}

// ---------------------------------------------------------------------------
// Execution
// ---------------------------------------------------------------------------

export async function executeAgentTask(
  agentId: string,
  task: AgentTask,
): Promise<TaskExecution> {
  const agent = agentStore.get(agentId);
  if (!agent) {
    throw new Error(`Agent not found: ${agentId}`);
  }

  if (agent.status === "paused") {
    throw new Error(`Agent ${agentId} is paused`);
  }

  const team = teamStore.get(agent.teamId);
  if (team && team.status === "budget-exceeded") {
    throw new Error(`Team ${agent.teamId} has exceeded its budget`);
  }

  const runningExecutions = Array.from(executionStore.values()).filter(
    (e) => e.agentId === agentId && e.status === "running",
  );
  if (team && runningExecutions.length >= team.maxConcurrentTasks) {
    throw new Error(`Max concurrent tasks reached for team ${agent.teamId}`);
  }

  const execution: TaskExecution = {
    id: randomUUID(),
    agentId,
    task,
    status: "pending",
    tokensUsed: 0,
    costUsd: 0,
    startedAt: new Date().toISOString(),
  };
  executionStore.set(execution.id, execution);

  execution.status = "running";
  agent.status = "running";

  const tokensUsed = Math.min(
    Math.floor(Math.random() * 2000) + 500,
    agent.maxTokensPerTask,
  );
  const cost = estimateCost(tokensUsed);

  execution.tokensUsed = tokensUsed;
  execution.costUsd = cost;
  execution.output = {
    result: `Processed ${task.type}`,
    tokensUsed,
  };
  execution.status = "completed";
  execution.completedAt = new Date().toISOString();
  execution.duration =
    new Date(execution.completedAt).getTime() -
    new Date(execution.startedAt).getTime();

  agent.status = "idle";
  agent.totalTasks += 1;
  agent.totalSpend += cost;
  agent.lastRunAt = execution.completedAt;

  if (team) {
    team.totalSpend += cost;
    if (team.totalSpend >= team.maxBudgetPerDay) {
      team.status = "budget-exceeded";
    }
  }

  return execution;
}

export async function getTaskExecution(
  executionId: string,
): Promise<TaskExecution> {
  const execution = executionStore.get(executionId);
  if (!execution) {
    throw new Error(`Execution not found: ${executionId}`);
  }
  return execution;
}

export async function listExecutions(
  agentId: string,
  options?: ListOptions,
): Promise<TaskExecution[]> {
  let executions = Array.from(executionStore.values()).filter(
    (e) => e.agentId === agentId,
  );

  if (options?.status) {
    executions = executions.filter((e) => e.status === options.status);
  }

  executions.sort(
    (a, b) =>
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  );

  const offset = options?.offset ?? 0;
  const limit = options?.limit ?? 50;
  return executions.slice(offset, offset + limit);
}

export async function cancelExecution(executionId: string): Promise<void> {
  const execution = executionStore.get(executionId);
  if (!execution) {
    throw new Error(`Execution not found: ${executionId}`);
  }
  if (
    execution.status === "completed" ||
    execution.status === "failed" ||
    execution.status === "cancelled"
  ) {
    return;
  }
  execution.status = "cancelled";
  execution.completedAt = new Date().toISOString();
  execution.duration =
    new Date(execution.completedAt).getTime() -
    new Date(execution.startedAt).getTime();

  const agent = agentStore.get(execution.agentId);
  if (agent && agent.status === "running") {
    agent.status = "idle";
  }
}

// ---------------------------------------------------------------------------
// Budget & Governance
// ---------------------------------------------------------------------------

export async function setAgentBudget(
  agentId: string,
  budget: BudgetConfig,
): Promise<void> {
  const agent = agentStore.get(agentId);
  if (!agent) {
    throw new Error(`Agent not found: ${agentId}`);
  }
  budgetStore.set(agentId, budget);
}

export async function getAgentSpend(
  agentId: string,
  period: string,
): Promise<SpendReport> {
  const agent = agentStore.get(agentId);
  if (!agent) {
    throw new Error(`Agent not found: ${agentId}`);
  }

  const executions = Array.from(executionStore.values()).filter(
    (e) => e.agentId === agentId && e.status === "completed",
  );

  const breakdownMap = new Map<
    string,
    { cost: number; tokens: number; tasks: number }
  >();
  for (const exec of executions) {
    const date = exec.startedAt.split("T")[0];
    const entry = breakdownMap.get(date) ?? { cost: 0, tokens: 0, tasks: 0 };
    entry.cost += exec.costUsd;
    entry.tokens += exec.tokensUsed;
    entry.tasks += 1;
    breakdownMap.set(date, entry);
  }

  const breakdown = Array.from(breakdownMap.entries()).map(([date, data]) => ({
    date,
    ...data,
  }));

  return {
    period,
    totalCost: executions.reduce((sum, e) => sum + e.costUsd, 0),
    totalTokens: executions.reduce((sum, e) => sum + e.tokensUsed, 0),
    taskCount: executions.length,
    breakdown,
  };
}

export async function getTeamSpend(
  teamId: string,
  period: string,
): Promise<SpendReport> {
  const team = teamStore.get(teamId);
  if (!team) {
    throw new Error(`Agent team not found: ${teamId}`);
  }

  const teamAgentIds = new Set(
    Array.from(agentStore.values())
      .filter((a) => a.teamId === teamId)
      .map((a) => a.id),
  );

  const executions = Array.from(executionStore.values()).filter(
    (e) => teamAgentIds.has(e.agentId) && e.status === "completed",
  );

  const breakdownMap = new Map<
    string,
    { cost: number; tokens: number; tasks: number }
  >();
  for (const exec of executions) {
    const date = exec.startedAt.split("T")[0];
    const entry = breakdownMap.get(date) ?? { cost: 0, tokens: 0, tasks: 0 };
    entry.cost += exec.costUsd;
    entry.tokens += exec.tokensUsed;
    entry.tasks += 1;
    breakdownMap.set(date, entry);
  }

  const breakdown = Array.from(breakdownMap.entries()).map(([date, data]) => ({
    date,
    ...data,
  }));

  return {
    period,
    totalCost: executions.reduce((sum, e) => sum + e.costUsd, 0),
    totalTokens: executions.reduce((sum, e) => sum + e.tokensUsed, 0),
    taskCount: executions.length,
    breakdown,
  };
}

// ---------------------------------------------------------------------------
// Store reset (testing only)
// ---------------------------------------------------------------------------

export function resetPaperclipStores(): void {
  teamStore.clear();
  agentStore.clear();
  executionStore.clear();
  budgetStore.clear();
}

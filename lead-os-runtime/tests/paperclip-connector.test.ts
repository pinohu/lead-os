import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  createCompany,
  getCompany,
  listCompanies,
  deleteCompany,
  addAgentToCompany,
  listAgents,
  getAgent,
  updateAgent,
  removeAgent,
  assignTask,
  getTaskStatus,
  listTasks,
  setBudget,
  getBudgetStatus,
  getLeadOSAgentConfigs,
  resetPaperclipStore,
} from "../src/lib/integrations/paperclip-connector.ts";

beforeEach(() => {
  resetPaperclipStore();
});

// ---------------------------------------------------------------------------
// Company management
// ---------------------------------------------------------------------------

test("createCompany returns a company with generated id", async () => {
  const company = await createCompany("tenant-pc-1", {
    name: "Acme Leads Inc",
    description: "Lead generation company",
  });

  assert.ok(company.id.startsWith("pco-"));
  assert.equal(company.tenantId, "tenant-pc-1");
  assert.equal(company.name, "Acme Leads Inc");
  assert.equal(company.description, "Lead generation company");
  assert.deepEqual(company.agents, []);
  assert.ok(company.createdAt.length > 0);
});

test("getCompany returns stored company", async () => {
  const created = await createCompany("tenant-pc-2", {
    name: "Beta Corp",
    description: "Testing",
  });

  const fetched = await getCompany(created.id);
  assert.equal(fetched.id, created.id);
  assert.equal(fetched.name, "Beta Corp");
});

test("getCompany throws for unknown company", async () => {
  await assert.rejects(
    () => getCompany("nonexistent-company"),
    { message: "Company not found: nonexistent-company" },
  );
});

test("listCompanies returns all created companies", async () => {
  await createCompany("tenant-pc-3a", { name: "Company A", description: "A" });
  await createCompany("tenant-pc-3b", { name: "Company B", description: "B" });

  const companies = await listCompanies();
  assert.equal(companies.length, 2);
});

test("deleteCompany removes company and its agents", async () => {
  const company = await createCompany("tenant-pc-4", {
    name: "Delete Me",
    description: "To be deleted",
  });

  await addAgentToCompany(company.id, {
    name: "Agent X",
    role: "test",
    type: "claude",
    tools: [],
    systemPrompt: "Test prompt",
  });

  await deleteCompany(company.id);
  const remaining = await listCompanies();
  assert.equal(remaining.length, 0);
});

// ---------------------------------------------------------------------------
// Agent management
// ---------------------------------------------------------------------------

test("addAgentToCompany creates an agent attached to company", async () => {
  const company = await createCompany("tenant-pc-5", {
    name: "Agent Test Co",
    description: "Testing agents",
  });

  const agent = await addAgentToCompany(company.id, {
    name: "Lead Researcher",
    role: "research",
    type: "claude",
    tools: ["firecrawl-mcp-search"],
    systemPrompt: "You are a lead researcher.",
  });

  assert.ok(agent.id.startsWith("pag-"));
  assert.equal(agent.companyId, company.id);
  assert.equal(agent.name, "Lead Researcher");
  assert.equal(agent.status, "idle");
  assert.equal(agent.tasksCompleted, 0);

  const updatedCompany = await getCompany(company.id);
  assert.equal(updatedCompany.agents.length, 1);
});

test("listAgents returns agents for the given company", async () => {
  const company = await createCompany("tenant-pc-6", {
    name: "Multi Agent Co",
    description: "Testing",
  });

  await addAgentToCompany(company.id, {
    name: "Agent Alpha",
    role: "alpha",
    type: "claude",
    tools: [],
    systemPrompt: "Alpha",
  });

  await addAgentToCompany(company.id, {
    name: "Agent Beta",
    role: "beta",
    type: "openai",
    tools: [],
    systemPrompt: "Beta",
  });

  const agents = await listAgents(company.id);
  assert.equal(agents.length, 2);
});

test("updateAgent modifies agent properties", async () => {
  const company = await createCompany("tenant-pc-7", {
    name: "Update Agent Co",
    description: "Testing",
  });

  const agent = await addAgentToCompany(company.id, {
    name: "Original Name",
    role: "original",
    type: "claude",
    tools: ["tool-a"],
    systemPrompt: "Original prompt",
  });

  const updated = await updateAgent(agent.id, {
    name: "Updated Name",
    tools: ["tool-a", "tool-b"],
  });

  assert.equal(updated.name, "Updated Name");
  assert.deepEqual(updated.tools, ["tool-a", "tool-b"]);
  assert.equal(updated.role, "original");
});

test("removeAgent deletes agent and removes from company", async () => {
  const company = await createCompany("tenant-pc-8", {
    name: "Remove Agent Co",
    description: "Testing",
  });

  const agent = await addAgentToCompany(company.id, {
    name: "Temporary Agent",
    role: "temp",
    type: "shell",
    tools: [],
    systemPrompt: "Temp",
  });

  await removeAgent(agent.id);

  const agents = await listAgents(company.id);
  assert.equal(agents.length, 0);

  await assert.rejects(
    () => getAgent(agent.id),
    { message: `Agent not found: ${agent.id}` },
  );
});

// ---------------------------------------------------------------------------
// Task execution
// ---------------------------------------------------------------------------

test("assignTask creates and completes a task in dry-run", async () => {
  const company = await createCompany("tenant-pc-9", {
    name: "Task Test Co",
    description: "Testing",
  });

  const agent = await addAgentToCompany(company.id, {
    name: "Worker Agent",
    role: "worker",
    type: "claude",
    tools: [],
    systemPrompt: "Work",
  });

  const result = await assignTask(agent.id, {
    description: "Research plumbing companies in Austin",
    priority: "high",
  });

  assert.ok(result.id.startsWith("ptask-"));
  assert.equal(result.agentId, agent.id);
  assert.equal(result.status, "completed");
  assert.ok(result.output?.includes("dry-run") || result.output?.includes("Dry-run"));
  assert.ok(result.artifacts && result.artifacts.length > 0);
  assert.ok(result.cost > 0);
  assert.ok(result.tokensUsed > 0);
  assert.ok(result.completedAt);

  const updatedAgent = await getAgent(agent.id);
  assert.equal(updatedAgent.tasksCompleted, 1);
  assert.ok(updatedAgent.totalCost > 0);
});

test("getTaskStatus returns stored task result", async () => {
  const company = await createCompany("tenant-pc-10", {
    name: "Task Status Co",
    description: "Testing",
  });

  const agent = await addAgentToCompany(company.id, {
    name: "Status Agent",
    role: "status",
    type: "claude",
    tools: [],
    systemPrompt: "Status",
  });

  const task = await assignTask(agent.id, {
    description: "Check status test",
  });

  const status = await getTaskStatus(task.id);
  assert.equal(status.id, task.id);
  assert.equal(status.status, "completed");
});

test("listTasks returns tasks for the company agents", async () => {
  const company = await createCompany("tenant-pc-11", {
    name: "List Tasks Co",
    description: "Testing",
  });

  const agent = await addAgentToCompany(company.id, {
    name: "List Agent",
    role: "lister",
    type: "claude",
    tools: [],
    systemPrompt: "List",
  });

  await assignTask(agent.id, { description: "Task 1" });
  await assignTask(agent.id, { description: "Task 2" });

  const tasks = await listTasks(company.id);
  assert.equal(tasks.length, 2);
});

// ---------------------------------------------------------------------------
// Budget control
// ---------------------------------------------------------------------------

test("setBudget and getBudgetStatus track spending", async () => {
  const company = await createCompany("tenant-pc-12", {
    name: "Budget Test Co",
    description: "Testing",
  });

  await setBudget(company.id, {
    dailyLimit: 10,
    monthlyLimit: 200,
    perTaskLimit: 1,
    alertEmail: "admin@test.com",
  });

  const agent = await addAgentToCompany(company.id, {
    name: "Budget Agent",
    role: "budget",
    type: "claude",
    tools: [],
    systemPrompt: "Budget",
  });

  await assignTask(agent.id, { description: "Spend some budget" });

  const status = await getBudgetStatus(company.id);
  assert.equal(status.dailyLimit, 10);
  assert.equal(status.monthlyLimit, 200);
  assert.ok(status.dailySpent > 0);
  assert.ok(status.monthlySpent > 0);
  assert.equal(typeof status.isOverBudget, "boolean");
  assert.equal(typeof status.projectedMonthlySpend, "number");
});

// ---------------------------------------------------------------------------
// Pre-built Lead OS agent configs
// ---------------------------------------------------------------------------

test("getLeadOSAgentConfigs returns 6 agents configured for niche", () => {
  const configs = getLeadOSAgentConfigs("plumbing");

  assert.equal(configs.length, 6);

  const names = configs.map((c) => c.name);
  assert.ok(names.includes("Lead Researcher"));
  assert.ok(names.includes("Data Enricher"));
  assert.ok(names.includes("Content Creator"));
  assert.ok(names.includes("Outreach Manager"));
  assert.ok(names.includes("Analytics Reporter"));
  assert.ok(names.includes("Nurture Manager"));

  for (const config of configs) {
    assert.ok(config.systemPrompt.includes("plumbing"));
    assert.ok(config.tools.length > 0);
    assert.ok(["claude", "openai", "shell", "http", "custom"].includes(config.type));
  }
});

test("getLeadOSAgentConfigs includes heartbeat for relevant agents", () => {
  const configs = getLeadOSAgentConfigs("HVAC");

  const withHeartbeat = configs.filter((c) => c.heartbeat);
  assert.ok(withHeartbeat.length >= 3);

  for (const config of withHeartbeat) {
    assert.ok(config.heartbeat!.cronExpression.length > 0);
    assert.ok(config.heartbeat!.task.length > 0);
  }
});

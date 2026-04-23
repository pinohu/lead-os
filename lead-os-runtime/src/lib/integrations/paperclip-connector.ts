import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OrgNode {
  role: string;
  reportsTo?: string;
  agentId?: string;
}

export interface PaperclipCompanyConfig {
  name: string;
  description: string;
  orgChart?: OrgNode[];
}

export interface PaperclipAgentConfig {
  name: string;
  role: string;
  type: "claude" | "openai" | "shell" | "http" | "custom";
  tools: string[];
  systemPrompt: string;
  heartbeat?: { cronExpression: string; task: string };
}

export interface PaperclipAgent {
  id: string;
  companyId: string;
  name: string;
  role: string;
  type: PaperclipAgentConfig["type"];
  tools: string[];
  status: "active" | "idle" | "running" | "paused" | "error";
  tasksCompleted: number;
  totalCost: number;
  lastActiveAt?: string;
}

export interface PaperclipCompany {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  agents: PaperclipAgent[];
  orgChart: OrgNode[];
  budget: PaperclipBudget | null;
  createdAt: string;
}

export interface PaperclipTask {
  description: string;
  tools?: string[];
  context?: Record<string, unknown>;
  priority?: "low" | "normal" | "high";
  deadline?: string;
}

export interface PaperclipTaskResult {
  id: string;
  agentId: string;
  description: string;
  status: "queued" | "running" | "completed" | "failed";
  output?: string;
  artifacts?: { name: string; type: string; content: string }[];
  cost: number;
  tokensUsed: number;
  startedAt: string;
  completedAt?: string;
}

export interface PaperclipBudget {
  dailyLimit: number;
  monthlyLimit: number;
  perTaskLimit: number;
  alertEmail?: string;
}

export interface PaperclipBudgetStatus {
  dailySpent: number;
  dailyLimit: number;
  monthlySpent: number;
  monthlyLimit: number;
  isOverBudget: boolean;
  projectedMonthlySpend: number;
}

export interface ListOptions {
  status?: PaperclipTaskResult["status"];
  limit?: number;
  offset?: number;
}

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

const companyStore = new Map<string, PaperclipCompany>();
const agentStore = new Map<string, PaperclipAgent>();
const taskStore = new Map<string, PaperclipTaskResult>();
const budgetStore = new Map<string, PaperclipBudget>();
const spendingStore = new Map<string, { daily: number; monthly: number }>();

export function resetPaperclipStore(): void {
  companyStore.clear();
  agentStore.clear();
  taskStore.clear();
  budgetStore.clear();
  spendingStore.clear();
}

export function _getCompanyStoreForTesting(): Map<string, PaperclipCompany> {
  return companyStore;
}

export function _getAgentStoreForTesting(): Map<string, PaperclipAgent> {
  return agentStore;
}

export function _getTaskStoreForTesting(): Map<string, PaperclipTaskResult> {
  return taskStore;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

function getPaperclipConfig(): { apiKey: string; baseUrl: string } | undefined {
  const apiKey = process.env["PAPERCLIP_API_KEY"];
  const baseUrl =
    process.env["PAPERCLIP_BASE_URL"] ?? "https://api.paperclip.ai/v1";

  if (typeof apiKey === "string" && apiKey.trim().length > 0) {
    return { apiKey: apiKey.trim(), baseUrl: baseUrl.replace(/\/$/, "") };
  }

  return undefined;
}

function isDryRun(): boolean {
  return (
    !getPaperclipConfig() ||
    process.env["LEAD_OS_ENABLE_LIVE_SENDS"] === "false"
  );
}

// ---------------------------------------------------------------------------
// Paperclip API request helper
// ---------------------------------------------------------------------------

async function paperclipRequest(
  path: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  body?: Record<string, unknown>,
): Promise<unknown> {
  const config = getPaperclipConfig();
  if (!config) {
    throw new Error("Paperclip API key not configured");
  }

  const response = await fetch(`${config.baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(
      `Paperclip returned ${response.status}: ${response.statusText}`,
    );
  }

  if (response.status === 204) return undefined;
  return response.json();
}

// ---------------------------------------------------------------------------
// Company management
// ---------------------------------------------------------------------------

export async function createCompany(
  tenantId: string,
  config: PaperclipCompanyConfig,
): Promise<PaperclipCompany> {
  const now = new Date().toISOString();

  if (isDryRun()) {
    const company: PaperclipCompany = {
      id: `pco-${randomUUID()}`,
      tenantId,
      name: config.name,
      description: config.description,
      agents: [],
      orgChart: config.orgChart ?? [],
      budget: null,
      createdAt: now,
    };
    companyStore.set(company.id, company);
    return company;
  }

  const data = (await paperclipRequest("/companies", "POST", {
    tenantId,
    name: config.name,
    description: config.description,
    orgChart: config.orgChart,
  })) as { id: string };

  const company: PaperclipCompany = {
    id: data.id ?? `pco-${randomUUID()}`,
    tenantId,
    name: config.name,
    description: config.description,
    agents: [],
    orgChart: config.orgChart ?? [],
    budget: null,
    createdAt: now,
  };

  companyStore.set(company.id, company);
  return company;
}

export async function getCompany(companyId: string): Promise<PaperclipCompany> {
  const cached = companyStore.get(companyId);

  if (isDryRun()) {
    if (!cached) {
      throw new Error(`Company not found: ${companyId}`);
    }
    return cached;
  }

  const data = (await paperclipRequest(
    `/companies/${companyId}`,
    "GET",
  )) as Record<string, unknown>;

  const company: PaperclipCompany = {
    id: companyId,
    tenantId: (data.tenantId as string) ?? cached?.tenantId ?? "",
    name: (data.name as string) ?? cached?.name ?? "",
    description: (data.description as string) ?? cached?.description ?? "",
    agents: (data.agents as PaperclipAgent[]) ?? cached?.agents ?? [],
    orgChart: (data.orgChart as OrgNode[]) ?? cached?.orgChart ?? [],
    budget: (data.budget as PaperclipBudget) ?? cached?.budget ?? null,
    createdAt: (data.createdAt as string) ?? cached?.createdAt ?? new Date().toISOString(),
  };

  companyStore.set(companyId, company);
  return company;
}

export async function listCompanies(): Promise<PaperclipCompany[]> {
  if (isDryRun()) {
    return [...companyStore.values()];
  }

  const data = (await paperclipRequest("/companies", "GET")) as {
    data: Record<string, unknown>[];
  };

  return (data.data ?? []).map((c) => ({
    id: (c.id as string) ?? "",
    tenantId: (c.tenantId as string) ?? "",
    name: (c.name as string) ?? "",
    description: (c.description as string) ?? "",
    agents: (c.agents as PaperclipAgent[]) ?? [],
    orgChart: (c.orgChart as OrgNode[]) ?? [],
    budget: (c.budget as PaperclipBudget) ?? null,
    createdAt: (c.createdAt as string) ?? "",
  }));
}

export async function deleteCompany(companyId: string): Promise<void> {
  if (isDryRun()) {
    if (!companyStore.has(companyId)) {
      throw new Error(`Company not found: ${companyId}`);
    }
    const company = companyStore.get(companyId)!;
    for (const agent of company.agents) {
      agentStore.delete(agent.id);
    }
    companyStore.delete(companyId);
    budgetStore.delete(companyId);
    spendingStore.delete(companyId);
    return;
  }

  await paperclipRequest(`/companies/${companyId}`, "DELETE");
  companyStore.delete(companyId);
}

// ---------------------------------------------------------------------------
// Agent management
// ---------------------------------------------------------------------------

export async function addAgentToCompany(
  companyId: string,
  agentConfig: PaperclipAgentConfig,
): Promise<PaperclipAgent> {
  const company = companyStore.get(companyId);

  if (isDryRun()) {
    if (!company) {
      throw new Error(`Company not found: ${companyId}`);
    }

    const agent: PaperclipAgent = {
      id: `pag-${randomUUID()}`,
      companyId,
      name: agentConfig.name,
      role: agentConfig.role,
      type: agentConfig.type,
      tools: agentConfig.tools,
      status: "idle",
      tasksCompleted: 0,
      totalCost: 0,
      lastActiveAt: undefined,
    };

    agentStore.set(agent.id, agent);
    company.agents.push(agent);
    return agent;
  }

  const data = (await paperclipRequest(
    `/companies/${companyId}/agents`,
    "POST",
    {
      name: agentConfig.name,
      role: agentConfig.role,
      type: agentConfig.type,
      tools: agentConfig.tools,
      systemPrompt: agentConfig.systemPrompt,
      heartbeat: agentConfig.heartbeat,
    },
  )) as { id: string };

  const agent: PaperclipAgent = {
    id: data.id ?? `pag-${randomUUID()}`,
    companyId,
    name: agentConfig.name,
    role: agentConfig.role,
    type: agentConfig.type,
    tools: agentConfig.tools,
    status: "idle",
    tasksCompleted: 0,
    totalCost: 0,
    lastActiveAt: undefined,
  };

  agentStore.set(agent.id, agent);
  if (company) {
    company.agents.push(agent);
  }
  return agent;
}

export async function listAgents(companyId: string): Promise<PaperclipAgent[]> {
  if (isDryRun()) {
    return [...agentStore.values()].filter((a) => a.companyId === companyId);
  }

  const data = (await paperclipRequest(
    `/companies/${companyId}/agents`,
    "GET",
  )) as { data: PaperclipAgent[] };

  return data.data ?? [];
}

export async function getAgent(agentId: string): Promise<PaperclipAgent> {
  const cached = agentStore.get(agentId);

  if (isDryRun()) {
    if (!cached) {
      throw new Error(`Agent not found: ${agentId}`);
    }
    return cached;
  }

  const data = (await paperclipRequest(
    `/agents/${agentId}`,
    "GET",
  )) as PaperclipAgent;

  agentStore.set(agentId, data);
  return data;
}

export async function updateAgent(
  agentId: string,
  updates: Partial<PaperclipAgentConfig>,
): Promise<PaperclipAgent> {
  const cached = agentStore.get(agentId);

  if (isDryRun()) {
    if (!cached) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    if (updates.name !== undefined) cached.name = updates.name;
    if (updates.role !== undefined) cached.role = updates.role;
    if (updates.type !== undefined) cached.type = updates.type;
    if (updates.tools !== undefined) cached.tools = updates.tools;

    return cached;
  }

  const data = (await paperclipRequest(`/agents/${agentId}`, "PATCH", {
    ...updates,
  })) as PaperclipAgent;

  agentStore.set(agentId, data);
  return data;
}

export async function removeAgent(agentId: string): Promise<void> {
  const cached = agentStore.get(agentId);

  if (isDryRun()) {
    if (!cached) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    const company = companyStore.get(cached.companyId);
    if (company) {
      company.agents = company.agents.filter((a) => a.id !== agentId);
    }
    agentStore.delete(agentId);
    return;
  }

  await paperclipRequest(`/agents/${agentId}`, "DELETE");
  if (cached) {
    const company = companyStore.get(cached.companyId);
    if (company) {
      company.agents = company.agents.filter((a) => a.id !== agentId);
    }
  }
  agentStore.delete(agentId);
}

// ---------------------------------------------------------------------------
// Task execution
// ---------------------------------------------------------------------------

export async function assignTask(
  agentId: string,
  task: PaperclipTask,
): Promise<PaperclipTaskResult> {
  const agent = agentStore.get(agentId);
  const now = new Date().toISOString();

  if (isDryRun()) {
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    const taskCost = 0.05;
    const tokensUsed = 1500;

    const result: PaperclipTaskResult = {
      id: `ptask-${randomUUID()}`,
      agentId,
      description: task.description,
      status: "completed",
      output: `Dry-run task completed: "${task.description}". Configure PAPERCLIP_API_KEY for live execution.`,
      artifacts: [
        {
          name: "task-report.md",
          type: "text/markdown",
          content: `# Task Report\n\n**Task:** ${task.description}\n**Status:** Completed (dry-run)\n**Agent:** ${agent.name}`,
        },
      ],
      cost: taskCost,
      tokensUsed,
      startedAt: now,
      completedAt: now,
    };

    taskStore.set(result.id, result);
    agent.tasksCompleted += 1;
    agent.totalCost += taskCost;
    agent.lastActiveAt = now;
    agent.status = "idle";

    updateSpending(agent.companyId, taskCost);

    return result;
  }

  const data = (await paperclipRequest(`/agents/${agentId}/tasks`, "POST", {
    description: task.description,
    tools: task.tools,
    context: task.context,
    priority: task.priority,
    deadline: task.deadline,
  })) as Record<string, unknown>;

  const result: PaperclipTaskResult = {
    id: (data.id as string) ?? `ptask-${randomUUID()}`,
    agentId,
    description: task.description,
    status: (data.status as PaperclipTaskResult["status"]) ?? "queued",
    output: data.output as string | undefined,
    artifacts: data.artifacts as PaperclipTaskResult["artifacts"],
    cost: (data.cost as number) ?? 0,
    tokensUsed: (data.tokensUsed as number) ?? 0,
    startedAt: (data.startedAt as string) ?? now,
    completedAt: data.completedAt as string | undefined,
  };

  taskStore.set(result.id, result);
  return result;
}

export async function getTaskStatus(
  taskId: string,
): Promise<PaperclipTaskResult> {
  const cached = taskStore.get(taskId);

  if (isDryRun()) {
    if (!cached) {
      throw new Error(`Task not found: ${taskId}`);
    }
    return cached;
  }

  const data = (await paperclipRequest(
    `/tasks/${taskId}`,
    "GET",
  )) as PaperclipTaskResult;

  taskStore.set(taskId, data);
  return data;
}

export async function listTasks(
  companyId: string,
  options?: ListOptions,
): Promise<PaperclipTaskResult[]> {
  if (isDryRun()) {
    const company = companyStore.get(companyId);
    if (!company) return [];

    const agentIds = new Set(company.agents.map((a) => a.id));
    let tasks = [...taskStore.values()].filter((t) => agentIds.has(t.agentId));

    if (options?.status) {
      tasks = tasks.filter((t) => t.status === options.status);
    }

    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 50;
    return tasks.slice(offset, offset + limit);
  }

  const params = new URLSearchParams();
  if (options?.status) params.set("status", options.status);
  if (options?.limit) params.set("limit", String(options.limit));
  if (options?.offset) params.set("offset", String(options.offset));

  const query = params.toString() ? `?${params.toString()}` : "";
  const data = (await paperclipRequest(
    `/companies/${companyId}/tasks${query}`,
    "GET",
  )) as { data: PaperclipTaskResult[] };

  return data.data ?? [];
}

// ---------------------------------------------------------------------------
// Budget control
// ---------------------------------------------------------------------------

export async function setBudget(
  companyId: string,
  budget: PaperclipBudget,
): Promise<void> {
  if (isDryRun()) {
    if (!companyStore.has(companyId)) {
      throw new Error(`Company not found: ${companyId}`);
    }
    budgetStore.set(companyId, budget);
    const company = companyStore.get(companyId)!;
    company.budget = budget;
    return;
  }

  await paperclipRequest(`/companies/${companyId}/budget`, "PUT", {
    dailyLimit: budget.dailyLimit,
    monthlyLimit: budget.monthlyLimit,
    perTaskLimit: budget.perTaskLimit,
    alertEmail: budget.alertEmail,
  });

  budgetStore.set(companyId, budget);
}

export async function getBudgetStatus(
  companyId: string,
): Promise<PaperclipBudgetStatus> {
  if (isDryRun()) {
    const budget = budgetStore.get(companyId);
    const spending = spendingStore.get(companyId) ?? { daily: 0, monthly: 0 };

    const dailyLimit = budget?.dailyLimit ?? 0;
    const monthlyLimit = budget?.monthlyLimit ?? 0;
    const dailySpent = spending.daily;
    const monthlySpent = spending.monthly;

    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const projectedMonthlySpend =
      dayOfMonth > 0 ? (monthlySpent / dayOfMonth) * daysInMonth : 0;

    return {
      dailySpent,
      dailyLimit,
      monthlySpent,
      monthlyLimit,
      isOverBudget: dailySpent > dailyLimit || monthlySpent > monthlyLimit,
      projectedMonthlySpend: Math.round(projectedMonthlySpend * 100) / 100,
    };
  }

  const data = (await paperclipRequest(
    `/companies/${companyId}/budget/status`,
    "GET",
  )) as PaperclipBudgetStatus;

  return data;
}

// ---------------------------------------------------------------------------
// Pre-built Lead OS agent configurations
// ---------------------------------------------------------------------------

export function getLeadOSAgentConfigs(niche: string): PaperclipAgentConfig[] {
  return [
    {
      name: "Lead Researcher",
      role: "research",
      type: "claude",
      tools: [
        "firecrawl-mcp-scrape",
        "firecrawl-mcp-search",
        "firecrawl-mcp-crawl",
        "firecrawl-mcp-map",
      ],
      systemPrompt: `You are a lead researcher specializing in the ${niche} industry. Your job is to discover and qualify potential prospects using web scraping and search tools. Focus on finding businesses that match the target niche, have active web presence, and show signals of being good prospects.`,
      heartbeat: {
        cronExpression: "0 9 * * 1-5",
        task: `Search for new ${niche} prospects and add them to the pipeline`,
      },
    },
    {
      name: "Data Enricher",
      role: "enrichment",
      type: "claude",
      tools: [
        "firecrawl-mcp-scrape",
        "firecrawl-mcp-agent",
        "company-analysis",
      ],
      systemPrompt: `You are a data enrichment specialist for the ${niche} industry. Enrich lead profiles with company details, technology stack, team information, social presence, and financial indicators. Produce comprehensive profiles that sales teams can use for personalized outreach.`,
    },
    {
      name: "Content Creator",
      role: "content",
      type: "claude",
      tools: [
        "social-asset-engine",
        "langchain-generate",
        "template-engine",
      ],
      systemPrompt: `You are a content creator for ${niche} businesses. Generate engaging content including social media posts, email copy, blog drafts, and ad creatives. All content should be tailored to the ${niche} audience and follow brand guidelines.`,
      heartbeat: {
        cronExpression: "0 8 * * 1-5",
        task: `Create daily social media content for ${niche} audience`,
      },
    },
    {
      name: "Outreach Manager",
      role: "outreach",
      type: "claude",
      tools: [
        "email-send",
        "sms-send",
        "linkedin-connect",
        "sequence-engine",
      ],
      systemPrompt: `You are an outreach manager for ${niche} lead generation. Execute multi-channel outreach campaigns via email, SMS, and LinkedIn. Personalize each message based on the prospect's profile and engagement history. Follow up strategically based on response patterns.`,
    },
    {
      name: "Analytics Reporter",
      role: "analytics",
      type: "claude",
      tools: [
        "umami-analytics",
        "internal-metrics",
        "report-generator",
      ],
      systemPrompt: `You are an analytics reporter for a ${niche} business. Collect data from analytics platforms and internal metrics to produce daily performance reports. Highlight key trends, conversion rates, campaign performance, and actionable recommendations.`,
      heartbeat: {
        cronExpression: "0 18 * * 1-5",
        task: "Generate daily analytics report with key metrics and recommendations",
      },
    },
    {
      name: "Nurture Manager",
      role: "nurture",
      type: "claude",
      tools: [
        "activepieces-workflow",
        "email-sequence",
        "lead-scoring",
      ],
      systemPrompt: `You are a nurture manager for ${niche} leads. Design and execute lead nurture sequences using automated workflows. Monitor engagement, adjust sequences based on behavior, and escalate hot leads to the sales team. Focus on moving leads through the funnel efficiently.`,
      heartbeat: {
        cronExpression: "0 10 * * *",
        task: "Review nurture sequences and adjust based on engagement metrics",
      },
    },
  ];
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function updateSpending(companyId: string, cost: number): void {
  const current = spendingStore.get(companyId) ?? { daily: 0, monthly: 0 };
  current.daily += cost;
  current.monthly += cost;
  spendingStore.set(companyId, current);
}

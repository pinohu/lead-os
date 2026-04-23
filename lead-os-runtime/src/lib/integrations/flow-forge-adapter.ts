import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WorkflowTrigger {
  type: "webhook" | "schedule" | "event" | "manual";
  config: Record<string, unknown>;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: "action" | "condition" | "delay" | "split" | "merge";
  action?: string;
  config: Record<string, unknown>;
  next?: string | { condition: string; trueStep: string; falseStep: string };
}

export interface WorkflowConfig {
  name: string;
  description?: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  errorHandling: "stop" | "skip" | "retry";
}

export interface Workflow {
  id: string;
  tenantId: string;
  name: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  status: "active" | "inactive" | "draft";
  executionCount: number;
  lastRunAt?: string;
  createdAt: string;
}

export interface StepResult {
  stepId: string;
  status: "completed" | "skipped" | "failed";
  output?: unknown;
  duration: number;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: "running" | "completed" | "failed" | "cancelled";
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  stepResults: StepResult[];
  startedAt: string;
  completedAt?: string;
  error?: string;
}

export interface RoutingRule {
  condition: string;
  assignTo: string;
  priority: number;
}

export interface NurtureStage {
  name: string;
  delay: string;
  channel: "email" | "sms" | "call";
  template: string;
  exitCondition?: string;
}

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

const workflowStore = new Map<string, Workflow>();
const executionStore = new Map<string, WorkflowExecution[]>();

export function resetFlowForgeStore(): void {
  workflowStore.clear();
  executionStore.clear();
}

export function _getWorkflowStoreForTesting(): Map<string, Workflow> {
  return workflowStore;
}

export function _getExecutionStoreForTesting(): Map<string, WorkflowExecution[]> {
  return executionStore;
}

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

export async function createWorkflow(
  tenantId: string,
  config: WorkflowConfig,
): Promise<Workflow> {
  const now = new Date().toISOString();
  const workflow: Workflow = {
    id: `wf-${randomUUID()}`,
    tenantId,
    name: config.name,
    trigger: config.trigger,
    steps: config.steps,
    status: "draft",
    executionCount: 0,
    createdAt: now,
  };

  workflowStore.set(workflow.id, workflow);
  return workflow;
}

export async function getWorkflow(workflowId: string): Promise<Workflow> {
  const workflow = workflowStore.get(workflowId);
  if (!workflow) throw new Error(`Workflow not found: ${workflowId}`);
  return workflow;
}

export async function listWorkflows(tenantId: string): Promise<Workflow[]> {
  return [...workflowStore.values()].filter((w) => w.tenantId === tenantId);
}

export async function updateWorkflow(
  workflowId: string,
  updates: Partial<WorkflowConfig>,
): Promise<Workflow> {
  const workflow = workflowStore.get(workflowId);
  if (!workflow) throw new Error(`Workflow not found: ${workflowId}`);

  const updated: Workflow = {
    ...workflow,
    name: updates.name ?? workflow.name,
    trigger: updates.trigger ?? workflow.trigger,
    steps: updates.steps ?? workflow.steps,
  };

  workflowStore.set(workflowId, updated);
  return updated;
}

export async function deleteWorkflow(workflowId: string): Promise<void> {
  const workflow = workflowStore.get(workflowId);
  if (!workflow) throw new Error(`Workflow not found: ${workflowId}`);
  workflowStore.delete(workflowId);
  executionStore.delete(workflowId);
}

export async function executeWorkflow(
  workflowId: string,
  input: Record<string, unknown>,
): Promise<WorkflowExecution> {
  const workflow = workflowStore.get(workflowId);
  if (!workflow) throw new Error(`Workflow not found: ${workflowId}`);

  const now = new Date().toISOString();
  const stepResults: StepResult[] = workflow.steps.map((step) => ({
    stepId: step.id,
    status: "completed" as const,
    output: { processed: true },
    duration: Math.floor(Math.random() * 500) + 50,
  }));

  const execution: WorkflowExecution = {
    id: `exec-${randomUUID()}`,
    workflowId,
    status: "completed",
    input,
    output: { success: true, stepsExecuted: stepResults.length },
    stepResults,
    startedAt: now,
    completedAt: new Date().toISOString(),
  };

  const runs = executionStore.get(workflowId) ?? [];
  runs.unshift(execution);
  executionStore.set(workflowId, runs);

  workflowStore.set(workflowId, {
    ...workflow,
    executionCount: workflow.executionCount + 1,
    lastRunAt: now,
  });

  return execution;
}

export async function getExecutionStatus(
  executionId: string,
): Promise<WorkflowExecution> {
  for (const runs of executionStore.values()) {
    const exec = runs.find((r) => r.id === executionId);
    if (exec) return exec;
  }
  throw new Error(`Execution not found: ${executionId}`);
}

export async function listExecutions(
  workflowId: string,
): Promise<WorkflowExecution[]> {
  return executionStore.get(workflowId) ?? [];
}

// ---------------------------------------------------------------------------
// Pre-built lead workflows
// ---------------------------------------------------------------------------

function makeStep(
  name: string,
  type: WorkflowStep["type"],
  action: string,
  config: Record<string, unknown>,
): WorkflowStep {
  return {
    id: `step-${randomUUID()}`,
    name,
    type,
    action,
    config,
  };
}

export async function createLeadIntakeWorkflow(
  tenantId: string,
): Promise<Workflow> {
  return createWorkflow(tenantId, {
    name: "Lead Intake",
    description: "Capture and normalize incoming leads from all channels",
    trigger: { type: "webhook", config: { path: `/intake/${tenantId}` } },
    steps: [
      makeStep("Validate Lead", "action", "validate-lead", { requiredFields: ["email"] }),
      makeStep("Deduplicate", "action", "deduplicate", { matchOn: ["email", "phone"] }),
      makeStep("Enrich", "action", "enrich-lead", { providers: ["clearbit", "fullcontact"] }),
      makeStep("Score", "action", "score-lead", { model: "default" }),
      makeStep("Route", "action", "route-lead", { strategy: "round-robin" }),
    ],
    errorHandling: "skip",
  });
}

export async function createLeadRoutingWorkflow(
  tenantId: string,
  rules: RoutingRule[],
): Promise<Workflow> {
  const steps: WorkflowStep[] = rules
    .sort((a, b) => a.priority - b.priority)
    .map((rule) =>
      makeStep(
        `Route: ${rule.condition}`,
        "condition",
        "evaluate-route",
        { condition: rule.condition, assignTo: rule.assignTo, priority: rule.priority },
      ),
    );

  steps.push(
    makeStep("Default Assignment", "action", "assign-default", { pool: "general" }),
  );

  return createWorkflow(tenantId, {
    name: "Lead Routing",
    description: "Route leads to the right team members based on rules",
    trigger: { type: "event", config: { event: "lead.qualified" } },
    steps,
    errorHandling: "stop",
  });
}

export async function createLeadNurtureSequence(
  tenantId: string,
  stages: NurtureStage[],
): Promise<Workflow> {
  const steps: WorkflowStep[] = [];
  for (const stage of stages) {
    steps.push(
      makeStep(`Delay: ${stage.delay}`, "delay", "wait", { duration: stage.delay }),
    );
    steps.push(
      makeStep(
        `Send: ${stage.name}`,
        "action",
        `send-${stage.channel}`,
        { template: stage.template, channel: stage.channel },
      ),
    );
    if (stage.exitCondition) {
      steps.push(
        makeStep(
          `Check Exit: ${stage.exitCondition}`,
          "condition",
          "evaluate-exit",
          { condition: stage.exitCondition },
        ),
      );
    }
  }

  return createWorkflow(tenantId, {
    name: "Lead Nurture Sequence",
    description: "Multi-stage nurture sequence across channels",
    trigger: { type: "event", config: { event: "lead.captured" } },
    steps,
    errorHandling: "skip",
  });
}

export async function createLeadHandoffWorkflow(
  tenantId: string,
  crmType: string,
): Promise<Workflow> {
  return createWorkflow(tenantId, {
    name: `Lead Handoff to ${crmType}`,
    description: `Sync qualified leads to ${crmType} CRM`,
    trigger: { type: "event", config: { event: "lead.qualified" } },
    steps: [
      makeStep("Map Fields", "action", "map-crm-fields", { crmType, mapping: "auto" }),
      makeStep("Check Existing", "condition", "check-crm-duplicate", { crmType }),
      makeStep("Create/Update", "action", `sync-to-${crmType}`, { crmType, upsert: true }),
      makeStep("Notify Sales", "action", "notify-assignment", { channel: "email" }),
    ],
    errorHandling: "retry",
  });
}

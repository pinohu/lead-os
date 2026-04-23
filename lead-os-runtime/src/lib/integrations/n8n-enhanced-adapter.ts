import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface N8NNode {
  id: string;
  type: string;
  position: [number, number];
  parameters: Record<string, unknown>;
}

export interface N8NConnection {
  sourceNode: string;
  sourceOutput: number;
  targetNode: string;
  targetInput: number;
}

export interface N8NWorkflowConfig {
  name: string;
  nodes: N8NNode[];
  connections: N8NConnection[];
  settings?: Record<string, unknown>;
}

export interface N8NWorkflow {
  id: string;
  tenantId: string;
  name: string;
  active: boolean;
  nodes: N8NNode[];
  connections: N8NConnection[];
  executionCount: number;
  lastExecutionAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface N8NExecution {
  id: string;
  workflowId: string;
  status: "running" | "success" | "error" | "waiting";
  data?: Record<string, unknown>;
  startedAt: string;
  finishedAt?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

const workflowStore = new Map<string, N8NWorkflow>();
const executionStore = new Map<string, N8NExecution[]>();

export function resetN8NEnhancedStore(): void {
  workflowStore.clear();
  executionStore.clear();
}

export function _getWorkflowStoreForTesting(): Map<string, N8NWorkflow> {
  return workflowStore;
}

export function _getExecutionStoreForTesting(): Map<string, N8NExecution[]> {
  return executionStore;
}

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

export async function createN8NWorkflow(
  tenantId: string,
  workflow: N8NWorkflowConfig,
): Promise<N8NWorkflow> {
  const now = new Date().toISOString();
  const created: N8NWorkflow = {
    id: `n8n-wf-${randomUUID()}`,
    tenantId,
    name: workflow.name,
    active: false,
    nodes: workflow.nodes,
    connections: workflow.connections,
    executionCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  workflowStore.set(created.id, created);
  return created;
}

export async function getN8NWorkflow(workflowId: string): Promise<N8NWorkflow> {
  const workflow = workflowStore.get(workflowId);
  if (!workflow) throw new Error(`N8N workflow not found: ${workflowId}`);
  return workflow;
}

export async function listN8NWorkflows(tenantId: string): Promise<N8NWorkflow[]> {
  return [...workflowStore.values()].filter((w) => w.tenantId === tenantId);
}

export async function activateWorkflow(workflowId: string): Promise<N8NWorkflow> {
  const workflow = workflowStore.get(workflowId);
  if (!workflow) throw new Error(`N8N workflow not found: ${workflowId}`);

  const updated: N8NWorkflow = {
    ...workflow,
    active: true,
    updatedAt: new Date().toISOString(),
  };
  workflowStore.set(workflowId, updated);
  return updated;
}

export async function deactivateWorkflow(workflowId: string): Promise<N8NWorkflow> {
  const workflow = workflowStore.get(workflowId);
  if (!workflow) throw new Error(`N8N workflow not found: ${workflowId}`);

  const updated: N8NWorkflow = {
    ...workflow,
    active: false,
    updatedAt: new Date().toISOString(),
  };
  workflowStore.set(workflowId, updated);
  return updated;
}

export async function executeWorkflow(
  workflowId: string,
  data?: Record<string, unknown>,
): Promise<N8NExecution> {
  const workflow = workflowStore.get(workflowId);
  if (!workflow) throw new Error(`N8N workflow not found: ${workflowId}`);

  if (!workflow.active) {
    throw new Error(`Workflow ${workflowId} is not active`);
  }

  const now = new Date().toISOString();
  const execution: N8NExecution = {
    id: `n8n-exec-${randomUUID()}`,
    workflowId,
    status: "success",
    data: data ?? {},
    startedAt: now,
    finishedAt: new Date().toISOString(),
  };

  const runs = executionStore.get(workflowId) ?? [];
  runs.unshift(execution);
  executionStore.set(workflowId, runs);

  workflowStore.set(workflowId, {
    ...workflow,
    executionCount: workflow.executionCount + 1,
    lastExecutionAt: now,
    updatedAt: now,
  });

  return execution;
}

export async function getExecution(executionId: string): Promise<N8NExecution> {
  for (const runs of executionStore.values()) {
    const exec = runs.find((r) => r.id === executionId);
    if (exec) return exec;
  }
  throw new Error(`N8N execution not found: ${executionId}`);
}

export async function listExecutions(
  workflowId: string,
  limit?: number,
): Promise<N8NExecution[]> {
  const runs = executionStore.get(workflowId) ?? [];
  return limit ? runs.slice(0, limit) : runs;
}

export async function importWorkflowFromJSON(
  tenantId: string,
  json: string,
): Promise<N8NWorkflow> {
  let parsed: N8NWorkflowConfig;
  try {
    parsed = JSON.parse(json) as N8NWorkflowConfig;
  } catch {
    throw new Error("Invalid JSON: could not parse workflow definition");
  }

  if (!parsed.name || !Array.isArray(parsed.nodes)) {
    throw new Error("Invalid workflow JSON: missing name or nodes");
  }

  return createN8NWorkflow(tenantId, parsed);
}

export async function exportWorkflowToJSON(workflowId: string): Promise<string> {
  const workflow = workflowStore.get(workflowId);
  if (!workflow) throw new Error(`N8N workflow not found: ${workflowId}`);

  const exportData: N8NWorkflowConfig = {
    name: workflow.name,
    nodes: workflow.nodes,
    connections: workflow.connections,
  };

  return JSON.stringify(exportData, null, 2);
}

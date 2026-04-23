import { randomUUID } from "crypto";
import { BaseAdapter } from "./adapter-base.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TriggerConfig {
  type: "webhook" | "schedule" | "event";
  config: Record<string, unknown>;
}

export interface StepConfig {
  type: "action" | "condition" | "loop";
  action: string;
  config: Record<string, unknown>;
}

export interface FlowDefinition {
  name: string;
  trigger: TriggerConfig;
  steps: StepConfig[];
}

export interface Flow {
  id: string;
  tenantId: string;
  name: string;
  enabled: boolean;
  trigger: TriggerConfig;
  steps: StepConfig[];
  createdAt: string;
  updatedAt: string;
  lastRunAt: string | null;
}

export interface FlowRun {
  id: string;
  flowId: string;
  status: "running" | "completed" | "failed";
  startedAt: string;
  finishedAt: string | null;
  output: Record<string, unknown>;
}

export interface NurtureConfig {
  stages: {
    delay: string;
    channel: string;
    template: string;
  }[];
}

export interface EmailSequence {
  name: string;
  steps: {
    subject: string;
    body: string;
    delayDays: number;
  }[];
}

// ---------------------------------------------------------------------------
// Shared adapter instance & in-memory stores
// ---------------------------------------------------------------------------

const adapter = new BaseAdapter("Activepieces", "ACTIVEPIECES", "https://cloud.activepieces.com/api");

const flowStore = new Map<string, Flow>();
const flowRunStore = new Map<string, FlowRun[]>();

export function resetActivepiecesStore(): void {
  flowStore.clear();
  flowRunStore.clear();
  adapter.resetStore();
}

export function _getFlowStoreForTesting(): Map<string, Flow> {
  return flowStore;
}

export function _getFlowRunStoreForTesting(): Map<string, FlowRun[]> {
  return flowRunStore;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

function getActivepiecesConfig(): { apiKey: string; baseUrl: string } | undefined {
  const apiKey = process.env["ACTIVEPIECES_API_KEY"];
  const baseUrl = process.env["ACTIVEPIECES_BASE_URL"];

  if (
    typeof apiKey === "string" && apiKey.trim().length > 0 &&
    typeof baseUrl === "string" && baseUrl.trim().length > 0
  ) {
    return { apiKey: apiKey.trim(), baseUrl: baseUrl.trim().replace(/\/$/, "") };
  }

  return undefined;
}

function isDryRun(): boolean {
  return !getActivepiecesConfig() || process.env["LEAD_OS_ENABLE_LIVE_SENDS"] === "false";
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function apRequest(
  path: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  body?: Record<string, unknown>,
): Promise<unknown> {
  const config = getActivepiecesConfig();
  if (!config) {
    throw new Error("Activepieces API not configured");
  }

  const response = await fetch(`${config.baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`Activepieces returned ${response.status}: ${response.statusText}`);
  }

  if (method === "DELETE" && response.status === 204) {
    return {};
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

export async function createFlow(tenantId: string, flow: FlowDefinition): Promise<Flow> {
  const now = new Date().toISOString();
  const id = randomUUID();

  if (!isDryRun()) {
    try {
      const result = (await apRequest("/api/v1/flows", "POST", {
        displayName: flow.name,
        trigger: flow.trigger,
        steps: flow.steps,
        folderId: tenantId,
      })) as { id?: string };

      const remoteId = result.id ?? id;
      const created: Flow = {
        id: remoteId,
        tenantId,
        name: flow.name,
        enabled: true,
        trigger: flow.trigger,
        steps: flow.steps,
        createdAt: now,
        updatedAt: now,
        lastRunAt: null,
      };

      flowStore.set(remoteId, created);
      return created;
    } catch {
      // Fall through to dry-run
    }
  }

  const created: Flow = {
    id,
    tenantId,
    name: flow.name,
    enabled: true,
    trigger: flow.trigger,
    steps: flow.steps,
    createdAt: now,
    updatedAt: now,
    lastRunAt: null,
  };

  flowStore.set(id, created);
  return created;
}

export async function listFlows(tenantId: string): Promise<Flow[]> {
  if (!isDryRun()) {
    try {
      const result = (await apRequest(`/api/v1/flows?folderId=${tenantId}`, "GET")) as {
        data?: Array<{ id: string; displayName: string; status: string }>;
      };

      if (result.data) {
        return result.data.map((f) => {
          const existing = flowStore.get(f.id);
          return existing ?? {
            id: f.id,
            tenantId,
            name: f.displayName,
            enabled: f.status === "ENABLED",
            trigger: { type: "webhook" as const, config: {} },
            steps: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastRunAt: null,
          };
        });
      }
    } catch {
      // Fall through to local store
    }
  }

  return [...flowStore.values()].filter((f) => f.tenantId === tenantId);
}

export async function getFlow(flowId: string): Promise<Flow> {
  const local = flowStore.get(flowId);

  if (!isDryRun()) {
    try {
      const result = (await apRequest(`/api/v1/flows/${flowId}`, "GET")) as {
        id: string;
        displayName?: string;
        status?: string;
      };

      if (local) {
        const updated = { ...local, enabled: result.status === "ENABLED" };
        flowStore.set(flowId, updated);
        return updated;
      }

      return {
        id: result.id,
        tenantId: "",
        name: result.displayName ?? "",
        enabled: result.status === "ENABLED",
        trigger: { type: "webhook", config: {} },
        steps: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastRunAt: null,
      };
    } catch {
      // Fall through to local store
    }
  }

  if (!local) {
    throw new Error(`Flow ${flowId} not found`);
  }

  return local;
}

export async function toggleFlow(flowId: string, enabled: boolean): Promise<Flow> {
  const flow = await getFlow(flowId);

  if (!isDryRun()) {
    try {
      await apRequest(`/api/v1/flows/${flowId}`, "POST", {
        type: "CHANGE_STATUS",
        request: { status: enabled ? "ENABLED" : "DISABLED" },
      });
    } catch {
      // Update locally anyway
    }
  }

  const updated: Flow = { ...flow, enabled, updatedAt: new Date().toISOString() };
  flowStore.set(flowId, updated);
  return updated;
}

export async function deleteFlow(flowId: string): Promise<void> {
  if (!isDryRun()) {
    try {
      await apRequest(`/api/v1/flows/${flowId}`, "DELETE");
    } catch {
      // Delete locally anyway
    }
  }

  flowStore.delete(flowId);
  flowRunStore.delete(flowId);
}

export async function triggerFlow(flowId: string, data: Record<string, unknown>): Promise<FlowRun> {
  const flow = await getFlow(flowId);
  const now = new Date().toISOString();
  const runId = randomUUID();

  if (!isDryRun()) {
    try {
      const result = (await apRequest(`/api/v1/flow-runs`, "POST", {
        flowVersionId: flowId,
        payload: data,
      })) as { id?: string };

      const run: FlowRun = {
        id: result.id ?? runId,
        flowId,
        status: "completed",
        startedAt: now,
        finishedAt: new Date().toISOString(),
        output: data,
      };

      const runs = flowRunStore.get(flowId) ?? [];
      runs.unshift(run);
      flowRunStore.set(flowId, runs);

      const updatedFlow = { ...flow, lastRunAt: now, updatedAt: now };
      flowStore.set(flowId, updatedFlow);

      return run;
    } catch {
      // Fall through to dry-run
    }
  }

  const run: FlowRun = {
    id: runId,
    flowId,
    status: "completed",
    startedAt: now,
    finishedAt: new Date().toISOString(),
    output: data,
  };

  const runs = flowRunStore.get(flowId) ?? [];
  runs.unshift(run);
  flowRunStore.set(flowId, runs);

  const updatedFlow = { ...flow, lastRunAt: now, updatedAt: now };
  flowStore.set(flowId, updatedFlow);

  return run;
}

export async function getFlowRuns(flowId: string): Promise<FlowRun[]> {
  if (!isDryRun()) {
    try {
      const result = (await apRequest(`/api/v1/flow-runs?flowId=${flowId}`, "GET")) as {
        data?: Array<{
          id: string;
          status: string;
          startTime: string;
          finishTime?: string;
        }>;
      };

      if (result.data) {
        return result.data.map((r) => ({
          id: r.id,
          flowId,
          status: r.status === "SUCCEEDED" ? "completed" as const : r.status === "RUNNING" ? "running" as const : "failed" as const,
          startedAt: r.startTime,
          finishedAt: r.finishTime ?? null,
          output: {},
        }));
      }
    } catch {
      // Fall through to local store
    }
  }

  return flowRunStore.get(flowId) ?? [];
}

// ---------------------------------------------------------------------------
// Pre-built workflow templates
// ---------------------------------------------------------------------------

export async function createLeadNurtureWorkflow(
  tenantId: string,
  config: NurtureConfig,
): Promise<Flow> {
  const steps: StepConfig[] = config.stages.map((stage, i) => ({
    type: "action" as const,
    action: `send-${stage.channel}`,
    config: {
      template: stage.template,
      delay: stage.delay,
      stepIndex: i,
    },
  }));

  return createFlow(tenantId, {
    name: "Lead Nurture Sequence",
    trigger: { type: "event", config: { event: "lead.captured" } },
    steps,
  });
}

export async function createLeadScoringWorkflow(tenantId: string): Promise<Flow> {
  return createFlow(tenantId, {
    name: "Lead Scoring Automation",
    trigger: { type: "event", config: { event: "lead.activity" } },
    steps: [
      {
        type: "action",
        action: "calculate-score",
        config: {
          factors: ["pageViews", "emailOpens", "formSubmissions", "timeOnSite"],
          weights: { pageViews: 1, emailOpens: 2, formSubmissions: 5, timeOnSite: 1 },
        },
      },
      {
        type: "condition",
        action: "check-threshold",
        config: { threshold: 80, field: "score" },
      },
      {
        type: "action",
        action: "notify-sales",
        config: { channel: "email", template: "hot-lead-alert" },
      },
    ],
  });
}

export async function createCRMSyncWorkflow(
  tenantId: string,
  crmType: string,
): Promise<Flow> {
  return createFlow(tenantId, {
    name: `CRM Sync - ${crmType}`,
    trigger: { type: "event", config: { event: "lead.updated" } },
    steps: [
      {
        type: "action",
        action: "map-fields",
        config: { crmType, mapping: "auto" },
      },
      {
        type: "action",
        action: `sync-to-${crmType}`,
        config: { crmType, upsert: true },
      },
    ],
  });
}

export async function createEmailSequenceWorkflow(
  tenantId: string,
  sequence: EmailSequence,
): Promise<Flow> {
  const steps: StepConfig[] = sequence.steps.map((step, i) => ({
    type: "action" as const,
    action: "send-email",
    config: {
      subject: step.subject,
      body: step.body,
      delayDays: step.delayDays,
      stepIndex: i,
    },
  }));

  return createFlow(tenantId, {
    name: `Email Sequence: ${sequence.name}`,
    trigger: { type: "event", config: { event: "lead.enrolled" } },
    steps,
  });
}

export async function createWebhookWorkflow(
  tenantId: string,
  webhookUrl: string,
): Promise<Flow> {
  return createFlow(tenantId, {
    name: "Webhook Relay",
    trigger: { type: "webhook", config: { path: `/webhooks/${tenantId}` } },
    steps: [
      {
        type: "action",
        action: "forward-webhook",
        config: { url: webhookUrl, method: "POST" },
      },
    ],
  });
}

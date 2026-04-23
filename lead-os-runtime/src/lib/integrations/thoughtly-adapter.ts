import { randomUUID } from "crypto";
import { BaseAdapter } from "./adapter-base.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ThoughtlyConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface VoiceAgent {
  id: string;
  tenantId: string;
  name: string;
  script: string;
  voiceId: string;
  qualificationCriteria: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OutboundCall {
  id: string;
  tenantId: string;
  agentId: string;
  phoneNumber: string;
  status: "queued" | "in-progress" | "completed" | "failed" | "no-answer";
  durationSeconds?: number;
  transcript?: string;
  qualified?: boolean;
  sentiment?: "positive" | "neutral" | "negative";
  capturedData: Record<string, string>;
  startedAt: string;
  endedAt?: string;
}

export interface CallSummary {
  totalCalls: number;
  completed: number;
  qualified: number;
  averageDuration: number;
}

// ---------------------------------------------------------------------------
// Shared adapter instance & in-memory stores
// ---------------------------------------------------------------------------

const adapter = new BaseAdapter("Thoughtly", "THOUGHTLY", "https://api.thoughtly.com/v1");

const agentStore = new Map<string, VoiceAgent>();
const callStore = new Map<string, OutboundCall>();

export function resetThoughtlyStore(): void {
  agentStore.clear();
  callStore.clear();
  adapter.resetStore();
}

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

export async function healthCheck(config?: ThoughtlyConfig): Promise<{ ok: boolean; message: string }> {
  return adapter.healthCheck(config);
}

// ---------------------------------------------------------------------------
// Voice agent CRUD
// ---------------------------------------------------------------------------

export async function createAgent(
  tenantId: string,
  name: string,
  script: string,
  voiceId: string,
  qualificationCriteria: string[],
): Promise<VoiceAgent> {
  const now = new Date().toISOString();
  const agent: VoiceAgent = {
    id: `vagent-${randomUUID()}`,
    tenantId,
    name,
    script,
    voiceId,
    qualificationCriteria,
    active: true,
    createdAt: now,
    updatedAt: now,
  };
  agentStore.set(agent.id, agent);
  return agent;
}

export async function getAgent(agentId: string): Promise<VoiceAgent | undefined> {
  return agentStore.get(agentId);
}

export async function listAgents(tenantId: string): Promise<VoiceAgent[]> {
  return [...agentStore.values()].filter((a) => a.tenantId === tenantId);
}

export async function deleteAgent(agentId: string): Promise<boolean> {
  return agentStore.delete(agentId);
}

// ---------------------------------------------------------------------------
// Outbound calls
// ---------------------------------------------------------------------------

export async function triggerCall(
  tenantId: string,
  agentId: string,
  phoneNumber: string,
): Promise<OutboundCall> {
  const agent = agentStore.get(agentId);
  if (!agent) throw new Error(`Voice agent not found: ${agentId}`);

  const call: OutboundCall = {
    id: `call-${randomUUID()}`,
    tenantId,
    agentId,
    phoneNumber,
    status: "completed",
    durationSeconds: Math.floor(Math.random() * 180) + 30,
    transcript: `[AI Agent]: Hello, this is ${agent.name}. [Lead]: Hi, yes I'm interested.`,
    qualified: true,
    sentiment: "positive",
    capturedData: { interest: "high" },
    startedAt: new Date().toISOString(),
    endedAt: new Date().toISOString(),
  };
  callStore.set(call.id, call);
  return call;
}

export async function getCall(callId: string): Promise<OutboundCall | undefined> {
  return callStore.get(callId);
}

export async function listCalls(tenantId: string): Promise<OutboundCall[]> {
  return [...callStore.values()].filter((c) => c.tenantId === tenantId);
}

// ---------------------------------------------------------------------------
// Batch calling
// ---------------------------------------------------------------------------

export async function triggerBatchCalls(
  tenantId: string,
  agentId: string,
  phoneNumbers: string[],
): Promise<OutboundCall[]> {
  return Promise.all(phoneNumbers.map((num) => triggerCall(tenantId, agentId, num)));
}

// ---------------------------------------------------------------------------
// Call summary
// ---------------------------------------------------------------------------

export async function getCallSummary(tenantId: string): Promise<CallSummary> {
  const calls = [...callStore.values()].filter((c) => c.tenantId === tenantId);
  const completed = calls.filter((c) => c.status === "completed");
  const qualified = calls.filter((c) => c.qualified === true);
  const totalDuration = completed.reduce((sum, c) => sum + (c.durationSeconds ?? 0), 0);

  return {
    totalCalls: calls.length,
    completed: completed.length,
    qualified: qualified.length,
    averageDuration: completed.length > 0 ? totalDuration / completed.length : 0,
  };
}

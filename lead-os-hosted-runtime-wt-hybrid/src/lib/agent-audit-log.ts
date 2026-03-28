// ---------------------------------------------------------------------------
// Agent Audit Log — governance and audit trail for all agent actions.
// Every agent execution, budget change, and configuration update is logged.
// ---------------------------------------------------------------------------

import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuditEntry {
  id: string;
  timestamp: string;
  tenantId: string;
  teamId: string;
  agentId: string;
  action: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  tokensUsed: number;
  costUsd: number;
  status: "success" | "failure" | "warning";
  metadata?: Record<string, unknown>;
}

export interface AuditOptions {
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
  action?: string;
  status?: AuditEntry["status"];
}

export interface AuditSummary {
  period: string;
  totalActions: number;
  successRate: number;
  totalCost: number;
  topAgents: { agentId: string; name: string; actions: number; cost: number }[];
  topActions: { action: string; count: number; avgCost: number }[];
  warnings: string[];
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const auditStore: AuditEntry[] = [];

// ---------------------------------------------------------------------------
// Filtering helper
// ---------------------------------------------------------------------------

function applyFilters(
  entries: AuditEntry[],
  options?: AuditOptions,
): AuditEntry[] {
  let filtered = entries;

  if (options?.startDate) {
    const start = new Date(options.startDate).getTime();
    filtered = filtered.filter(
      (e) => new Date(e.timestamp).getTime() >= start,
    );
  }
  if (options?.endDate) {
    const end = new Date(options.endDate).getTime();
    filtered = filtered.filter((e) => new Date(e.timestamp).getTime() <= end);
  }
  if (options?.action) {
    filtered = filtered.filter((e) => e.action === options.action);
  }
  if (options?.status) {
    filtered = filtered.filter((e) => e.status === options.status);
  }

  filtered.sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  const offset = options?.offset ?? 0;
  const limit = options?.limit ?? 100;
  return filtered.slice(offset, offset + limit);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function logAgentAction(
  entry: Omit<AuditEntry, "id" | "timestamp">,
): Promise<void> {
  const full: AuditEntry = {
    ...entry,
    id: randomUUID(),
    timestamp: new Date().toISOString(),
  };
  auditStore.push(full);
}

export async function getAuditLog(
  agentId: string,
  options?: AuditOptions,
): Promise<AuditEntry[]> {
  const entries = auditStore.filter((e) => e.agentId === agentId);
  return applyFilters(entries, options);
}

export async function getTeamAuditLog(
  teamId: string,
  options?: AuditOptions,
): Promise<AuditEntry[]> {
  const entries = auditStore.filter((e) => e.teamId === teamId);
  return applyFilters(entries, options);
}

export async function getTenantAuditLog(
  tenantId: string,
  options?: AuditOptions,
): Promise<AuditEntry[]> {
  const entries = auditStore.filter((e) => e.tenantId === tenantId);
  return applyFilters(entries, options);
}

export async function getAuditSummary(
  tenantId: string,
  period: string,
): Promise<AuditSummary> {
  const entries = auditStore.filter((e) => e.tenantId === tenantId);

  const successCount = entries.filter((e) => e.status === "success").length;
  const successRate =
    entries.length > 0 ? Math.round((successCount / entries.length) * 100) : 0;

  const agentMap = new Map<
    string,
    { agentId: string; name: string; actions: number; cost: number }
  >();
  for (const entry of entries) {
    const existing = agentMap.get(entry.agentId) ?? {
      agentId: entry.agentId,
      name: entry.metadata?.agentName as string ?? entry.agentId,
      actions: 0,
      cost: 0,
    };
    existing.actions += 1;
    existing.cost += entry.costUsd;
    agentMap.set(entry.agentId, existing);
  }

  const actionMap = new Map<
    string,
    { action: string; count: number; totalCost: number }
  >();
  for (const entry of entries) {
    const existing = actionMap.get(entry.action) ?? {
      action: entry.action,
      count: 0,
      totalCost: 0,
    };
    existing.count += 1;
    existing.totalCost += entry.costUsd;
    actionMap.set(entry.action, existing);
  }

  const topAgents = Array.from(agentMap.values())
    .sort((a, b) => b.actions - a.actions)
    .slice(0, 10);

  const topActions = Array.from(actionMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((a) => ({
      action: a.action,
      count: a.count,
      avgCost: a.count > 0 ? a.totalCost / a.count : 0,
    }));

  const warnings: string[] = [];
  const failureCount = entries.filter((e) => e.status === "failure").length;
  if (entries.length > 0 && failureCount / entries.length > 0.1) {
    warnings.push(
      `High failure rate: ${Math.round((failureCount / entries.length) * 100)}% of actions failed`,
    );
  }

  const totalCost = entries.reduce((sum, e) => sum + e.costUsd, 0);
  if (totalCost > 100) {
    warnings.push(
      `High spend alert: $${totalCost.toFixed(2)} total for period ${period}`,
    );
  }

  return {
    period,
    totalActions: entries.length,
    successRate,
    totalCost,
    topAgents,
    topActions,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Store reset (testing only)
// ---------------------------------------------------------------------------

export function resetAuditStore(): void {
  auditStore.length = 0;
}

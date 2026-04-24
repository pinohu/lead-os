// ---------------------------------------------------------------------------
// Status Page — builds structured payloads for external status-page services
// (Betteruptime, Instatus, or a custom status page).
// ---------------------------------------------------------------------------

import {
  getUptimePercentage,
  getAllComponents,
  getRecentChecks,
} from "./uptime-tracker";
import { getTenantAuditLog } from "./agent-audit-log";
import { tenantConfig } from "./tenant.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ComponentStatus {
  name: string;
  status: "operational" | "degraded" | "down" | "maintenance" | "unknown";
  uptime30d: number;
  uptime90d: number;
  latencyMs: number;
  lastCheckedAt: string | null;
}

export interface IncidentSummary {
  id: string;
  title: string;
  severity: "critical" | "major" | "minor";
  status: "investigating" | "identified" | "monitoring" | "resolved";
  createdAt: string;
  resolvedAt: string | null;
  message: string;
}

export interface StatusPayload {
  overall: "operational" | "degraded" | "major_outage";
  timestamp: string;
  components: ComponentStatus[];
  incidents: IncidentSummary[];
  page: {
    name: string;
    url: string;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;

function mapUptimeStatus(
  raw: string,
): ComponentStatus["status"] {
  switch (raw) {
    case "healthy":
      return "operational";
    case "degraded":
      return "degraded";
    case "down":
      return "down";
    default:
      return "unknown";
  }
}

function deriveOverall(
  components: ComponentStatus[],
): StatusPayload["overall"] {
  if (components.some((c) => c.status === "down")) return "major_outage";
  if (components.some((c) => c.status === "degraded")) return "degraded";
  return "operational";
}

async function extractIncidents(): Promise<IncidentSummary[]> {
  try {
    const tenantId = process.env.LEAD_OS_TENANT_ID ?? "default";
    const entries = await getTenantAuditLog(tenantId, {
      limit: 50,
      status: "failure",
    });
    return entries
      .filter(
        (e) =>
          e.action.includes("outage") ||
          e.action.includes("incident") ||
          e.action.includes("alert") ||
          e.status === "failure",
      )
      .slice(0, 20)
      .map((e) => ({
        id: e.id,
        title: `${e.action} — ${e.agentId}`,
        severity: e.action.includes("critical") ? "critical" : e.action.includes("major") ? "major" : "minor",
        status: "resolved" as const,
        createdAt: e.timestamp,
        resolvedAt: e.timestamp,
        message: JSON.stringify(e.output ?? e.metadata ?? {}).slice(0, 500),
      }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build the full status-page data object used by our own /api/status
 * endpoint and by external integrations.
 */
export async function buildStatusPayload(): Promise<StatusPayload> {
  const componentNames = getAllComponents();

  const defaultComponents: ComponentStatus[] = [
    { name: "api", status: "operational", uptime30d: 100, uptime90d: 100, latencyMs: 0, lastCheckedAt: null },
    { name: "database", status: "unknown", uptime30d: 100, uptime90d: 100, latencyMs: 0, lastCheckedAt: null },
    { name: "agents", status: "operational", uptime30d: 100, uptime90d: 100, latencyMs: 0, lastCheckedAt: null },
    { name: "webhooks", status: "operational", uptime30d: 100, uptime90d: 100, latencyMs: 0, lastCheckedAt: null },
  ];

  const liveComponents: ComponentStatus[] = componentNames.map((name) => {
    const recent = getRecentChecks(name, 1);
    const latest = recent[0];
    return {
      name,
      status: latest ? mapUptimeStatus(latest.status) : "unknown",
      uptime30d: getUptimePercentage(name, THIRTY_DAYS),
      uptime90d: getUptimePercentage(name, NINETY_DAYS),
      latencyMs: latest?.latencyMs ?? 0,
      lastCheckedAt: latest?.checkedAt ?? null,
    };
  });

  const components = liveComponents.length > 0 ? liveComponents : defaultComponents;

  return {
    overall: deriveOverall(components),
    timestamp: new Date().toISOString(),
    components,
    incidents: await extractIncidents(),
    page: {
      name: "CX React Status",
      url: (process.env.NEXT_PUBLIC_SITE_URL ?? tenantConfig.siteUrl).replace(/\/$/, ""),
    },
  };
}

/**
 * Format for Betteruptime heartbeat / status-page API.
 * @see https://docs.betteruptime.com/api
 */
export async function buildBetterUptimePayload(): Promise<{
  status: string;
  components: { name: string; status: string }[];
  incidents: { name: string; status: string; started_at: string; resolved_at: string | null }[];
}> {
  const data = await buildStatusPayload();
  return {
    status: data.overall === "operational" ? "up" : data.overall === "degraded" ? "degraded" : "down",
    components: data.components.map((c) => ({
      name: c.name,
      status: c.status === "operational" ? "operational" : c.status === "degraded" ? "degraded_performance" : c.status === "down" ? "major_outage" : "under_maintenance",
    })),
    incidents: data.incidents.map((i) => ({
      name: i.title,
      status: i.status,
      started_at: i.createdAt,
      resolved_at: i.resolvedAt,
    })),
  };
}

/**
 * Format for Instatus status-page API.
 * @see https://instatus.com/help/api
 */
export async function buildInstatusPayload(): Promise<{
  status: "UP" | "HASISSUES" | "UNDERMAINTENANCE";
  components: { name: string; status: "OPERATIONAL" | "DEGRADEDPERFORMANCE" | "PARTIALOUTAGE" | "MAJOROUTAGE" | "UNDERMAINTENANCE" }[];
}> {
  const data = await buildStatusPayload();
  const statusMap: Record<string, "OPERATIONAL" | "DEGRADEDPERFORMANCE" | "PARTIALOUTAGE" | "MAJOROUTAGE" | "UNDERMAINTENANCE"> = {
    operational: "OPERATIONAL",
    degraded: "DEGRADEDPERFORMANCE",
    down: "MAJOROUTAGE",
    maintenance: "UNDERMAINTENANCE",
    unknown: "OPERATIONAL",
  };

  return {
    status: data.overall === "operational" ? "UP" : "HASISSUES",
    components: data.components.map((c) => ({
      name: c.name,
      status: statusMap[c.status] ?? "OPERATIONAL",
    })),
  };
}

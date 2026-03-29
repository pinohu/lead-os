import type { ProviderResult } from "../providers.ts";
import { getPool } from "../db.ts";

// ---------------------------------------------------------------------------
// OWOX BI Marketing Analytics Types
// ---------------------------------------------------------------------------

export interface OwoxConfig {
  apiKey: string;
  projectId: string;
  baseUrl: string;
}

export type AttributionModel =
  | "last-click"
  | "first-click"
  | "linear"
  | "time-decay"
  | "position-based"
  | "data-driven";

export interface MarketingEvent {
  id: string;
  source: string;
  medium: string;
  campaign?: string;
  channel: string;
  action: string;
  value?: number;
  leadId?: string;
  tenantId?: string;
  timestamp: string;
}

export interface AttributionReport {
  model: AttributionModel;
  channels: ChannelAttribution[];
  period: string;
  totalConversions: number;
  totalRevenue: number;
}

export interface ChannelAttribution {
  channel: string;
  source: string;
  conversions: number;
  revenue: number;
  cost: number;
  roas: number;
  contribution: number;
}

export interface CohortAnalysis {
  cohort: string;
  size: number;
  retention: number[];
  ltv: number;
}

export interface FunnelReport {
  name: string;
  steps: { name: string; visitors: number; conversionRate: number }[];
  overallConversionRate: number;
}

export interface OwoxStats {
  totalEvents: number;
  totalChannels: number;
  topChannel: string;
  avgRoas: number;
  totalRevenue: number;
  totalCost: number;
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

interface StoredOwoxRecord {
  id: string;
  type: "event" | "attribution" | "cohort" | "funnel";
  tenantId?: string;
  channel: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

const owoxStore = new Map<string, StoredOwoxRecord>();

let schemaEnsured = false;

// ---------------------------------------------------------------------------
// Config & Dry-run
// ---------------------------------------------------------------------------

export function resolveOwoxConfig(): OwoxConfig | null {
  const apiKey = process.env.OWOX_API_KEY ?? "";
  if (!apiKey) return null;
  return {
    apiKey,
    projectId: process.env.OWOX_PROJECT_ID ?? "",
    baseUrl: process.env.OWOX_BASE_URL ?? "https://api.owox.com/v1",
  };
}

export function isOwoxDryRun(): boolean {
  return !process.env.OWOX_API_KEY;
}

// ---------------------------------------------------------------------------
// Schema (lazy-init)
// ---------------------------------------------------------------------------

async function ensureOwoxSchema(): Promise<void> {
  if (schemaEnsured) return;
  const pool = getPool();
  if (!pool) return;

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lead_os_owox (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        tenant_id TEXT,
        channel TEXT NOT NULL DEFAULT '',
        payload JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    schemaEnsured = true;
  } catch {
    // Schema creation failed -- fall back to in-memory only
  }
}

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

function generateId(): string {
  return `owox_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

async function persistRecord(record: StoredOwoxRecord): Promise<void> {
  owoxStore.set(record.id, record);

  await ensureOwoxSchema();
  const pool = getPool();
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO lead_os_owox (id, type, tenant_id, channel, payload, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE
         SET type = EXCLUDED.type,
             tenant_id = EXCLUDED.tenant_id,
             channel = EXCLUDED.channel,
             payload = EXCLUDED.payload,
             created_at = EXCLUDED.created_at`,
        [record.id, record.type, record.tenantId ?? null, record.channel, JSON.stringify(record.payload), record.createdAt],
      );
    } catch {
      // DB write failed -- in-memory store is still valid
    }
  }
}

// ---------------------------------------------------------------------------
// Track Events
// ---------------------------------------------------------------------------

export async function trackEvent(
  event: Omit<MarketingEvent, "id">,
): Promise<MarketingEvent> {
  const id = generateId();
  const fullEvent: MarketingEvent = {
    id,
    ...event,
    timestamp: event.timestamp || new Date().toISOString(),
  };

  if (!isOwoxDryRun()) {
    const cfg = resolveOwoxConfig();
    if (cfg) {
      try {
        await fetch(`${cfg.baseUrl}/projects/${cfg.projectId}/events`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cfg.apiKey}`,
          },
          body: JSON.stringify(fullEvent),
          signal: AbortSignal.timeout(30_000),
        });
      } catch {
        // Fall through to local storage
      }
    }
  }

  await persistRecord({
    id,
    type: "event",
    tenantId: event.tenantId,
    channel: event.channel,
    payload: fullEvent as unknown as Record<string, unknown>,
    createdAt: fullEvent.timestamp,
  });

  return fullEvent;
}

export async function trackBulkEvents(
  events: Omit<MarketingEvent, "id">[],
): Promise<MarketingEvent[]> {
  const results: MarketingEvent[] = [];
  for (const event of events) {
    results.push(await trackEvent(event));
  }
  return results;
}

// ---------------------------------------------------------------------------
// List Events
// ---------------------------------------------------------------------------

export async function listEvents(
  filter?: {
    source?: string;
    channel?: string;
    tenantId?: string;
    dateFrom?: string;
    dateTo?: string;
  },
): Promise<MarketingEvent[]> {
  const allRecords = [...owoxStore.values()].filter((r) => r.type === "event");

  let events = allRecords.map((r) => r.payload as unknown as MarketingEvent);

  if (filter?.source) {
    events = events.filter((e) => e.source === filter.source);
  }
  if (filter?.channel) {
    events = events.filter((e) => e.channel === filter.channel);
  }
  if (filter?.tenantId) {
    events = events.filter((e) => e.tenantId === filter.tenantId);
  }
  if (filter?.dateFrom) {
    const from = new Date(filter.dateFrom).getTime();
    events = events.filter((e) => new Date(e.timestamp).getTime() >= from);
  }
  if (filter?.dateTo) {
    const to = new Date(filter.dateTo).getTime();
    events = events.filter((e) => new Date(e.timestamp).getTime() <= to);
  }

  return events;
}

// ---------------------------------------------------------------------------
// Attribution Report
// ---------------------------------------------------------------------------

function distributeCredit(
  model: AttributionModel,
  touchpointCount: number,
  index: number,
): number {
  if (touchpointCount === 0) return 0;
  if (touchpointCount === 1) return 1;

  switch (model) {
    case "last-click":
      return index === touchpointCount - 1 ? 1 : 0;
    case "first-click":
      return index === 0 ? 1 : 0;
    case "linear":
      return 1 / touchpointCount;
    case "time-decay": {
      // More weight to later touchpoints
      const weight = Math.pow(2, index);
      const totalWeight = Array.from({ length: touchpointCount }, (_, i) => Math.pow(2, i))
        .reduce((sum, w) => sum + w, 0);
      return weight / totalWeight;
    }
    case "position-based": {
      // 40% first, 40% last, 20% distributed among middle
      if (index === 0) return 0.4;
      if (index === touchpointCount - 1) return 0.4;
      const middleCount = touchpointCount - 2;
      return middleCount > 0 ? 0.2 / middleCount : 0;
    }
    case "data-driven":
      // Simulate data-driven as weighted linear
      return 1 / touchpointCount;
    default:
      return 1 / touchpointCount;
  }
}

export async function getAttributionReport(
  model: AttributionModel,
  period: string,
  tenantId?: string,
): Promise<AttributionReport> {
  const events = await listEvents({ tenantId });

  // Group events by channel
  const channelMap = new Map<string, { events: MarketingEvent[]; source: string }>();
  for (const event of events) {
    const existing = channelMap.get(event.channel);
    if (existing) {
      existing.events.push(event);
    } else {
      channelMap.set(event.channel, { events: [event], source: event.source });
    }
  }

  // Build sorted touchpoint list for attribution
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
  const touchpointCount = new Set(sortedEvents.map((e) => e.channel)).size;
  const uniqueChannels = [...new Set(sortedEvents.map((e) => e.channel))];

  let totalConversions = 0;
  let totalRevenue = 0;

  const channels: ChannelAttribution[] = uniqueChannels.map((channel, index) => {
    const channelData = channelMap.get(channel);
    const channelEvents = channelData?.events ?? [];
    const credit = distributeCredit(model, touchpointCount, index);

    const conversions = channelEvents.filter((e) => e.action === "conversion").length;
    const revenue = channelEvents.reduce((sum, e) => sum + (e.value ?? 0), 0);
    const cost = revenue * 0.3; // Simulate 30% cost ratio
    const roas = cost > 0 ? Number((revenue / cost).toFixed(2)) : 0;

    totalConversions += conversions;
    totalRevenue += revenue;

    return {
      channel,
      source: channelData?.source ?? "unknown",
      conversions,
      revenue: Number(revenue.toFixed(2)),
      cost: Number(cost.toFixed(2)),
      roas,
      contribution: Number((credit * 100).toFixed(2)),
    };
  });

  return {
    model,
    channels,
    period,
    totalConversions,
    totalRevenue: Number(totalRevenue.toFixed(2)),
  };
}

// ---------------------------------------------------------------------------
// Cohort Analysis
// ---------------------------------------------------------------------------

export async function getCohortAnalysis(
  tenantId?: string,
  period?: string,
): Promise<CohortAnalysis[]> {
  const events = await listEvents({ tenantId });

  // Group events by month cohort
  const cohortMap = new Map<string, MarketingEvent[]>();
  for (const event of events) {
    const date = new Date(event.timestamp);
    const cohortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const existing = cohortMap.get(cohortKey);
    if (existing) {
      existing.push(event);
    } else {
      cohortMap.set(cohortKey, [event]);
    }
  }

  // Standard retention curve for dry-run
  const retentionCurve = [100, 60, 40, 30, 25, 20];

  const cohorts: CohortAnalysis[] = [];
  for (const [cohortKey, cohortEvents] of cohortMap) {
    const uniqueLeads = new Set(cohortEvents.map((e) => e.leadId ?? e.source)).size;
    const totalValue = cohortEvents.reduce((sum, e) => sum + (e.value ?? 0), 0);

    cohorts.push({
      cohort: cohortKey,
      size: uniqueLeads,
      retention: retentionCurve.map((r) => Number(((r / 100) * uniqueLeads).toFixed(0))),
      ltv: uniqueLeads > 0 ? Number((totalValue / uniqueLeads).toFixed(2)) : 0,
    });
  }

  // If no events exist, return a single empty cohort
  if (cohorts.length === 0) {
    const now = new Date();
    cohorts.push({
      cohort: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
      size: 0,
      retention: retentionCurve.map(() => 0),
      ltv: 0,
    });
  }

  return cohorts;
}

// ---------------------------------------------------------------------------
// Funnel Report
// ---------------------------------------------------------------------------

export async function getFunnelReport(
  funnelName: string,
  steps: string[],
  tenantId?: string,
): Promise<FunnelReport> {
  const events = await listEvents({ tenantId });

  // Generate funnel with 25-35% dropoff per step
  const baseVisitors = events.length > 0
    ? events.length
    : 1000;

  const funnelSteps: { name: string; visitors: number; conversionRate: number }[] = [];
  let currentVisitors = baseVisitors;

  for (let i = 0; i < steps.length; i++) {
    const visitors = Math.round(currentVisitors);
    const conversionRate = i === 0
      ? 100
      : Number(((visitors / baseVisitors) * 100).toFixed(1));

    funnelSteps.push({
      name: steps[i],
      visitors,
      conversionRate,
    });

    // Apply 25-35% dropoff (deterministic based on step index)
    const dropoff = 0.25 + (i % 3) * 0.05;
    currentVisitors = currentVisitors * (1 - dropoff);
  }

  const lastStep = funnelSteps[funnelSteps.length - 1];
  const overallConversionRate = baseVisitors > 0 && lastStep
    ? Number(((lastStep.visitors / baseVisitors) * 100).toFixed(1))
    : 0;

  return {
    name: funnelName,
    steps: funnelSteps,
    overallConversionRate,
  };
}

// ---------------------------------------------------------------------------
// ROAS Calculation
// ---------------------------------------------------------------------------

export async function calculateRoas(
  channel: string,
  tenantId?: string,
): Promise<{ channel: string; revenue: number; cost: number; roas: number }> {
  const events = await listEvents({ channel, tenantId });

  const revenue = events.reduce((sum, e) => sum + (e.value ?? 0), 0);
  const cost = revenue * 0.3; // Simulate 30% cost ratio
  const roas = cost > 0 ? Number((revenue / cost).toFixed(2)) : 0;

  return {
    channel,
    revenue: Number(revenue.toFixed(2)),
    cost: Number(cost.toFixed(2)),
    roas,
  };
}

// ---------------------------------------------------------------------------
// Channel Performance
// ---------------------------------------------------------------------------

export async function getChannelPerformance(
  tenantId?: string,
): Promise<ChannelAttribution[]> {
  const events = await listEvents({ tenantId });

  const channelMap = new Map<string, { source: string; events: MarketingEvent[] }>();
  for (const event of events) {
    const existing = channelMap.get(event.channel);
    if (existing) {
      existing.events.push(event);
    } else {
      channelMap.set(event.channel, { source: event.source, events: [event] });
    }
  }

  const totalEvents = events.length;
  const channels: ChannelAttribution[] = [];

  for (const [channel, data] of channelMap) {
    const conversions = data.events.filter((e) => e.action === "conversion").length;
    const revenue = data.events.reduce((sum, e) => sum + (e.value ?? 0), 0);
    const cost = revenue * 0.3;
    const roas = cost > 0 ? Number((revenue / cost).toFixed(2)) : 0;
    const contribution = totalEvents > 0
      ? Number(((data.events.length / totalEvents) * 100).toFixed(2))
      : 0;

    channels.push({
      channel,
      source: data.source,
      conversions,
      revenue: Number(revenue.toFixed(2)),
      cost: Number(cost.toFixed(2)),
      roas,
      contribution,
    });
  }

  return channels.sort((a, b) => b.roas - a.roas);
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export async function getOwoxStats(tenantId?: string): Promise<OwoxStats> {
  const events = await listEvents({ tenantId });
  const channels = new Set(events.map((e) => e.channel));

  const totalRevenue = events.reduce((sum, e) => sum + (e.value ?? 0), 0);
  const totalCost = totalRevenue * 0.3;
  const avgRoas = totalCost > 0 ? Number((totalRevenue / totalCost).toFixed(2)) : 0;

  // Find top channel by event count
  const channelCounts = new Map<string, number>();
  for (const event of events) {
    channelCounts.set(event.channel, (channelCounts.get(event.channel) ?? 0) + 1);
  }
  let topChannel = "none";
  let maxCount = 0;
  for (const [channel, count] of channelCounts) {
    if (count > maxCount) {
      topChannel = channel;
      maxCount = count;
    }
  }

  return {
    totalEvents: events.length,
    totalChannels: channels.size,
    topChannel,
    avgRoas,
    totalRevenue: Number(totalRevenue.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
  };
}

// ---------------------------------------------------------------------------
// Provider bridge
// ---------------------------------------------------------------------------

export function owoxResult(op: string, detail: string): ProviderResult {
  return {
    ok: true,
    provider: "OWOX BI",
    mode: isOwoxDryRun() ? "dry-run" : "live",
    detail,
  };
}

// ---------------------------------------------------------------------------
// Reset (for tests)
// ---------------------------------------------------------------------------

export function resetOwoxStore(): void {
  owoxStore.clear();
  schemaEnsured = false;
}

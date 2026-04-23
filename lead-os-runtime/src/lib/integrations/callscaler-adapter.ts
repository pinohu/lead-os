import type { ProviderResult } from "../providers.ts";
import { getPool } from "../db.ts";

// ---------------------------------------------------------------------------
// CallScaler Call Tracking Types
// ---------------------------------------------------------------------------

export interface CallScalerConfig {
  apiKey: string;
  baseUrl: string;
}

export interface TrackingNumber {
  id: string;
  number: string;
  forwardTo: string;
  source: string;
  campaign?: string;
  tenantId?: string;
  status: "active" | "paused" | "released";
  createdAt: string;
}

export interface CallRecord {
  id: string;
  trackingNumberId: string;
  callerNumber: string;
  callerName?: string;
  callerCity?: string;
  callerState?: string;
  duration: number;
  status: "completed" | "missed" | "voicemail" | "busy";
  source: string;
  campaign?: string;
  recording?: string;
  startedAt: string;
  tenantId?: string;
}

export interface CallStats {
  totalCalls: number;
  completed: number;
  missed: number;
  voicemail: number;
  avgDuration: number;
  bySource: Record<string, number>;
  byCampaign: Record<string, number>;
  uniqueCallers: number;
  peakHour: number;
}

export interface ProvisionNumberInput {
  forwardTo: string;
  source: string;
  campaign?: string;
  areaCode?: string;
  tenantId?: string;
}

export interface SourceAttribution {
  source: string;
  calls: number;
  avgDuration: number;
  conversionRate: number;
}

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

const numberStore = new Map<string, TrackingNumber>();
const callStore = new Map<string, CallRecord>();

let schemaEnsured = false;

// ---------------------------------------------------------------------------
// Config & Dry-run
// ---------------------------------------------------------------------------

export function resolveCallScalerConfig(): CallScalerConfig | null {
  const apiKey = process.env.CALLSCALER_API_KEY ?? "";
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl: process.env.CALLSCALER_BASE_URL ?? "https://api.callscaler.com/v1",
  };
}

export function isCallScalerDryRun(): boolean {
  return !process.env.CALLSCALER_API_KEY;
}

// ---------------------------------------------------------------------------
// Schema (lazy-init)
// ---------------------------------------------------------------------------

async function ensureCallScalerSchema(): Promise<void> {
  if (schemaEnsured) return;
  const pool = getPool();
  if (!pool) return;

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lead_os_callscaler (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        tenant_id TEXT,
        payload JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    schemaEnsured = true;
  } catch {
    // Schema creation failed — fall back to in-memory only
  }
}

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

let idCounter = 0;

function generateId(prefix: string): string {
  idCounter += 1;
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${ts}${rand}${idCounter}`;
}

// ---------------------------------------------------------------------------
// Phone number generation (dry-run)
// ---------------------------------------------------------------------------

function generatePhoneNumber(areaCode?: string): string {
  const area = areaCode ?? "555";
  const exchange = String(Math.floor(Math.random() * 900) + 100);
  const subscriber = String(Math.floor(Math.random() * 9000) + 1000);
  return `+1${area}${exchange}${subscriber}`;
}

// ---------------------------------------------------------------------------
// DB persistence helpers
// ---------------------------------------------------------------------------

async function persistToDb(id: string, type: string, tenantId: string | undefined, payload: unknown): Promise<void> {
  await ensureCallScalerSchema();
  const pool = getPool();
  if (!pool) return;

  try {
    await pool.query(
      `INSERT INTO lead_os_callscaler (id, type, tenant_id, payload, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (id) DO UPDATE
       SET type = EXCLUDED.type,
           tenant_id = EXCLUDED.tenant_id,
           payload = EXCLUDED.payload`,
      [id, type, tenantId ?? null, JSON.stringify(payload)],
    );
  } catch {
    // DB write failed — in-memory store is still valid
  }
}

// ---------------------------------------------------------------------------
// Number Provisioning
// ---------------------------------------------------------------------------

export async function provisionNumber(input: ProvisionNumberInput): Promise<TrackingNumber> {
  const id = generateId("tn");
  const now = new Date().toISOString();

  if (!isCallScalerDryRun()) {
    const cfg = resolveCallScalerConfig();
    if (cfg) {
      try {
        const res = await fetch(`${cfg.baseUrl}/numbers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cfg.apiKey}`,
          },
          body: JSON.stringify(input),
          signal: AbortSignal.timeout(30_000),
        });

        if (res.ok) {
          const data = (await res.json()) as Record<string, unknown>;
          const number: TrackingNumber = {
            id: typeof data.id === "string" ? data.id : id,
            number: typeof data.number === "string" ? data.number : generatePhoneNumber(input.areaCode),
            forwardTo: input.forwardTo,
            source: input.source,
            campaign: input.campaign,
            tenantId: input.tenantId,
            status: "active",
            createdAt: now,
          };
          numberStore.set(number.id, number);
          await persistToDb(number.id, "number", input.tenantId, number);
          return number;
        }
      } catch {
        // Fall through to dry-run provisioning
      }
    }
  }

  const number: TrackingNumber = {
    id,
    number: generatePhoneNumber(input.areaCode),
    forwardTo: input.forwardTo,
    source: input.source,
    campaign: input.campaign,
    tenantId: input.tenantId,
    status: "active",
    createdAt: now,
  };

  numberStore.set(id, number);
  await persistToDb(id, "number", input.tenantId, number);
  return number;
}

// ---------------------------------------------------------------------------
// Number Management
// ---------------------------------------------------------------------------

export async function listNumbers(tenantId?: string): Promise<TrackingNumber[]> {
  const all = [...numberStore.values()];
  if (tenantId) {
    return all.filter((n) => n.tenantId === tenantId);
  }
  return all;
}

export async function getNumber(numberId: string): Promise<TrackingNumber | null> {
  return numberStore.get(numberId) ?? null;
}

export async function pauseNumber(numberId: string): Promise<TrackingNumber> {
  const number = numberStore.get(numberId);
  if (!number) throw new Error(`Tracking number ${numberId} not found`);
  if (number.status === "released") throw new Error(`Cannot pause a released number`);

  number.status = "paused";
  numberStore.set(numberId, number);
  await persistToDb(numberId, "number", number.tenantId, number);
  return number;
}

export async function resumeNumber(numberId: string): Promise<TrackingNumber> {
  const number = numberStore.get(numberId);
  if (!number) throw new Error(`Tracking number ${numberId} not found`);
  if (number.status === "released") throw new Error(`Cannot resume a released number`);

  number.status = "active";
  numberStore.set(numberId, number);
  await persistToDb(numberId, "number", number.tenantId, number);
  return number;
}

export async function releaseNumber(numberId: string): Promise<TrackingNumber> {
  const number = numberStore.get(numberId);
  if (!number) throw new Error(`Tracking number ${numberId} not found`);
  if (number.status === "released") throw new Error(`Number ${numberId} is already released`);

  number.status = "released";
  numberStore.set(numberId, number);
  await persistToDb(numberId, "number", number.tenantId, number);
  return number;
}

// ---------------------------------------------------------------------------
// Call Recording
// ---------------------------------------------------------------------------

export async function recordCall(call: Omit<CallRecord, "id">): Promise<CallRecord> {
  const id = generateId("call");

  if (!isCallScalerDryRun()) {
    const cfg = resolveCallScalerConfig();
    if (cfg) {
      try {
        const res = await fetch(`${cfg.baseUrl}/calls`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cfg.apiKey}`,
          },
          body: JSON.stringify(call),
          signal: AbortSignal.timeout(30_000),
        });

        if (res.ok) {
          const data = (await res.json()) as Record<string, unknown>;
          const record: CallRecord = {
            id: typeof data.id === "string" ? data.id : id,
            ...call,
          };
          callStore.set(record.id, record);
          await persistToDb(record.id, "call", call.tenantId, record);
          return record;
        }
      } catch {
        // Fall through to local storage
      }
    }
  }

  const record: CallRecord = { id, ...call };
  callStore.set(id, record);
  await persistToDb(id, "call", call.tenantId, record);
  return record;
}

// ---------------------------------------------------------------------------
// Call Retrieval
// ---------------------------------------------------------------------------

export async function getCall(callId: string): Promise<CallRecord | null> {
  return callStore.get(callId) ?? null;
}

export interface CallFilter {
  trackingNumberId?: string;
  source?: string;
  campaign?: string;
  status?: string;
  tenantId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function listCalls(filter?: CallFilter): Promise<CallRecord[]> {
  let calls = [...callStore.values()];

  if (filter) {
    if (filter.trackingNumberId) {
      calls = calls.filter((c) => c.trackingNumberId === filter.trackingNumberId);
    }
    if (filter.source) {
      calls = calls.filter((c) => c.source === filter.source);
    }
    if (filter.campaign) {
      calls = calls.filter((c) => c.campaign === filter.campaign);
    }
    if (filter.status) {
      calls = calls.filter((c) => c.status === filter.status);
    }
    if (filter.tenantId) {
      calls = calls.filter((c) => c.tenantId === filter.tenantId);
    }
    if (filter.dateFrom) {
      const from = new Date(filter.dateFrom).getTime();
      calls = calls.filter((c) => new Date(c.startedAt).getTime() >= from);
    }
    if (filter.dateTo) {
      const to = new Date(filter.dateTo).getTime();
      calls = calls.filter((c) => new Date(c.startedAt).getTime() <= to);
    }
  }

  return calls;
}

// ---------------------------------------------------------------------------
// Call Stats
// ---------------------------------------------------------------------------

export async function getCallStats(tenantId?: string): Promise<CallStats> {
  let calls = [...callStore.values()];
  if (tenantId) {
    calls = calls.filter((c) => c.tenantId === tenantId);
  }

  const totalCalls = calls.length;
  const completed = calls.filter((c) => c.status === "completed").length;
  const missed = calls.filter((c) => c.status === "missed").length;
  const voicemail = calls.filter((c) => c.status === "voicemail").length;

  const totalDuration = calls.reduce((sum, c) => sum + c.duration, 0);
  const avgDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;

  const bySource: Record<string, number> = {};
  for (const c of calls) {
    bySource[c.source] = (bySource[c.source] ?? 0) + 1;
  }

  const byCampaign: Record<string, number> = {};
  for (const c of calls) {
    if (c.campaign) {
      byCampaign[c.campaign] = (byCampaign[c.campaign] ?? 0) + 1;
    }
  }

  const uniqueCallers = new Set(calls.map((c) => c.callerNumber)).size;

  const hourCounts: Record<number, number> = {};
  for (const c of calls) {
    const hour = new Date(c.startedAt).getUTCHours();
    hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
  }

  let peakHour = 0;
  let peakCount = 0;
  for (const [hour, count] of Object.entries(hourCounts)) {
    if (count > peakCount) {
      peakCount = count;
      peakHour = Number(hour);
    }
  }

  return {
    totalCalls,
    completed,
    missed,
    voicemail,
    avgDuration,
    bySource,
    byCampaign,
    uniqueCallers,
    peakHour,
  };
}

// ---------------------------------------------------------------------------
// Source Attribution
// ---------------------------------------------------------------------------

export async function getSourceAttribution(tenantId?: string): Promise<SourceAttribution[]> {
  let calls = [...callStore.values()];
  if (tenantId) {
    calls = calls.filter((c) => c.tenantId === tenantId);
  }

  const sourceMap = new Map<string, { calls: number; totalDuration: number; completed: number }>();

  for (const c of calls) {
    const entry = sourceMap.get(c.source) ?? { calls: 0, totalDuration: 0, completed: 0 };
    entry.calls += 1;
    entry.totalDuration += c.duration;
    if (c.status === "completed") {
      entry.completed += 1;
    }
    sourceMap.set(c.source, entry);
  }

  const results: SourceAttribution[] = [];
  for (const [source, data] of sourceMap) {
    results.push({
      source,
      calls: data.calls,
      avgDuration: data.calls > 0 ? Math.round(data.totalDuration / data.calls) : 0,
      conversionRate: data.calls > 0 ? Math.round((data.completed / data.calls) * 100) : 0,
    });
  }

  return results.sort((a, b) => b.calls - a.calls);
}

// ---------------------------------------------------------------------------
// Call-to-Lead Conversion
// ---------------------------------------------------------------------------

export async function convertCallToLead(callId: string, tenantId?: string): Promise<Record<string, unknown>> {
  const call = callStore.get(callId);
  if (!call) throw new Error(`Call ${callId} not found`);

  const lead: Record<string, unknown> = {
    id: generateId("lead"),
    source: "phone_call",
    channel: "callscaler",
    phone: call.callerNumber,
    name: call.callerName ?? null,
    city: call.callerCity ?? null,
    state: call.callerState ?? null,
    campaignSource: call.source,
    campaign: call.campaign ?? null,
    callId: call.id,
    callDuration: call.duration,
    callStatus: call.status,
    tenantId: tenantId ?? call.tenantId ?? null,
    createdAt: new Date().toISOString(),
  };

  await persistToDb(lead.id as string, "lead", (tenantId ?? call.tenantId), lead);
  return lead;
}

// ---------------------------------------------------------------------------
// Provider bridge
// ---------------------------------------------------------------------------

export function callScalerResult(operation: string, detail: string): ProviderResult {
  return {
    ok: true,
    provider: "CallScaler",
    mode: isCallScalerDryRun() ? "dry-run" : "live",
    detail,
    payload: { operation },
  };
}

// ---------------------------------------------------------------------------
// Reset (for tests)
// ---------------------------------------------------------------------------

export function resetCallScalerStore(): void {
  numberStore.clear();
  callStore.clear();
  schemaEnsured = false;
  idCounter = 0;
}

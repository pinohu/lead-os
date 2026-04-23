import type { ProviderResult } from "../providers.ts";
import { getPool } from "../db.ts";

// ---------------------------------------------------------------------------
// Novocall Callback Widget Types
// ---------------------------------------------------------------------------

export interface NovocallConfig {
  apiKey: string;
  baseUrl: string;
  widgetId: string;
}

export type CallbackStatus = "pending" | "scheduled" | "connected" | "completed" | "missed" | "cancelled";

export interface CallbackRequest {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  preferredTime?: string;
  status: CallbackStatus;
  source: string;
  page?: string;
  duration?: number;
  assignedTo?: string;
  tenantId?: string;
  createdAt: string;
  connectedAt?: string;
  completedAt?: string;
}

export type WidgetPosition = "bottom-right" | "bottom-left";

export interface BusinessHours {
  day: string;
  start: string;
  end: string;
}

export interface CallbackWidget {
  id: string;
  name: string;
  buttonText: string;
  buttonColor: string;
  position: WidgetPosition;
  businessHours: BusinessHours[];
  greeting: string;
  fields: string[];
  tenantId?: string;
}

export interface AvailableSlot {
  day: string;
  start: string;
  end: string;
}

export interface CallbackSchedule {
  id: string;
  name: string;
  availableSlots: AvailableSlot[];
  timezone: string;
  tenantId?: string;
}

export interface NovocallStats {
  totalCallbacks: number;
  connected: number;
  missed: number;
  completed: number;
  avgWaitSeconds: number;
  avgDuration: number;
  conversionRate: number;
  bySource: Record<string, number>;
  peakHour: number;
}

export interface CallbackFilter {
  status?: string;
  source?: string;
  tenantId?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

const callbackStore = new Map<string, CallbackRequest>();
const widgetStore = new Map<string, CallbackWidget>();
const scheduleStore = new Map<string, CallbackSchedule>();

let schemaEnsured = false;

// ---------------------------------------------------------------------------
// Config & Dry-run
// ---------------------------------------------------------------------------

export function resolveNovocallConfig(): NovocallConfig | null {
  const apiKey = process.env.NOVOCALL_API_KEY ?? "";
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl: process.env.NOVOCALL_BASE_URL ?? "https://api.novocall.co/v1",
    widgetId: process.env.NOVOCALL_WIDGET_ID ?? "",
  };
}

export function isNovocallDryRun(): boolean {
  return !process.env.NOVOCALL_API_KEY;
}

// ---------------------------------------------------------------------------
// Schema (lazy-init)
// ---------------------------------------------------------------------------

async function ensureNovocallSchema(): Promise<void> {
  if (schemaEnsured) return;
  const pool = getPool();
  if (!pool) return;

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lead_os_novocall (
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
// DB persistence helpers
// ---------------------------------------------------------------------------

async function persistToDb(id: string, type: string, tenantId: string | undefined, payload: unknown): Promise<void> {
  await ensureNovocallSchema();
  const pool = getPool();
  if (!pool) return;

  try {
    await pool.query(
      `INSERT INTO lead_os_novocall (id, type, tenant_id, payload, created_at)
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
// Callback Requests
// ---------------------------------------------------------------------------

export interface RequestCallbackInput {
  name: string;
  phone: string;
  email?: string;
  company?: string;
  preferredTime?: string;
  source?: string;
  page?: string;
  tenantId?: string;
}

export async function requestCallback(input: RequestCallbackInput): Promise<CallbackRequest> {
  const id = generateId("cb");
  const now = new Date().toISOString();

  if (!isNovocallDryRun()) {
    const cfg = resolveNovocallConfig();
    if (cfg) {
      try {
        const res = await fetch(`${cfg.baseUrl}/callbacks`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cfg.apiKey}`,
          },
          body: JSON.stringify({ ...input, widgetId: cfg.widgetId }),
          signal: AbortSignal.timeout(30_000),
        });

        if (res.ok) {
          const data = (await res.json()) as Record<string, unknown>;
          const callback: CallbackRequest = {
            id: typeof data.id === "string" ? data.id : id,
            name: input.name,
            phone: input.phone,
            email: input.email,
            company: input.company,
            preferredTime: input.preferredTime,
            status: "pending",
            source: input.source ?? "widget",
            page: input.page,
            tenantId: input.tenantId,
            createdAt: now,
          };
          callbackStore.set(callback.id, callback);
          await persistToDb(callback.id, "callback", input.tenantId, callback);
          return callback;
        }
      } catch {
        // Fall through to dry-run
      }
    }
  }

  const callback: CallbackRequest = {
    id,
    name: input.name,
    phone: input.phone,
    email: input.email,
    company: input.company,
    preferredTime: input.preferredTime,
    status: input.preferredTime ? "scheduled" : "pending",
    source: input.source ?? "widget",
    page: input.page,
    tenantId: input.tenantId,
    createdAt: now,
  };

  callbackStore.set(id, callback);
  await persistToDb(id, "callback", input.tenantId, callback);
  return callback;
}

export async function getCallbackRequest(id: string): Promise<CallbackRequest | null> {
  return callbackStore.get(id) ?? null;
}

export async function listCallbackRequests(filter?: CallbackFilter): Promise<CallbackRequest[]> {
  let callbacks = [...callbackStore.values()];

  if (filter) {
    if (filter.status) {
      callbacks = callbacks.filter((c) => c.status === filter.status);
    }
    if (filter.source) {
      callbacks = callbacks.filter((c) => c.source === filter.source);
    }
    if (filter.tenantId) {
      callbacks = callbacks.filter((c) => c.tenantId === filter.tenantId);
    }
    if (filter.dateFrom) {
      const from = new Date(filter.dateFrom).getTime();
      callbacks = callbacks.filter((c) => new Date(c.createdAt).getTime() >= from);
    }
    if (filter.dateTo) {
      const to = new Date(filter.dateTo).getTime();
      callbacks = callbacks.filter((c) => new Date(c.createdAt).getTime() <= to);
    }
  }

  return callbacks;
}

export async function updateCallbackStatus(
  id: string,
  status: CallbackStatus,
  duration?: number,
): Promise<CallbackRequest> {
  const callback = callbackStore.get(id);
  if (!callback) throw new Error(`Callback ${id} not found`);

  callback.status = status;
  const now = new Date().toISOString();

  if (status === "connected") {
    callback.connectedAt = now;
  }
  if (status === "completed") {
    callback.completedAt = now;
    if (duration !== undefined) {
      callback.duration = duration;
    }
  }
  if (duration !== undefined && status !== "completed") {
    callback.duration = duration;
  }

  callbackStore.set(id, callback);
  await persistToDb(id, "callback", callback.tenantId, callback);
  return callback;
}

// ---------------------------------------------------------------------------
// Callback Widgets
// ---------------------------------------------------------------------------

export interface CreateWidgetInput {
  name: string;
  buttonText: string;
  buttonColor: string;
  position: WidgetPosition;
  businessHours: BusinessHours[];
  greeting: string;
  fields: string[];
  tenantId?: string;
}

export async function createWidget(input: CreateWidgetInput): Promise<CallbackWidget> {
  const id = generateId("wgt");

  const widget: CallbackWidget = {
    id,
    name: input.name,
    buttonText: input.buttonText,
    buttonColor: input.buttonColor,
    position: input.position,
    businessHours: input.businessHours,
    greeting: input.greeting,
    fields: input.fields,
    tenantId: input.tenantId,
  };

  widgetStore.set(id, widget);
  await persistToDb(id, "widget", input.tenantId, widget);
  return widget;
}

export async function getWidget(widgetId: string): Promise<CallbackWidget | null> {
  return widgetStore.get(widgetId) ?? null;
}

export async function listWidgets(tenantId?: string): Promise<CallbackWidget[]> {
  const all = [...widgetStore.values()];
  if (tenantId) {
    return all.filter((w) => w.tenantId === tenantId);
  }
  return all;
}

export function generateWidgetEmbed(widgetId: string): string | null {
  const widget = widgetStore.get(widgetId);
  if (!widget) return null;

  const cfg = resolveNovocallConfig();
  const baseUrl = cfg?.baseUrl ?? "https://api.novocall.co/v1";

  return `<!-- Novocall Callback Widget -->
<div id="novocall-widget-${widget.id}" data-widget-id="${widget.id}" data-position="${widget.position}"></div>
<script src="${baseUrl}/widget.js" data-api-key="${cfg?.apiKey ?? "DRY_RUN"}" data-widget-id="${widget.id}" data-button-text="${widget.buttonText}" data-button-color="${widget.buttonColor}" data-position="${widget.position}" data-greeting="${widget.greeting}" async></script>`;
}

// ---------------------------------------------------------------------------
// Callback Schedules
// ---------------------------------------------------------------------------

export interface CreateScheduleInput {
  name: string;
  availableSlots: AvailableSlot[];
  timezone: string;
  tenantId?: string;
}

export async function createSchedule(input: CreateScheduleInput): Promise<CallbackSchedule> {
  const id = generateId("sched");

  const schedule: CallbackSchedule = {
    id,
    name: input.name,
    availableSlots: input.availableSlots,
    timezone: input.timezone,
    tenantId: input.tenantId,
  };

  scheduleStore.set(id, schedule);
  await persistToDb(id, "schedule", input.tenantId, schedule);
  return schedule;
}

export async function getAvailableSlots(scheduleId: string, date: string): Promise<AvailableSlot[]> {
  const schedule = scheduleStore.get(scheduleId);
  if (!schedule) return [];

  const dateObj = new Date(date);
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayName = dayNames[dateObj.getUTCDay()]!;

  return schedule.availableSlots.filter((slot) => slot.day.toLowerCase() === dayName.toLowerCase());
}

// ---------------------------------------------------------------------------
// Callback-to-Lead Conversion
// ---------------------------------------------------------------------------

export async function convertCallbackToLead(callbackId: string, tenantId?: string): Promise<Record<string, unknown>> {
  const callback = callbackStore.get(callbackId);
  if (!callback) throw new Error(`Callback ${callbackId} not found`);

  const lead: Record<string, unknown> = {
    id: generateId("lead"),
    source: "callback",
    channel: "novocall",
    phone: callback.phone,
    name: callback.name,
    email: callback.email ?? null,
    company: callback.company ?? null,
    callbackId: callback.id,
    callbackStatus: callback.status,
    callbackDuration: callback.duration ?? null,
    page: callback.page ?? null,
    tenantId: tenantId ?? callback.tenantId ?? null,
    createdAt: new Date().toISOString(),
  };

  await persistToDb(lead.id as string, "lead", (tenantId ?? callback.tenantId), lead);
  return lead;
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export async function getNovocallStats(tenantId?: string): Promise<NovocallStats> {
  let callbacks = [...callbackStore.values()];
  if (tenantId) {
    callbacks = callbacks.filter((c) => c.tenantId === tenantId);
  }

  const totalCallbacks = callbacks.length;
  const connected = callbacks.filter((c) => c.status === "connected").length;
  const missed = callbacks.filter((c) => c.status === "missed").length;
  const completed = callbacks.filter((c) => c.status === "completed").length;

  const withWait = callbacks.filter((c) => c.connectedAt && c.createdAt);
  const totalWaitMs = withWait.reduce((sum, c) => {
    return sum + (new Date(c.connectedAt!).getTime() - new Date(c.createdAt).getTime());
  }, 0);
  const avgWaitSeconds = withWait.length > 0 ? Math.round(totalWaitMs / withWait.length / 1000) : 0;

  const withDuration = callbacks.filter((c) => typeof c.duration === "number");
  const totalDuration = withDuration.reduce((sum, c) => sum + (c.duration ?? 0), 0);
  const avgDuration = withDuration.length > 0 ? Math.round(totalDuration / withDuration.length) : 0;

  const conversionRate = totalCallbacks > 0
    ? Math.round((completed / totalCallbacks) * 100)
    : 0;

  const bySource: Record<string, number> = {};
  for (const c of callbacks) {
    bySource[c.source] = (bySource[c.source] ?? 0) + 1;
  }

  const hourCounts: Record<number, number> = {};
  for (const c of callbacks) {
    const hour = new Date(c.createdAt).getUTCHours();
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
    totalCallbacks,
    connected,
    missed,
    completed,
    avgWaitSeconds,
    avgDuration,
    conversionRate,
    bySource,
    peakHour,
  };
}

// ---------------------------------------------------------------------------
// Provider bridge
// ---------------------------------------------------------------------------

export function novocallResult(operation: string, detail: string): ProviderResult {
  return {
    ok: true,
    provider: "Novocall",
    mode: isNovocallDryRun() ? "dry-run" : "live",
    detail,
    payload: { operation },
  };
}

// ---------------------------------------------------------------------------
// Reset (for tests)
// ---------------------------------------------------------------------------

export function resetNovocallStore(): void {
  callbackStore.clear();
  widgetStore.clear();
  scheduleStore.clear();
  schemaEnsured = false;
  idCounter = 0;
}

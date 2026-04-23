import { randomUUID } from "crypto";
import { BaseAdapter } from "./adapter-base.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ClaspoConfig {
  apiKey: string;
  baseUrl?: string;
}

export type WidgetType = "popup" | "banner" | "floating-bar" | "spin-to-win";

export interface WidgetTargeting {
  exitIntent?: boolean;
  scrollDepth?: number;
  timeOnPage?: number;
  geo?: string[];
  device?: ("desktop" | "mobile" | "tablet")[];
}

export interface ClaspoWidget {
  id: string;
  tenantId: string;
  name: string;
  type: WidgetType;
  targeting: WidgetTargeting;
  html: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CapturedLead {
  id: string;
  widgetId: string;
  email: string;
  name?: string;
  capturedAt: string;
  metadata: Record<string, unknown>;
}

export interface AbTestVariant {
  id: string;
  widgetId: string;
  name: string;
  weight: number;
  impressions: number;
  conversions: number;
}

// ---------------------------------------------------------------------------
// Shared adapter instance & in-memory stores
// ---------------------------------------------------------------------------

const adapter = new BaseAdapter("Claspo", "CLASPO", "https://api.claspo.io/v1");

const widgetStore = new Map<string, ClaspoWidget>();
const capturedLeadStore = new Map<string, CapturedLead[]>();
const abTestStore = new Map<string, AbTestVariant[]>();

export function resetClaspoStore(): void {
  widgetStore.clear();
  capturedLeadStore.clear();
  abTestStore.clear();
  adapter.resetStore();
}

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

export async function healthCheck(config?: ClaspoConfig): Promise<{ ok: boolean; message: string }> {
  return adapter.healthCheck(config);
}

// ---------------------------------------------------------------------------
// Widget CRUD
// ---------------------------------------------------------------------------

export async function createWidget(
  tenantId: string,
  name: string,
  type: WidgetType,
  targeting: WidgetTargeting,
  html: string,
): Promise<ClaspoWidget> {
  const now = new Date().toISOString();
  const widget: ClaspoWidget = {
    id: `widget-${randomUUID()}`,
    tenantId,
    name,
    type,
    targeting,
    html,
    active: true,
    createdAt: now,
    updatedAt: now,
  };
  widgetStore.set(widget.id, widget);
  return widget;
}

export async function getWidget(widgetId: string): Promise<ClaspoWidget | undefined> {
  return widgetStore.get(widgetId);
}

export async function listWidgets(tenantId: string): Promise<ClaspoWidget[]> {
  return [...widgetStore.values()].filter((w) => w.tenantId === tenantId);
}

export async function deleteWidget(widgetId: string): Promise<boolean> {
  return widgetStore.delete(widgetId);
}

// ---------------------------------------------------------------------------
// Embed script generation
// ---------------------------------------------------------------------------

export function generateEmbedScript(widgetId: string, config?: ClaspoConfig): string {
  const cfg = adapter.resolveConfig(config);
  return `<script src="${cfg.baseUrl}/embed/${widgetId}.js" data-claspo-key="${cfg.apiKey}" async></script>`;
}

// ---------------------------------------------------------------------------
// Lead capture
// ---------------------------------------------------------------------------

export async function recordCapturedLead(
  widgetId: string,
  email: string,
  name?: string,
  metadata?: Record<string, unknown>,
): Promise<CapturedLead> {
  const lead: CapturedLead = {
    id: `clead-${randomUUID()}`,
    widgetId,
    email,
    name,
    capturedAt: new Date().toISOString(),
    metadata: metadata ?? {},
  };
  const existing = capturedLeadStore.get(widgetId) ?? [];
  existing.push(lead);
  capturedLeadStore.set(widgetId, existing);
  return lead;
}

export async function getCapturedLeads(widgetId: string): Promise<CapturedLead[]> {
  return capturedLeadStore.get(widgetId) ?? [];
}

// ---------------------------------------------------------------------------
// A/B testing
// ---------------------------------------------------------------------------

export async function createAbTest(
  widgetId: string,
  variants: { name: string; weight: number }[],
): Promise<AbTestVariant[]> {
  const created = variants.map((v) => ({
    id: `var-${randomUUID()}`,
    widgetId,
    name: v.name,
    weight: v.weight,
    impressions: 0,
    conversions: 0,
  }));
  abTestStore.set(widgetId, created);
  return created;
}

export async function getAbTestResults(widgetId: string): Promise<AbTestVariant[]> {
  return abTestStore.get(widgetId) ?? [];
}

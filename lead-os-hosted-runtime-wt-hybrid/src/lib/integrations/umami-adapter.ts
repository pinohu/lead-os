import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UmamiConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface UmamiSite {
  id: string;
  tenantId: string;
  domain: string;
  name: string;
  trackingCode: string;
  createdAt: string;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface PageviewEntry {
  path: string;
  views: number;
  uniqueViews: number;
}

export interface PageviewData {
  total: number;
  unique: number;
  pageviews: PageviewEntry[];
}

export interface EventData {
  name: string;
  count: number;
  metadata: Record<string, unknown>;
}

export type MetricType = "url" | "referrer" | "browser" | "os" | "device" | "country" | "language";

export interface MetricData {
  name: string;
  value: number;
}

export interface FunnelStep {
  name: string;
  visitors: number;
  dropoff: number;
}

export interface FunnelData {
  steps: FunnelStep[];
  overallConversion: number;
}

export interface LeadTrackingEvent {
  visitorId: string;
  event: "form_submit" | "cta_click" | "page_view" | "scroll_depth";
  metadata: Record<string, unknown>;
}

export interface LeadConversionMetrics {
  totalVisitors: number;
  leadsGenerated: number;
  conversionRate: number;
  topConvertingPages: { path: string; conversions: number }[];
  topReferrers: { source: string; conversions: number }[];
}

export interface TrafficSource {
  source: string;
  visitors: number;
  leads: number;
  conversionRate: number;
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const siteStore = new Map<string, UmamiSite>();
const pageviewStore = new Map<string, PageviewEntry[]>();
const eventStore = new Map<string, EventData[]>();
const leadEventStore = new Map<string, LeadTrackingEvent[]>();

export function resetUmamiStore(): void {
  siteStore.clear();
  pageviewStore.clear();
  eventStore.clear();
  leadEventStore.clear();
}

export function _getSiteStoreForTesting(): Map<string, UmamiSite> {
  return siteStore;
}

export function _getLeadEventStoreForTesting(): Map<string, LeadTrackingEvent[]> {
  return leadEventStore;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

function resolveConfig(config?: UmamiConfig): UmamiConfig {
  return {
    apiKey: config?.apiKey ?? process.env.UMAMI_API_KEY ?? "",
    baseUrl: config?.baseUrl ?? process.env.UMAMI_BASE_URL ?? "https://api.umami.is/v1",
  };
}

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

export async function healthCheck(config?: UmamiConfig): Promise<{ ok: boolean; message: string }> {
  const cfg = resolveConfig(config);
  if (!cfg.apiKey) {
    return { ok: false, message: "Umami API key not configured" };
  }

  try {
    const res = await fetch(`${cfg.baseUrl}/me`, {
      headers: { Authorization: `Bearer ${cfg.apiKey}` },
    });
    return res.ok
      ? { ok: true, message: "Umami connection verified" }
      : { ok: false, message: `Umami returned ${res.status}` };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Connection failed" };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateTrackingCode(siteId: string): string {
  return `<script defer src="https://analytics.leados.io/script.js" data-website-id="${siteId}"></script>`;
}

function filterByDateRange<T extends { metadata?: Record<string, unknown> }>(
  items: T[],
  _range: DateRange,
): T[] {
  return items;
}

// ---------------------------------------------------------------------------
// Site management
// ---------------------------------------------------------------------------

export async function createSite(tenantId: string, domain: string): Promise<UmamiSite> {
  const site: UmamiSite = {
    id: `site-${randomUUID()}`,
    tenantId,
    domain,
    name: domain.replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/.*$/, ""),
    trackingCode: "",
    createdAt: new Date().toISOString(),
  };
  site.trackingCode = generateTrackingCode(site.id);
  siteStore.set(site.id, site);
  return site;
}

export async function getSite(siteId: string): Promise<UmamiSite> {
  const site = siteStore.get(siteId);
  if (!site) throw new Error(`Site not found: ${siteId}`);
  return site;
}

export async function listSites(tenantId: string): Promise<UmamiSite[]> {
  return [...siteStore.values()].filter((s) => s.tenantId === tenantId);
}

export async function deleteSite(siteId: string): Promise<void> {
  if (!siteStore.has(siteId)) throw new Error(`Site not found: ${siteId}`);
  siteStore.delete(siteId);
  pageviewStore.delete(siteId);
  eventStore.delete(siteId);
  leadEventStore.delete(siteId);
}

// ---------------------------------------------------------------------------
// Analytics — Pageviews
// ---------------------------------------------------------------------------

export async function recordPageview(siteId: string, path: string, isUnique: boolean): Promise<void> {
  if (!siteStore.has(siteId)) throw new Error(`Site not found: ${siteId}`);

  const views = pageviewStore.get(siteId) ?? [];
  const existing = views.find((v) => v.path === path);
  if (existing) {
    existing.views += 1;
    if (isUnique) existing.uniqueViews += 1;
  } else {
    views.push({ path, views: 1, uniqueViews: isUnique ? 1 : 0 });
  }
  pageviewStore.set(siteId, views);
}

export async function getPageviews(siteId: string, range: DateRange): Promise<PageviewData> {
  if (!siteStore.has(siteId)) throw new Error(`Site not found: ${siteId}`);

  const views = pageviewStore.get(siteId) ?? [];
  const total = views.reduce((sum, v) => sum + v.views, 0);
  const unique = views.reduce((sum, v) => sum + v.uniqueViews, 0);

  return { total, unique, pageviews: views };
}

// ---------------------------------------------------------------------------
// Analytics — Events
// ---------------------------------------------------------------------------

export async function recordEvent(siteId: string, name: string, metadata?: Record<string, unknown>): Promise<void> {
  if (!siteStore.has(siteId)) throw new Error(`Site not found: ${siteId}`);

  const events = eventStore.get(siteId) ?? [];
  const existing = events.find((e) => e.name === name);
  if (existing) {
    existing.count += 1;
  } else {
    events.push({ name, count: 1, metadata: metadata ?? {} });
  }
  eventStore.set(siteId, events);
}

export async function getEvents(siteId: string, range: DateRange): Promise<EventData[]> {
  if (!siteStore.has(siteId)) throw new Error(`Site not found: ${siteId}`);
  return eventStore.get(siteId) ?? [];
}

// ---------------------------------------------------------------------------
// Analytics — Metrics
// ---------------------------------------------------------------------------

export async function getMetrics(siteId: string, range: DateRange, type: MetricType): Promise<MetricData[]> {
  if (!siteStore.has(siteId)) throw new Error(`Site not found: ${siteId}`);

  const views = pageviewStore.get(siteId) ?? [];

  if (type === "url") {
    return views.map((v) => ({ name: v.path, value: v.views }));
  }

  return [{ name: type, value: views.reduce((sum, v) => sum + v.views, 0) }];
}

// ---------------------------------------------------------------------------
// Analytics — Funnel
// ---------------------------------------------------------------------------

export async function getFunnelAnalytics(siteId: string, steps: string[]): Promise<FunnelData> {
  if (!siteStore.has(siteId)) throw new Error(`Site not found: ${siteId}`);

  const views = pageviewStore.get(siteId) ?? [];
  const funnelSteps: FunnelStep[] = [];
  let previousVisitors = 0;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]!;
    const pageview = views.find((v) => v.path === step);
    const visitors = pageview?.uniqueViews ?? 0;

    const dropoff = i === 0 ? 0 : Math.max(0, previousVisitors - visitors);

    funnelSteps.push({ name: step, visitors, dropoff });
    previousVisitors = visitors;
  }

  const firstVisitors = funnelSteps[0]?.visitors ?? 0;
  const lastVisitors = funnelSteps[funnelSteps.length - 1]?.visitors ?? 0;
  const overallConversion = firstVisitors > 0
    ? Math.round((lastVisitors / firstVisitors) * 100)
    : 0;

  return { steps: funnelSteps, overallConversion };
}

// ---------------------------------------------------------------------------
// Analytics — Realtime
// ---------------------------------------------------------------------------

export async function getRealtimeVisitors(siteId: string): Promise<number> {
  if (!siteStore.has(siteId)) throw new Error(`Site not found: ${siteId}`);

  const events = leadEventStore.get(siteId) ?? [];
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  const recentVisitors = new Set(
    events
      .filter((e) => {
        const ts = e.metadata.timestamp;
        return typeof ts === "number" && ts > fiveMinutesAgo;
      })
      .map((e) => e.visitorId),
  );
  return recentVisitors.size;
}

// ---------------------------------------------------------------------------
// Lead tracking
// ---------------------------------------------------------------------------

export async function trackLeadEvent(siteId: string, event: LeadTrackingEvent): Promise<void> {
  if (!siteStore.has(siteId)) throw new Error(`Site not found: ${siteId}`);

  const events = leadEventStore.get(siteId) ?? [];
  events.push({ ...event, metadata: { ...event.metadata, timestamp: Date.now() } });
  leadEventStore.set(siteId, events);

  await recordEvent(siteId, event.event, event.metadata);
}

export async function getLeadConversionMetrics(siteId: string, range: DateRange): Promise<LeadConversionMetrics> {
  if (!siteStore.has(siteId)) throw new Error(`Site not found: ${siteId}`);

  const events = leadEventStore.get(siteId) ?? [];
  const views = pageviewStore.get(siteId) ?? [];

  const totalVisitors = views.reduce((sum, v) => sum + v.uniqueViews, 0);
  const formSubmits = events.filter((e) => e.event === "form_submit");
  const leadsGenerated = new Set(formSubmits.map((e) => e.visitorId)).size;
  const conversionRate = totalVisitors > 0
    ? Math.round((leadsGenerated / totalVisitors) * 100 * 100) / 100
    : 0;

  const pageConversions: Record<string, number> = {};
  for (const e of formSubmits) {
    const page = String(e.metadata.page ?? "/");
    pageConversions[page] = (pageConversions[page] ?? 0) + 1;
  }
  const topConvertingPages = Object.entries(pageConversions)
    .map(([path, conversions]) => ({ path, conversions }))
    .sort((a, b) => b.conversions - a.conversions)
    .slice(0, 10);

  const referrerConversions: Record<string, number> = {};
  for (const e of formSubmits) {
    const source = String(e.metadata.referrer ?? "direct");
    referrerConversions[source] = (referrerConversions[source] ?? 0) + 1;
  }
  const topReferrers = Object.entries(referrerConversions)
    .map(([source, conversions]) => ({ source, conversions }))
    .sort((a, b) => b.conversions - a.conversions)
    .slice(0, 10);

  return { totalVisitors, leadsGenerated, conversionRate, topConvertingPages, topReferrers };
}

export async function getTrafficSources(siteId: string, range: DateRange): Promise<TrafficSource[]> {
  if (!siteStore.has(siteId)) throw new Error(`Site not found: ${siteId}`);

  const events = leadEventStore.get(siteId) ?? [];
  const sourceMap: Record<string, { visitors: Set<string>; leads: Set<string> }> = {};

  for (const e of events) {
    const source = String(e.metadata.referrer ?? "direct");
    if (!sourceMap[source]) {
      sourceMap[source] = { visitors: new Set(), leads: new Set() };
    }
    sourceMap[source]!.visitors.add(e.visitorId);
    if (e.event === "form_submit") {
      sourceMap[source]!.leads.add(e.visitorId);
    }
  }

  return Object.entries(sourceMap)
    .map(([source, data]) => {
      const visitors = data.visitors.size;
      const leads = data.leads.size;
      const conversionRate = visitors > 0
        ? Math.round((leads / visitors) * 100 * 100) / 100
        : 0;
      return { source, visitors, leads, conversionRate };
    })
    .sort((a, b) => b.visitors - a.visitors);
}

import type { ProviderResult } from "../providers.ts";
import { getPool } from "../db.ts";

// ---------------------------------------------------------------------------
// Happierleads Website Visitor Identification Types
// ---------------------------------------------------------------------------

export interface HappierleadsConfig {
  apiKey: string;
  baseUrl: string;
  siteId: string;
}

export interface PageView {
  url: string;
  title: string;
  duration: number;
  timestamp: string;
}

export interface IdentifiedVisitor {
  id: string;
  companyName: string;
  domain: string;
  industry: string;
  size: string;
  revenue?: string;
  location: string;
  country: string;
  pageViews: PageView[];
  totalVisits: number;
  firstVisitAt: string;
  lastVisitAt: string;
  engagementScore: number;
  tenantId?: string;
}

export interface VisitorFilter {
  minEngagement?: number;
  industry?: string;
  location?: string;
  dateFrom?: string;
  dateTo?: string;
  minVisits?: number;
}

export interface VisitorStats {
  totalIdentified: number;
  totalPageViews: number;
  avgEngagement: number;
  topIndustries: { industry: string; count: number }[];
  topPages: { url: string; views: number }[];
  newThisWeek: number;
}

export interface TrackingSnippet {
  siteId: string;
  script: string;
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const visitorStore = new Map<string, IdentifiedVisitor>();

let schemaEnsured = false;

// ---------------------------------------------------------------------------
// Config & Dry-run
// ---------------------------------------------------------------------------

export function resolveHappierleadsConfig(): HappierleadsConfig | null {
  const apiKey = process.env.HAPPIERLEADS_API_KEY ?? "";
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl: process.env.HAPPIERLEADS_BASE_URL ?? "https://api.happierleads.com/v1",
    siteId: process.env.HAPPIERLEADS_SITE_ID ?? "",
  };
}

export function isHappierleadsDryRun(): boolean {
  return !process.env.HAPPIERLEADS_API_KEY;
}

// ---------------------------------------------------------------------------
// Schema (lazy-init)
// ---------------------------------------------------------------------------

async function ensureHappierleadsSchema(): Promise<void> {
  if (schemaEnsured) return;
  const pool = getPool();
  if (!pool) return;

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lead_os_happierleads_visitors (
        id TEXT NOT NULL,
        tenant_id TEXT,
        domain TEXT,
        payload JSONB NOT NULL DEFAULT '{}',
        engagement_score INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (id)
      )
    `);
    schemaEnsured = true;
  } catch {
    // Schema creation failed -- fall back to in-memory only
  }
}

// ---------------------------------------------------------------------------
// Dry-run seed data
// ---------------------------------------------------------------------------

const SEED_COMPANIES: Omit<IdentifiedVisitor, "id">[] = [
  { companyName: "Acme Corp", domain: "acme.com", industry: "Technology", size: "51-200", revenue: "$10M-$50M", location: "San Francisco, CA", country: "US", pageViews: [{ url: "/pricing", title: "Pricing", duration: 120, timestamp: "2026-03-28T10:00:00Z" }, { url: "/features", title: "Features", duration: 90, timestamp: "2026-03-28T10:02:00Z" }], totalVisits: 8, firstVisitAt: "2026-03-15T08:00:00Z", lastVisitAt: "2026-03-28T10:02:00Z", engagementScore: 85 },
  { companyName: "Globex Industries", domain: "globex.com", industry: "Manufacturing", size: "201-500", revenue: "$50M-$100M", location: "Chicago, IL", country: "US", pageViews: [{ url: "/demo", title: "Request Demo", duration: 180, timestamp: "2026-03-27T14:30:00Z" }], totalVisits: 5, firstVisitAt: "2026-03-20T09:00:00Z", lastVisitAt: "2026-03-27T14:30:00Z", engagementScore: 78 },
  { companyName: "Initech Solutions", domain: "initech.io", industry: "Technology", size: "11-50", revenue: "$1M-$10M", location: "Austin, TX", country: "US", pageViews: [{ url: "/blog/lead-gen", title: "Lead Generation Guide", duration: 240, timestamp: "2026-03-28T11:00:00Z" }, { url: "/pricing", title: "Pricing", duration: 60, timestamp: "2026-03-28T11:04:00Z" }], totalVisits: 12, firstVisitAt: "2026-03-10T07:00:00Z", lastVisitAt: "2026-03-28T11:04:00Z", engagementScore: 92 },
  { companyName: "Soylent Corp", domain: "soylent-corp.com", industry: "Food & Beverage", size: "501-1000", revenue: "$100M-$500M", location: "Los Angeles, CA", country: "US", pageViews: [{ url: "/", title: "Homepage", duration: 30, timestamp: "2026-03-26T16:00:00Z" }], totalVisits: 2, firstVisitAt: "2026-03-25T10:00:00Z", lastVisitAt: "2026-03-26T16:00:00Z", engagementScore: 25 },
  { companyName: "Umbrella GmbH", domain: "umbrella.de", industry: "Healthcare", size: "1001-5000", revenue: "$500M+", location: "Berlin", country: "DE", pageViews: [{ url: "/enterprise", title: "Enterprise Solutions", duration: 300, timestamp: "2026-03-28T09:00:00Z" }, { url: "/case-studies", title: "Case Studies", duration: 200, timestamp: "2026-03-28T09:05:00Z" }, { url: "/pricing", title: "Pricing", duration: 150, timestamp: "2026-03-28T09:10:00Z" }], totalVisits: 15, firstVisitAt: "2026-03-01T08:00:00Z", lastVisitAt: "2026-03-28T09:10:00Z", engagementScore: 95 },
  { companyName: "Wayne Enterprises", domain: "wayne.co", industry: "Finance", size: "5001-10000", revenue: "$500M+", location: "New York, NY", country: "US", pageViews: [{ url: "/integrations", title: "Integrations", duration: 90, timestamp: "2026-03-27T13:00:00Z" }], totalVisits: 3, firstVisitAt: "2026-03-22T11:00:00Z", lastVisitAt: "2026-03-27T13:00:00Z", engagementScore: 45 },
  { companyName: "Stark Digital", domain: "stark.digital", industry: "Technology", size: "11-50", location: "Seattle, WA", country: "US", pageViews: [{ url: "/pricing", title: "Pricing", duration: 100, timestamp: "2026-03-28T15:00:00Z" }, { url: "/signup", title: "Sign Up", duration: 60, timestamp: "2026-03-28T15:02:00Z" }], totalVisits: 6, firstVisitAt: "2026-03-18T09:00:00Z", lastVisitAt: "2026-03-28T15:02:00Z", engagementScore: 72 },
  { companyName: "Oscorp Ltd", domain: "oscorp.co.uk", industry: "Biotech", size: "201-500", revenue: "$50M-$100M", location: "London", country: "GB", pageViews: [{ url: "/api-docs", title: "API Documentation", duration: 400, timestamp: "2026-03-28T12:00:00Z" }], totalVisits: 9, firstVisitAt: "2026-03-12T08:00:00Z", lastVisitAt: "2026-03-28T12:00:00Z", engagementScore: 80 },
  { companyName: "Cyberdyne Systems", domain: "cyberdyne.jp", industry: "Robotics", size: "51-200", revenue: "$10M-$50M", location: "Tokyo", country: "JP", pageViews: [{ url: "/", title: "Homepage", duration: 20, timestamp: "2026-03-25T06:00:00Z" }], totalVisits: 1, firstVisitAt: "2026-03-25T06:00:00Z", lastVisitAt: "2026-03-25T06:00:00Z", engagementScore: 10 },
  { companyName: "Pied Piper Inc", domain: "piedpiper.com", industry: "Technology", size: "1-10", revenue: "$1M-$10M", location: "Palo Alto, CA", country: "US", pageViews: [{ url: "/features", title: "Features", duration: 180, timestamp: "2026-03-28T08:00:00Z" }, { url: "/pricing", title: "Pricing", duration: 120, timestamp: "2026-03-28T08:03:00Z" }, { url: "/demo", title: "Request Demo", duration: 90, timestamp: "2026-03-28T08:05:00Z" }], totalVisits: 10, firstVisitAt: "2026-03-05T10:00:00Z", lastVisitAt: "2026-03-28T08:05:00Z", engagementScore: 88 },
  { companyName: "Hooli", domain: "hooli.xyz", industry: "Technology", size: "5001-10000", revenue: "$500M+", location: "Mountain View, CA", country: "US", pageViews: [{ url: "/enterprise", title: "Enterprise Solutions", duration: 60, timestamp: "2026-03-27T10:00:00Z" }], totalVisits: 4, firstVisitAt: "2026-03-20T14:00:00Z", lastVisitAt: "2026-03-27T10:00:00Z", engagementScore: 55 },
  { companyName: "Bluth Company", domain: "bluthco.com", industry: "Real Estate", size: "11-50", location: "Newport Beach, CA", country: "US", pageViews: [{ url: "/blog/crm-tips", title: "CRM Tips", duration: 300, timestamp: "2026-03-28T07:00:00Z" }], totalVisits: 7, firstVisitAt: "2026-03-14T11:00:00Z", lastVisitAt: "2026-03-28T07:00:00Z", engagementScore: 65 },
  { companyName: "Wonka Industries", domain: "wonka.ch", industry: "Food & Beverage", size: "201-500", revenue: "$100M-$500M", location: "Zurich", country: "CH", pageViews: [{ url: "/", title: "Homepage", duration: 45, timestamp: "2026-03-23T15:00:00Z" }, { url: "/about", title: "About Us", duration: 30, timestamp: "2026-03-23T15:01:00Z" }], totalVisits: 3, firstVisitAt: "2026-03-21T09:00:00Z", lastVisitAt: "2026-03-23T15:01:00Z", engagementScore: 35 },
  { companyName: "Tyrell Corp", domain: "tyrell.ai", industry: "Artificial Intelligence", size: "51-200", revenue: "$10M-$50M", location: "San Jose, CA", country: "US", pageViews: [{ url: "/pricing", title: "Pricing", duration: 200, timestamp: "2026-03-28T16:00:00Z" }, { url: "/demo", title: "Request Demo", duration: 150, timestamp: "2026-03-28T16:04:00Z" }], totalVisits: 11, firstVisitAt: "2026-03-08T10:00:00Z", lastVisitAt: "2026-03-28T16:04:00Z", engagementScore: 90 },
  { companyName: "Massive Dynamic", domain: "massivedynamic.com", industry: "Conglomerate", size: "1001-5000", revenue: "$500M+", location: "Boston, MA", country: "US", pageViews: [{ url: "/case-studies", title: "Case Studies", duration: 250, timestamp: "2026-03-28T14:00:00Z" }], totalVisits: 6, firstVisitAt: "2026-03-16T08:00:00Z", lastVisitAt: "2026-03-28T14:00:00Z", engagementScore: 70 },
];

function seedDryRunVisitors(): void {
  if (visitorStore.size > 0) return;
  for (let i = 0; i < SEED_COMPANIES.length; i++) {
    const seed = SEED_COMPANIES[i];
    const id = `hl_visitor_${String(i + 1).padStart(3, "0")}`;
    visitorStore.set(id, { id, ...seed });
  }
}

// ---------------------------------------------------------------------------
// Get Identified Visitors
// ---------------------------------------------------------------------------

export async function getIdentifiedVisitors(filter?: VisitorFilter): Promise<IdentifiedVisitor[]> {
  if (isHappierleadsDryRun()) {
    seedDryRunVisitors();
    return applyFilter([...visitorStore.values()], filter);
  }

  const cfg = resolveHappierleadsConfig();
  if (!cfg) {
    seedDryRunVisitors();
    return applyFilter([...visitorStore.values()], filter);
  }

  try {
    const url = new URL(`${cfg.baseUrl}/sites/${cfg.siteId}/visitors`);
    if (filter?.minEngagement) url.searchParams.set("min_score", String(filter.minEngagement));
    if (filter?.dateFrom) url.searchParams.set("from", filter.dateFrom);
    if (filter?.dateTo) url.searchParams.set("to", filter.dateTo);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${cfg.apiKey}` },
      signal: AbortSignal.timeout(30_000),
    });

    if (res.ok) {
      const data = (await res.json()) as { visitors?: Record<string, unknown>[] };
      const visitors = (data.visitors ?? []).map(mapApiVisitor);
      for (const v of visitors) visitorStore.set(v.id, v);
      return applyFilter(visitors, filter);
    }
  } catch {
    // Fall through to in-memory store
  }

  return applyFilter([...visitorStore.values()], filter);
}

function mapApiVisitor(raw: Record<string, unknown>): IdentifiedVisitor {
  return {
    id: String(raw.id ?? ""),
    companyName: String(raw.company_name ?? raw.companyName ?? ""),
    domain: String(raw.domain ?? ""),
    industry: String(raw.industry ?? ""),
    size: String(raw.size ?? raw.employee_range ?? ""),
    revenue: raw.revenue != null ? String(raw.revenue) : undefined,
    location: String(raw.location ?? raw.city ?? ""),
    country: String(raw.country ?? raw.country_code ?? ""),
    pageViews: Array.isArray(raw.page_views) ? raw.page_views.map(mapApiPageView) : [],
    totalVisits: typeof raw.total_visits === "number" ? raw.total_visits : 0,
    firstVisitAt: String(raw.first_visit_at ?? raw.firstVisitAt ?? ""),
    lastVisitAt: String(raw.last_visit_at ?? raw.lastVisitAt ?? ""),
    engagementScore: typeof raw.engagement_score === "number" ? raw.engagement_score : 0,
    tenantId: raw.tenant_id != null ? String(raw.tenant_id) : undefined,
  };
}

function mapApiPageView(raw: Record<string, unknown>): PageView {
  return {
    url: String(raw.url ?? ""),
    title: String(raw.title ?? ""),
    duration: typeof raw.duration === "number" ? raw.duration : 0,
    timestamp: String(raw.timestamp ?? ""),
  };
}

function applyFilter(visitors: IdentifiedVisitor[], filter?: VisitorFilter): IdentifiedVisitor[] {
  if (!filter) return visitors;

  let result = visitors;

  if (filter.minEngagement != null) {
    result = result.filter((v) => v.engagementScore >= filter.minEngagement!);
  }
  if (filter.industry) {
    const lower = filter.industry.toLowerCase();
    result = result.filter((v) => v.industry.toLowerCase() === lower);
  }
  if (filter.location) {
    const lower = filter.location.toLowerCase();
    result = result.filter((v) => v.location.toLowerCase().includes(lower));
  }
  if (filter.dateFrom) {
    const from = new Date(filter.dateFrom).getTime();
    result = result.filter((v) => new Date(v.lastVisitAt).getTime() >= from);
  }
  if (filter.dateTo) {
    const to = new Date(filter.dateTo).getTime();
    result = result.filter((v) => new Date(v.lastVisitAt).getTime() <= to);
  }
  if (filter.minVisits != null) {
    result = result.filter((v) => v.totalVisits >= filter.minVisits!);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Visitor Detail
// ---------------------------------------------------------------------------

export async function getVisitorDetail(visitorId: string): Promise<IdentifiedVisitor | null> {
  if (isHappierleadsDryRun()) {
    seedDryRunVisitors();
  }

  const cached = visitorStore.get(visitorId);
  if (cached) return cached;

  const cfg = resolveHappierleadsConfig();
  if (!cfg) return null;

  try {
    const res = await fetch(`${cfg.baseUrl}/visitors/${visitorId}`, {
      headers: { Authorization: `Bearer ${cfg.apiKey}` },
      signal: AbortSignal.timeout(30_000),
    });

    if (res.ok) {
      const data = (await res.json()) as Record<string, unknown>;
      const visitor = mapApiVisitor(data);
      visitorStore.set(visitor.id, visitor);
      return visitor;
    }
  } catch {
    // Fall through
  }

  return null;
}

// ---------------------------------------------------------------------------
// Record Visitor
// ---------------------------------------------------------------------------

export async function recordVisitor(visitor: Omit<IdentifiedVisitor, "id">): Promise<IdentifiedVisitor> {
  const id = `hl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const full: IdentifiedVisitor = { id, ...visitor };

  visitorStore.set(id, full);

  await persistVisitor(full);

  return full;
}

async function persistVisitor(visitor: IdentifiedVisitor): Promise<void> {
  await ensureHappierleadsSchema();
  const pool = getPool();
  if (!pool) return;

  try {
    await pool.query(
      `INSERT INTO lead_os_happierleads_visitors (id, tenant_id, domain, payload, engagement_score, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE
       SET tenant_id = EXCLUDED.tenant_id,
           domain = EXCLUDED.domain,
           payload = EXCLUDED.payload,
           engagement_score = EXCLUDED.engagement_score,
           updated_at = NOW()`,
      [visitor.id, visitor.tenantId ?? null, visitor.domain, JSON.stringify(visitor), visitor.engagementScore],
    );
  } catch {
    // DB write failed -- in-memory store is still valid
  }
}

// ---------------------------------------------------------------------------
// Lookup by Domain
// ---------------------------------------------------------------------------

export async function getVisitorByDomain(domain: string): Promise<IdentifiedVisitor | null> {
  if (isHappierleadsDryRun()) {
    seedDryRunVisitors();
  }

  const lower = domain.toLowerCase();
  for (const visitor of visitorStore.values()) {
    if (visitor.domain.toLowerCase() === lower) return visitor;
  }

  await ensureHappierleadsSchema();
  const pool = getPool();
  if (pool) {
    try {
      const { rows } = await pool.query<{ payload: IdentifiedVisitor }>(
        `SELECT payload FROM lead_os_happierleads_visitors WHERE domain = $1 LIMIT 1`,
        [domain],
      );
      if (rows.length > 0) return rows[0].payload;
    } catch {
      // DB read failed
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Hot Visitors
// ---------------------------------------------------------------------------

export async function getHotVisitors(minEngagement?: number): Promise<IdentifiedVisitor[]> {
  const threshold = minEngagement ?? 70;
  return getIdentifiedVisitors({ minEngagement: threshold });
}

// ---------------------------------------------------------------------------
// Visitor Stats
// ---------------------------------------------------------------------------

export async function getVisitorStats(tenantId?: string): Promise<VisitorStats> {
  if (isHappierleadsDryRun()) {
    seedDryRunVisitors();
  }

  const all = [...visitorStore.values()];
  const filtered = tenantId ? all.filter((v) => v.tenantId === tenantId) : all;

  const totalIdentified = filtered.length;
  const totalPageViews = filtered.reduce((sum, v) => sum + v.pageViews.length, 0);
  const avgEngagement = totalIdentified > 0
    ? Math.round(filtered.reduce((sum, v) => sum + v.engagementScore, 0) / totalIdentified)
    : 0;

  const industryCounts = new Map<string, number>();
  for (const v of filtered) {
    industryCounts.set(v.industry, (industryCounts.get(v.industry) ?? 0) + 1);
  }
  const topIndustries = [...industryCounts.entries()]
    .map(([industry, count]) => ({ industry, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const pageCounts = new Map<string, number>();
  for (const v of filtered) {
    for (const pv of v.pageViews) {
      pageCounts.set(pv.url, (pageCounts.get(pv.url) ?? 0) + 1);
    }
  }
  const topPages = [...pageCounts.entries()]
    .map(([url, views]) => ({ url, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const newThisWeek = filtered.filter((v) => v.firstVisitAt >= oneWeekAgo).length;

  return { totalIdentified, totalPageViews, avgEngagement, topIndustries, topPages, newThisWeek };
}

// ---------------------------------------------------------------------------
// Tracking Snippet
// ---------------------------------------------------------------------------

export function generateTrackingSnippet(siteId?: string): TrackingSnippet {
  const resolvedSiteId = siteId ?? process.env.HAPPIERLEADS_SITE_ID ?? "SITE_ID_PLACEHOLDER";
  const script = `<script>
(function(h,a,p,i,e,r){h._hlq=h._hlq||[];
h._hlSettings={siteId:'${resolvedSiteId}'};
e=a.createElement(p);r=a.getElementsByTagName(p)[0];
e.async=1;e.src=i;r.parentNode.insertBefore(e,r);
})(window,document,'script','https://cdn.happierleads.com/tracker.js');
</script>`;

  return { siteId: resolvedSiteId, script };
}

// ---------------------------------------------------------------------------
// Convert Visitor to Lead
// ---------------------------------------------------------------------------

export async function convertVisitorToLead(
  visitorId: string,
  tenantId?: string,
): Promise<{ leadKey: string; companyName: string; engagementScore: number }> {
  if (isHappierleadsDryRun()) {
    seedDryRunVisitors();
  }

  const visitor = visitorStore.get(visitorId);
  if (!visitor) {
    throw new Error(`Visitor not found: ${visitorId}`);
  }

  const leadKey = `lead_hl_${visitor.domain.replace(/\./g, "_")}_${Date.now()}`;

  if (tenantId) {
    visitor.tenantId = tenantId;
    visitorStore.set(visitorId, visitor);
  }

  await persistVisitor(visitor);

  return {
    leadKey,
    companyName: visitor.companyName,
    engagementScore: visitor.engagementScore,
  };
}

// ---------------------------------------------------------------------------
// Sync Visitors
// ---------------------------------------------------------------------------

export async function syncVisitors(tenantId?: string): Promise<{ synced: number; total: number }> {
  if (isHappierleadsDryRun()) {
    seedDryRunVisitors();
    const visitors = [...visitorStore.values()];
    if (tenantId) {
      for (const v of visitors) {
        v.tenantId = tenantId;
        visitorStore.set(v.id, v);
      }
    }
    return { synced: visitors.length, total: visitors.length };
  }

  const cfg = resolveHappierleadsConfig();
  if (!cfg) {
    return { synced: 0, total: visitorStore.size };
  }

  try {
    const res = await fetch(`${cfg.baseUrl}/sites/${cfg.siteId}/visitors`, {
      headers: { Authorization: `Bearer ${cfg.apiKey}` },
      signal: AbortSignal.timeout(30_000),
    });

    if (res.ok) {
      const data = (await res.json()) as { visitors?: Record<string, unknown>[] };
      const visitors = (data.visitors ?? []).map(mapApiVisitor);
      for (const v of visitors) {
        if (tenantId) v.tenantId = tenantId;
        visitorStore.set(v.id, v);
        await persistVisitor(v);
      }
      return { synced: visitors.length, total: visitorStore.size };
    }
  } catch {
    // Fall through
  }

  return { synced: 0, total: visitorStore.size };
}

// ---------------------------------------------------------------------------
// Provider bridge
// ---------------------------------------------------------------------------

export function happierleadsResult(operation: string, detail: string): ProviderResult {
  return {
    ok: true,
    provider: "Happierleads",
    mode: isHappierleadsDryRun() ? "dry-run" : "live",
    detail: `[${operation}] ${detail}`,
  };
}

// ---------------------------------------------------------------------------
// Reset (for tests)
// ---------------------------------------------------------------------------

export function resetHappierleadsStore(): void {
  visitorStore.clear();
  schemaEnsured = false;
}

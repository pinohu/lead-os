import type { ProviderResult } from "../providers.ts";
import { getPool } from "../db.ts";

// ---------------------------------------------------------------------------
// Plerdy Heatmap & SEO Analysis Types
// ---------------------------------------------------------------------------

export interface PlerdyConfig {
  apiKey: string;
  siteId: string;
  baseUrl: string;
}

export type DeviceType = "desktop" | "mobile" | "tablet";

export interface ClickPoint {
  x: number;
  y: number;
  element: string;
  count: number;
}

export interface HeatmapData {
  url: string;
  clicks: ClickPoint[];
  scrollDepth: number[];
  totalSessions: number;
  device: DeviceType;
  period: string;
}

export interface SessionRecording {
  id: string;
  visitorId: string;
  url: string;
  duration: number;
  clicks: number;
  scrollDepth: number;
  device: string;
  country: string;
  recordedAt: string;
}

export interface SeoIssue {
  type: string;
  severity: "critical" | "warning" | "info";
  description: string;
  element?: string;
  recommendation: string;
}

export interface SeoAudit {
  url: string;
  score: number;
  issues: SeoIssue[];
  auditedAt: string;
}

export interface FunnelStep {
  url: string;
  name: string;
  visitors: number;
  dropoffRate: number;
}

export interface ConversionFunnel {
  id: string;
  name: string;
  steps: FunnelStep[];
  tenantId?: string;
}

export interface PlerdyStats {
  totalPages: number;
  totalSessions: number;
  avgScrollDepth: number;
  avgSeoScore: number;
  topClickedElements: { element: string; clicks: number }[];
  funnelCount: number;
}

interface RecordingFilter {
  url?: string;
  minDuration?: number;
  device?: string;
}

interface StoredEntry {
  id: string;
  type: string;
  tenantId?: string;
  url?: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const plerdyStore = new Map<string, StoredEntry>();

let schemaEnsured = false;

// ---------------------------------------------------------------------------
// Config & Dry-run
// ---------------------------------------------------------------------------

export function resolvePlerdyConfig(): PlerdyConfig | null {
  const apiKey = process.env.PLERDY_API_KEY ?? "";
  const siteId = process.env.PLERDY_SITE_ID ?? "";
  if (!apiKey || !siteId) return null;
  return {
    apiKey,
    siteId,
    baseUrl: process.env.PLERDY_BASE_URL ?? "https://api.plerdy.com/v1",
  };
}

export function isPlerdyDryRun(): boolean {
  return !process.env.PLERDY_API_KEY;
}

// ---------------------------------------------------------------------------
// Schema (lazy-init)
// ---------------------------------------------------------------------------

async function ensurePlerdySchema(): Promise<void> {
  if (schemaEnsured) return;
  const pool = getPool();
  if (!pool) return;

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lead_os_plerdy (
        id TEXT NOT NULL,
        type TEXT NOT NULL,
        tenant_id TEXT,
        url TEXT,
        payload JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (id)
      )
    `);
    schemaEnsured = true;
  } catch {
    // Schema creation failed — fall back to in-memory only
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function generateId(prefix: string): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${ts}_${rand}`;
}

function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return () => {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff;
    return (hash % 1000) / 1000;
  };
}

async function persistEntry(entry: StoredEntry): Promise<void> {
  plerdyStore.set(entry.id, entry);

  await ensurePlerdySchema();
  const pool = getPool();
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO lead_os_plerdy (id, type, tenant_id, url, payload, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE
         SET type = EXCLUDED.type,
             tenant_id = EXCLUDED.tenant_id,
             url = EXCLUDED.url,
             payload = EXCLUDED.payload,
             created_at = EXCLUDED.created_at`,
        [entry.id, entry.type, entry.tenantId ?? null, entry.url ?? null, JSON.stringify(entry.payload), entry.createdAt],
      );
    } catch {
      // DB write failed — in-memory store is still valid
    }
  }
}

// ---------------------------------------------------------------------------
// Dry-run data generators
// ---------------------------------------------------------------------------

const COMMON_ELEMENTS = [
  "nav > a.logo",
  "button.cta-primary",
  "input[name='email']",
  "a.pricing-link",
  "button.submit",
  "div.hero-image",
  "a.signup-link",
  "footer > a.contact",
  "button.close-modal",
  "a.learn-more",
];

const COUNTRIES = ["US", "GB", "DE", "FR", "CA", "AU", "NL", "SE", "JP", "BR"];

function generateDryRunClickPoints(url: string): ClickPoint[] {
  const rng = seededRandom(url);
  const count = 5 + Math.floor(rng() * 6);
  const points: ClickPoint[] = [];
  for (let i = 0; i < count; i++) {
    points.push({
      x: Math.floor(rng() * 1200),
      y: Math.floor(rng() * 800),
      element: COMMON_ELEMENTS[Math.floor(rng() * COMMON_ELEMENTS.length)],
      count: Math.floor(rng() * 200) + 10,
    });
  }
  return points;
}

function generateDryRunScrollDepth(url: string): number[] {
  const rng = seededRandom(url + "-scroll");
  const depths: number[] = [];
  let current = 100;
  for (let i = 0; i < 10; i++) {
    current = Math.max(5, current - Math.floor(rng() * 15));
    depths.push(current);
  }
  return depths;
}

const SEO_ISSUE_TEMPLATES: SeoIssue[] = [
  { type: "missing_alt", severity: "warning", description: "Image missing alt text", element: "img.hero-bg", recommendation: "Add descriptive alt text to all images for accessibility and SEO" },
  { type: "slow_loading", severity: "critical", description: "Page load time exceeds 3 seconds", recommendation: "Optimize images, minify CSS/JS, and enable caching" },
  { type: "missing_meta", severity: "warning", description: "Missing meta description", element: "head", recommendation: "Add a unique meta description between 120-160 characters" },
  { type: "missing_h1", severity: "critical", description: "Page missing H1 heading", recommendation: "Add exactly one H1 tag that describes the page content" },
  { type: "broken_link", severity: "warning", description: "Internal link returns 404", element: "a[href='/old-page']", recommendation: "Fix or remove broken links to improve crawlability" },
  { type: "duplicate_title", severity: "warning", description: "Title tag duplicated across pages", element: "title", recommendation: "Create unique, descriptive titles for each page" },
  { type: "missing_canonical", severity: "info", description: "Missing canonical URL tag", element: "head", recommendation: "Add a canonical link element to prevent duplicate content issues" },
  { type: "large_images", severity: "warning", description: "Images not optimized for web", element: "img.product-photo", recommendation: "Compress images and use modern formats like WebP or AVIF" },
  { type: "no_ssl", severity: "critical", description: "Page served over HTTP", recommendation: "Enable HTTPS across the entire site" },
  { type: "low_text_ratio", severity: "info", description: "Low text-to-HTML ratio", recommendation: "Add more meaningful content to the page body" },
  { type: "missing_viewport", severity: "critical", description: "Missing viewport meta tag", element: "head", recommendation: "Add <meta name='viewport' content='width=device-width, initial-scale=1'>" },
  { type: "render_blocking", severity: "warning", description: "Render-blocking CSS resources detected", recommendation: "Defer non-critical CSS or inline critical styles" },
];

function generateDryRunSeoIssues(url: string): SeoIssue[] {
  const rng = seededRandom(url + "-seo");
  const count = 3 + Math.floor(rng() * 5);
  const issues: SeoIssue[] = [];
  const used = new Set<number>();
  for (let i = 0; i < count && used.size < SEO_ISSUE_TEMPLATES.length; i++) {
    let idx = Math.floor(rng() * SEO_ISSUE_TEMPLATES.length);
    while (used.has(idx)) {
      idx = (idx + 1) % SEO_ISSUE_TEMPLATES.length;
    }
    used.add(idx);
    issues.push({ ...SEO_ISSUE_TEMPLATES[idx] });
  }
  return issues;
}

function generateDryRunRecordings(filter?: RecordingFilter): SessionRecording[] {
  const seed = (filter?.url ?? "all") + (filter?.device ?? "");
  const rng = seededRandom(seed);
  const count = 10 + Math.floor(rng() * 11);
  const devices = ["desktop", "mobile", "tablet"];
  const urls = [
    "/", "/pricing", "/features", "/signup", "/lp/demo",
    "/lp/trial", "/about", "/contact", "/blog", "/docs",
  ];
  const recordings: SessionRecording[] = [];

  for (let i = 0; i < count; i++) {
    const duration = Math.floor(rng() * 300) + 15;
    const device = devices[Math.floor(rng() * devices.length)];
    const url = filter?.url ?? urls[Math.floor(rng() * urls.length)];

    if (filter?.minDuration && duration < filter.minDuration) continue;
    if (filter?.device && device !== filter.device) continue;

    recordings.push({
      id: `rec_${i}_${seed.replace(/[^a-z0-9]/gi, "")}`,
      visitorId: `vis_${Math.floor(rng() * 99999)}`,
      url,
      duration,
      clicks: Math.floor(rng() * 50) + 1,
      scrollDepth: Math.floor(rng() * 100),
      device,
      country: COUNTRIES[Math.floor(rng() * COUNTRIES.length)],
      recordedAt: new Date(Date.now() - Math.floor(rng() * 7 * 86400000)).toISOString(),
    });
  }

  return recordings;
}

// ---------------------------------------------------------------------------
// 1. getHeatmapData
// ---------------------------------------------------------------------------

export async function getHeatmapData(
  url: string,
  device: DeviceType = "desktop",
  period: string = "7d",
): Promise<HeatmapData> {
  if (!isPlerdyDryRun()) {
    const cfg = resolvePlerdyConfig();
    if (cfg) {
      try {
        const res = await fetch(
          `${cfg.baseUrl}/heatmaps?url=${encodeURIComponent(url)}&device=${device}&period=${period}&site_id=${cfg.siteId}`,
          {
            headers: { Authorization: `Bearer ${cfg.apiKey}` },
            signal: AbortSignal.timeout(30_000),
          },
        );
        if (res.ok) {
          const data = (await res.json()) as Record<string, unknown>;
          return data as unknown as HeatmapData;
        }
      } catch {
        // Fall through to dry-run
      }
    }
  }

  const clicks = generateDryRunClickPoints(url + device);
  const scrollDepth = generateDryRunScrollDepth(url + device);
  const rng = seededRandom(url + device + period);
  const totalSessions = Math.floor(rng() * 5000) + 100;

  const heatmap: HeatmapData = {
    url,
    clicks,
    scrollDepth,
    totalSessions,
    device,
    period,
  };

  const id = generateId("hm");
  await persistEntry({
    id,
    type: "heatmap",
    url,
    payload: heatmap as unknown as Record<string, unknown>,
    createdAt: new Date().toISOString(),
  });

  return heatmap;
}

// ---------------------------------------------------------------------------
// 2. listSessionRecordings
// ---------------------------------------------------------------------------

export async function listSessionRecordings(
  filter?: RecordingFilter,
): Promise<SessionRecording[]> {
  if (!isPlerdyDryRun()) {
    const cfg = resolvePlerdyConfig();
    if (cfg) {
      try {
        const params = new URLSearchParams({ site_id: cfg.siteId });
        if (filter?.url) params.set("url", filter.url);
        if (filter?.minDuration) params.set("min_duration", String(filter.minDuration));
        if (filter?.device) params.set("device", filter.device);

        const res = await fetch(`${cfg.baseUrl}/recordings?${params}`, {
          headers: { Authorization: `Bearer ${cfg.apiKey}` },
          signal: AbortSignal.timeout(30_000),
        });
        if (res.ok) {
          const data = (await res.json()) as Record<string, unknown>;
          return (data as unknown as { recordings: SessionRecording[] }).recordings;
        }
      } catch {
        // Fall through to dry-run
      }
    }
  }

  return generateDryRunRecordings(filter);
}

// ---------------------------------------------------------------------------
// 3. getSessionRecording
// ---------------------------------------------------------------------------

export async function getSessionRecording(
  recordingId: string,
): Promise<SessionRecording | null> {
  if (!isPlerdyDryRun()) {
    const cfg = resolvePlerdyConfig();
    if (cfg) {
      try {
        const res = await fetch(
          `${cfg.baseUrl}/recordings/${recordingId}?site_id=${cfg.siteId}`,
          {
            headers: { Authorization: `Bearer ${cfg.apiKey}` },
            signal: AbortSignal.timeout(30_000),
          },
        );
        if (res.ok) {
          return (await res.json()) as SessionRecording;
        }
      } catch {
        // Fall through to dry-run
      }
    }
  }

  // Dry-run: check in-memory store first
  const stored = plerdyStore.get(recordingId);
  if (stored && stored.type === "recording") {
    return stored.payload as unknown as SessionRecording;
  }

  // Generate a deterministic recording from the ID
  const rng = seededRandom(recordingId);
  return {
    id: recordingId,
    visitorId: `vis_${Math.floor(rng() * 99999)}`,
    url: "/lp/demo",
    duration: Math.floor(rng() * 300) + 15,
    clicks: Math.floor(rng() * 50) + 1,
    scrollDepth: Math.floor(rng() * 100),
    device: "desktop",
    country: COUNTRIES[Math.floor(rng() * COUNTRIES.length)],
    recordedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// 4. runSeoAudit
// ---------------------------------------------------------------------------

export async function runSeoAudit(url: string): Promise<SeoAudit> {
  if (!isPlerdyDryRun()) {
    const cfg = resolvePlerdyConfig();
    if (cfg) {
      try {
        const res = await fetch(`${cfg.baseUrl}/seo/audit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cfg.apiKey}`,
          },
          body: JSON.stringify({ url, site_id: cfg.siteId }),
          signal: AbortSignal.timeout(30_000),
        });
        if (res.ok) {
          return (await res.json()) as SeoAudit;
        }
      } catch {
        // Fall through to dry-run
      }
    }
  }

  const issues = generateDryRunSeoIssues(url);
  const criticalCount = issues.filter((i) => i.severity === "critical").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;
  const score = Math.max(10, 100 - (criticalCount * 20) - (warningCount * 8));

  const audit: SeoAudit = {
    url,
    score,
    issues,
    auditedAt: new Date().toISOString(),
  };

  const id = generateId("seo");
  await persistEntry({
    id,
    type: "seo_audit",
    url,
    payload: audit as unknown as Record<string, unknown>,
    createdAt: audit.auditedAt,
  });

  return audit;
}

// ---------------------------------------------------------------------------
// 5. getSeoAuditHistory
// ---------------------------------------------------------------------------

export async function getSeoAuditHistory(url?: string): Promise<SeoAudit[]> {
  const entries = [...plerdyStore.values()].filter(
    (e) => e.type === "seo_audit" && (!url || e.url === url),
  );
  return entries.map((e) => e.payload as unknown as SeoAudit);
}

// ---------------------------------------------------------------------------
// 6. createConversionFunnel
// ---------------------------------------------------------------------------

export async function createConversionFunnel(input: {
  name: string;
  steps: { url: string; name: string }[];
  tenantId?: string;
}): Promise<ConversionFunnel> {
  const id = generateId("fun");
  const rng = seededRandom(id);

  let visitors = Math.floor(rng() * 5000) + 1000;
  const steps: FunnelStep[] = input.steps.map((s, i) => {
    const dropoffRate = i === 0 ? 0 : Math.floor(rng() * 21) + 20;
    if (i > 0) {
      visitors = Math.floor(visitors * (1 - dropoffRate / 100));
    }
    return {
      url: s.url,
      name: s.name,
      visitors,
      dropoffRate,
    };
  });

  const funnel: ConversionFunnel = {
    id,
    name: input.name,
    steps,
    tenantId: input.tenantId,
  };

  await persistEntry({
    id,
    type: "funnel",
    tenantId: input.tenantId,
    payload: funnel as unknown as Record<string, unknown>,
    createdAt: new Date().toISOString(),
  });

  return funnel;
}

// ---------------------------------------------------------------------------
// 7. getFunnelAnalytics
// ---------------------------------------------------------------------------

export async function getFunnelAnalytics(
  funnelId: string,
): Promise<ConversionFunnel | null> {
  if (!isPlerdyDryRun()) {
    const cfg = resolvePlerdyConfig();
    if (cfg) {
      try {
        const res = await fetch(
          `${cfg.baseUrl}/funnels/${funnelId}?site_id=${cfg.siteId}`,
          {
            headers: { Authorization: `Bearer ${cfg.apiKey}` },
            signal: AbortSignal.timeout(30_000),
          },
        );
        if (res.ok) {
          return (await res.json()) as ConversionFunnel;
        }
      } catch {
        // Fall through to in-memory lookup
      }
    }
  }

  const stored = plerdyStore.get(funnelId);
  if (stored && stored.type === "funnel") {
    return stored.payload as unknown as ConversionFunnel;
  }
  return null;
}

// ---------------------------------------------------------------------------
// 8. generateTrackingCode
// ---------------------------------------------------------------------------

export function generateTrackingCode(siteId?: string): string {
  const id = siteId ?? process.env.PLERDY_SITE_ID ?? "SITE_ID_PLACEHOLDER";
  return `<!-- Plerdy tracking code -->
<script type="text/javascript" defer data-plerdy_code="1">
  var _protocol = "https:" == document.location.protocol ? "https://" : "http://";
  _site_hash_code = "${id}";
  _suid = Date.now();
  var script = document.createElement("script");
  script.src = _protocol + "a.plerdy.com/public/js/click/main.js?v=" + Date.now();
  script.setAttribute("defer", "defer");
  document.head.appendChild(script);
</script>`;
}

// ---------------------------------------------------------------------------
// 9. auditLandingPage
// ---------------------------------------------------------------------------

export async function auditLandingPage(
  slug: string,
  tenantId?: string,
): Promise<SeoAudit> {
  const url = `/lp/${slug}`;
  const audit = await runSeoAudit(url);

  if (tenantId) {
    const id = generateId("lpa");
    await persistEntry({
      id,
      type: "landing_page_audit",
      tenantId,
      url,
      payload: audit as unknown as Record<string, unknown>,
      createdAt: audit.auditedAt,
    });
  }

  return audit;
}

// ---------------------------------------------------------------------------
// 10. getPlerdyStats
// ---------------------------------------------------------------------------

export async function getPlerdyStats(tenantId?: string): Promise<PlerdyStats> {
  const entries = [...plerdyStore.values()];
  const filtered = tenantId
    ? entries.filter((e) => e.tenantId === tenantId)
    : entries;

  const heatmaps = filtered.filter((e) => e.type === "heatmap");
  const seoAudits = filtered.filter((e) => e.type === "seo_audit" || e.type === "landing_page_audit");
  const funnels = filtered.filter((e) => e.type === "funnel");

  const uniqueUrls = new Set(filtered.map((e) => e.url).filter(Boolean));

  let totalSessions = 0;
  let scrollSum = 0;
  let scrollCount = 0;
  const elementClicks = new Map<string, number>();

  for (const hm of heatmaps) {
    const data = hm.payload as unknown as HeatmapData;
    totalSessions += data.totalSessions;
    for (const depth of data.scrollDepth) {
      scrollSum += depth;
      scrollCount++;
    }
    for (const click of data.clicks) {
      const current = elementClicks.get(click.element) ?? 0;
      elementClicks.set(click.element, current + click.count);
    }
  }

  let seoScoreSum = 0;
  for (const audit of seoAudits) {
    const data = audit.payload as unknown as SeoAudit;
    seoScoreSum += data.score;
  }

  const topClickedElements = [...elementClicks.entries()]
    .map(([element, clicks]) => ({ element, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  return {
    totalPages: uniqueUrls.size,
    totalSessions,
    avgScrollDepth: scrollCount > 0 ? Math.round(scrollSum / scrollCount) : 0,
    avgSeoScore: seoAudits.length > 0 ? Math.round(seoScoreSum / seoAudits.length) : 0,
    topClickedElements,
    funnelCount: funnels.length,
  };
}

// ---------------------------------------------------------------------------
// 11. plerdyResult (Provider bridge)
// ---------------------------------------------------------------------------

export function plerdyResult(
  op: string,
  detail: string,
  payload?: Record<string, unknown>,
): ProviderResult {
  return {
    ok: true,
    provider: "Plerdy",
    mode: isPlerdyDryRun() ? "dry-run" : "live",
    detail: `[${op}] ${detail}`,
    payload,
  };
}

// ---------------------------------------------------------------------------
// 12. resetPlerdyStore (for tests)
// ---------------------------------------------------------------------------

export function resetPlerdyStore(): void {
  plerdyStore.clear();
  schemaEnsured = false;
}

// ---------------------------------------------------------------------------
// Test-only store accessor
// ---------------------------------------------------------------------------

export function _getPlerdyStoreForTesting(): Map<string, StoredEntry> {
  return plerdyStore;
}

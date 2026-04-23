import type { ProviderResult } from "../providers.ts";
import { getPool } from "../db.ts";

// ---------------------------------------------------------------------------
// Hexomatic Web Scraping Automation Types
// ---------------------------------------------------------------------------

export interface HexomaticConfig {
  apiKey: string;
  baseUrl: string;
}

export type AutomationStatus = "draft" | "running" | "completed" | "failed" | "paused";

export interface ScrapeSelector {
  name: string;
  selector: string;
  type: "text" | "href" | "src" | "html" | "attribute";
  attribute?: string;
}

export interface ScrapedRow {
  url: string;
  data: Record<string, string>;
  scrapedAt: string;
}

export interface ScrapingAutomation {
  id: string;
  name: string;
  sourceUrls: string[];
  selectors: ScrapeSelector[];
  status: AutomationStatus;
  schedule?: string;
  results: ScrapedRow[];
  creditsUsed: number;
  tenantId?: string;
  createdAt: string;
  completedAt?: string;
}

export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  sourceUrlPattern: string;
  selectors: ScrapeSelector[];
}

export interface HexomaticStats {
  totalAutomations: number;
  totalRows: number;
  creditsUsed: number;
  topDomains: { domain: string; rows: number }[];
}

export interface CreateAutomationInput {
  name: string;
  sourceUrls: string[];
  selectors: ScrapeSelector[];
  schedule?: string;
  tenantId?: string;
}

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

const automationStore = new Map<string, ScrapingAutomation>();
const templateStore = new Map<string, AutomationTemplate>();

let schemaEnsured = false;
let idCounter = 0;

// ---------------------------------------------------------------------------
// Built-in templates
// ---------------------------------------------------------------------------

const BUILT_IN_TEMPLATES: AutomationTemplate[] = [
  {
    id: "tpl-business-directory",
    name: "Business Directory Scraper",
    description: "Extracts business names, addresses, phone numbers, and websites from directory listings",
    sourceUrlPattern: "https://directory.example.com/listings/*",
    selectors: [
      { name: "businessName", selector: "h2.listing-title", type: "text" },
      { name: "address", selector: ".listing-address", type: "text" },
      { name: "phone", selector: ".listing-phone", type: "text" },
      { name: "website", selector: "a.listing-website", type: "href" },
    ],
  },
  {
    id: "tpl-contact-page",
    name: "Contact Page Extractor",
    description: "Pulls contact information including emails, phone numbers, and social links from contact pages",
    sourceUrlPattern: "https://*/contact*",
    selectors: [
      { name: "email", selector: "a[href^='mailto:']", type: "href" },
      { name: "phone", selector: "a[href^='tel:']", type: "text" },
      { name: "address", selector: ".contact-address, .address", type: "text" },
      { name: "socialLink", selector: "a[href*='linkedin.com'], a[href*='twitter.com']", type: "href" },
    ],
  },
  {
    id: "tpl-google-results",
    name: "Google Results Scraper",
    description: "Extracts titles, URLs, and descriptions from search engine results pages",
    sourceUrlPattern: "https://www.google.com/search?q=*",
    selectors: [
      { name: "title", selector: "h3", type: "text" },
      { name: "url", selector: "a[href]", type: "href" },
      { name: "description", selector: ".VwiC3b", type: "text" },
    ],
  },
  {
    id: "tpl-social-profile",
    name: "Social Profile Extractor",
    description: "Extracts profile information from social media pages including name, bio, and follower counts",
    sourceUrlPattern: "https://linkedin.com/in/*",
    selectors: [
      { name: "name", selector: ".profile-name, h1", type: "text" },
      { name: "headline", selector: ".profile-headline, .subtitle", type: "text" },
      { name: "location", selector: ".profile-location, .location", type: "text" },
      { name: "profileImage", selector: ".profile-photo img, .avatar img", type: "src" },
    ],
  },
  {
    id: "tpl-review-scraper",
    name: "Review Scraper",
    description: "Collects reviews including reviewer name, rating, date, and review text from review sites",
    sourceUrlPattern: "https://reviews.example.com/*",
    selectors: [
      { name: "reviewer", selector: ".reviewer-name, .author", type: "text" },
      { name: "rating", selector: ".rating, .stars", type: "text" },
      { name: "date", selector: ".review-date, time", type: "text" },
      { name: "reviewText", selector: ".review-body, .review-text", type: "text" },
    ],
  },
];

function loadBuiltInTemplates(): void {
  if (templateStore.size > 0) return;
  for (const tpl of BUILT_IN_TEMPLATES) {
    templateStore.set(tpl.id, tpl);
  }
}

// ---------------------------------------------------------------------------
// Config & Dry-run
// ---------------------------------------------------------------------------

export function resolveHexomaticConfig(): HexomaticConfig | null {
  const apiKey = process.env.HEXOMATIC_API_KEY ?? "";
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl: process.env.HEXOMATIC_BASE_URL ?? "https://api.hexomatic.com/v2",
  };
}

export function isHexomaticDryRun(): boolean {
  return !process.env.HEXOMATIC_API_KEY;
}

// ---------------------------------------------------------------------------
// Schema (lazy-init)
// ---------------------------------------------------------------------------

async function ensureHexomaticSchema(): Promise<void> {
  if (schemaEnsured) return;
  const pool = getPool();
  if (!pool) return;

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lead_os_hexomatic (
        id TEXT NOT NULL,
        type TEXT NOT NULL,
        tenant_id TEXT,
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
// ID generation
// ---------------------------------------------------------------------------

function generateId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

// ---------------------------------------------------------------------------
// DB persistence helpers
// ---------------------------------------------------------------------------

async function persistAutomation(automation: ScrapingAutomation): Promise<void> {
  await ensureHexomaticSchema();
  const pool = getPool();
  if (!pool) return;

  try {
    await pool.query(
      `INSERT INTO lead_os_hexomatic (id, type, tenant_id, payload, created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE
       SET type = EXCLUDED.type,
           tenant_id = EXCLUDED.tenant_id,
           payload = EXCLUDED.payload`,
      [automation.id, "automation", automation.tenantId ?? null, JSON.stringify(automation), automation.createdAt],
    );
  } catch {
    // DB write failed — in-memory store is still valid
  }
}

// ---------------------------------------------------------------------------
// Dry-run data generation
// ---------------------------------------------------------------------------

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "example.com";
  }
}

function generateFakeValue(selector: ScrapeSelector, url: string, index: number): string {
  const domain = extractDomain(url);
  switch (selector.type) {
    case "href":
      return `https://${domain}/page-${index + 1}`;
    case "src":
      return `https://${domain}/images/img-${index + 1}.jpg`;
    case "html":
      return `<div class="result-${index + 1}">${selector.name} content from ${domain}</div>`;
    case "attribute":
      return `${selector.attribute ?? "data"}-value-${index + 1}`;
    case "text":
    default:
      return `${selector.name} result ${index + 1} from ${domain}`;
  }
}

function generateDryRunRows(sourceUrls: string[], selectors: ScrapeSelector[]): ScrapedRow[] {
  const rows: ScrapedRow[] = [];
  const now = Date.now();

  for (const url of sourceUrls) {
    const rowCount = 5 + Math.floor((hashCode(url) % 11 + 11) % 11);
    for (let i = 0; i < rowCount; i++) {
      const data: Record<string, string> = {};
      for (const sel of selectors) {
        data[sel.name] = generateFakeValue(sel, url, i);
      }
      rows.push({
        url,
        data,
        scrapedAt: new Date(now - i * 60_000).toISOString(),
      });
    }
  }

  return rows;
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash = ((hash << 5) - hash + ch) | 0;
  }
  return hash;
}

// ---------------------------------------------------------------------------
// Automation CRUD
// ---------------------------------------------------------------------------

export async function createAutomation(input: CreateAutomationInput): Promise<ScrapingAutomation> {
  const automation: ScrapingAutomation = {
    id: generateId("hex"),
    name: input.name,
    sourceUrls: input.sourceUrls,
    selectors: input.selectors,
    status: "draft",
    schedule: input.schedule,
    results: [],
    creditsUsed: 0,
    tenantId: input.tenantId,
    createdAt: new Date().toISOString(),
  };

  automationStore.set(automation.id, automation);
  await persistAutomation(automation);

  return automation;
}

export async function getAutomation(automationId: string): Promise<ScrapingAutomation | null> {
  const cached = automationStore.get(automationId);
  if (cached) return cached;

  await ensureHexomaticSchema();
  const pool = getPool();
  if (pool) {
    try {
      const { rows } = await pool.query<{ payload: ScrapingAutomation }>(
        `SELECT payload FROM lead_os_hexomatic WHERE id = $1 AND type = 'automation'`,
        [automationId],
      );
      if (rows.length > 0) {
        automationStore.set(automationId, rows[0].payload);
        return rows[0].payload;
      }
    } catch {
      // DB read failed — return null
    }
  }

  return null;
}

export async function listAutomations(tenantId?: string): Promise<ScrapingAutomation[]> {
  const all = [...automationStore.values()];
  if (tenantId) {
    return all.filter((a) => a.tenantId === tenantId);
  }
  return all;
}

// ---------------------------------------------------------------------------
// Automation lifecycle
// ---------------------------------------------------------------------------

export async function runAutomation(automationId: string): Promise<ScrapingAutomation> {
  const automation = automationStore.get(automationId);
  if (!automation) {
    throw new Error(`Automation ${automationId} not found`);
  }

  if (automation.status === "completed") {
    throw new Error(`Automation ${automationId} is already completed`);
  }

  if (isHexomaticDryRun()) {
    const rows = generateDryRunRows(automation.sourceUrls, automation.selectors);
    automation.status = "completed";
    automation.results = rows;
    automation.creditsUsed = rows.length;
    automation.completedAt = new Date().toISOString();
  } else {
    const cfg = resolveHexomaticConfig();
    if (!cfg) {
      throw new Error("Hexomatic API key not configured");
    }

    try {
      const res = await fetch(`${cfg.baseUrl}/automations/${automationId}/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cfg.apiKey}`,
        },
        signal: AbortSignal.timeout(30_000),
      });

      if (res.ok) {
        const data = (await res.json()) as Record<string, unknown>;
        automation.status = (data.status as AutomationStatus) ?? "running";
        if (Array.isArray(data.results)) {
          automation.results = data.results as ScrapedRow[];
        }
        if (typeof data.creditsUsed === "number") {
          automation.creditsUsed = data.creditsUsed;
        }
      } else {
        automation.status = "running";
      }
    } catch {
      // Network failure — mark as running, will poll later
      automation.status = "running";
    }
  }

  automationStore.set(automationId, automation);
  await persistAutomation(automation);

  return automation;
}

export async function pauseAutomation(automationId: string): Promise<ScrapingAutomation> {
  const automation = automationStore.get(automationId);
  if (!automation) {
    throw new Error(`Automation ${automationId} not found`);
  }

  if (automation.status !== "running") {
    throw new Error(`Automation ${automationId} is not running (status: ${automation.status})`);
  }

  automation.status = "paused";
  automationStore.set(automationId, automation);
  await persistAutomation(automation);

  return automation;
}

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

export async function getAutomationResults(automationId: string): Promise<ScrapedRow[]> {
  const automation = await getAutomation(automationId);
  if (!automation) {
    throw new Error(`Automation ${automationId} not found`);
  }
  return automation.results;
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export function getBuiltInTemplates(): AutomationTemplate[] {
  loadBuiltInTemplates();
  return [...templateStore.values()];
}

export async function createFromTemplate(
  templateId: string,
  sourceUrls: string[],
  tenantId?: string,
): Promise<ScrapingAutomation> {
  loadBuiltInTemplates();
  const template = templateStore.get(templateId);
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }

  return createAutomation({
    name: `${template.name} (from template)`,
    sourceUrls,
    selectors: template.selectors,
    tenantId,
  });
}

// ---------------------------------------------------------------------------
// One-off scrape
// ---------------------------------------------------------------------------

export async function scrapeUrl(
  url: string,
  selectors: ScrapeSelector[],
): Promise<ScrapedRow[]> {
  if (isHexomaticDryRun()) {
    return generateDryRunRows([url], selectors);
  }

  const cfg = resolveHexomaticConfig();
  if (!cfg) {
    return generateDryRunRows([url], selectors);
  }

  try {
    const res = await fetch(`${cfg.baseUrl}/scrape`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({ url, selectors }),
      signal: AbortSignal.timeout(30_000),
    });

    if (res.ok) {
      const data = (await res.json()) as { rows?: ScrapedRow[] };
      return data.rows ?? [];
    }
  } catch {
    // Fall through to dry-run
  }

  return generateDryRunRows([url], selectors);
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export async function exportResults(
  automationId: string,
  format: "json" | "csv",
): Promise<string> {
  const results = await getAutomationResults(automationId);

  if (format === "csv") {
    if (results.length === 0) return "";

    const allKeys = new Set<string>();
    for (const row of results) {
      allKeys.add("url");
      allKeys.add("scrapedAt");
      for (const key of Object.keys(row.data)) {
        allKeys.add(key);
      }
    }

    const headers = [...allKeys];
    const csvRows = [headers.join(",")];

    for (const row of results) {
      const values = headers.map((h) => {
        if (h === "url") return escapeCsvField(row.url);
        if (h === "scrapedAt") return escapeCsvField(row.scrapedAt);
        return escapeCsvField(row.data[h] ?? "");
      });
      csvRows.push(values.join(","));
    }

    return csvRows.join("\n");
  }

  return JSON.stringify(results, null, 2);
}

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export async function getHexomaticStats(tenantId?: string): Promise<HexomaticStats> {
  const entries = [...automationStore.values()];
  const filtered = tenantId
    ? entries.filter((a) => a.tenantId === tenantId)
    : entries;

  let totalRows = 0;
  let creditsUsed = 0;
  const domainCounts = new Map<string, number>();

  for (const automation of filtered) {
    totalRows += automation.results.length;
    creditsUsed += automation.creditsUsed;

    for (const row of automation.results) {
      const domain = extractDomain(row.url);
      domainCounts.set(domain, (domainCounts.get(domain) ?? 0) + 1);
    }
  }

  const topDomains = [...domainCounts.entries()]
    .map(([domain, rows]) => ({ domain, rows }))
    .sort((a, b) => b.rows - a.rows)
    .slice(0, 10);

  return {
    totalAutomations: filtered.length,
    totalRows,
    creditsUsed,
    topDomains,
  };
}

// ---------------------------------------------------------------------------
// Provider bridge
// ---------------------------------------------------------------------------

export async function scrapeViaHexomatic(
  url: string,
  selectors: ScrapeSelector[],
): Promise<ProviderResult> {
  const dryRun = isHexomaticDryRun();
  const rows = await scrapeUrl(url, selectors);

  return {
    ok: true,
    provider: "Hexomatic",
    mode: dryRun ? "dry-run" : "live",
    detail: `Scraped ${rows.length} rows from ${url}`,
    payload: { url, rowCount: rows.length, rows },
  };
}

// ---------------------------------------------------------------------------
// Reset (for tests)
// ---------------------------------------------------------------------------

export function resetHexomaticStore(): void {
  automationStore.clear();
  templateStore.clear();
  schemaEnsured = false;
  idCounter = 0;
}

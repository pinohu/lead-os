import { randomUUID } from "crypto";
import { BaseAdapter } from "./adapter-base.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScrapeOptions {
  formats?: ("markdown" | "html" | "links")[];
  onlyMainContent?: boolean;
  includeTags?: string[];
  excludeTags?: string[];
  waitFor?: number;
  timeout?: number;
}

export interface ScrapedPage {
  url: string;
  markdown: string;
  html: string;
  metadata: {
    title: string;
    description: string;
    language: string;
    ogImage: string;
  };
}

export interface CrawlOptions {
  maxPages?: number;
  includePaths?: string[];
  excludePaths?: string[];
  allowBackwardLinks?: boolean;
}

export interface CrawlJob {
  id: string;
  status: "scraping" | "completed" | "failed";
  totalPages: number;
  completedPages: number;
  results: ScrapedPage[];
  startedAt: string;
}

export type CrawlStatus = CrawlJob;

export interface CompanyProfile {
  name: string;
  industry: string;
  description: string;
  employeeCount: string;
  location: string;
  techStack: string[];
  socialLinks: Record<string, string>;
}

export interface ContactInfo {
  emails: string[];
  phones: string[];
  forms: string[];
  addresses: string[];
}

export interface ProductInfo {
  name: string;
  description: string;
  price?: string;
  url: string;
}

export interface LeadEnrichment {
  company: CompanyProfile;
  contacts: ContactInfo;
  products: ProductInfo[];
  techStack: string[];
  socialPresence: Record<string, string>;
  estimatedRevenue: string;
}

// ---------------------------------------------------------------------------
// Shared adapter instance & in-memory stores
// ---------------------------------------------------------------------------

const adapter = new BaseAdapter("Firecrawl", "FIRECRAWL", "https://api.firecrawl.dev");

const crawlJobStore = new Map<string, CrawlJob>();
const scrapeCache = new Map<string, ScrapedPage>();

export function resetFirecrawlStore(): void {
  crawlJobStore.clear();
  scrapeCache.clear();
  adapter.resetStore();
}

export function _getCrawlJobStoreForTesting(): Map<string, CrawlJob> {
  return crawlJobStore;
}

export function _getScrapeCacheForTesting(): Map<string, ScrapedPage> {
  return scrapeCache;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

function getFirecrawlConfig(): { apiKey: string; baseUrl: string } | undefined {
  const apiKey = process.env["FIRECRAWL_API_KEY"];
  const baseUrl = process.env["FIRECRAWL_BASE_URL"] ?? "https://api.firecrawl.dev";

  if (typeof apiKey === "string" && apiKey.trim().length > 0) {
    return { apiKey: apiKey.trim(), baseUrl: baseUrl.replace(/\/$/, "") };
  }

  return undefined;
}

function isDryRun(): boolean {
  return !getFirecrawlConfig() || process.env["LEAD_OS_ENABLE_LIVE_SENDS"] === "false";
}

// ---------------------------------------------------------------------------
// Dry-run helpers
// ---------------------------------------------------------------------------

function buildDryRunPage(url: string): ScrapedPage {
  const hostname = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  })();

  return {
    url,
    markdown: `# ${hostname}\n\nDry-run scraped content for ${hostname}. Configure FIRECRAWL_API_KEY to enable live scraping.\n\n## About\n\nThis is a technology company building innovative solutions.\n\n## Products\n\n- Product Alpha - Enterprise platform\n- Product Beta - Developer tools`,
    html: `<html><head><title>${hostname}</title></head><body><h1>${hostname}</h1><p>Dry-run content</p></body></html>`,
    metadata: {
      title: `${hostname} - Official Website`,
      description: `${hostname} is a technology company providing innovative solutions.`,
      language: "en",
      ogImage: `https://${hostname}/og-image.png`,
    },
  };
}

function buildDryRunCompanyProfile(domain: string): CompanyProfile {
  const hostname = domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const name = hostname.split(".")[0] ?? hostname;
  const capitalized = name.charAt(0).toUpperCase() + name.slice(1);

  return {
    name: capitalized,
    industry: "Technology",
    description: `${capitalized} is a technology company providing innovative solutions.`,
    employeeCount: "51-200",
    location: "San Francisco, CA",
    techStack: ["React", "Node.js", "PostgreSQL"],
    socialLinks: {
      linkedin: `https://linkedin.com/company/${name}`,
      twitter: `https://twitter.com/${name}`,
    },
  };
}

function buildDryRunContactInfo(domain: string): ContactInfo {
  const hostname = domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return {
    emails: [`info@${hostname}`, `support@${hostname}`],
    phones: ["+1 (555) 123-4567"],
    forms: [`https://${hostname}/contact`],
    addresses: ["123 Tech Street, San Francisco, CA 94105"],
  };
}

function buildDryRunProducts(domain: string): ProductInfo[] {
  const hostname = domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return [
    {
      name: "Enterprise Platform",
      description: "Full-featured enterprise solution for teams.",
      price: "$99/month",
      url: `https://${hostname}/products/enterprise`,
    },
    {
      name: "Developer Tools",
      description: "APIs and SDKs for developers.",
      price: "Free",
      url: `https://${hostname}/products/developer`,
    },
  ];
}

// ---------------------------------------------------------------------------
// Firecrawl API calls
// ---------------------------------------------------------------------------

async function firecrawlRequest(
  path: string,
  method: "GET" | "POST",
  body?: Record<string, unknown>,
): Promise<unknown> {
  const config = getFirecrawlConfig();
  if (!config) {
    throw new Error("Firecrawl API key not configured");
  }

  const response = await fetch(`${config.baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`Firecrawl returned ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

function parseScrapedPage(url: string, data: Record<string, unknown>): ScrapedPage {
  const metadata = (data.metadata ?? {}) as Record<string, unknown>;
  return {
    url,
    markdown: (data.markdown as string) ?? "",
    html: (data.html as string) ?? "",
    metadata: {
      title: (metadata.title as string) ?? "",
      description: (metadata.description as string) ?? "",
      language: (metadata.language as string) ?? "en",
      ogImage: (metadata.ogImage as string) ?? "",
    },
  };
}

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

export async function scrapeUrl(url: string, options?: ScrapeOptions): Promise<ScrapedPage> {
  const cached = scrapeCache.get(url);
  if (cached) return cached;

  if (isDryRun()) {
    const page = buildDryRunPage(url);
    scrapeCache.set(url, page);
    return page;
  }

  const body: Record<string, unknown> = { url };
  if (options?.formats) body.formats = options.formats;
  if (options?.onlyMainContent !== undefined) body.onlyMainContent = options.onlyMainContent;
  if (options?.includeTags) body.includeTags = options.includeTags;
  if (options?.excludeTags) body.excludeTags = options.excludeTags;
  if (options?.waitFor) body.waitFor = options.waitFor;
  if (options?.timeout) body.timeout = options.timeout;

  const result = (await firecrawlRequest("/v1/scrape", "POST", body)) as {
    success: boolean;
    data?: Record<string, unknown>;
  };

  if (!result.success || !result.data) {
    throw new Error("Firecrawl scrape returned no data");
  }

  const page = parseScrapedPage(url, result.data);
  scrapeCache.set(url, page);
  return page;
}

export async function crawlSite(url: string, options?: CrawlOptions): Promise<CrawlJob> {
  const jobId = randomUUID();
  const now = new Date().toISOString();

  if (isDryRun()) {
    const maxPages = options?.maxPages ?? 10;
    const pageCount = Math.min(maxPages, 3);
    const results: ScrapedPage[] = [];

    for (let i = 0; i < pageCount; i++) {
      const pageUrl = i === 0 ? url : `${url.replace(/\/$/, "")}/page-${i}`;
      results.push(buildDryRunPage(pageUrl));
    }

    const job: CrawlJob = {
      id: jobId,
      status: "completed",
      totalPages: pageCount,
      completedPages: pageCount,
      results,
      startedAt: now,
    };

    crawlJobStore.set(jobId, job);
    return job;
  }

  const body: Record<string, unknown> = { url };
  if (options?.maxPages) body.limit = options.maxPages;
  if (options?.includePaths) body.includePaths = options.includePaths;
  if (options?.excludePaths) body.excludePaths = options.excludePaths;
  if (options?.allowBackwardLinks !== undefined) body.allowBackwardLinks = options.allowBackwardLinks;

  const result = (await firecrawlRequest("/v1/crawl", "POST", body)) as {
    success: boolean;
    id?: string;
  };

  if (!result.success || !result.id) {
    throw new Error("Firecrawl crawl failed to start");
  }

  const job: CrawlJob = {
    id: result.id,
    status: "scraping",
    totalPages: options?.maxPages ?? 10,
    completedPages: 0,
    results: [],
    startedAt: now,
  };

  crawlJobStore.set(result.id, job);
  return job;
}

export async function getCrawlStatus(jobId: string): Promise<CrawlStatus> {
  const cached = crawlJobStore.get(jobId);

  if (isDryRun()) {
    if (!cached) {
      throw new Error(`Crawl job ${jobId} not found`);
    }
    return cached;
  }

  const result = (await firecrawlRequest(`/v1/crawl/${jobId}`, "GET")) as {
    status: string;
    total?: number;
    completed?: number;
    data?: Record<string, unknown>[];
  };

  const job: CrawlJob = {
    id: jobId,
    status: result.status === "completed" ? "completed" : result.status === "failed" ? "failed" : "scraping",
    totalPages: result.total ?? 0,
    completedPages: result.completed ?? 0,
    results: (result.data ?? []).map((d) => parseScrapedPage((d.url as string) ?? "", d)),
    startedAt: cached?.startedAt ?? new Date().toISOString(),
  };

  crawlJobStore.set(jobId, job);
  return job;
}

export async function extractStructuredData(
  url: string,
  schema: Record<string, unknown>,
): Promise<unknown> {
  if (isDryRun()) {
    return { url, extracted: true, data: {} };
  }

  const result = (await firecrawlRequest("/v1/scrape", "POST", {
    url,
    formats: ["extract"],
    extract: { schema },
  })) as { success: boolean; data?: { extract?: unknown } };

  if (!result.success || !result.data) {
    throw new Error("Firecrawl extraction returned no data");
  }

  return result.data.extract ?? {};
}

export async function batchScrape(urls: string[]): Promise<ScrapedPage[]> {
  if (urls.length === 0) return [];

  if (isDryRun()) {
    return urls.map((url) => buildDryRunPage(url));
  }

  const results = await Promise.allSettled(urls.map((url) => scrapeUrl(url)));
  return results.map((r, i) =>
    r.status === "fulfilled" ? r.value : buildDryRunPage(urls[i]!),
  );
}

// ---------------------------------------------------------------------------
// Lead-specific functions
// ---------------------------------------------------------------------------

export async function scrapeCompanyInfo(domain: string): Promise<CompanyProfile> {
  const url = domain.startsWith("http") ? domain : `https://${domain}`;

  if (isDryRun()) {
    return buildDryRunCompanyProfile(domain);
  }

  const page = await scrapeUrl(url);
  const aboutPage = await scrapeUrl(`${url.replace(/\/$/, "")}/about`).catch(() => null);
  const text = (page.markdown + (aboutPage?.markdown ?? "")).toLowerCase();

  const techIndicators: Record<string, string[]> = {
    React: ["react", "reactjs"],
    "Next.js": ["next.js", "nextjs", "vercel"],
    Vue: ["vue", "vuejs"],
    Angular: ["angular"],
    WordPress: ["wordpress", "wp-content"],
    Shopify: ["shopify", "myshopify"],
    Node: ["node.js", "nodejs", "express"],
    Python: ["python", "django", "flask"],
    PostgreSQL: ["postgresql", "postgres"],
    MongoDB: ["mongodb", "mongo"],
  };

  const techStack = Object.entries(techIndicators)
    .filter(([, patterns]) => patterns.some((p) => text.includes(p)))
    .map(([name]) => name);

  const industryKeywords: Record<string, string[]> = {
    "SaaS / Software": ["software", "saas", "platform", "api", "developer"],
    "E-commerce": ["shop", "store", "cart", "checkout", "product"],
    "Professional Services": ["consulting", "agency", "law", "accounting"],
    Healthcare: ["health", "medical", "clinic", "patient"],
    Finance: ["finance", "banking", "fintech", "payment"],
    Education: ["education", "learning", "course", "university"],
  };

  const industry = Object.entries(industryKeywords).find(([, patterns]) =>
    patterns.some((p) => text.includes(p)),
  )?.[0] ?? "Technology";

  const employeeSizeHints: Array<[string, string]> = [
    ["1-10", "startup"],
    ["11-50", "small team"],
    ["51-200", "growing"],
    ["201-1000", "mid-size"],
    ["1000+", "enterprise"],
  ];

  const employeeCount = employeeSizeHints.find(([, hint]) => text.includes(hint))?.[0] ?? "Unknown";

  const socialPatterns: Record<string, RegExp> = {
    linkedin: /linkedin\.com\/company\/[\w-]+/i,
    twitter: /(?:twitter|x)\.com\/[\w-]+/i,
    facebook: /facebook\.com\/[\w.-]+/i,
    instagram: /instagram\.com\/[\w.-]+/i,
    github: /github\.com\/[\w-]+/i,
  };

  const socialLinks: Record<string, string> = {};
  for (const [platform, regex] of Object.entries(socialPatterns)) {
    const match = regex.exec(text);
    if (match) {
      socialLinks[platform] = `https://${match[0]}`;
    }
  }

  return {
    name: page.metadata.title || domain,
    industry,
    description: page.metadata.description || `Company at ${domain}`,
    employeeCount,
    location: "Unknown",
    techStack,
    socialLinks,
  };
}

export async function scrapeContactPage(domain: string): Promise<ContactInfo> {
  const url = domain.startsWith("http") ? domain : `https://${domain}`;

  if (isDryRun()) {
    return buildDryRunContactInfo(domain);
  }

  const contactPage = await scrapeUrl(`${url.replace(/\/$/, "")}/contact`).catch(() => null);
  const mainPage = await scrapeUrl(url).catch(() => null);
  const text = (mainPage?.markdown ?? "") + (contactPage?.markdown ?? "");

  const emailRegex = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
  const phoneRegex = /(?:\+\d{1,3}\s?)?(?:\(\d{1,4}\)\s?)?\d[\d\s.-]{6,}\d/g;
  const formRegex = /(?:https?:\/\/[^\s"']+)?\/(?:contact|form|get-in-touch|request|inquiry)[^\s"']*/gi;
  const addressRegex = /\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct)[,\s]+[\w\s]+,?\s*[A-Z]{2}\s*\d{5}/g;

  const emails = [...new Set(text.match(emailRegex) ?? [])].slice(0, 10);
  const phones = [...new Set(text.match(phoneRegex) ?? [])].slice(0, 10);
  const forms = [...new Set(text.match(formRegex) ?? [])].slice(0, 5);
  const addresses = [...new Set(text.match(addressRegex) ?? [])].slice(0, 5);

  return { emails, phones, forms, addresses };
}

export async function scrapeProductPages(domain: string): Promise<ProductInfo[]> {
  const url = domain.startsWith("http") ? domain : `https://${domain}`;

  if (isDryRun()) {
    return buildDryRunProducts(domain);
  }

  const pages = ["/products", "/pricing", "/solutions", "/services"];
  const results = await Promise.allSettled(
    pages.map((path) => scrapeUrl(`${url.replace(/\/$/, "")}${path}`)),
  );

  const products: ProductInfo[] = [];

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    const page = result.value;
    const lines = page.markdown.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (line.startsWith("## ") || line.startsWith("### ")) {
        const name = line.replace(/^#+\s*/, "").trim();
        const description = lines[i + 1]?.trim() ?? "";
        const priceMatch = /\$[\d,.]+(?:\/\w+)?/.exec(
          lines.slice(i, i + 5).join(" "),
        );

        if (name.length > 0 && name.length < 100) {
          products.push({
            name,
            description,
            price: priceMatch?.[0],
            url: page.url,
          });
        }
      }
    }
  }

  return products.length > 0 ? products.slice(0, 20) : buildDryRunProducts(domain);
}

export async function enrichLeadFromWebsite(leadDomain: string): Promise<LeadEnrichment> {
  const [company, contacts, products] = await Promise.all([
    scrapeCompanyInfo(leadDomain),
    scrapeContactPage(leadDomain),
    scrapeProductPages(leadDomain),
  ]);

  const revenueHints: Array<[string, string]> = [
    ["$0-1M", "1-10"],
    ["$1-10M", "11-50"],
    ["$10-50M", "51-200"],
    ["$50-500M", "201-1000"],
    ["$500M+", "1000+"],
  ];

  const estimatedRevenue = revenueHints.find(
    ([, size]) => size === company.employeeCount,
  )?.[0] ?? "Unknown";

  return {
    company,
    contacts,
    products,
    techStack: company.techStack,
    socialPresence: company.socialLinks,
    estimatedRevenue,
  };
}

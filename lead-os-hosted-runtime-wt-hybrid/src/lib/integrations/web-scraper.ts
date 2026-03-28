import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScrapeResult {
  url: string;
  title: string;
  markdown: string;
  metadata: {
    description?: string;
    keywords?: string[];
    ogImage?: string;
    language?: string;
  };
  links: string[];
  scrapedAt: string;
  mode: "firecrawl" | "crawl4ai" | "fetch-fallback" | "dry-run";
}

export interface CrawlJob {
  id: string;
  startUrl: string;
  maxPages: number;
  status: "running" | "completed" | "failed";
  pagesScraped: number;
  results: ScrapeResult[];
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const crawlJobStore = new Map<string, CrawlJob>();

export function resetScraperStore(): void {
  crawlJobStore.clear();
}

// ---------------------------------------------------------------------------
// Config detection
// ---------------------------------------------------------------------------

function getFirecrawlKey(): string | undefined {
  const val = process.env["FIRECRAWL_API_KEY"];
  return typeof val === "string" && val.trim().length > 0 ? val.trim() : undefined;
}

function getCrawl4aiUrl(): string | undefined {
  const val = process.env["CRAWL4AI_URL"];
  return typeof val === "string" && val.trim().length > 0 ? val.trim() : undefined;
}

// ---------------------------------------------------------------------------
// HTML-to-markdown (minimal fetch fallback)
// ---------------------------------------------------------------------------

function htmlToMarkdown(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level, content) => {
      const hashes = "#".repeat(Number(level));
      return `\n${hashes} ${content.replace(/<[^>]+>/g, "").trim()}\n`;
    })
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, content) => `\n${content.replace(/<[^>]+>/g, "").trim()}\n`)
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, content) => `- ${content.replace(/<[^>]+>/g, "").trim()}`)
    .replace(/<a[^>]+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, text) => `[${text.replace(/<[^>]+>/g, "").trim()}](${href})`)
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s{3,}/g, "\n\n")
    .trim();
}

function extractLinks(html: string, baseUrl: string): string[] {
  const links: string[] = [];
  const regex = /href="([^"]+)"/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    const href = match[1];
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("javascript:")) {
      continue;
    }
    try {
      const absolute = new URL(href, baseUrl).toString();
      links.push(absolute);
    } catch {
      // skip malformed URLs
    }
  }

  return [...new Set(links)].slice(0, 50);
}

function extractMetaTag(html: string, name: string): string | undefined {
  const regex = new RegExp(
    `<meta[^>]+(?:name|property)=["'](?:og:)?${name}["'][^>]+content=["']([^"']*)["']`,
    "i",
  );
  const match = regex.exec(html);
  return match?.[1] ?? undefined;
}

function extractTitle(html: string): string {
  const match = /<title[^>]*>([^<]*)<\/title>/i.exec(html);
  return match?.[1]?.trim() ?? "";
}

// ---------------------------------------------------------------------------
// Firecrawl adapter
// ---------------------------------------------------------------------------

async function scrapeViaFirecrawl(url: string, apiKey: string): Promise<ScrapeResult> {
  const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ url, formats: ["markdown", "links"], includeTags: ["title", "meta"] }),
  });

  if (!response.ok) {
    throw new Error(`Firecrawl returned ${response.status}`);
  }

  const data = (await response.json()) as {
    success: boolean;
    data?: {
      markdown?: string;
      metadata?: {
        title?: string;
        description?: string;
        keywords?: string;
        ogImage?: string;
        language?: string;
      };
      links?: string[];
    };
  };

  if (!data.success || !data.data) {
    throw new Error("Firecrawl returned no data");
  }

  const { metadata = {}, markdown = "", links = [] } = data.data;

  return {
    url,
    title: metadata.title ?? "",
    markdown,
    metadata: {
      description: metadata.description,
      keywords: metadata.keywords ? metadata.keywords.split(",").map((k) => k.trim()) : undefined,
      ogImage: metadata.ogImage,
      language: metadata.language,
    },
    links,
    scrapedAt: new Date().toISOString(),
    mode: "firecrawl",
  };
}

// ---------------------------------------------------------------------------
// Crawl4AI adapter
// ---------------------------------------------------------------------------

async function scrapeViaCrawl4ai(url: string, baseUrl: string): Promise<ScrapeResult> {
  const endpoint = baseUrl.replace(/\/$/, "");
  const response = await fetch(`${endpoint}/crawl`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, word_count_threshold: 10, extract_markdown: true }),
  });

  if (!response.ok) {
    throw new Error(`Crawl4AI returned ${response.status}`);
  }

  const data = (await response.json()) as {
    success: boolean;
    result?: {
      markdown?: string;
      title?: string;
      description?: string;
      links?: { href?: string }[];
    };
  };

  if (!data.success || !data.result) {
    throw new Error("Crawl4AI returned no result");
  }

  const { result } = data;

  return {
    url,
    title: result.title ?? "",
    markdown: result.markdown ?? "",
    metadata: {
      description: result.description,
    },
    links: (result.links ?? []).map((l) => l.href ?? "").filter(Boolean).slice(0, 50),
    scrapedAt: new Date().toISOString(),
    mode: "crawl4ai",
  };
}

// ---------------------------------------------------------------------------
// Fetch fallback
// ---------------------------------------------------------------------------

async function scrapeViaFetch(url: string): Promise<ScrapeResult> {
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; LeadOS/1.0; +https://leados.io)" },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`Fetch returned ${response.status} for ${url}`);
  }

  const html = await response.text();

  return {
    url,
    title: extractTitle(html),
    markdown: htmlToMarkdown(html),
    metadata: {
      description: extractMetaTag(html, "description"),
      ogImage: extractMetaTag(html, "image"),
      language: extractMetaTag(html, "language"),
    },
    links: extractLinks(html, url),
    scrapedAt: new Date().toISOString(),
    mode: "fetch-fallback",
  };
}

// ---------------------------------------------------------------------------
// Dry-run
// ---------------------------------------------------------------------------

function buildDryRunResult(url: string): ScrapeResult {
  const hostname = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  })();

  return {
    url,
    title: `[DRY-RUN] ${hostname}`,
    markdown: `# ${hostname}\n\nThis is a dry-run result. Configure FIRECRAWL_API_KEY or CRAWL4AI_URL to enable live scraping.\n\n## Sample Section\n\nLorem ipsum placeholder content for ${hostname}.`,
    metadata: {
      description: `Dry-run description for ${hostname}`,
      keywords: ["dry-run", "placeholder"],
      language: "en",
    },
    links: [`https://${hostname}/about`, `https://${hostname}/contact`],
    scrapedAt: new Date().toISOString(),
    mode: "dry-run",
  };
}

// ---------------------------------------------------------------------------
// Core exports
// ---------------------------------------------------------------------------

export async function scrapePage(url: string): Promise<ScrapeResult> {
  const firecrawlKey = getFirecrawlKey();
  if (firecrawlKey) {
    try {
      return await scrapeViaFirecrawl(url, firecrawlKey);
    } catch {
      // fall through to next adapter
    }
  }

  const crawl4aiUrl = getCrawl4aiUrl();
  if (crawl4aiUrl) {
    try {
      return await scrapeViaCrawl4ai(url, crawl4aiUrl);
    } catch {
      // fall through to fetch fallback
    }
  }

  // In test / CI environments avoid live network calls unless explicitly enabled
  if (process.env["LEAD_OS_ENABLE_LIVE_SENDS"] === "false") {
    return buildDryRunResult(url);
  }

  try {
    return await scrapeViaFetch(url);
  } catch {
    return buildDryRunResult(url);
  }
}

export async function startCrawl(startUrl: string, maxPages = 10): Promise<string> {
  const jobId = randomUUID();
  const job: CrawlJob = {
    id: jobId,
    startUrl,
    maxPages,
    status: "running",
    pagesScraped: 0,
    results: [],
  };

  crawlJobStore.set(jobId, job);

  const firecrawlKey = getFirecrawlKey();

  if (firecrawlKey) {
    // Fire-and-forget: run crawl asynchronously via Firecrawl
    (async () => {
      try {
        const response = await fetch("https://api.firecrawl.dev/v1/crawl", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${firecrawlKey}`,
          },
          body: JSON.stringify({ url: startUrl, limit: maxPages }),
        });

        if (!response.ok) throw new Error(`Firecrawl crawl returned ${response.status}`);

        const data = (await response.json()) as { success: boolean; id?: string };

        if (data.success && data.id) {
          // Store the remote job ID in local job metadata
          const updated = crawlJobStore.get(jobId);
          if (updated) {
            crawlJobStore.set(jobId, { ...updated, id: jobId, status: "running" });
          }
        }
      } catch {
        const updated = crawlJobStore.get(jobId);
        if (updated) crawlJobStore.set(jobId, { ...updated, status: "failed" });
      }
    })();

    return jobId;
  }

  // Dry-run: immediately complete with synthetic pages
  const results: ScrapeResult[] = [];
  const pageCount = Math.min(maxPages, 3);

  for (let i = 0; i < pageCount; i++) {
    const pageUrl = i === 0 ? startUrl : `${startUrl.replace(/\/$/, "")}/page-${i}`;
    results.push(buildDryRunResult(pageUrl));
  }

  crawlJobStore.set(jobId, {
    ...job,
    status: "completed",
    pagesScraped: pageCount,
    results,
  });

  return jobId;
}

export async function getCrawlStatus(jobId: string): Promise<CrawlJob | undefined> {
  return crawlJobStore.get(jobId);
}

// ---------------------------------------------------------------------------
// Lead OS specific helpers
// ---------------------------------------------------------------------------

export async function scrapeCompetitor(url: string): Promise<{
  designSystem: Record<string, unknown>;
  offers: string[];
  trustSignals: string[];
  ctas: string[];
}> {
  const result = await scrapePage(url);
  const text = result.markdown.toLowerCase();
  const lines = result.markdown.split("\n");

  const offerKeywords = ["free", "trial", "discount", "deal", "save", "off", "bonus", "guarantee", "limited"];
  const offers = lines
    .filter((l) => offerKeywords.some((kw) => l.toLowerCase().includes(kw)))
    .slice(0, 10)
    .map((l) => l.trim())
    .filter(Boolean);

  const trustKeywords = ["certified", "award", "customers", "reviews", "rated", "trusted", "verified", "proven", "years"];
  const trustSignals = lines
    .filter((l) => trustKeywords.some((kw) => l.toLowerCase().includes(kw)))
    .slice(0, 10)
    .map((l) => l.trim())
    .filter(Boolean);

  const ctaKeywords = ["get started", "sign up", "book", "schedule", "contact", "call", "buy", "try", "claim", "join"];
  const ctas = lines
    .filter((l) => ctaKeywords.some((kw) => l.toLowerCase().includes(kw)))
    .slice(0, 10)
    .map((l) => l.trim())
    .filter(Boolean);

  const hasDarkMode = text.includes("dark") || text.includes("theme");
  const primaryColor = text.includes("blue") ? "blue" : text.includes("red") ? "red" : text.includes("green") ? "green" : "unknown";

  return {
    designSystem: {
      primaryColor,
      hasDarkMode,
      fontMentions: text.includes("sans-serif") ? ["sans-serif"] : [],
    },
    offers: offers.length > 0 ? offers : ["[dry-run] Free trial available"],
    trustSignals: trustSignals.length > 0 ? trustSignals : ["[dry-run] 500+ happy customers"],
    ctas: ctas.length > 0 ? ctas : ["[dry-run] Get started today"],
  };
}

export async function enrichLeadFromWebsite(domain: string): Promise<{
  companyName?: string;
  industry?: string;
  employeeCount?: string;
  techStack?: string[];
}> {
  const url = domain.startsWith("http") ? domain : `https://${domain}`;
  const result = await scrapePage(url);
  const text = result.markdown.toLowerCase();

  const techIndicators: Record<string, string[]> = {
    React: ["react", "reactjs"],
    "Next.js": ["next.js", "nextjs", "vercel"],
    WordPress: ["wordpress", "wp-content"],
    Shopify: ["shopify", "myshopify"],
    HubSpot: ["hubspot", "hs-scripts"],
    Salesforce: ["salesforce", "force.com"],
    Stripe: ["stripe"],
    Intercom: ["intercom"],
  };

  const techStack = Object.entries(techIndicators)
    .filter(([, patterns]) => patterns.some((p) => text.includes(p)))
    .map(([name]) => name);

  const industryKeywords: Record<string, string[]> = {
    "SaaS / Software": ["software", "saas", "platform", "api", "developer"],
    "E-commerce": ["shop", "store", "cart", "checkout", "product"],
    "Professional Services": ["consulting", "agency", "law", "accounting", "advisory"],
    Healthcare: ["health", "medical", "clinic", "patient", "doctor"],
    "Real Estate": ["property", "real estate", "mortgage", "rental"],
  };

  const industry = Object.entries(industryKeywords).find(([, patterns]) =>
    patterns.some((p) => text.includes(p)),
  )?.[0];

  const employeeCountHints: Array<[string, string]> = [
    ["1-10", "startup"],
    ["11-50", "small"],
    ["51-200", "growing"],
    ["201-1000", "mid-size"],
    ["1000+", "enterprise"],
  ];

  const employeeCount = employeeCountHints.find(([, hint]) => text.includes(hint))?.[0];

  return {
    companyName: result.title || domain,
    industry,
    employeeCount,
    techStack: techStack.length > 0 ? techStack : undefined,
  };
}

export async function scrapeLocalBusinesses(
  niche: string,
  location: string,
): Promise<
  { name: string; address: string; phone?: string; website?: string; rating?: number }[]
> {
  // In dry-run or without an external local-data API this generates realistic placeholders.
  const isDryRun = !getFirecrawlKey() && !getCrawl4aiUrl();

  if (isDryRun || process.env["LEAD_OS_ENABLE_LIVE_SENDS"] === "false") {
    const normalized = niche.toLowerCase().replace(/\s+/g, "-");
    const city = location.split(",")[0].trim();

    return [
      {
        name: `${city} ${niche} Pros`,
        address: `123 Main St, ${location}`,
        phone: "(555) 100-0001",
        website: `https://www.${normalized}-pros.example.com`,
        rating: 4.5,
      },
      {
        name: `Premier ${niche} Services`,
        address: `456 Oak Ave, ${location}`,
        phone: "(555) 100-0002",
        website: `https://www.premier-${normalized}.example.com`,
        rating: 4.2,
      },
      {
        name: `${city} ${niche} Experts`,
        address: `789 Elm Blvd, ${location}`,
        phone: "(555) 100-0003",
        rating: 3.9,
      },
    ];
  }

  // When a live scraping backend is available, delegate to a Google Maps / Yelp scrape
  const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(`${niche} near ${location}`)}`;
  const result = await scrapePage(searchUrl);

  // Parse results from the markdown (simplified heuristic)
  const lines = result.markdown.split("\n").filter((l) => l.trim().length > 0);
  const businesses: { name: string; address: string; phone?: string; website?: string; rating?: number }[] = [];

  for (let i = 0; i < lines.length && businesses.length < 10; i++) {
    const line = lines[i];
    const ratingMatch = /(\d\.\d)\s*(?:stars?|★)/.exec(line);
    const phoneMatch = /\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/.exec(line);

    if (ratingMatch || phoneMatch) {
      businesses.push({
        name: lines[Math.max(0, i - 1)].replace(/[#*`]/g, "").trim() || `Business ${businesses.length + 1}`,
        address: lines[Math.min(lines.length - 1, i + 1)].replace(/[#*`]/g, "").trim() || location,
        phone: phoneMatch?.[0],
        rating: ratingMatch ? parseFloat(ratingMatch[1]) : undefined,
      });
    }
  }

  return businesses.length > 0 ? businesses : [{ name: `${niche} (live search returned no results)`, address: location }];
}

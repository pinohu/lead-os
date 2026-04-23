import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MCPScrapeOptions {
  formats?: ("markdown" | "html" | "json")[];
  onlyMainContent?: boolean;
  waitFor?: number;
  extractSchema?: Record<string, unknown>;
}

export interface MCPScrapeResult {
  url: string;
  markdown?: string;
  html?: string;
  json?: Record<string, unknown>;
  metadata: {
    title: string;
    description: string;
    language: string;
    statusCode: number;
  };
}

export interface MCPCrawlOptions {
  maxPages?: number;
  maxDepth?: number;
  includePaths?: string[];
  excludePaths?: string[];
}

export interface MCPCrawlResult {
  jobId: string;
  status: "pending" | "crawling" | "completed" | "failed";
  pagesFound: number;
  pagesCrawled: number;
  results: MCPScrapeResult[];
}

export interface MCPMapResult {
  urls: string[];
  totalFound: number;
}

export interface MCPSearchOptions {
  limit?: number;
  country?: string;
  language?: string;
}

export interface MCPSearchResult {
  url: string;
  title: string;
  description: string;
  markdown: string;
  metadata: Record<string, unknown>;
}

export interface BrowserAction {
  type: "click" | "type" | "scroll" | "wait" | "screenshot";
  selector?: string;
  value?: string;
  delay?: number;
}

export interface MCPInteractResult {
  url: string;
  actions: { action: BrowserAction; success: boolean }[];
  finalContent: string;
}

export interface MCPAgentOptions {
  maxSteps?: number;
  extractSchema?: Record<string, unknown>;
}

export interface MCPAgentResult {
  answer: string;
  sources: { url: string; title: string }[];
  stepsExecuted: number;
}

export interface ProspectDiscovery {
  businessName: string;
  domain: string;
  phone?: string;
  email?: string;
  location?: string;
  category: string;
  matchScore: number;
}

export interface DeepCompanyProfile {
  name: string;
  domain: string;
  industry: string;
  size: string;
  revenue?: string;
  techStack: string[];
  socialLinks: Record<string, string>;
  keyPeople: { name: string; title: string; linkedin?: string }[];
  recentNews: string[];
  competitivePosition: string;
}

export interface DecisionMaker {
  name: string;
  title: string;
  email?: string;
  linkedin?: string;
  phone?: string;
  department: string;
  seniorityLevel: "c-level" | "vp" | "director" | "manager";
}

export interface CompetitorAnalysis {
  competitors: {
    name: string;
    domain: string;
    strengths: string[];
    weaknesses: string[];
    marketShare?: number;
  }[];
  opportunities: string[];
  threats: string[];
}

export interface TrendReport {
  trends: {
    topic: string;
    momentum: "rising" | "stable" | "declining";
    sources: string[];
  }[];
  insights: string[];
}

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

const crawlJobStore = new Map<string, MCPCrawlResult>();
const scrapeCache = new Map<string, MCPScrapeResult>();

export function resetMCPStore(): void {
  crawlJobStore.clear();
  scrapeCache.clear();
}

export function _getCrawlJobStoreForTesting(): Map<string, MCPCrawlResult> {
  return crawlJobStore;
}

export function _getScrapeCacheForTesting(): Map<string, MCPScrapeResult> {
  return scrapeCache;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

function getMCPConfig(): { apiKey: string; baseUrl: string } | undefined {
  const apiKey = process.env["FIRECRAWL_MCP_API_KEY"];
  const baseUrl =
    process.env["FIRECRAWL_MCP_BASE_URL"] ?? "https://api.firecrawl.dev/v1";

  if (typeof apiKey === "string" && apiKey.trim().length > 0) {
    return { apiKey: apiKey.trim(), baseUrl: baseUrl.replace(/\/$/, "") };
  }

  return undefined;
}

function isDryRun(): boolean {
  return (
    !getMCPConfig() ||
    process.env["LEAD_OS_ENABLE_LIVE_SENDS"] === "false"
  );
}

// ---------------------------------------------------------------------------
// MCP API request helper
// ---------------------------------------------------------------------------

async function mcpRequest(
  path: string,
  method: "GET" | "POST",
  body?: Record<string, unknown>,
): Promise<unknown> {
  const config = getMCPConfig();
  if (!config) {
    throw new Error("Firecrawl MCP API key not configured");
  }

  const response = await fetch(`${config.baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    throw new Error(
      `Firecrawl MCP returned ${response.status}: ${response.statusText}`,
    );
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// Dry-run helpers
// ---------------------------------------------------------------------------

function extractHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function buildDryRunScrapeResult(
  url: string,
  options?: MCPScrapeOptions,
): MCPScrapeResult {
  const hostname = extractHostname(url);
  const formats = options?.formats ?? ["markdown"];

  return {
    url,
    markdown: formats.includes("markdown")
      ? `# ${hostname}\n\nDry-run MCP scraped content for ${hostname}. Configure FIRECRAWL_MCP_API_KEY to enable live scraping.\n\n## About\n\nThis is a technology company building innovative solutions.`
      : undefined,
    html: formats.includes("html")
      ? `<html><head><title>${hostname}</title></head><body><h1>${hostname}</h1><p>Dry-run content</p></body></html>`
      : undefined,
    json: formats.includes("json") ? { dryRun: true, hostname } : undefined,
    metadata: {
      title: `${hostname} - Official Website`,
      description: `${hostname} is a technology company providing innovative solutions.`,
      language: "en",
      statusCode: 200,
    },
  };
}

function buildDryRunCrawlResult(
  url: string,
  options?: MCPCrawlOptions,
): MCPCrawlResult {
  const maxPages = options?.maxPages ?? 10;
  const pageCount = Math.min(maxPages, 3);
  const results: MCPScrapeResult[] = [];

  for (let i = 0; i < pageCount; i++) {
    const pageUrl =
      i === 0 ? url : `${url.replace(/\/$/, "")}/page-${i}`;
    results.push(buildDryRunScrapeResult(pageUrl));
  }

  return {
    jobId: randomUUID(),
    status: "completed",
    pagesFound: pageCount,
    pagesCrawled: pageCount,
    results,
  };
}

function buildDryRunSearchResult(
  query: string,
  options?: MCPSearchOptions,
): MCPSearchResult[] {
  const limit = options?.limit ?? 5;
  const count = Math.min(limit, 5);

  return Array.from({ length: count }, (_, i) => ({
    url: `https://example-${i + 1}.com`,
    title: `${query} - Result ${i + 1}`,
    description: `Dry-run search result ${i + 1} for "${query}". Configure FIRECRAWL_MCP_API_KEY for live search.`,
    markdown: `# ${query} - Result ${i + 1}\n\nDry-run search result content.`,
    metadata: { dryRun: true, rank: i + 1 },
  }));
}

// ---------------------------------------------------------------------------
// MCP Tool Wrappers
// ---------------------------------------------------------------------------

export async function mcpScrape(
  url: string,
  options?: MCPScrapeOptions,
): Promise<MCPScrapeResult> {
  const cached = scrapeCache.get(url);
  if (cached) return cached;

  if (isDryRun()) {
    const result = buildDryRunScrapeResult(url, options);
    scrapeCache.set(url, result);
    return result;
  }

  const body: Record<string, unknown> = { url };
  if (options?.formats) body.formats = options.formats;
  if (options?.onlyMainContent !== undefined)
    body.onlyMainContent = options.onlyMainContent;
  if (options?.waitFor) body.waitFor = options.waitFor;
  if (options?.extractSchema) body.extract = { schema: options.extractSchema };

  const data = (await mcpRequest("/scrape", "POST", body)) as {
    success: boolean;
    data?: Record<string, unknown>;
  };

  if (!data.success || !data.data) {
    throw new Error("MCP scrape returned no data");
  }

  const d = data.data;
  const meta = (d.metadata ?? {}) as Record<string, unknown>;
  const result: MCPScrapeResult = {
    url,
    markdown: (d.markdown as string) ?? undefined,
    html: (d.html as string) ?? undefined,
    json: (d.json as Record<string, unknown>) ?? undefined,
    metadata: {
      title: (meta.title as string) ?? "",
      description: (meta.description as string) ?? "",
      language: (meta.language as string) ?? "en",
      statusCode: (meta.statusCode as number) ?? 200,
    },
  };

  scrapeCache.set(url, result);
  return result;
}

export async function mcpBatchScrape(
  urls: string[],
  options?: MCPScrapeOptions,
): Promise<MCPScrapeResult[]> {
  if (urls.length === 0) return [];

  if (isDryRun()) {
    return urls.map((url) => buildDryRunScrapeResult(url, options));
  }

  const results = await Promise.allSettled(
    urls.map((url) => mcpScrape(url, options)),
  );

  return results.map((r, i) =>
    r.status === "fulfilled"
      ? r.value
      : buildDryRunScrapeResult(urls[i]!),
  );
}

export async function mcpCrawl(
  url: string,
  options?: MCPCrawlOptions,
): Promise<MCPCrawlResult> {
  if (isDryRun()) {
    const result = buildDryRunCrawlResult(url, options);
    crawlJobStore.set(result.jobId, result);
    return result;
  }

  const body: Record<string, unknown> = { url };
  if (options?.maxPages) body.limit = options.maxPages;
  if (options?.maxDepth) body.maxDepth = options.maxDepth;
  if (options?.includePaths) body.includePaths = options.includePaths;
  if (options?.excludePaths) body.excludePaths = options.excludePaths;

  const data = (await mcpRequest("/crawl", "POST", body)) as {
    success: boolean;
    id?: string;
  };

  if (!data.success || !data.id) {
    throw new Error("MCP crawl failed to start");
  }

  const result: MCPCrawlResult = {
    jobId: data.id,
    status: "pending",
    pagesFound: 0,
    pagesCrawled: 0,
    results: [],
  };

  crawlJobStore.set(result.jobId, result);
  return result;
}

export async function mcpMap(url: string): Promise<MCPMapResult> {
  if (isDryRun()) {
    const hostname = extractHostname(url);
    return {
      urls: [
        url,
        `${url.replace(/\/$/, "")}/about`,
        `${url.replace(/\/$/, "")}/contact`,
        `${url.replace(/\/$/, "")}/products`,
        `${url.replace(/\/$/, "")}/blog`,
      ],
      totalFound: 5,
    };
  }

  const data = (await mcpRequest("/map", "POST", { url })) as {
    success: boolean;
    links?: string[];
  };

  if (!data.success) {
    throw new Error("MCP map returned no data");
  }

  const urls = data.links ?? [];
  return { urls, totalFound: urls.length };
}

export async function mcpSearch(
  query: string,
  options?: MCPSearchOptions,
): Promise<MCPSearchResult[]> {
  if (isDryRun()) {
    return buildDryRunSearchResult(query, options);
  }

  const body: Record<string, unknown> = { query };
  if (options?.limit) body.limit = options.limit;
  if (options?.country) body.country = options.country;
  if (options?.language) body.lang = options.language;

  const data = (await mcpRequest("/search", "POST", body)) as {
    success: boolean;
    data?: Record<string, unknown>[];
  };

  if (!data.success || !data.data) {
    throw new Error("MCP search returned no data");
  }

  return data.data.map((item) => ({
    url: (item.url as string) ?? "",
    title: (item.title as string) ?? "",
    description: (item.description as string) ?? "",
    markdown: (item.markdown as string) ?? "",
    metadata: (item.metadata as Record<string, unknown>) ?? {},
  }));
}

export async function mcpInteract(
  url: string,
  actions: BrowserAction[],
): Promise<MCPInteractResult> {
  if (isDryRun()) {
    return {
      url,
      actions: actions.map((action) => ({ action, success: true })),
      finalContent: `Dry-run interaction with ${extractHostname(url)}. ${actions.length} action(s) simulated. Configure FIRECRAWL_MCP_API_KEY for live browser interaction.`,
    };
  }

  const data = (await mcpRequest("/interact", "POST", {
    url,
    actions,
  })) as {
    success: boolean;
    data?: {
      actions?: { action: BrowserAction; success: boolean }[];
      content?: string;
    };
  };

  if (!data.success || !data.data) {
    throw new Error("MCP interact returned no data");
  }

  return {
    url,
    actions: data.data.actions ?? actions.map((a) => ({ action: a, success: true })),
    finalContent: data.data.content ?? "",
  };
}

export async function mcpAgent(
  query: string,
  options?: MCPAgentOptions,
): Promise<MCPAgentResult> {
  if (isDryRun()) {
    return {
      answer: `Dry-run agent response for: "${query}". Configure FIRECRAWL_MCP_API_KEY to enable live agent queries.`,
      sources: [
        { url: "https://example.com/source-1", title: "Source 1" },
        { url: "https://example.com/source-2", title: "Source 2" },
      ],
      stepsExecuted: options?.maxSteps ? Math.min(options.maxSteps, 3) : 3,
    };
  }

  const body: Record<string, unknown> = { query };
  if (options?.maxSteps) body.maxSteps = options.maxSteps;
  if (options?.extractSchema)
    body.extract = { schema: options.extractSchema };

  const data = (await mcpRequest("/agent", "POST", body)) as {
    success: boolean;
    data?: {
      answer?: string;
      sources?: { url: string; title: string }[];
      stepsExecuted?: number;
    };
  };

  if (!data.success || !data.data) {
    throw new Error("MCP agent returned no data");
  }

  return {
    answer: data.data.answer ?? "",
    sources: data.data.sources ?? [],
    stepsExecuted: data.data.stepsExecuted ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Lead-specific MCP workflows
// ---------------------------------------------------------------------------

export async function discoverProspects(
  query: string,
  niche: string,
  limit?: number,
): Promise<ProspectDiscovery[]> {
  const searchQuery = `${niche} businesses ${query}`;
  const searchResults = await mcpSearch(searchQuery, {
    limit: limit ?? 10,
  });

  const prospects: ProspectDiscovery[] = [];

  for (const result of searchResults) {
    const hostname = extractHostname(result.url);
    const matchScore = calculateMatchScore(
      result.title + " " + result.description,
      niche,
    );

    const emailMatch = /[\w.+-]+@[\w-]+\.[\w.-]+/.exec(
      result.markdown + " " + result.description,
    );
    const phoneMatch =
      /(?:\+\d{1,3}\s?)?(?:\(\d{1,4}\)\s?)?\d[\d\s.-]{6,}\d/.exec(
        result.markdown + " " + result.description,
      );

    prospects.push({
      businessName: result.title.split(" - ")[0]?.trim() ?? hostname,
      domain: hostname,
      phone: phoneMatch?.[0],
      email: emailMatch?.[0],
      location: undefined,
      category: niche,
      matchScore,
    });
  }

  return prospects
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit ?? 10);
}

export async function deepEnrichCompany(
  domain: string,
): Promise<DeepCompanyProfile> {
  const url = domain.startsWith("http") ? domain : `https://${domain}`;
  const hostname = extractHostname(url);

  const [mainPage, mapResult] = await Promise.all([
    mcpScrape(url, { formats: ["markdown"], onlyMainContent: true }),
    mcpMap(url),
  ]);

  const aboutUrl = mapResult.urls.find((u) => /about/i.test(u));
  const teamUrl = mapResult.urls.find((u) => /team|people|leadership/i.test(u));
  const newsUrl = mapResult.urls.find((u) => /news|blog|press/i.test(u));

  const secondaryPages = await mcpBatchScrape(
    [aboutUrl, teamUrl, newsUrl].filter((u): u is string => u !== undefined),
    { formats: ["markdown"], onlyMainContent: true },
  );

  const allContent = [
    mainPage.markdown ?? "",
    ...secondaryPages.map((p) => p.markdown ?? ""),
  ].join("\n");

  const techStack = detectTechStack(allContent);
  const socialLinks = extractSocialLinks(allContent);
  const keyPeople = extractKeyPeople(allContent);
  const recentNews = extractRecentNews(allContent);
  const industry = detectIndustry(allContent);
  const size = estimateCompanySize(allContent);

  return {
    name: mainPage.metadata.title.split("|")[0]?.trim() ?? hostname,
    domain: hostname,
    industry,
    size,
    revenue: undefined,
    techStack,
    socialLinks,
    keyPeople,
    recentNews,
    competitivePosition: `${hostname} operates in the ${industry} space with a focus on innovative solutions.`,
  };
}

export async function findDecisionMakers(
  companyDomain: string,
): Promise<DecisionMaker[]> {
  const url = companyDomain.startsWith("http")
    ? companyDomain
    : `https://${companyDomain}`;

  const searchResults = await mcpSearch(
    `${extractHostname(url)} leadership team executives`,
    { limit: 10 },
  );

  const teamPage = await mcpScrape(
    `${url.replace(/\/$/, "")}/about`,
    { formats: ["markdown"], onlyMainContent: true },
  ).catch(() => null);

  const allContent = [
    teamPage?.markdown ?? "",
    ...searchResults.map((r) => r.markdown),
  ].join("\n");

  return extractDecisionMakers(allContent, extractHostname(url));
}

export async function analyzeCompetitorLandscape(
  niche: string,
  location: string,
): Promise<CompetitorAnalysis> {
  const searchResults = await mcpSearch(
    `top ${niche} companies ${location}`,
    { limit: 10 },
  );

  const competitors: CompetitorAnalysis["competitors"] = [];

  for (const result of searchResults.slice(0, 5)) {
    const hostname = extractHostname(result.url);
    competitors.push({
      name: result.title.split(" - ")[0]?.trim() ?? hostname,
      domain: hostname,
      strengths: extractStrengths(result.description + " " + result.markdown),
      weaknesses: extractWeaknesses(
        result.description + " " + result.markdown,
      ),
      marketShare: undefined,
    });
  }

  return {
    competitors,
    opportunities: [
      `Underserved segments in the ${niche} market in ${location}`,
      `Digital transformation gaps among existing providers`,
      `Customer experience improvements over current competitors`,
    ],
    threats: [
      `Established players with strong brand recognition`,
      `New entrants with innovative technology solutions`,
      `Market saturation in core ${niche} segments`,
    ],
  };
}

export async function monitorIndustryTrends(
  niche: string,
  keywords: string[],
): Promise<TrendReport> {
  const searchPromises = keywords.map((keyword) =>
    mcpSearch(`${niche} ${keyword} trends 2026`, { limit: 3 }),
  );

  const searchResults = await Promise.all(searchPromises);

  const trends: TrendReport["trends"] = keywords.map((keyword, i) => {
    const results = searchResults[i] ?? [];
    return {
      topic: keyword,
      momentum: determineMomentum(
        results.map((r) => r.description).join(" "),
      ),
      sources: results.map((r) => r.url),
    };
  });

  const insights = [
    `The ${niche} industry shows significant activity around: ${keywords.join(", ")}`,
    `Key trends indicate ${trends.filter((t) => t.momentum === "rising").length} rising topics out of ${trends.length} monitored`,
    `Recommended focus areas: ${trends.filter((t) => t.momentum === "rising").map((t) => t.topic).join(", ") || "all monitored topics"}`,
  ];

  return { trends, insights };
}

// ---------------------------------------------------------------------------
// Internal analysis helpers
// ---------------------------------------------------------------------------

function calculateMatchScore(text: string, niche: string): number {
  const lower = text.toLowerCase();
  const nicheWords = niche.toLowerCase().split(/\s+/);
  const matchCount = nicheWords.filter((w) => lower.includes(w)).length;
  return Math.min(1, (matchCount / Math.max(nicheWords.length, 1)) * 0.7 + 0.3);
}

function detectTechStack(content: string): string[] {
  const lower = content.toLowerCase();
  const indicators: Record<string, string[]> = {
    React: ["react", "reactjs"],
    "Next.js": ["next.js", "nextjs", "vercel"],
    Vue: ["vue", "vuejs"],
    Angular: ["angular"],
    WordPress: ["wordpress", "wp-content"],
    Shopify: ["shopify", "myshopify"],
    "Node.js": ["node.js", "nodejs", "express"],
    Python: ["python", "django", "flask"],
    PostgreSQL: ["postgresql", "postgres"],
    MongoDB: ["mongodb", "mongo"],
    AWS: ["amazon web services", "aws"],
    "Google Cloud": ["google cloud", "gcp"],
    Kubernetes: ["kubernetes", "k8s"],
  };

  return Object.entries(indicators)
    .filter(([, patterns]) => patterns.some((p) => lower.includes(p)))
    .map(([name]) => name);
}

function extractSocialLinks(content: string): Record<string, string> {
  const patterns: Record<string, RegExp> = {
    linkedin: /linkedin\.com\/company\/[\w-]+/i,
    twitter: /(?:twitter|x)\.com\/[\w-]+/i,
    facebook: /facebook\.com\/[\w.-]+/i,
    instagram: /instagram\.com\/[\w.-]+/i,
    github: /github\.com\/[\w-]+/i,
    youtube: /youtube\.com\/(?:c\/|channel\/|@)[\w-]+/i,
  };

  const links: Record<string, string> = {};
  for (const [platform, regex] of Object.entries(patterns)) {
    const match = regex.exec(content);
    if (match) {
      links[platform] = `https://${match[0]}`;
    }
  }
  return links;
}

function extractKeyPeople(
  content: string,
): { name: string; title: string; linkedin?: string }[] {
  const titlePatterns =
    /(?:CEO|CTO|CFO|COO|VP|Director|President|Founder|Co-Founder|Head of)\s*[,:—-]?\s*([A-Z][a-z]+(?:\s[A-Z][a-z]+){1,3})/g;
  const nameFirst =
    /([A-Z][a-z]+(?:\s[A-Z][a-z]+){1,3})\s*[,:—-]?\s*(?:CEO|CTO|CFO|COO|VP|Director|President|Founder|Co-Founder|Head of[\w\s]*)/g;

  const people: { name: string; title: string; linkedin?: string }[] = [];
  const seen = new Set<string>();

  for (const regex of [titlePatterns, nameFirst]) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      const name = match[1]?.trim();
      if (name && !seen.has(name) && name.length > 3) {
        seen.add(name);
        const titleMatch = match[0].match(
          /CEO|CTO|CFO|COO|VP[\w\s]*|Director[\w\s]*|President|(?:Co-)?Founder|Head of[\w\s]*/i,
        );
        people.push({
          name,
          title: titleMatch?.[0]?.trim() ?? "Executive",
          linkedin: undefined,
        });
      }
    }
  }

  return people.slice(0, 10);
}

function extractRecentNews(content: string): string[] {
  const lines = content.split("\n");
  const news: string[] = [];

  for (const line of lines) {
    const trimmed = line.replace(/^[#*\->\s]+/, "").trim();
    if (
      trimmed.length > 20 &&
      trimmed.length < 200 &&
      /(?:announce|launch|partner|raise|acquire|expand|release|update)/i.test(
        trimmed,
      )
    ) {
      news.push(trimmed);
    }
  }

  return news.slice(0, 5);
}

function detectIndustry(content: string): string {
  const lower = content.toLowerCase();
  const keywords: Record<string, string[]> = {
    "SaaS / Software": ["software", "saas", "platform", "api", "developer"],
    "E-commerce": ["shop", "store", "cart", "checkout", "product"],
    "Professional Services": ["consulting", "agency", "law", "accounting"],
    Healthcare: ["health", "medical", "clinic", "patient"],
    Finance: ["finance", "banking", "fintech", "payment"],
    Education: ["education", "learning", "course", "university"],
    Marketing: ["marketing", "advertising", "media", "creative"],
    "Real Estate": ["real estate", "property", "housing", "rental"],
  };

  return (
    Object.entries(keywords).find(([, patterns]) =>
      patterns.some((p) => lower.includes(p)),
    )?.[0] ?? "Technology"
  );
}

function estimateCompanySize(content: string): string {
  const lower = content.toLowerCase();
  const hints: Array<[string, string[]]> = [
    ["Enterprise (1000+)", ["enterprise", "global", "fortune"]],
    ["Mid-market (201-1000)", ["mid-size", "hundreds of employees"]],
    ["Growth (51-200)", ["growing team", "series"]],
    ["Small (11-50)", ["small team", "startup"]],
    ["Micro (1-10)", ["solo", "freelance", "solopreneur"]],
  ];

  return (
    hints.find(([, patterns]) => patterns.some((p) => lower.includes(p)))?.[0] ??
    "Unknown"
  );
}

function extractDecisionMakers(
  content: string,
  domain: string,
): DecisionMaker[] {
  const titleToSeniority: Record<string, DecisionMaker["seniorityLevel"]> = {
    CEO: "c-level",
    CTO: "c-level",
    CFO: "c-level",
    COO: "c-level",
    CMO: "c-level",
    CRO: "c-level",
    "Chief": "c-level",
    VP: "vp",
    "Vice President": "vp",
    Director: "director",
    Manager: "manager",
    "Head of": "director",
  };

  const titleToDepartment: Record<string, string> = {
    CEO: "Executive",
    CTO: "Engineering",
    CFO: "Finance",
    COO: "Operations",
    CMO: "Marketing",
    CRO: "Revenue",
    VP: "Management",
    Director: "Management",
    Manager: "Management",
  };

  const pattern =
    /([A-Z][a-z]+(?:\s[A-Z][a-z]+){1,3})\s*[,:—-]?\s*(CEO|CTO|CFO|COO|CMO|CRO|Chief[\w\s]+Officer|VP[\w\s]*|Vice President[\w\s]*|Director[\w\s]*|Head of[\w\s]*|Manager[\w\s]*)/g;

  const makers: DecisionMaker[] = [];
  const seen = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    const name = match[1]?.trim();
    const title = match[2]?.trim();
    if (!name || !title || seen.has(name) || name.length < 4) continue;
    seen.add(name);

    const seniorityKey = Object.keys(titleToSeniority).find((k) =>
      title.includes(k),
    );

    const departmentKey = Object.keys(titleToDepartment).find((k) =>
      title.includes(k),
    );

    makers.push({
      name,
      title,
      email: undefined,
      linkedin: undefined,
      phone: undefined,
      department: departmentKey
        ? titleToDepartment[departmentKey]!
        : "General",
      seniorityLevel: seniorityKey
        ? titleToSeniority[seniorityKey]!
        : "manager",
    });
  }

  if (makers.length === 0) {
    makers.push({
      name: "Unknown Decision Maker",
      title: "Executive",
      email: `info@${domain}`,
      linkedin: undefined,
      phone: undefined,
      department: "Executive",
      seniorityLevel: "c-level",
    });
  }

  return makers.slice(0, 10);
}

function extractStrengths(content: string): string[] {
  const lower = content.toLowerCase();
  const strengths: string[] = [];

  if (/leading|top|best|award/i.test(lower))
    strengths.push("Strong market position");
  if (/innovat|cutting.?edge|advanced/i.test(lower))
    strengths.push("Innovative technology");
  if (/customer|client|satisfaction/i.test(lower))
    strengths.push("Customer-focused approach");
  if (/global|international|worldwide/i.test(lower))
    strengths.push("Global presence");

  return strengths.length > 0
    ? strengths
    : ["Established market presence"];
}

function extractWeaknesses(content: string): string[] {
  const lower = content.toLowerCase();
  const weaknesses: string[] = [];

  if (/startup|new|emerging/i.test(lower))
    weaknesses.push("Limited market history");
  if (/small|niche|specialized/i.test(lower))
    weaknesses.push("Limited scale");
  if (!/mobile|app/i.test(lower))
    weaknesses.push("Potentially limited mobile presence");

  return weaknesses.length > 0
    ? weaknesses
    : ["No clear weaknesses identified from public data"];
}

function determineMomentum(
  content: string,
): "rising" | "stable" | "declining" {
  const lower = content.toLowerCase();

  if (/growing|surge|boom|accelerat|emerging|hot/i.test(lower))
    return "rising";
  if (/declining|shrink|slow|decrease|downturn/i.test(lower))
    return "declining";
  return "stable";
}

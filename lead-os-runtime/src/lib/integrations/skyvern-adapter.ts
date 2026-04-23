import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SkyvernTaskConfig {
  tenantId: string;
  type: string;
  url: string;
  instructions: string;
  extractSchema?: Record<string, unknown>;
  maxRetries?: number;
  timeout?: number;
}

export interface SkyvernTask {
  id: string;
  tenantId: string;
  type: string;
  status: "pending" | "running" | "completed" | "failed";
  url: string;
  result?: unknown;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

export interface Experience {
  title: string;
  company: string;
  duration: string;
  description: string;
}

export interface LinkedInProfile {
  name: string;
  title: string;
  company: string;
  location: string;
  about: string;
  experience: Experience[];
  skills: string[];
  connectionCount?: number;
}

export interface LinkedInCompanyProfile {
  name: string;
  industry: string;
  size: string;
  description: string;
  headquarters: string;
  specialties: string[];
  employees?: number;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
}

export interface FormSubmissionResult {
  success: boolean;
  confirmationMessage?: string;
  screenshotUrl?: string;
}

export interface FormSubmission {
  formUrl: string;
  data: ContactFormData;
}

export interface DirectoryFilters {
  category?: string;
  location?: string;
  minRating?: number;
  maxResults?: number;
}

export interface BusinessListing {
  name: string;
  address: string;
  phone: string;
  website: string;
  rating: number;
  reviewCount: number;
  category: string;
}

export interface PricingData {
  competitor: string;
  products: { name: string; price: string; features: string[] }[];
  scrapedAt: string;
}

export interface ReviewData {
  reviewer: string;
  rating: number;
  text: string;
  date: string;
  platform: string;
}

export interface BatchResult<T> {
  total: number;
  completed: number;
  failed: number;
  results: (T | { error: string })[];
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const taskStore = new Map<string, SkyvernTask>();

export function resetSkyvernStore(): void {
  taskStore.clear();
}

export function _getTaskStoreForTesting(): Map<string, SkyvernTask> {
  return taskStore;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

function getSkyvernConfig(): { apiKey: string; baseUrl: string } | undefined {
  const apiKey = process.env["SKYVERN_API_KEY"];
  const baseUrl = process.env["SKYVERN_BASE_URL"] ?? "https://api.skyvern.com/v1";

  if (typeof apiKey === "string" && apiKey.trim().length > 0) {
    return { apiKey: apiKey.trim(), baseUrl: baseUrl.replace(/\/$/, "") };
  }

  return undefined;
}

function isDryRun(): boolean {
  return !getSkyvernConfig() || process.env["LEAD_OS_ENABLE_LIVE_SENDS"] === "false";
}

// ---------------------------------------------------------------------------
// Skyvern API calls
// ---------------------------------------------------------------------------

async function skyvernRequest(
  path: string,
  method: "GET" | "POST" | "DELETE",
  body?: Record<string, unknown>,
): Promise<unknown> {
  const config = getSkyvernConfig();
  if (!config) {
    throw new Error("Skyvern API key not configured");
  }

  const response = await fetch(`${config.baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`Skyvern returned ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// Task management
// ---------------------------------------------------------------------------

export async function createTask(config: SkyvernTaskConfig): Promise<SkyvernTask> {
  const now = new Date().toISOString();

  if (isDryRun()) {
    const task: SkyvernTask = {
      id: `stask-${randomUUID()}`,
      tenantId: config.tenantId,
      type: config.type,
      status: "completed",
      url: config.url,
      result: { dryRun: true, message: "Task simulated in dry-run mode" },
      startedAt: now,
      completedAt: now,
    };
    taskStore.set(task.id, task);
    return task;
  }

  const result = (await skyvernRequest("/tasks", "POST", {
    url: config.url,
    navigation_goal: config.instructions,
    data_extraction_goal: config.extractSchema ? JSON.stringify(config.extractSchema) : undefined,
    max_retries: config.maxRetries ?? 3,
    timeout: config.timeout ?? 60_000,
  })) as { task_id?: string };

  const task: SkyvernTask = {
    id: result.task_id ?? `stask-${randomUUID()}`,
    tenantId: config.tenantId,
    type: config.type,
    status: "pending",
    url: config.url,
    startedAt: now,
  };
  taskStore.set(task.id, task);
  return task;
}

export async function getTaskStatus(taskId: string): Promise<SkyvernTask> {
  const cached = taskStore.get(taskId);

  if (isDryRun()) {
    if (!cached) {
      throw new Error(`Task not found: ${taskId}`);
    }
    return cached;
  }

  const result = (await skyvernRequest(`/tasks/${taskId}`, "GET")) as {
    status?: string;
    extracted_information?: unknown;
    failure_reason?: string;
  };

  const statusMap: Record<string, SkyvernTask["status"]> = {
    completed: "completed",
    failed: "failed",
    running: "running",
    queued: "pending",
  };

  const task: SkyvernTask = {
    id: taskId,
    tenantId: cached?.tenantId ?? "",
    type: cached?.type ?? "unknown",
    status: statusMap[result.status ?? ""] ?? "pending",
    url: cached?.url ?? "",
    result: result.extracted_information,
    error: result.failure_reason,
    startedAt: cached?.startedAt ?? new Date().toISOString(),
    completedAt: result.status === "completed" || result.status === "failed" ? new Date().toISOString() : undefined,
  };

  taskStore.set(taskId, task);
  return task;
}

export async function listTasks(tenantId: string): Promise<SkyvernTask[]> {
  return [...taskStore.values()].filter((t) => t.tenantId === tenantId);
}

export async function cancelTask(taskId: string): Promise<void> {
  const task = taskStore.get(taskId);
  if (!task) {
    throw new Error(`Task not found: ${taskId}`);
  }

  if (!isDryRun()) {
    await skyvernRequest(`/tasks/${taskId}`, "DELETE");
  }

  task.status = "failed";
  task.error = "Cancelled by user";
  task.completedAt = new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Pre-built lead gen tasks - LinkedIn profile
// ---------------------------------------------------------------------------

export async function scrapeLinkedInProfile(profileUrl: string): Promise<LinkedInProfile> {
  if (isDryRun()) {
    return buildDryRunLinkedInProfile(profileUrl);
  }

  const task = await createTask({
    tenantId: "system",
    type: "linkedin-profile",
    url: profileUrl,
    instructions: "Extract the full LinkedIn profile including name, title, company, location, about section, experience, and skills.",
    extractSchema: {
      name: "string",
      title: "string",
      company: "string",
      location: "string",
      about: "string",
      experience: "array",
      skills: "array",
    },
  });

  return (task.result as LinkedInProfile) ?? buildDryRunLinkedInProfile(profileUrl);
}

export async function scrapeLinkedInCompany(companyUrl: string): Promise<LinkedInCompanyProfile> {
  if (isDryRun()) {
    return buildDryRunLinkedInCompany(companyUrl);
  }

  const task = await createTask({
    tenantId: "system",
    type: "linkedin-company",
    url: companyUrl,
    instructions: "Extract the full LinkedIn company profile including name, industry, size, description, headquarters, and specialties.",
    extractSchema: {
      name: "string",
      industry: "string",
      size: "string",
      description: "string",
      headquarters: "string",
      specialties: "array",
    },
  });

  return (task.result as LinkedInCompanyProfile) ?? buildDryRunLinkedInCompany(companyUrl);
}

// ---------------------------------------------------------------------------
// Pre-built lead gen tasks - Forms
// ---------------------------------------------------------------------------

export async function fillContactForm(
  formUrl: string,
  data: ContactFormData,
): Promise<FormSubmissionResult> {
  if (isDryRun()) {
    return buildDryRunFormResult(formUrl, data);
  }

  const task = await createTask({
    tenantId: "system",
    type: "form-fill",
    url: formUrl,
    instructions: `Fill out the contact form with: Name: ${data.name}, Email: ${data.email}${data.phone ? `, Phone: ${data.phone}` : ""}${data.company ? `, Company: ${data.company}` : ""}, Message: ${data.message}. Then submit the form.`,
  });

  if (task.status === "completed") {
    return { success: true, confirmationMessage: "Form submitted successfully" };
  }
  return { success: false, confirmationMessage: task.error ?? "Form submission failed" };
}

// ---------------------------------------------------------------------------
// Pre-built lead gen tasks - Directory
// ---------------------------------------------------------------------------

export async function scrapeBusinessDirectory(
  directoryUrl: string,
  filters: DirectoryFilters,
): Promise<BusinessListing[]> {
  if (isDryRun()) {
    return buildDryRunDirectoryListings(directoryUrl, filters);
  }

  const task = await createTask({
    tenantId: "system",
    type: "directory-scrape",
    url: directoryUrl,
    instructions: `Scrape business listings from this directory.${filters.category ? ` Category: ${filters.category}.` : ""}${filters.location ? ` Location: ${filters.location}.` : ""}${filters.minRating ? ` Minimum rating: ${filters.minRating}.` : ""} Extract: name, address, phone, website, rating, review count, category.`,
    extractSchema: {
      listings: "array",
    },
  });

  return (task.result as BusinessListing[]) ?? buildDryRunDirectoryListings(directoryUrl, filters);
}

// ---------------------------------------------------------------------------
// Pre-built lead gen tasks - Competitor pricing
// ---------------------------------------------------------------------------

export async function monitorCompetitorPricing(competitorUrls: string[]): Promise<PricingData[]> {
  if (isDryRun()) {
    return competitorUrls.map((url) => buildDryRunPricing(url));
  }

  const results = await Promise.allSettled(
    competitorUrls.map(async (url) => {
      const task = await createTask({
        tenantId: "system",
        type: "pricing-monitor",
        url,
        instructions: "Extract all product names, prices, and features from this pricing page.",
        extractSchema: { products: "array" },
      });
      return {
        competitor: url,
        products: ((task.result as { products?: unknown[] })?.products ?? []) as PricingData["products"],
        scrapedAt: new Date().toISOString(),
      };
    }),
  );

  return results.map((r, i) =>
    r.status === "fulfilled" ? r.value : buildDryRunPricing(competitorUrls[i]!),
  );
}

// ---------------------------------------------------------------------------
// Pre-built lead gen tasks - Reviews
// ---------------------------------------------------------------------------

export async function extractReviewsFromPlatform(platformUrl: string): Promise<ReviewData[]> {
  if (isDryRun()) {
    return buildDryRunReviews(platformUrl);
  }

  const task = await createTask({
    tenantId: "system",
    type: "review-extract",
    url: platformUrl,
    instructions: "Extract all visible reviews including reviewer name, rating, review text, and date.",
    extractSchema: { reviews: "array" },
  });

  return (task.result as ReviewData[]) ?? buildDryRunReviews(platformUrl);
}

// ---------------------------------------------------------------------------
// Batch operations
// ---------------------------------------------------------------------------

export async function batchScrapeProfiles(urls: string[]): Promise<BatchResult<LinkedInProfile>> {
  const results: (LinkedInProfile | { error: string })[] = [];
  let completed = 0;
  let failed = 0;

  const settled = await Promise.allSettled(urls.map((url) => scrapeLinkedInProfile(url)));

  for (const result of settled) {
    if (result.status === "fulfilled") {
      results.push(result.value);
      completed++;
    } else {
      results.push({ error: result.reason instanceof Error ? result.reason.message : "Unknown error" });
      failed++;
    }
  }

  return { total: urls.length, completed, failed, results };
}

export async function batchFillForms(
  submissions: FormSubmission[],
): Promise<BatchResult<FormSubmissionResult>> {
  const results: (FormSubmissionResult | { error: string })[] = [];
  let completed = 0;
  let failed = 0;

  const settled = await Promise.allSettled(
    submissions.map((s) => fillContactForm(s.formUrl, s.data)),
  );

  for (const result of settled) {
    if (result.status === "fulfilled") {
      results.push(result.value);
      if (result.value.success) completed++;
      else failed++;
    } else {
      results.push({ error: result.reason instanceof Error ? result.reason.message : "Unknown error" });
      failed++;
    }
  }

  return { total: submissions.length, completed, failed, results };
}

// ---------------------------------------------------------------------------
// Dry-run builders
// ---------------------------------------------------------------------------

function extractSlugFromUrl(url: string): string {
  try {
    const parts = new URL(url).pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] ?? "unknown";
  } catch {
    return "unknown";
  }
}

function buildDryRunLinkedInProfile(profileUrl: string): LinkedInProfile {
  const slug = extractSlugFromUrl(profileUrl);
  const name = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    name,
    title: "Senior Director of Business Development",
    company: "Acme Corp",
    location: "San Francisco Bay Area",
    about: `${name} is an experienced business professional with a demonstrated history in technology and sales. Dry-run profile - configure SKYVERN_API_KEY for live scraping.`,
    experience: [
      { title: "Senior Director", company: "Acme Corp", duration: "2022 - Present", description: "Leading business development initiatives" },
      { title: "VP Sales", company: "TechStart Inc", duration: "2019 - 2022", description: "Built sales team from 5 to 30" },
    ],
    skills: ["Business Development", "SaaS Sales", "Strategic Partnerships", "Team Leadership"],
    connectionCount: 500,
  };
}

function buildDryRunLinkedInCompany(companyUrl: string): LinkedInCompanyProfile {
  const slug = extractSlugFromUrl(companyUrl);
  const name = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    name,
    industry: "Technology, Information and Internet",
    size: "51-200 employees",
    description: `${name} provides innovative solutions for modern businesses. Dry-run profile - configure SKYVERN_API_KEY for live scraping.`,
    headquarters: "San Francisco, CA",
    specialties: ["SaaS", "Cloud Computing", "AI/ML", "Enterprise Software"],
    employees: 150,
  };
}

function buildDryRunFormResult(_formUrl: string, data: ContactFormData): FormSubmissionResult {
  return {
    success: true,
    confirmationMessage: `Dry-run: Form submission simulated for ${data.name} (${data.email}). Configure SKYVERN_API_KEY for live form filling.`,
    screenshotUrl: undefined,
  };
}

function buildDryRunDirectoryListings(_url: string, filters: DirectoryFilters): BusinessListing[] {
  const count = Math.min(filters.maxResults ?? 5, 10);
  const category = filters.category ?? "Business Services";
  const location = filters.location ?? "San Francisco, CA";

  return Array.from({ length: count }, (_, i) => ({
    name: `${category} Provider ${i + 1}`,
    address: `${100 + i} Main St, ${location}`,
    phone: `+1 (555) ${String(100 + i).padStart(3, "0")}-${String(4000 + i).padStart(4, "0")}`,
    website: `https://example-${i + 1}.com`,
    rating: Math.min(5, (filters.minRating ?? 3.5) + Math.random() * 1.5),
    reviewCount: Math.floor(Math.random() * 200) + 10,
    category,
  }));
}

function buildDryRunPricing(url: string): PricingData {
  const hostname = (() => {
    try { return new URL(url).hostname; } catch { return url; }
  })();

  return {
    competitor: hostname,
    products: [
      { name: "Basic Plan", price: "$29/month", features: ["5 users", "Basic support", "1GB storage"] },
      { name: "Pro Plan", price: "$79/month", features: ["25 users", "Priority support", "10GB storage", "API access"] },
      { name: "Enterprise", price: "Contact us", features: ["Unlimited users", "Dedicated support", "Unlimited storage", "Custom integrations"] },
    ],
    scrapedAt: new Date().toISOString(),
  };
}

function buildDryRunReviews(platformUrl: string): ReviewData[] {
  const platform = (() => {
    try { return new URL(platformUrl).hostname.replace("www.", ""); } catch { return "unknown"; }
  })();

  return [
    { reviewer: "John D.", rating: 5, text: "Excellent service, highly recommend!", date: "2026-03-15", platform },
    { reviewer: "Sarah M.", rating: 4, text: "Great product with minor UX issues.", date: "2026-03-10", platform },
    { reviewer: "Mike R.", rating: 5, text: "Transformed our lead generation process.", date: "2026-03-05", platform },
    { reviewer: "Emily K.", rating: 3, text: "Good but could improve onboarding.", date: "2026-02-28", platform },
  ];
}

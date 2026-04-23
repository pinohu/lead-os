import type { ProviderResult } from "../providers.ts";
import { getPool } from "../db.ts";

// ---------------------------------------------------------------------------
// More Good Reviews Types
// ---------------------------------------------------------------------------

export interface MGRConfig {
  apiKey: string;
  baseUrl: string;
}

export interface ReviewRequest {
  id: string;
  customerEmail: string;
  customerName: string;
  businessName: string;
  templateId?: string;
  status: "pending" | "sent" | "opened" | "completed" | "expired";
  sentAt?: string;
  completedAt?: string;
  rating?: number;
  tenantId?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  platform: "google" | "yelp" | "facebook" | "trustpilot" | "custom";
  author: string;
  rating: number;
  text: string;
  date: string;
  verified: boolean;
  responded: boolean;
  response?: string;
  businessId?: string;
  tenantId?: string;
}

export interface ReviewTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  followUpDays: number;
  tenantId?: string;
}

export interface ReviewWidget {
  id: string;
  businessName: string;
  platform: string;
  style: "carousel" | "grid" | "list" | "badge";
  minRating: number;
  maxDisplay: number;
  tenantId?: string;
}

export interface ReviewStats {
  totalReviews: number;
  avgRating: number;
  byPlatform: Record<string, { count: number; avgRating: number }>;
  responseRate: number;
  requestsSent: number;
  requestConversionRate: number;
  ratingDistribution: Record<number, number>;
}

export interface SendReviewRequestInput {
  customerEmail: string;
  customerName: string;
  businessName: string;
  templateId?: string;
  tenantId?: string;
}

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

const requestStore = new Map<string, ReviewRequest>();
const reviewStore = new Map<string, Review>();
const templateStore = new Map<string, ReviewTemplate>();
const widgetStore = new Map<string, ReviewWidget>();

let schemaEnsured = false;

// ---------------------------------------------------------------------------
// Config & Dry-run
// ---------------------------------------------------------------------------

export function resolveMGRConfig(): MGRConfig | null {
  const apiKey = process.env.MORE_GOOD_REVIEWS_API_KEY ?? "";
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl:
      process.env.MORE_GOOD_REVIEWS_BASE_URL ??
      "https://api.moregoodreviews.com/v1",
  };
}

export function isMGRDryRun(): boolean {
  return !process.env.MORE_GOOD_REVIEWS_API_KEY;
}

// ---------------------------------------------------------------------------
// Schema (lazy-init)
// ---------------------------------------------------------------------------

async function ensureMGRSchema(): Promise<void> {
  if (schemaEnsured) return;
  const pool = getPool();
  if (!pool) return;

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lead_os_reviews (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        tenant_id TEXT,
        platform TEXT,
        payload JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    schemaEnsured = true;
  } catch {
    // Schema creation failed -- fall back to in-memory only
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

async function persistToDb(
  id: string,
  type: string,
  tenantId: string | undefined,
  platform: string | undefined,
  payload: unknown,
): Promise<void> {
  await ensureMGRSchema();
  const pool = getPool();
  if (!pool) return;

  try {
    await pool.query(
      `INSERT INTO lead_os_reviews (id, type, tenant_id, platform, payload)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE
       SET type = EXCLUDED.type,
           tenant_id = EXCLUDED.tenant_id,
           platform = EXCLUDED.platform,
           payload = EXCLUDED.payload`,
      [id, type, tenantId ?? null, platform ?? null, JSON.stringify(payload)],
    );
  } catch {
    // DB write failed -- in-memory store is still valid
  }
}

// ---------------------------------------------------------------------------
// Review Requests
// ---------------------------------------------------------------------------

export async function sendReviewRequest(
  input: SendReviewRequestInput,
): Promise<ReviewRequest> {
  const cfg = resolveMGRConfig();
  const now = new Date().toISOString();
  const id = generateId("rreq");

  if (cfg && !isMGRDryRun()) {
    try {
      const res = await fetch(`${cfg.baseUrl}/review-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cfg.apiKey}`,
        },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(30_000),
      });

      if (res.ok) {
        const data = (await res.json()) as Record<string, unknown>;
        const request: ReviewRequest = {
          id: typeof data.id === "string" ? data.id : id,
          customerEmail: input.customerEmail,
          customerName: input.customerName,
          businessName: input.businessName,
          templateId: input.templateId,
          status: "sent",
          sentAt: now,
          tenantId: input.tenantId,
          createdAt: now,
        };
        requestStore.set(request.id, request);
        await persistToDb(request.id, "request", input.tenantId, undefined, request);
        return request;
      }
    } catch {
      // Fall through to dry-run
    }
  }

  const request: ReviewRequest = {
    id,
    customerEmail: input.customerEmail,
    customerName: input.customerName,
    businessName: input.businessName,
    templateId: input.templateId,
    status: "sent",
    sentAt: now,
    tenantId: input.tenantId,
    createdAt: now,
  };

  requestStore.set(id, request);
  await persistToDb(id, "request", input.tenantId, undefined, request);
  return request;
}

export async function sendBulkReviewRequests(
  inputs: SendReviewRequestInput[],
): Promise<ReviewRequest[]> {
  const results: ReviewRequest[] = [];
  for (const input of inputs) {
    results.push(await sendReviewRequest(input));
  }
  return results;
}

export async function getReviewRequest(
  requestId: string,
): Promise<ReviewRequest | null> {
  return requestStore.get(requestId) ?? null;
}

export async function listReviewRequests(
  tenantId?: string,
): Promise<ReviewRequest[]> {
  const all = [...requestStore.values()];
  if (!tenantId) return all;
  return all.filter((r) => r.tenantId === tenantId);
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export async function addReview(
  review: Omit<Review, "id">,
): Promise<Review> {
  const id = generateId("rev");
  const full: Review = { id, ...review };
  reviewStore.set(id, full);
  await persistToDb(id, "review", review.tenantId, review.platform, full);
  return full;
}

export async function listReviews(
  filter?: { platform?: string; minRating?: number; tenantId?: string },
): Promise<Review[]> {
  let results = [...reviewStore.values()];

  if (filter?.tenantId) {
    results = results.filter((r) => r.tenantId === filter.tenantId);
  }
  if (filter?.platform) {
    results = results.filter((r) => r.platform === filter.platform);
  }
  if (filter?.minRating !== undefined) {
    results = results.filter((r) => r.rating >= filter.minRating!);
  }

  return results;
}

export async function respondToReview(
  reviewId: string,
  response: string,
): Promise<Review | null> {
  const review = reviewStore.get(reviewId);
  if (!review) return null;

  review.responded = true;
  review.response = response;
  reviewStore.set(reviewId, review);
  await persistToDb(reviewId, "review", review.tenantId, review.platform, review);
  return review;
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export async function createTemplate(
  template: Omit<ReviewTemplate, "id">,
): Promise<ReviewTemplate> {
  const id = generateId("tmpl");
  const full: ReviewTemplate = { id, ...template };
  templateStore.set(id, full);
  await persistToDb(id, "template", template.tenantId, undefined, full);
  return full;
}

export async function listTemplates(
  tenantId?: string,
): Promise<ReviewTemplate[]> {
  const all = [...templateStore.values()];
  if (!tenantId) return all;
  return all.filter((t) => t.tenantId === tenantId);
}

// ---------------------------------------------------------------------------
// Widgets
// ---------------------------------------------------------------------------

export async function createWidget(
  widget: Omit<ReviewWidget, "id">,
): Promise<ReviewWidget> {
  const id = generateId("wgt");
  const full: ReviewWidget = { id, ...widget };
  widgetStore.set(id, full);
  await persistToDb(id, "widget", widget.tenantId, widget.platform, full);
  return full;
}

export async function listWidgets(
  tenantId?: string,
): Promise<ReviewWidget[]> {
  const all = [...widgetStore.values()];
  if (!tenantId) return all;
  return all.filter((w) => w.tenantId === tenantId);
}

export async function generateWidgetHtml(
  widgetId: string,
): Promise<string | null> {
  const widget = widgetStore.get(widgetId);
  if (!widget) return null;

  const reviews = [...reviewStore.values()]
    .filter((r) => r.rating >= widget.minRating)
    .filter((r) => !widget.tenantId || r.tenantId === widget.tenantId)
    .slice(0, widget.maxDisplay);

  const reviewsHtml = reviews
    .map(
      (r) =>
        `<div class="mgr-review" data-rating="${r.rating}">` +
        `<strong class="mgr-author">${escapeHtml(r.author)}</strong>` +
        `<span class="mgr-rating">${"&#9733;".repeat(r.rating)}${"&#9734;".repeat(5 - r.rating)}</span>` +
        `<p class="mgr-text">${escapeHtml(r.text)}</p>` +
        `<time class="mgr-date">${escapeHtml(r.date)}</time>` +
        `${r.verified ? '<span class="mgr-verified">Verified</span>' : ""}` +
        `</div>`,
    )
    .join("\n");

  return (
    `<div class="mgr-widget mgr-${widget.style}" data-business="${escapeHtml(widget.businessName)}">` +
    `<h3 class="mgr-title">${escapeHtml(widget.businessName)} Reviews</h3>` +
    `${reviewsHtml}` +
    `${reviews.length === 0 ? '<p class="mgr-empty">No reviews yet.</p>' : ""}` +
    `</div>`
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export async function getReviewStats(
  tenantId?: string,
): Promise<ReviewStats> {
  const reviews = tenantId
    ? [...reviewStore.values()].filter((r) => r.tenantId === tenantId)
    : [...reviewStore.values()];

  const requests = tenantId
    ? [...requestStore.values()].filter((r) => r.tenantId === tenantId)
    : [...requestStore.values()];

  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

  const byPlatform: Record<string, { count: number; avgRating: number }> = {};
  for (const r of reviews) {
    if (!byPlatform[r.platform]) {
      byPlatform[r.platform] = { count: 0, avgRating: 0 };
    }
    byPlatform[r.platform].count += 1;
  }
  for (const platform of Object.keys(byPlatform)) {
    const platformReviews = reviews.filter((r) => r.platform === platform);
    byPlatform[platform].avgRating =
      platformReviews.reduce((sum, r) => sum + r.rating, 0) /
      platformReviews.length;
  }

  const respondedCount = reviews.filter((r) => r.responded).length;
  const responseRate = totalReviews > 0 ? respondedCount / totalReviews : 0;

  const requestsSent = requests.length;
  const completedRequests = requests.filter(
    (r) => r.status === "completed",
  ).length;
  const requestConversionRate =
    requestsSent > 0 ? completedRequests / requestsSent : 0;

  const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) {
    const bucket = Math.min(5, Math.max(1, Math.round(r.rating)));
    ratingDistribution[bucket] = (ratingDistribution[bucket] ?? 0) + 1;
  }

  return {
    totalReviews,
    avgRating,
    byPlatform,
    responseRate,
    requestsSent,
    requestConversionRate,
    ratingDistribution,
  };
}

// ---------------------------------------------------------------------------
// Sync to Landing Page
// ---------------------------------------------------------------------------

export async function syncReviewsToLandingPage(
  businessSlug: string,
  tenantId?: string,
): Promise<{ slug: string; reviewCount: number; avgRating: number; reviews: Review[] }> {
  const reviews = (await listReviews({ tenantId }))
    .filter((r) => r.rating >= 3)
    .sort((a, b) => b.rating - a.rating || b.date.localeCompare(a.date))
    .slice(0, 10);

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return {
    slug: businessSlug,
    reviewCount: reviews.length,
    avgRating,
    reviews,
  };
}

// ---------------------------------------------------------------------------
// Provider bridge
// ---------------------------------------------------------------------------

export function mgrResult(operation: string, detail: string): ProviderResult {
  return {
    ok: true,
    provider: "MoreGoodReviews",
    mode: isMGRDryRun() ? "dry-run" : "live",
    detail: `[${operation}] ${detail}`,
  };
}

// ---------------------------------------------------------------------------
// Reset (for tests)
// ---------------------------------------------------------------------------

export function resetMGRStore(): void {
  requestStore.clear();
  reviewStore.clear();
  templateStore.clear();
  widgetStore.clear();
  schemaEnsured = false;
}

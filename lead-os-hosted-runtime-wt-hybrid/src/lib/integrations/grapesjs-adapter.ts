import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GrapesJSConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface GrapesJSComponent {
  type: string;
  tagName?: string;
  attributes?: Record<string, string>;
  content?: string;
  children?: GrapesJSComponent[];
}

export interface PageConfig {
  name: string;
  slug: string;
  templateId?: string;
  html?: string;
  css?: string;
  components?: GrapesJSComponent[];
  metadata?: Record<string, unknown>;
}

export interface PageUpdates {
  name?: string;
  slug?: string;
  html?: string;
  css?: string;
  components?: GrapesJSComponent[];
  metadata?: Record<string, unknown>;
  status?: Page["status"];
}

export interface PageAnalytics {
  views: number;
  uniqueVisitors: number;
  formSubmissions: number;
  conversionRate: number;
  averageTimeOnPage: number;
  bounceRate: number;
}

export interface Page {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  html: string;
  css: string;
  components: GrapesJSComponent[];
  status: "draft" | "published" | "archived";
  publishedUrl?: string;
  analytics: PageAnalytics;
  createdAt: string;
  updatedAt: string;
}

export interface PublishResult {
  page: Page;
  publishedUrl: string;
  publishedAt: string;
}

export interface PageTemplate {
  id: string;
  name: string;
  category: "landing" | "squeeze" | "webinar" | "thankyou" | "booking";
  thumbnail: string;
  description: string;
}

export interface LeadWidgetConfig {
  type: "form" | "popup" | "chatbot" | "booking";
  position: string;
  fields: { name: string; type: string; required: boolean }[];
  submitAction: string;
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const pageStore = new Map<string, Page>();

export function resetGrapesJSStore(): void {
  pageStore.clear();
}

export function _getPageStoreForTesting(): Map<string, Page> {
  return pageStore;
}

// ---------------------------------------------------------------------------
// Built-in templates
// ---------------------------------------------------------------------------

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: "tmpl-high-converting-squeeze",
    name: "High-Converting Squeeze Page",
    category: "squeeze",
    thumbnail: "https://templates.grapesjs.com/squeeze.png",
    description: "Email capture with headline + social proof",
  },
  {
    id: "tmpl-webinar-registration",
    name: "Webinar Registration",
    category: "webinar",
    thumbnail: "https://templates.grapesjs.com/webinar.png",
    description: "Video preview + countdown + registration form",
  },
  {
    id: "tmpl-service-booking",
    name: "Service Booking",
    category: "booking",
    thumbnail: "https://templates.grapesjs.com/booking.png",
    description: "Service description + calendar embed + testimonials",
  },
  {
    id: "tmpl-case-study-landing",
    name: "Case Study Landing",
    category: "landing",
    thumbnail: "https://templates.grapesjs.com/case-study.png",
    description: "Problem/solution/results with CTA",
  },
  {
    id: "tmpl-lead-magnet-download",
    name: "Lead Magnet Download",
    category: "squeeze",
    thumbnail: "https://templates.grapesjs.com/lead-magnet.png",
    description: "Free resource offer with email gate",
  },
];

const TEMPLATE_HTML: Record<string, { html: string; css: string }> = {
  "tmpl-high-converting-squeeze": {
    html: `<section class="hero"><h1>Get Your Free Guide</h1><p>Join 10,000+ professionals who transformed their business</p><form class="capture-form"><input type="email" placeholder="Enter your email" required /><button type="submit">Get Instant Access</button></form><div class="social-proof"><span>★★★★★ Rated 4.9/5 by 2,000+ users</span></div></section>`,
    css: `.hero{text-align:center;padding:60px 20px;max-width:600px;margin:0 auto}.capture-form{margin:30px 0}.capture-form input{padding:12px;width:70%;border:1px solid #ddd;border-radius:4px}.capture-form button{padding:12px 24px;background:#2563eb;color:#fff;border:none;border-radius:4px;cursor:pointer}.social-proof{color:#666;font-size:14px}`,
  },
  "tmpl-webinar-registration": {
    html: `<section class="webinar"><h1>Free Live Webinar</h1><div class="video-preview"><div class="placeholder">Video Preview</div></div><div class="countdown"><span class="timer">Starts in 3 days</span></div><form class="reg-form"><input type="text" placeholder="Full Name" required /><input type="email" placeholder="Email" required /><button type="submit">Reserve My Spot</button></form></section>`,
    css: `.webinar{text-align:center;padding:40px 20px;max-width:700px;margin:0 auto}.video-preview{background:#f3f4f6;padding:80px;margin:20px 0;border-radius:8px}.countdown{font-size:18px;font-weight:bold;color:#dc2626;margin:20px 0}.reg-form input{display:block;width:80%;margin:10px auto;padding:12px;border:1px solid #ddd;border-radius:4px}.reg-form button{padding:14px 32px;background:#16a34a;color:#fff;border:none;border-radius:4px;cursor:pointer;margin-top:10px}`,
  },
  "tmpl-service-booking": {
    html: `<section class="booking"><h1>Book Your Consultation</h1><p class="subtitle">Expert service tailored to your needs</p><div class="calendar-embed"><div class="placeholder">Calendar Widget</div></div><div class="testimonials"><blockquote>"Best decision we ever made!" — Sarah M.</blockquote><blockquote>"Exceeded all expectations." — James K.</blockquote></div></section>`,
    css: `.booking{text-align:center;padding:40px 20px;max-width:700px;margin:0 auto}.subtitle{color:#666;font-size:18px}.calendar-embed{background:#f3f4f6;padding:60px;margin:30px 0;border-radius:8px}.testimonials blockquote{font-style:italic;color:#555;margin:15px 0;padding:10px;border-left:3px solid #2563eb}`,
  },
  "tmpl-case-study-landing": {
    html: `<section class="case-study"><h1>How We Helped Company X Grow 300%</h1><div class="problem"><h2>The Problem</h2><p>They were struggling with lead generation and conversion.</p></div><div class="solution"><h2>Our Solution</h2><p>We implemented a comprehensive funnel strategy.</p></div><div class="results"><h2>The Results</h2><ul><li>300% increase in leads</li><li>50% reduction in cost per acquisition</li><li>2x revenue growth</li></ul></div><div class="cta"><button>Get Similar Results</button></div></section>`,
    css: `.case-study{max-width:800px;margin:0 auto;padding:40px 20px}.case-study h1{text-align:center}.problem,.solution,.results{margin:30px 0;padding:20px;border-radius:8px}.problem{background:#fef2f2}.solution{background:#eff6ff}.results{background:#f0fdf4}.results ul{list-style:none;padding:0}.results li{padding:8px 0;font-size:18px}.cta{text-align:center;margin-top:40px}.cta button{padding:16px 40px;background:#2563eb;color:#fff;border:none;border-radius:4px;font-size:18px;cursor:pointer}`,
  },
  "tmpl-lead-magnet-download": {
    html: `<section class="lead-magnet"><div class="offer"><h1>Download Your Free Resource</h1><p>The ultimate guide to growing your business — no cost, no catch.</p><ul class="benefits"><li>✓ Actionable strategies</li><li>✓ Real-world case studies</li><li>✓ Templates included</li></ul></div><form class="gate-form"><input type="text" placeholder="Your Name" required /><input type="email" placeholder="Your Email" required /><button type="submit">Download Now — Free</button><p class="privacy">We respect your privacy. Unsubscribe anytime.</p></form></section>`,
    css: `.lead-magnet{display:flex;flex-wrap:wrap;max-width:900px;margin:0 auto;padding:40px 20px;gap:40px;align-items:center}.offer{flex:1;min-width:300px}.offer h1{font-size:28px}.benefits{list-style:none;padding:0}.benefits li{padding:6px 0;font-size:16px}.gate-form{flex:1;min-width:280px;background:#f9fafb;padding:30px;border-radius:8px}.gate-form input{display:block;width:100%;margin:10px 0;padding:12px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box}.gate-form button{width:100%;padding:14px;background:#2563eb;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:16px}.privacy{font-size:12px;color:#999;text-align:center}`,
  },
};

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

function resolveConfig(config?: GrapesJSConfig): GrapesJSConfig {
  return {
    apiKey: config?.apiKey ?? process.env.GRAPESJS_API_KEY ?? "",
    baseUrl: config?.baseUrl ?? process.env.GRAPESJS_BASE_URL ?? "https://api.grapesjs.com/v1",
  };
}

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

export async function healthCheck(config?: GrapesJSConfig): Promise<{ ok: boolean; message: string }> {
  const cfg = resolveConfig(config);
  if (!cfg.apiKey) {
    return { ok: false, message: "GrapesJS API key not configured" };
  }

  try {
    const res = await fetch(`${cfg.baseUrl}/account`, {
      headers: { Authorization: `Bearer ${cfg.apiKey}` },
    });
    return res.ok
      ? { ok: true, message: "GrapesJS connection verified" }
      : { ok: false, message: `GrapesJS returned ${res.status}` };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Connection failed" };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function defaultAnalytics(): PageAnalytics {
  return {
    views: 0,
    uniqueVisitors: 0,
    formSubmissions: 0,
    conversionRate: 0,
    averageTimeOnPage: 0,
    bounceRate: 0,
  };
}

function buildHtmlShell(name: string, bodyHtml: string, css: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${name}</title><style>${css}</style></head><body>${bodyHtml}</body></html>`;
}

// ---------------------------------------------------------------------------
// Page CRUD
// ---------------------------------------------------------------------------

export async function createPage(tenantId: string, config: PageConfig): Promise<Page> {
  const now = new Date().toISOString();
  const templateContent = config.templateId ? TEMPLATE_HTML[config.templateId] : undefined;

  const html = config.html ?? templateContent?.html ?? `<main><h1>${config.name}</h1></main>`;
  const css = config.css ?? templateContent?.css ?? "";

  const page: Page = {
    id: `gpage-${randomUUID()}`,
    tenantId,
    name: config.name,
    slug: config.slug,
    html: buildHtmlShell(config.name, html, css),
    css,
    components: config.components ?? [],
    status: "draft",
    analytics: defaultAnalytics(),
    createdAt: now,
    updatedAt: now,
  };
  pageStore.set(page.id, page);
  return page;
}

export async function getPage(pageId: string): Promise<Page> {
  const page = pageStore.get(pageId);
  if (!page) throw new Error(`Page not found: ${pageId}`);
  return page;
}

export async function updatePage(pageId: string, updates: PageUpdates): Promise<Page> {
  const page = pageStore.get(pageId);
  if (!page) throw new Error(`Page not found: ${pageId}`);

  const updated: Page = {
    ...page,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  if (updates.html !== undefined || updates.css !== undefined) {
    const html = updates.html ?? page.html;
    const css = updates.css ?? page.css;
    updated.html = buildHtmlShell(updated.name, html, css);
    updated.css = css;
  }

  pageStore.set(pageId, updated);
  return updated;
}

export async function deletePage(pageId: string): Promise<void> {
  if (!pageStore.has(pageId)) throw new Error(`Page not found: ${pageId}`);
  pageStore.delete(pageId);
}

export async function listPages(tenantId: string): Promise<Page[]> {
  return [...pageStore.values()].filter((p) => p.tenantId === tenantId);
}

// ---------------------------------------------------------------------------
// Publishing
// ---------------------------------------------------------------------------

export async function publishPage(pageId: string): Promise<PublishResult> {
  const page = pageStore.get(pageId);
  if (!page) throw new Error(`Page not found: ${pageId}`);

  const publishedUrl = `https://pages.leados.io/${page.slug}`;
  const publishedAt = new Date().toISOString();

  const published: Page = {
    ...page,
    status: "published",
    publishedUrl,
    updatedAt: publishedAt,
  };
  pageStore.set(pageId, published);

  return { page: published, publishedUrl, publishedAt };
}

// ---------------------------------------------------------------------------
// Duplicate
// ---------------------------------------------------------------------------

export async function duplicatePage(pageId: string, newName: string): Promise<Page> {
  const original = pageStore.get(pageId);
  if (!original) throw new Error(`Page not found: ${pageId}`);

  const now = new Date().toISOString();
  const newSlug = newName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const duplicate: Page = {
    ...original,
    id: `gpage-${randomUUID()}`,
    name: newName,
    slug: newSlug,
    status: "draft",
    publishedUrl: undefined,
    analytics: defaultAnalytics(),
    createdAt: now,
    updatedAt: now,
  };
  pageStore.set(duplicate.id, duplicate);
  return duplicate;
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export async function listTemplates(): Promise<PageTemplate[]> {
  return PAGE_TEMPLATES;
}

export async function createFromTemplate(
  tenantId: string,
  templateId: string,
  overrides?: Partial<PageConfig>,
): Promise<Page> {
  const template = PAGE_TEMPLATES.find((t) => t.id === templateId);
  if (!template) throw new Error(`Template not found: ${templateId}`);

  const name = overrides?.name ?? template.name;
  const slug = overrides?.slug ?? name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  return createPage(tenantId, {
    name,
    slug,
    templateId,
    html: overrides?.html,
    css: overrides?.css,
    components: overrides?.components,
    metadata: overrides?.metadata,
  });
}

// ---------------------------------------------------------------------------
// Lead capture widget injection
// ---------------------------------------------------------------------------

export async function injectLeadWidget(pageId: string, widgetConfig: LeadWidgetConfig): Promise<Page> {
  const page = pageStore.get(pageId);
  if (!page) throw new Error(`Page not found: ${pageId}`);

  const fieldInputs = widgetConfig.fields
    .map((f) => {
      const req = f.required ? " required" : "";
      return `<div class="widget-field"><label>${f.name}</label><input type="${f.type}" name="${f.name}" placeholder="${f.name}"${req} /></div>`;
    })
    .join("");

  const widgetHtml = `<div class="lead-widget lead-widget-${widgetConfig.type}" data-position="${widgetConfig.position}" data-action="${widgetConfig.submitAction}"><form class="lead-widget-form">${fieldInputs}<button type="submit">Submit</button></form></div>`;

  const bodyMatch = page.html.match(/(.*<body>)([\s\S]*?)(<\/body>.*)/);
  let newHtml: string;
  if (bodyMatch) {
    const insertion = widgetConfig.position === "top"
      ? `${bodyMatch[1]}${widgetHtml}${bodyMatch[2]}${bodyMatch[3]}`
      : `${bodyMatch[1]}${bodyMatch[2]}${widgetHtml}${bodyMatch[3]}`;
    newHtml = insertion;
  } else {
    newHtml = page.html + widgetHtml;
  }

  const updated: Page = {
    ...page,
    html: newHtml,
    updatedAt: new Date().toISOString(),
  };
  pageStore.set(pageId, updated);
  return updated;
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export async function getPageAnalytics(pageId: string): Promise<PageAnalytics> {
  const page = pageStore.get(pageId);
  if (!page) throw new Error(`Page not found: ${pageId}`);
  return page.analytics;
}

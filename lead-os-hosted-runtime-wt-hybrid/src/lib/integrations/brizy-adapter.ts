import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BrizyConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface BrizyPage {
  id: string;
  tenantId: string;
  title: string;
  slug: string;
  templateId?: string;
  html: string;
  status: "draft" | "published" | "archived";
  publishedUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BrizyTemplate {
  id: string;
  name: string;
  category: string;
  previewUrl: string;
}

export interface EmbedWidget {
  id: string;
  pageId: string;
  type: "lead-form" | "chatbot" | "popup" | "cta-button";
  config: Record<string, unknown>;
  position: string;
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const pageStore = new Map<string, BrizyPage>();
const widgetStore = new Map<string, EmbedWidget[]>();

export function resetBrizyStore(): void {
  pageStore.clear();
  widgetStore.clear();
}

// ---------------------------------------------------------------------------
// Built-in templates
// ---------------------------------------------------------------------------

export const BRIZY_TEMPLATES: BrizyTemplate[] = [
  { id: "tmpl-landing", name: "Landing Page", category: "marketing", previewUrl: "https://cloud.brizy.io/templates/landing.png" },
  { id: "tmpl-lead-gen", name: "Lead Generation", category: "lead-gen", previewUrl: "https://cloud.brizy.io/templates/lead-gen.png" },
  { id: "tmpl-webinar", name: "Webinar Registration", category: "events", previewUrl: "https://cloud.brizy.io/templates/webinar.png" },
  { id: "tmpl-portfolio", name: "Portfolio", category: "showcase", previewUrl: "https://cloud.brizy.io/templates/portfolio.png" },
  { id: "tmpl-coming-soon", name: "Coming Soon", category: "pre-launch", previewUrl: "https://cloud.brizy.io/templates/coming-soon.png" },
];

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

function resolveConfig(config?: BrizyConfig): BrizyConfig {
  return {
    apiKey: config?.apiKey ?? process.env.BRIZY_API_KEY ?? "",
    baseUrl: config?.baseUrl ?? process.env.BRIZY_BASE_URL ?? "https://api.brizy.io/v1",
  };
}

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

export async function healthCheck(config?: BrizyConfig): Promise<{ ok: boolean; message: string }> {
  const cfg = resolveConfig(config);
  if (!cfg.apiKey) {
    return { ok: false, message: "Brizy API key not configured" };
  }

  try {
    const res = await fetch(`${cfg.baseUrl}/account`, {
      headers: { Authorization: `Bearer ${cfg.apiKey}` },
    });
    return res.ok
      ? { ok: true, message: "Brizy connection verified" }
      : { ok: false, message: `Brizy returned ${res.status}` };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Connection failed" };
  }
}

// ---------------------------------------------------------------------------
// Page CRUD
// ---------------------------------------------------------------------------

export async function createPage(
  tenantId: string,
  title: string,
  templateId?: string,
): Promise<BrizyPage> {
  const now = new Date().toISOString();
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const template = BRIZY_TEMPLATES.find((t) => t.id === templateId);

  const page: BrizyPage = {
    id: `bpage-${randomUUID()}`,
    tenantId,
    title,
    slug,
    templateId,
    html: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${title}</title></head><body><main><h1>${title}</h1>${template ? `<p>Built from template: ${template.name}</p>` : ""}</main></body></html>`,
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };
  pageStore.set(page.id, page);
  return page;
}

export async function getPage(pageId: string): Promise<BrizyPage | undefined> {
  return pageStore.get(pageId);
}

export async function listPages(tenantId: string): Promise<BrizyPage[]> {
  return [...pageStore.values()].filter((p) => p.tenantId === tenantId);
}

export async function updatePage(
  pageId: string,
  updates: Partial<Pick<BrizyPage, "title" | "html" | "status">>,
): Promise<BrizyPage> {
  const page = pageStore.get(pageId);
  if (!page) throw new Error(`Page not found: ${pageId}`);

  const updated: BrizyPage = {
    ...page,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  pageStore.set(pageId, updated);
  return updated;
}

export async function deletePage(pageId: string): Promise<boolean> {
  return pageStore.delete(pageId);
}

// ---------------------------------------------------------------------------
// Publishing
// ---------------------------------------------------------------------------

export async function publishPage(pageId: string): Promise<BrizyPage> {
  const page = pageStore.get(pageId);
  if (!page) throw new Error(`Page not found: ${pageId}`);

  const published: BrizyPage = {
    ...page,
    status: "published",
    publishedUrl: `https://pages.brizy.io/${page.slug}`,
    updatedAt: new Date().toISOString(),
  };
  pageStore.set(pageId, published);
  return published;
}

// ---------------------------------------------------------------------------
// Widget embedding
// ---------------------------------------------------------------------------

export async function embedWidget(
  pageId: string,
  type: EmbedWidget["type"],
  config: Record<string, unknown>,
  position = "bottom",
): Promise<EmbedWidget> {
  const widget: EmbedWidget = {
    id: `bwidget-${randomUUID()}`,
    pageId,
    type,
    config,
    position,
  };
  const existing = widgetStore.get(pageId) ?? [];
  existing.push(widget);
  widgetStore.set(pageId, existing);
  return widget;
}

export async function listWidgets(pageId: string): Promise<EmbedWidget[]> {
  return widgetStore.get(pageId) ?? [];
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export function getTemplates(): BrizyTemplate[] {
  return BRIZY_TEMPLATES;
}

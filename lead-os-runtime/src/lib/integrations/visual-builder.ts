// GrapesJS adapter for visual page editing.
// GrapesJS is client-side; this module manages server-side project storage.
// The actual GrapesJS editor is loaded in the dashboard UI.

export interface PageProject {
  id: string;
  tenantId: string;
  name: string;
  html: string;
  css: string;
  components: unknown;
  styles: unknown;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Pre-built Lead OS templates
// ---------------------------------------------------------------------------

export const LEAD_OS_TEMPLATES: {
  id: string;
  name: string;
  category: string;
  description: string;
}[] = [
  {
    id: "landing-page",
    name: "Landing Page",
    category: "marketing",
    description: "High-converting landing page with hero, features, and CTA sections",
  },
  {
    id: "lead-capture",
    name: "Lead Capture",
    category: "lead-gen",
    description: "Focused opt-in page with lead magnet offer and form",
  },
  {
    id: "booking-page",
    name: "Booking Page",
    category: "scheduling",
    description: "Appointment booking page with calendar embed and confirmation",
  },
  {
    id: "pricing-page",
    name: "Pricing Page",
    category: "sales",
    description: "Tiered pricing table with feature comparison and buy buttons",
  },
  {
    id: "testimonial-wall",
    name: "Testimonial Wall",
    category: "social-proof",
    description: "Showcase client results with photo testimonials and video reviews",
  },
  {
    id: "comparison-table",
    name: "Comparison Table",
    category: "sales",
    description: "Side-by-side comparison of your service vs. competitors",
  },
];

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const projectStore = new Map<string, PageProject>();

export function resetBuilderStore(): void {
  projectStore.clear();
}

// ---------------------------------------------------------------------------
// Template HTML generators
// ---------------------------------------------------------------------------

function getTemplateHtml(templateId: string, name: string): string {
  const templates: Record<string, string> = {
    "landing-page": `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${name}</title></head><body><header><nav><a href="#">Logo</a></nav></header><main><section class="hero"><h1>Your Compelling Headline Here</h1><p>Subheadline that reinforces the value proposition.</p><a href="#cta" class="btn-primary">Get Started</a></section><section class="features"><div class="feature"><h2>Feature One</h2><p>Description of this key benefit.</p></div><div class="feature"><h2>Feature Two</h2><p>Description of this key benefit.</p></div><div class="feature"><h2>Feature Three</h2><p>Description of this key benefit.</p></div></section><section id="cta"><h2>Ready to Start?</h2><a href="/contact" class="btn-primary">Contact Us</a></section></main><footer><p>&copy; 2026</p></footer></body></html>`,
    "lead-capture": `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${name}</title></head><body><main><section class="lead-capture"><h1>Get Your Free Guide</h1><p>Enter your details to receive instant access.</p><form><label for="name">Name</label><input id="name" type="text" name="name" required><label for="email">Email</label><input id="email" type="email" name="email" required><button type="submit">Send Me the Guide</button></form></section></main></body></html>`,
    "booking-page": `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${name}</title></head><body><main><section class="booking"><h1>Schedule Your Free Call</h1><p>Pick a time that works for you.</p><div class="cal-embed" data-cal-link="your-slug"></div></section></main></body></html>`,
    "pricing-page": `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${name}</title></head><body><main><section class="pricing"><h1>Simple, Transparent Pricing</h1><div class="plans"><div class="plan"><h2>Starter</h2><p class="price">$497/mo</p><ul><li>Feature A</li><li>Feature B</li></ul><a href="#" class="btn-primary">Get Started</a></div><div class="plan featured"><h2>Pro</h2><p class="price">$997/mo</p><ul><li>Everything in Starter</li><li>Feature C</li><li>Feature D</li></ul><a href="#" class="btn-primary">Get Started</a></div></div></section></main></body></html>`,
    "testimonial-wall": `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${name}</title></head><body><main><section class="testimonials"><h1>What Our Clients Say</h1><div class="testimonial-grid"><blockquote><p>"This service transformed our lead generation completely."</p><cite>— Jane D., CEO</cite></blockquote><blockquote><p>"We 3x'd our close rate within 60 days."</p><cite>— Mark S., Sales Director</cite></blockquote></div></section></main></body></html>`,
    "comparison-table": `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${name}</title></head><body><main><section class="comparison"><h1>Why Choose Us?</h1><table><thead><tr><th>Feature</th><th>Us</th><th>Competitor A</th><th>Competitor B</th></tr></thead><tbody><tr><td>Feature One</td><td>Yes</td><td>No</td><td>No</td></tr><tr><td>Feature Two</td><td>Yes</td><td>Yes</td><td>No</td></tr><tr><td>Support</td><td>24/7</td><td>Business hours</td><td>Email only</td></tr></tbody></table></section></main></body></html>`,
  };

  return templates[templateId] ?? `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${name}</title></head><body><main><h1>${name}</h1></main></body></html>`;
}

function generateId(): string {
  return `proj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function createProject(
  tenantId: string,
  name: string,
  initialHtml?: string,
): Promise<PageProject> {
  const id = generateId();
  const now = new Date().toISOString();

  const project: PageProject = {
    id,
    tenantId,
    name,
    html: initialHtml ?? `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${name}</title></head><body></body></html>`,
    css: "",
    components: [],
    styles: [],
    createdAt: now,
    updatedAt: now,
  };

  projectStore.set(id, project);
  return project;
}

export async function getProject(
  projectId: string,
): Promise<PageProject | undefined> {
  return projectStore.get(projectId);
}

export async function updateProject(
  projectId: string,
  updates: {
    html?: string;
    css?: string;
    components?: unknown;
    styles?: unknown;
  },
): Promise<PageProject> {
  const existing = projectStore.get(projectId);
  if (!existing) {
    throw new Error(`Project not found: ${projectId}`);
  }

  const updated: PageProject = {
    ...existing,
    html: updates.html ?? existing.html,
    css: updates.css ?? existing.css,
    components: updates.components ?? existing.components,
    styles: updates.styles ?? existing.styles,
    updatedAt: new Date().toISOString(),
  };

  projectStore.set(projectId, updated);
  return updated;
}

export async function listProjects(tenantId: string): Promise<PageProject[]> {
  return Array.from(projectStore.values()).filter(
    (p) => p.tenantId === tenantId,
  );
}

export async function deleteProject(projectId: string): Promise<boolean> {
  return projectStore.delete(projectId);
}

export async function exportToHtml(projectId: string): Promise<string> {
  const project = projectStore.get(projectId);
  if (!project) {
    throw new Error(`Project not found: ${projectId}`);
  }

  if (!project.css) return project.html;

  const styleTag = `<style>${project.css}</style>`;
  return project.html.replace("</head>", `${styleTag}</head>`);
}

export async function exportToDeployable(
  projectId: string,
): Promise<{ html: string; css: string; assets: string[] }> {
  const project = projectStore.get(projectId);
  if (!project) {
    throw new Error(`Project not found: ${projectId}`);
  }

  const assetPattern = /src="([^"]+)"|href="([^"]+\.(?:png|jpg|jpeg|gif|svg|webp|woff2?|ttf))"/gi;
  const assets: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = assetPattern.exec(project.html)) !== null) {
    const asset = match[1] ?? match[2];
    if (asset && !asset.startsWith("http") && !asset.startsWith("data:")) {
      assets.push(asset);
    }
  }

  return { html: project.html, css: project.css, assets };
}

export function getTemplates(): {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
}[] {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  return LEAD_OS_TEMPLATES.map((t) => ({
    id: t.id,
    name: t.name,
    category: t.category,
    thumbnail: `${siteUrl}/templates/${t.id}/thumbnail.png`,
  }));
}

export async function createFromTemplate(
  tenantId: string,
  templateId: string,
  name: string,
): Promise<PageProject> {
  const template = LEAD_OS_TEMPLATES.find((t) => t.id === templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  const html = getTemplateHtml(templateId, name);
  return createProject(tenantId, name, html);
}

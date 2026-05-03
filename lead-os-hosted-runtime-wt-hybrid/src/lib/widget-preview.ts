import { getPool } from "./db.ts";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WidgetPreviewConfig {
  tenantId: string;
  brandName: string;
  accentColor: string;
  logoUrl?: string;
  niche: string;
  enabledFunnels: string[];
  channels: Record<string, boolean>;
  customCss?: string;
}

export interface PreviewSession {
  id: string;
  tenantId: string;
  config: WidgetPreviewConfig;
  testLeads: TestLead[];
  createdAt: string;
  expiresAt: string;
}

export interface TestLead {
  name: string;
  email: string;
  phone?: string;
  service?: string;
  submittedAt: string;
  result: "captured" | "scored" | "routed" | "error";
  score?: number;
  route?: string;
  errorMessage?: string;
}

export interface EmbedCodeSnippet {
  html: string;
  scriptTag: string;
  iframeTag: string;
  wordpressShortcode: string;
  reactComponent: string;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const previewStore = new Map<string, PreviewSession>();

let schemaReady: Promise<void> | null = null;

async function ensureSchema(): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS lead_os_widget_preview_sessions (
          id TEXT PRIMARY KEY,
          tenant_id TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          expires_at TIMESTAMPTZ NOT NULL,
          payload JSONB NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_lead_os_widget_preview_tenant
          ON lead_os_widget_preview_sessions (tenant_id);
        CREATE INDEX IF NOT EXISTS idx_lead_os_widget_preview_expires
          ON lead_os_widget_preview_sessions (expires_at);
      `);
    } catch {
      schemaReady = null;
    }
  })();

  return schemaReady;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function rowToSession(row: {
  id: string;
  tenant_id: string;
  created_at: Date;
  expires_at: Date;
  payload: Record<string, unknown>;
}): PreviewSession {
  const p = row.payload;
  return {
    id: row.id,
    tenantId: row.tenant_id,
    config: p.config as WidgetPreviewConfig,
    testLeads: (p.testLeads as TestLead[]) ?? [],
    createdAt: row.created_at.toISOString(),
    expiresAt: row.expires_at.toISOString(),
  };
}

function isExpired(session: PreviewSession): boolean {
  return new Date(session.expiresAt) <= new Date();
}

function simulateLeadPipeline(lead: {
  name: string;
  email: string;
  phone?: string;
  service?: string;
}): Pick<TestLead, "result" | "score" | "route"> {
  // Dry-run simulation: score by presence of fields
  let score = 30;
  if (lead.phone) score += 20;
  if (lead.service) score += 25;
  if (lead.email.includes(".com")) score += 10;
  score = Math.min(score, 100);

  const route = score >= 70 ? "high-priority" : score >= 50 ? "standard" : "nurture";

  return { result: "routed", score, route };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function createPreviewSession(
  config: WidgetPreviewConfig,
): Promise<PreviewSession> {
  await ensureSchema();

  const id = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const session: PreviewSession = {
    id,
    tenantId: config.tenantId,
    config,
    testLeads: [],
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  const pool = getPool();
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO lead_os_widget_preview_sessions (id, tenant_id, created_at, expires_at, payload)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          id,
          config.tenantId,
          session.createdAt,
          session.expiresAt,
          JSON.stringify({ config, testLeads: [] }),
        ],
      );
    } catch {
      // Silently fall through to memory-only mode
    }
  }

  previewStore.set(id, session);
  return session;
}

export async function getPreviewSession(
  sessionId: string,
): Promise<PreviewSession | null> {
  await ensureSchema();

  const cached = previewStore.get(sessionId);
  if (cached) {
    return isExpired(cached) ? null : cached;
  }

  const pool = getPool();
  if (!pool) return null;

  try {
    const result = await pool.query(
      `SELECT id, tenant_id, created_at, expires_at, payload
       FROM lead_os_widget_preview_sessions
       WHERE id = $1`,
      [sessionId],
    );

    if (result.rows.length === 0) return null;

    const session = rowToSession(result.rows[0]);
    if (isExpired(session)) return null;

    previewStore.set(session.id, session);
    return session;
  } catch {
    return null;
  }
}

export async function submitTestLead(
  sessionId: string,
  lead: { name: string; email: string; phone?: string; service?: string },
): Promise<TestLead | null> {
  const session = await getPreviewSession(sessionId);
  if (!session) return null;

  const pipeline = simulateLeadPipeline(lead);

  const testLead: TestLead = {
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    service: lead.service,
    submittedAt: new Date().toISOString(),
    ...pipeline,
  };

  session.testLeads.push(testLead);

  const pool = getPool();
  if (pool) {
    try {
      await pool.query(
        `UPDATE lead_os_widget_preview_sessions
         SET payload = jsonb_set(payload, '{testLeads}', $1::jsonb)
         WHERE id = $2`,
        [JSON.stringify(session.testLeads), sessionId],
      );
    } catch {
      // Silently fall through to memory-only mode
    }
  }

  previewStore.set(sessionId, session);
  return testLead;
}

export async function getTestLeads(sessionId: string): Promise<TestLead[]> {
  const session = await getPreviewSession(sessionId);
  return session?.testLeads ?? [];
}

export async function generateEmbedCode(
  tenantId: string,
  siteUrl: string,
): Promise<EmbedCodeSnippet> {
  const baseUrl = siteUrl.replace(/\/$/, "");
  const accent = encodeURIComponent("#14b8a6");

  const scriptTag = `<script src="${baseUrl}/embed.js" data-tenant="${tenantId}" data-accent="${accent}" async></script>`;

  const iframeTag = `<iframe
  src="${baseUrl}/widget/${tenantId}"
  width="100%"
  height="600"
  frameborder="0"
  title="LeadOS Widget"
  loading="lazy"
  allow="clipboard-write"
></iframe>`;

  const wordpressShortcode = `[leados tenant="${tenantId}"]`;

  const reactComponent = `import { LeadOSWidget } from "@leados/react";

<LeadOSWidget tenantId="${tenantId}" accent="${accent}" />`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>LeadOS Widget</title>
</head>
<body>
  ${scriptTag}
</body>
</html>`;

  return {
    html,
    scriptTag,
    iframeTag,
    wordpressShortcode,
    reactComponent,
  };
}

export function generatePreviewHtml(config: WidgetPreviewConfig): string {
  const {
    brandName,
    accentColor,
    niche,
    logoUrl,
    customCss = "",
  } = config;

  const actionColor = "#0f766e";

  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="${brandName} logo" style="height:40px;object-fit:contain;" />`
    : `<span style="font-size:1.5rem;font-weight:800;color:#0f172a;border-bottom:3px solid ${accentColor};">${brandName}</span>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${brandName} — Widget Preview</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      line-height: 1.6;
    }
    /* Header */
    .site-header {
      background: #fff;
      border-bottom: 1px solid #e2e8f0;
      padding: 0 24px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .site-nav a {
      color: #475569;
      text-decoration: none;
      margin-left: 24px;
      font-size: 0.95rem;
    }
    /* Hero */
    .hero {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #fff;
      padding: 80px 24px;
      text-align: center;
    }
    .hero h1 {
      font-size: 3.5rem;
      font-weight: 800;
      margin-bottom: 16px;
      line-height: 1.2;
      letter-spacing: 0;
    }
    .hero p {
      font-size: 1.2rem;
      color: #94a3b8;
      max-width: 560px;
      margin: 0 auto 32px;
    }
    .hero-cta {
      display: inline-block;
      background: ${actionColor};
      color: #fff;
      padding: 14px 32px;
      border-radius: 999px;
      font-weight: 700;
      font-size: 1rem;
      text-decoration: none;
      box-shadow: 0 12px 28px rgba(15, 118, 110, 0.28);
    }
    @media (max-width: 640px) {
      .hero h1 { font-size: 2.25rem; }
    }
    /* Widget section */
    .widget-section {
      max-width: 960px;
      margin: 0 auto;
      padding: 64px 24px;
    }
    .widget-section h2 {
      font-size: 1.75rem;
      font-weight: 700;
      margin-bottom: 8px;
      color: #0f172a;
    }
    .widget-section .subtitle {
      color: #64748b;
      margin-bottom: 32px;
      font-size: 1.05rem;
    }
    .widget-card {
      background: #fff;
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.07);
      border: 1px solid #e2e8f0;
    }
    /* Lead capture form (inline render) */
    .lead-form label {
      display: block;
      font-size: 0.9rem;
      font-weight: 600;
      color: #385145;
      margin-bottom: 6px;
    }
    .lead-form input,
    .lead-form select {
      display: block;
      width: 100%;
      padding: 12px 16px;
      border-radius: 10px;
      border: 1px solid #cbd5e1;
      background: #fff;
      font-size: 1rem;
      color: #14211d;
      font-family: inherit;
      margin-bottom: 16px;
    }
    .lead-form .field-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 0;
    }
    .lead-form .field-row .field { margin-bottom: 0; }
    .lead-form .privacy-notice {
      font-size: 0.78rem;
      color: #64748b;
      margin-bottom: 20px;
      line-height: 1.5;
    }
    .lead-form .privacy-notice a { color: inherit; text-decoration: underline; }
    .submit-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 52px;
      padding: 14px 32px;
      border-radius: 999px;
      border: none;
      background: ${accentColor};
      color: #fff;
      font-weight: 700;
      font-size: 1rem;
      cursor: pointer;
      box-shadow: 0 12px 24px ${accentColor}38;
      font-family: inherit;
    }
    /* Reviews */
    .reviews-section {
      background: #fff;
      padding: 64px 24px;
      border-top: 1px solid #e2e8f0;
    }
    .reviews-section h2 {
      font-size: 1.75rem;
      font-weight: 700;
      text-align: center;
      margin-bottom: 40px;
    }
    .reviews-grid {
      max-width: 960px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 24px;
    }
    .review-card {
      background: #f8fafc;
      border-radius: 16px;
      padding: 24px;
      border: 1px solid #e2e8f0;
    }
    .review-stars {
      color: ${accentColor};
      font-size: 1.1rem;
      margin-bottom: 8px;
    }
    .review-text {
      color: #334155;
      font-size: 0.95rem;
      line-height: 1.6;
      margin-bottom: 12px;
    }
    .review-author {
      font-weight: 600;
      font-size: 0.88rem;
      color: #64748b;
    }
    /* Preview badge */
    .preview-badge {
      position: fixed;
      bottom: 16px;
      right: 16px;
      background: #0f172a;
      color: #fff;
      padding: 8px 16px;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 600;
      z-index: 100;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .preview-dot {
      width: 8px;
      height: 8px;
      background: ${accentColor};
      border-radius: 50%;
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    /* Footer */
    .site-footer {
      background: #0f172a;
      color: #94a3b8;
      text-align: center;
      padding: 32px 24px;
      font-size: 0.88rem;
    }
    .site-footer a {
      color: ${accentColor};
      text-decoration: none;
    }
    @media (prefers-reduced-motion: reduce) {
      .preview-dot { animation: none; }
    }
    ${customCss}
  </style>
</head>
<body>
  <!-- Site header -->
  <header class="site-header" role="banner">
    ${logoHtml}
    <nav class="site-nav" aria-label="Main navigation">
      <a href="#">Services</a>
      <a href="#">About</a>
      <a href="#">Contact</a>
    </nav>
  </header>

  <!-- Hero section -->
  <section class="hero" aria-labelledby="hero-heading">
    <h1 id="hero-heading">Professional ${niche} Services<br />You Can Trust</h1>
    <p>Serving local customers with excellence. Get your free quote today — no obligation, no pressure.</p>
    <a href="#contact-form" class="hero-cta">Get My Free Quote</a>
  </section>

  <!-- Widget / Lead capture section -->
  <main>
    <section class="widget-section" aria-labelledby="form-heading">
      <h2 id="form-heading">Request a Free Quote</h2>
      <p class="subtitle">Fill in the form below and we'll get back to you within one business day.</p>

      <div class="widget-card" id="contact-form">
        <form class="lead-form" aria-label="Contact form" novalidate>
          <div class="field-row">
            <div class="field">
              <label for="preview-first-name">
                First name <span aria-hidden="true" style="color:${accentColor}">*</span>
              </label>
              <input id="preview-first-name" type="text" autocomplete="given-name" required aria-required="true" placeholder="Jane" />
            </div>
            <div class="field">
              <label for="preview-last-name">
                Last name <span aria-hidden="true" style="color:${accentColor}">*</span>
              </label>
              <input id="preview-last-name" type="text" autocomplete="family-name" required aria-required="true" placeholder="Smith" />
            </div>
            <div class="field">
              <label for="preview-email">
                Email address <span aria-hidden="true" style="color:${accentColor}">*</span>
              </label>
              <input id="preview-email" type="email" autocomplete="email" inputmode="email" required aria-required="true" placeholder="jane@example.com" />
            </div>
            <div class="field">
              <label for="preview-phone">
                Phone number <span style="font-weight:400;color:#64748b">(optional)</span>
              </label>
              <input id="preview-phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="+1 555 000 0000" />
            </div>
            <div class="field" style="grid-column: 1 / -1">
              <label for="preview-service">
                Service needed <span style="font-weight:400;color:#64748b">(optional)</span>
              </label>
              <input id="preview-service" type="text" autocomplete="off" placeholder="e.g. ${niche} service" />
            </div>
          </div>

          <p class="privacy-notice">
            By submitting, you agree to our
            <a href="/privacy">Privacy Policy</a>.
            We may send follow-up communications related to your inquiry. You can unsubscribe at any time.
          </p>

          <button type="submit" class="submit-btn">Get My Free Quote</button>
        </form>
      </div>
    </section>
  </main>

  <!-- Reviews section -->
  <section class="reviews-section" aria-labelledby="reviews-heading">
    <h2 id="reviews-heading">What Our Customers Say</h2>
    <div class="reviews-grid">
      <article class="review-card">
        <div class="review-stars" aria-label="5 out of 5 stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
        <p class="review-text">"${brandName} exceeded every expectation. Fast, professional, and fairly priced. Would highly recommend to anyone."</p>
        <p class="review-author">— Sarah M., verified customer</p>
      </article>
      <article class="review-card">
        <div class="review-stars" aria-label="5 out of 5 stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
        <p class="review-text">"Called them on Monday, work was done by Wednesday. Incredible response time and top-quality results."</p>
        <p class="review-author">— David R., verified customer</p>
      </article>
      <article class="review-card">
        <div class="review-stars" aria-label="5 out of 5 stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
        <p class="review-text">"The team was respectful, clean, and thorough. I've already referred three neighbors. Absolute top tier."</p>
        <p class="review-author">— Linda K., verified customer</p>
      </article>
    </div>
  </section>

  <!-- Footer -->
  <footer class="site-footer" role="contentinfo">
    <p>
      &copy; ${new Date().getFullYear()} ${brandName}. All rights reserved.
      &nbsp;|&nbsp;
      Powered by <a href="https://leados.io" target="_blank" rel="noopener noreferrer">LeadOS</a>
    </p>
  </footer>

  <!-- Preview mode badge -->
  <div class="preview-badge" role="status" aria-live="polite">
    <span class="preview-dot" aria-hidden="true"></span>
    Widget Preview Mode
  </div>
</body>
</html>`;
}

export async function validateWidgetOrigin(
  tenantId: string,
  origin: string,
): Promise<{ valid: boolean; message: string }> {
  const pool = getPool();

  if (pool) {
    try {
      const result = await pool.query(
        `SELECT payload->>'widgetOrigins' AS origins
         FROM lead_os_tenants
         WHERE id = $1`,
        [tenantId],
      );

      if (result.rows.length > 0) {
        const rawOrigins = result.rows[0].origins;
        const origins: string[] = rawOrigins ? JSON.parse(rawOrigins) : [];

        if (origins.length === 0) {
          return { valid: true, message: "No origin restrictions configured" };
        }

        const isWhitelisted = origins.some(
          (allowed) => allowed === origin || allowed === "*",
        );

        return isWhitelisted
          ? { valid: true, message: "Origin is whitelisted" }
          : { valid: false, message: `Origin '${origin}' is not in the allowed list` };
      }
    } catch {
      // Fall through to memory-only check
    }
  }

  // Memory-only: no tenant record means no restrictions
  return { valid: false, message: `Tenant '${tenantId}' not found` };
}

export function resetPreviewStore(): void {
  previewStore.clear();
  schemaReady = null;
}

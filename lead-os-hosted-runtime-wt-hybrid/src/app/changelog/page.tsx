import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog",
  description: "What is new in Lead OS. Release notes, new features, and improvements.",
};

interface Release {
  version: string;
  date: string;
  added?: string[];
  changed?: string[];
  fixed?: string[];
}

const releases: Release[] = [
  {
    version: "1.3.0",
    date: "2026-03-31",
    added: [
      "Schema.org AggregateRating + Review JSON-LD on all erie-pro niche reviews pages",
      "Schema.org Service + OfferCatalog JSON-LD on all erie-pro niche costs pages",
      "Schema.org EmergencyService JSON-LD with 24/7 hours on all erie-pro emergency pages",
      "Schema.org ItemList pricing JSON-LD on all erie-pro niche pricing pages",
      "Schema.org HowTo + HowToTip JSON-LD on all erie-pro niche tips pages",
      "Schema.org ItemList credentials JSON-LD on all erie-pro niche certifications pages",
      "Schema.org HowTo + HowToSection JSON-LD on all erie-pro niche seasonal pages",
      "Schema.org ItemList territory JSON-LD on all erie-pro niche directory pages",
      "Schema.org Article JSON-LD on all erie-pro niche compare pages",
      "Schema.org ItemList JSON-LD on erie-pro services page (all 13 niches)",
      "Schema.org Organization + WebSite + SoftwareApplication JSON-LD in NeatCircle root layout",
      "sitemap.ts for NeatCircle covering services, stories, industries, locations, and assessments",
      "robots.ts for NeatCircle with correct disallow rules for dashboard and control-center",
    ],
    changed: [
      "Erie-pro now has Schema.org structured data on every public-facing route (15 of 15 non-admin pages)",
      "NeatCircle root layout now exports structured data alongside skip-to-content and metadata",
    ],
  },
  {
    version: "1.2.0",
    date: "2026-03-31",
    added: [
      "Demo data fallbacks on 12 dashboard pages — attribution, analytics, scoring, radar, revenue, leads, marketplace, health, experiments, feedback, competitors, creative, lead-magnets, billing, tenants",
      "Schema.org Organization + WebSite + SoftwareApplication JSON-LD in kernel root layout",
      "Schema.org LocalBusiness + WebSite JSON-LD in erie-pro root layout with dynamic city and niche data",
      "28 server-component layout.tsx files for unique dashboard page titles (SEO)",
      "CSV export on leads dashboard — exports all visible lead rows with one click",
      "Provider testimonials section on for-business page (erie-pro)",
      "Agency owner testimonials section on kernel homepage with metric badges",
      "Comparison table on niche compare pages (9 rows, 3 columns)",
      "HowTo Schema.org JSON-LD on niche guides pages for rich search results",
      "Phone number and business hours on erie-pro contact page",
      "Niche-specific step lists on guide cards with CheckCircle2 icons",
      "Skip-to-main-content accessibility link in NeatCircle layout",
      "Checklist page metadata (generateMetadata server layout for client-component page)",
    ],
    changed: [
      "Dashboard pages that returned error walls now show demo data with amber banners",
      "Credentials and marketing-ingestion pages now show empty state instead of blocking error",
      "Feedback page action errors (run cycle, apply adjustments) preserved inline",
      "Revenue page always returns data — no null state on failure",
    ],
    fixed: [
      "TypeScript error in api-funnel.test.ts: ChannelType import for strict array typing",
      "Analytics, scoring, radar dashboards showing error wall on unauthenticated visits",
      "All 12 dashboard client-component pages now render useful content for all visitors",
    ],
  },
  {
    version: "1.1.0",
    date: "2026-03-28",
    added: [
      "Privacy Policy and Terms of Service pages",
      "Standalone pricing page with 4 tiers",
      "Help Center with searchable FAQ",
      "Public changelog and roadmap pages",
      "Content Security Policy headers",
      "Rate limiting on authentication endpoints",
      "CORS hardening (no wildcard in production)",
      "Error and loading boundaries for all route segments",
      "Structured JSON logging for production",
      "LRU cache with TTL for all in-memory stores",
      "Database migration runner with transaction safety",
      "Connection timeouts and pool configuration",
      "Transaction helper for multi-step writes",
      "Sitemap.xml and robots.txt",
      "Open Graph and Twitter Card metadata",
      "Favicon, manifest.json, PWA support",
      "GitHub Actions CI pipeline (typecheck + test + build)",
      ".dockerignore for optimized container builds",
      "CONTRIBUTING.md, PR templates, and issue templates",
    ],
    changed: [
      "All API routes now require authentication by default",
      "Credential vault rejects missing encryption key in production",
      "CORS defaults to same-origin when ALLOWED_ORIGINS is not set",
      "Cross-platform test scripts (replaced Windows-only set syntax)",
      "Layout metadata updated with professional title and descriptions",
      "Footer now includes links to legal, help, and roadmap pages",
    ],
    fixed: [
      "Open redirect vulnerability in click tracking endpoint",
      "Unbounded in-memory Maps replaced with LRU caches (prevents memory leaks)",
      "Silent catch blocks now log errors with context",
      "Database queries now have statement timeouts (5s default)",
    ],
  },
  {
    version: "1.0.0",
    date: "2026-03-15",
    added: [
      "278 API endpoints across intake, scoring, nurturing, marketplace, billing, and operators",
      "23-page operator dashboard with KPIs, analytics, and management tools",
      "110+ provider integrations with dry-run mode",
      "Multi-tenant infrastructure with tenant isolation",
      "Four-dimensional lead scoring (intent, fit, engagement, urgency)",
      "AI-powered content generation with social asset engine",
      "Multi-agent AI orchestration system",
      "78 funnel node types across 8 families",
      "Lead marketplace with dynamic pricing",
      "Stripe billing with 8 pricing plans",
      "Multi-channel nurturing (email, SMS, WhatsApp, voice, chat)",
      "A/B experiment engine with statistical significance detection",
      "Self-service onboarding wizard",
      "13 industry niche templates",
      "100 lead magnets in the content library",
      "Embeddable widgets (script, iframe, React, WordPress)",
      "GDPR compliance tools (export, deletion, consent)",
      "3,964 test cases",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <main id="main-content" style={{ maxWidth: "48rem", margin: "0 auto", padding: "3rem 1rem" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.5rem" }}>Changelog</h1>
      <p style={{ color: "#6b7280", marginBottom: "3rem" }}>
        New features, improvements, and fixes in Lead OS.
      </p>

      {releases.map((release) => (
        <article
          key={release.version}
          style={{
            marginBottom: "3rem",
            paddingBottom: "2rem",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: "1rem", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>v{release.version}</h2>
            <time style={{ color: "#6b7280", fontSize: "0.875rem" }}>{release.date}</time>
          </div>

          {release.added && release.added.length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                Added
              </h3>
              <ul style={{ paddingLeft: "1.25rem", fontSize: "0.875rem", lineHeight: 1.7, color: "#374151" }}>
                {release.added.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {release.changed && release.changed.length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#d97706", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                Changed
              </h3>
              <ul style={{ paddingLeft: "1.25rem", fontSize: "0.875rem", lineHeight: 1.7, color: "#374151" }}>
                {release.changed.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {release.fixed && release.fixed.length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                Fixed
              </h3>
              <ul style={{ paddingLeft: "1.25rem", fontSize: "0.875rem", lineHeight: 1.7, color: "#374151" }}>
                {release.fixed.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </article>
      ))}
    </main>
  );
}

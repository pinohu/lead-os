import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Roadmap",
  description: "See what is planned, in progress, and completed for Lead OS.",
};

interface RoadmapItem {
  title: string;
  description: string;
}

const columns: { label: string; color: string; items: RoadmapItem[] }[] = [
  {
    label: "Completed",
    color: "#059669",
    items: [
      { title: "278 API endpoints", description: "Full intake, scoring, nurturing, marketplace, billing, and operator APIs" },
      { title: "23-page operator dashboard", description: "KPIs, analytics, pipeline, agents, creative, experiments, and more" },
      { title: "110+ provider integrations", description: "CRM, email, SMS, WhatsApp, voice, AI, analytics, automation, deployment" },
      { title: "AI content generation engine", description: "Social asset engine with 10+ angles, 7 hook types, 12 platform variants" },
      { title: "Multi-tenant infrastructure", description: "Tenant isolation, automated provisioning, credential vaults" },
      { title: "A/B experiment engine", description: "Statistical significance detection with automatic winner promotion" },
      { title: "Lead marketplace", description: "Dynamic pricing by temperature and quality, buyer claiming, outcome tracking" },
      { title: "Security hardening", description: "CSP headers, rate limiting, CORS enforcement, auth middleware on all routes" },
    ],
  },
  {
    label: "In Progress",
    color: "#d97706",
    items: [
      { title: "Self-service tenant provisioning", description: "Automated niche generation, CRM setup, and embed code delivery" },
      { title: "Stripe billing integration", description: "Subscription management with usage-based billing and plan enforcement" },
      { title: "AppSumo integration roadmap", description: "31 Tier 1 products mapped to Lead OS modules for enhanced capabilities" },
      { title: "Database migration system", description: "Formal migration runner replacing dual schema path" },
    ],
  },
  {
    label: "Planned",
    color: "#6366f1",
    items: [
      { title: "Voice AI lead qualification", description: "Real-time phone-based qualification with AI agents (Pipecat/LiveKit)" },
      { title: "Advanced A/B testing", description: "Auto-optimization with multi-armed bandit algorithms" },
      { title: "Multi-language support", description: "i18n for widgets, dashboard, and nurture content" },
      { title: "Mobile app for operators", description: "React Native dashboard app with push notifications" },
      { title: "Advanced attribution modeling", description: "Multi-touch attribution with decay models" },
      { title: "Marketplace buyer mobile app", description: "Browse and claim leads on the go" },
      { title: "LightRAG knowledge graphs", description: "Per-tenant knowledge graphs for contextual outreach" },
      { title: "Mastra AI agent framework", description: "TypeScript-native agent orchestration with MCP support" },
    ],
  },
];

export default function RoadmapPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://leadgen-os.com";
  const roadmapJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${baseUrl}/roadmap#webpage`,
    url: `${baseUrl}/roadmap`,
    name: "Lead OS Product Roadmap",
    description: "See what is planned, in progress, and completed for Lead OS.",
    isPartOf: { "@id": `${baseUrl}/#website` },
    about: {
      "@type": "SoftwareApplication",
      "@id": `${baseUrl}/#app`,
      name: "Lead OS",
    },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(roadmapJsonLd) }} />
      <main id="main-content" style={{ maxWidth: "76rem", margin: "0 auto", padding: "3rem 1rem" }}>
      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.5rem" }}>Product Roadmap</h1>
        <p style={{ color: "#6b7280", maxWidth: "32rem", margin: "0 auto" }}>
          See what we are building. Have a feature request?{" "}
          <Link href="https://github.com/pinohu/lead-os/issues" style={{ color: "#4f46e5", textDecoration: "underline" }}>
            Open an issue on GitHub
          </Link>.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(20rem, 1fr))",
          gap: "1.5rem",
        }}
      >
        {columns.map((col) => (
          <section key={col.label}>
            <h2
              style={{
                fontSize: "0.875rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: col.color,
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span
                style={{
                  width: "0.5rem",
                  height: "0.5rem",
                  borderRadius: "50%",
                  background: col.color,
                  display: "inline-block",
                }}
                aria-hidden="true"
              />
              {col.label} ({col.items.length})
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {col.items.map((item) => (
                <div
                  key={item.title}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.5rem",
                    padding: "1rem",
                    borderLeft: `3px solid ${col.color}`,
                  }}
                >
                  <h3 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "#6b7280", lineHeight: 1.5 }}>
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
    </>
  );
}

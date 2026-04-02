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

const columns: { label: string; color: string; twColor: string; items: RoadmapItem[] }[] = [
  {
    label: "Completed",
    color: "#059669",
    twColor: "text-emerald-600",
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
    twColor: "text-amber-600",
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
    twColor: "text-indigo-500",
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
      <main id="main-content" className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-2xl font-extrabold mb-2">Product Roadmap</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          See what we are building. Have a feature request?{" "}
          <Link href="https://github.com/pinohu/lead-os/issues" className="text-primary underline">
            Open an issue on GitHub
          </Link>.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((col) => (
          <section key={col.label}>
            <h2
              className={`text-sm font-bold uppercase tracking-wide mb-4 flex items-center gap-2 ${col.twColor}`}
            >
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ background: col.color }}
                aria-hidden="true"
              />
              {col.label} ({col.items.length})
            </h2>
            <div className="flex flex-col gap-3">
              {col.items.map((item) => (
                <div
                  key={item.title}
                  className="border border-border rounded-lg p-4"
                  style={{ borderLeftWidth: 3, borderLeftColor: col.color }}
                >
                  <h3 className="text-sm font-semibold mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
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

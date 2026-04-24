import type { Metadata } from "next";
import Link from "next/link";
import { tenantConfig } from "@/lib/tenant";

export const metadata: Metadata = {
  title: "Roadmap",
  description: "See what is planned, in progress, and completed for CX React.",
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
      { title: "Full agency dashboard", description: "KPIs, analytics, pipeline management, client reporting, and team tools in one place" },
      { title: "137+ tool integrations", description: "Connect your CRM, email, SMS, WhatsApp, voice, analytics, and automation tools" },
      { title: "AI content engine", description: "Generate social posts, ad copy, and email sequences for any industry in minutes" },
      { title: "Multi-client management", description: "Run all your clients from one account with complete data isolation between them" },
      { title: "Built-in A/B testing", description: "Test subject lines, landing pages, and offers with automatic winner detection" },
      { title: "Lead marketplace", description: "Sell surplus qualified leads to verified buyers with dynamic pricing" },
      { title: "Enterprise security", description: "Bank-level encryption, access controls, and compliance reporting for enterprise clients" },
    ],
  },
  {
    label: "In Progress",
    color: "#d97706",
    twColor: "text-amber-600",
    items: [
      { title: "One-click client setup", description: "Add a new client and get a fully configured account with funnels, scoring, and nurture sequences in minutes" },
      { title: "Automated billing", description: "Bill clients directly through the platform with usage-based pricing and automated invoicing" },
      { title: "Extended tool ecosystem", description: "Deeper integrations with 31 additional best-in-class marketing and sales tools" },
    ],
  },
  {
    label: "Planned",
    color: "#6366f1",
    twColor: "text-indigo-500",
    items: [
      { title: "AI phone qualification", description: "Qualify leads by phone using AI agents that sound natural and book appointments automatically" },
      { title: "Smart A/B optimization", description: "AI that automatically adjusts campaigns based on performance, no manual intervention needed" },
      { title: "Multi-language support", description: "Run campaigns in any language for your international clients" },
      { title: "Mobile app", description: "Manage your agency from your phone with real-time notifications and lead alerts" },
      { title: "Advanced attribution", description: "Show clients exactly which channels and touchpoints are driving their best leads" },
      { title: "Marketplace mobile app", description: "Let lead buyers browse and claim leads from their phone" },
      { title: "AI knowledge base", description: "AI that learns your clients' businesses and personalizes every outreach message automatically" },
      { title: "Next-gen AI agents", description: "Smarter AI agents that handle more complex workflows across your entire client portfolio" },
    ],
  },
];

export default function RoadmapPage() {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || tenantConfig.siteUrl).replace(/\/$/, "");
  const roadmapJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${baseUrl}/roadmap#webpage`,
    url: `${baseUrl}/roadmap`,
    name: "CX React Product Roadmap",
    description: "See what is planned, in progress, and completed for CX React.",
    isPartOf: { "@id": `${baseUrl}/#website` },
    about: {
      "@type": "SoftwareApplication",
      "@id": `${baseUrl}/#app`,
      name: "CX React",
    },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(roadmapJsonLd) }} />
      <main id="main-content" className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-foreground text-2xl font-extrabold mb-2">Product Roadmap</h1>
        <p className="text-foreground max-w-lg mx-auto">
          See what we are building next to help your agency grow. Have a feature request?{" "}
          <Link href="/contact" className="text-primary underline">
            Let us know
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
                  <h3 className="text-foreground text-sm font-semibold mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-foreground leading-relaxed">
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

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog",
  description: "What is new in Lead OS. Release notes, solution launch improvements, and production updates.",
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
      "Enhanced search engine visibility for all client-facing pages (reviews, costs, emergency, pricing, tips, certifications, seasonal, directory, and comparisons)",
      "Improved search engine indexing for all network sites",
      "Automatic sitemap generation for better Google discoverability",
    ],
    changed: [
      "All public-facing pages now have rich search results for better organic traffic",
    ],
  },
  {
    version: "1.2.0",
    date: "2026-03-31",
    added: [
      "Dashboard now shows sample data for new accounts so you can explore before going live",
      "One-click CSV export for all leads in your dashboard",
      "Client testimonials section on business pages for social proof",
      "Agency owner testimonials with metric badges on the homepage",
      "Side-by-side comparison tables on industry pages",
      "Rich search results for industry guide pages",
      "Phone number and business hours on contact pages",
      "Step-by-step guide cards for each industry",
      "Improved accessibility across all pages",
    ],
    changed: [
      "Dashboard pages now gracefully show sample data instead of error messages for new accounts",
      "Revenue dashboard always loads, even during initial setup",
    ],
    fixed: [
      "Dashboard pages now load properly for all visitors",
      "Analytics and scoring dashboards accessible without full setup",
    ],
  },
  {
    version: "1.1.0",
    date: "2026-03-28",
    added: [
      "Privacy Policy and Terms of Service pages",
      "Standalone pricing page with all 4 plan tiers",
      "Searchable Help Center with FAQ",
      "Public changelog and product roadmap",
      "Enhanced security protections across all pages",
      "Sitemap for better search engine indexing",
      "Social sharing previews (Open Graph and Twitter Cards)",
      "Mobile app support (installable as a PWA)",
    ],
    changed: [
      "Stronger security defaults across all account pages",
      "Updated page titles and descriptions for professional branding",
      "Footer now links to legal, help, and roadmap pages",
    ],
    fixed: [
      "Resolved a security issue in link tracking",
      "Improved platform stability and performance under load",
    ],
  },
  {
    version: "1.0.0",
    date: "2026-03-15",
    added: [
      "Full agency dashboard with KPIs, analytics, and client management tools",
      "137+ tool integrations (CRM, email, SMS, chat, and more)",
      "Multi-client management with complete data isolation",
      "AI-powered lead scoring across 4 dimensions (intent, fit, engagement, urgency)",
      "AI content generation for social media, ads, and email",
      "AI agents that work overnight to nurture leads and prevent churn",
      "Drag-and-drop funnel builder with 78 automation types",
      "Built-in lead marketplace with dynamic pricing",
      "Flexible billing with 4 plan tiers",
      "Multi-channel nurturing across email, SMS, WhatsApp, voice, and chat",
      "A/B testing with automatic winner detection",
      "Self-service onboarding wizard (15-minute setup)",
      "Pre-built templates for 13 industries",
      "100 ready-to-use lead magnets",
      "Embeddable widgets for any website",
      "Built-in GDPR compliance tools",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-foreground text-2xl font-extrabold mb-2">What&apos;s New</h1>
      <p className="text-foreground mb-12">
          Platform updates, solution launch improvements, and fulfillment automation changes.
      </p>

      {releases.map((release) => (
        <article
          key={release.version}
          className="mb-12 pb-8 border-b border-border"
        >
          <div className="flex items-baseline gap-4 mb-4">
            <h2 className="text-foreground text-2xl font-bold">v{release.version}</h2>
            <time className="text-muted-foreground text-sm">{release.date}</time>
          </div>

          {release.added && release.added.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wide mb-2">
                Added
              </h3>
              <ul className="pl-5 text-sm leading-7 text-foreground">
                {release.added.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {release.changed && release.changed.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-bold text-amber-600 uppercase tracking-wide mb-2">
                Changed
              </h3>
              <ul className="pl-5 text-sm leading-7 text-foreground">
                {release.changed.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {release.fixed && release.fixed.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-bold text-red-600 uppercase tracking-wide mb-2">
                Fixed
              </h3>
              <ul className="pl-5 text-sm leading-7 text-foreground">
                {release.fixed.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

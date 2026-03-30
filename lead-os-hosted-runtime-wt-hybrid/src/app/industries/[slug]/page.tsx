import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { AdaptiveLeadCaptureForm } from "@/components/AdaptiveLeadCaptureForm";
import { ExperienceScaffold } from "@/components/ExperienceScaffold";
import { getNiche, nicheCatalog } from "@/lib/catalog";
import { resolveExperienceProfile } from "@/lib/experience";
import { tenantConfig } from "@/lib/tenant";
import { INDUSTRY_TEMPLATES, type IndustryCategory } from "@/lib/niche-templates";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function asString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function asBoolean(value: string | string[] | undefined) {
  const normalized = asString(value)?.toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

/** Map niche slugs to the closest INDUSTRY_TEMPLATES key. */
function resolveTemplateCategory(slug: string): IndustryCategory {
  const directMap: Record<string, IndustryCategory> = {
    general: "general",
    legal: "legal",
    "home-services": "service",
    coaching: "service",
    construction: "construction",
    "real-estate": "real-estate",
    tech: "tech",
    education: "education",
    finance: "finance",
    franchise: "franchise",
    staffing: "staffing",
    faith: "faith",
    creative: "creative",
    health: "health",
    ecommerce: "general",
    fitness: "health",
  };
  return directMap[slug] ?? "general";
}

export function generateStaticParams() {
  return Object.keys(nicheCatalog).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const niche = getNiche(slug);
  if (!niche) return {};
  return {
    title: `${niche.label} Growth System | Lead OS`,
    description: `${niche.summary} Discover purpose-built funnels, scoring, and automation for ${niche.label.toLowerCase()} businesses.`,
  };
}

export default async function IndustryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const query = await searchParams;
  const niche = getNiche(slug);

  if (!niche) notFound();

  const category = resolveTemplateCategory(slug);
  const template = INDUSTRY_TEMPLATES[category];

  const headerStore = await headers();
  const profile = resolveExperienceProfile({
    family: "lead-magnet",
    niche,
    supportEmail: tenantConfig.supportEmail,
    source: asString(query.source) ?? "industry-page",
    intent: "discover",
    returning: asBoolean(query.returning),
    milestone: asString(query.milestone),
    preferredMode: asString(query.mode) ?? "form-first",
    score: Number(asString(query.score) ?? 50),
    userAgent: headerStore.get("user-agent") ?? undefined,
    referrer: headerStore.get("referer") ?? undefined,
  });

  const coldHeadline = template.headlineTemplates.cold;
  const headline = coldHeadline.headline.replace(/\{\{niche\}\}/g, niche.label);
  const subheadline = coldHeadline.subheadline.replace(/\{\{niche\}\}/g, niche.label);

  const painPoints = template.painPoints
    .slice(0, 6)
    .map((p) => p.replace(/\{\{niche\}\}/g, niche.label));
  const offers = template.offers.map((o) =>
    o.replace(/\{\{niche\}\}/g, niche.label),
  );

  return (
    <>
      <ExperienceScaffold
        eyebrow={niche.label}
        title={headline}
        summary={subheadline}
        profile={profile}
        niche={niche.slug}
        metrics={[
          {
            label: "Funnel style",
            value: niche.recommendedFunnels[0] ?? "lead-magnet",
            detail: `Primary conversion path recommended for ${niche.label} businesses.`,
          },
          {
            label: "Scoring bias",
            value: niche.calculatorBias,
            detail: `Leads are scored with a ${niche.calculatorBias}-first weighting model.`,
          },
          {
            label: "Automation depth",
            value: `${template.offers.length} playbooks`,
            detail: "Pre-built automations ready to deploy on day one.",
          },
        ]}
      >
        {/* ---------- Pain Points ---------- */}
        <section>
          <h2>Challenges {niche.label} businesses face every day</h2>
          <div className="grid two">
            {painPoints.map((point, i) => (
              <article key={i} className="panel">
                <p>{point}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ---------- Offers ---------- */}
        <section>
          <h2>What we build for {niche.label} teams</h2>
          <ul className="check-list">
            {offers.map((offer, i) => (
              <li key={i}>{offer}</li>
            ))}
          </ul>
        </section>

        {/* ---------- Assessment Teaser ---------- */}
        <section className="panel">
          <p className="eyebrow">Free diagnostic</p>
          <h2>Find out where your {niche.label} pipeline leaks revenue</h2>
          <p>
            Our two-minute assessment scores your current funnel against
            benchmarks from hundreds of {niche.label.toLowerCase()} businesses
            and returns a prioritized action plan.
          </p>
          <div className="cta-row">
            <Link href={`/assess/${niche.slug}`} className="primary">
              {coldHeadline.ctaText.replace(/\{\{niche\}\}/g, niche.label)}
            </Link>
          </div>
        </section>

        {/* ---------- Lead Capture ---------- */}
        <AdaptiveLeadCaptureForm
          source="contact_form"
          family="lead-magnet"
          niche={niche.slug}
          service={tenantConfig.defaultService}
          pagePath={`/industries/${niche.slug}`}
          returning={asBoolean(query.returning)}
          profile={profile}
        />
      </ExperienceScaffold>

      {/* ---------- Schema.org JSON-LD ---------- */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: `${niche.label} Growth System`,
            description: niche.summary,
            provider: {
              "@type": "Organization",
              name: tenantConfig.brandName,
              url: tenantConfig.siteUrl,
            },
            areaServed: "US",
            serviceType: "Marketing Automation",
          }),
        }}
      />
    </>
  );
}

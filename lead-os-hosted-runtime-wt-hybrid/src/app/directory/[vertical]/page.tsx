import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ExperienceScaffold } from "@/components/ExperienceScaffold";
import { getNiche, nicheCatalog } from "@/lib/catalog";
import { resolveExperienceProfile } from "@/lib/experience";
import { tenantConfig } from "@/lib/tenant";
import { INDUSTRY_TEMPLATES, type IndustryCategory } from "@/lib/niche-templates";
import { buildOgImageUrl } from "@/lib/og-url";
import { NICHE_TESTIMONIALS } from "@/lib/niche-testimonials";
import { CALCULATOR_PRESETS } from "@/lib/calculator-presets";
import { getCustomerIntelligenceOrDefault } from "@/lib/customer-intelligence";

type Props = {
  params: Promise<{ vertical: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function asString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function asBoolean(value: string | string[] | undefined) {
  const normalized = asString(value)?.toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

function resolveTemplateCategory(slug: string): IndustryCategory {
  const directMap: Record<string, IndustryCategory> = {
    general: "general", legal: "legal", health: "health", tech: "tech",
    construction: "construction", "real-estate": "real-estate", education: "education",
    finance: "finance", franchise: "franchise", staffing: "staffing",
    faith: "faith", creative: "creative", "home-services": "service",
    coaching: "education", fitness: "health", ecommerce: "tech",
  };
  return directMap[slug] ?? "general";
}

export function generateStaticParams() {
  return Object.keys(nicheCatalog).map((vertical) => ({ vertical }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { vertical } = await params;
  const niche = getNiche(vertical);
  return {
    title: `${niche.label} Directory | Lead OS`,
    description: `Complete directory of ${niche.label.toLowerCase()} growth resources: industry overview, assessments, authority guides, ROI calculators, testimonials, and funnel blueprints.`,
    openGraph: {
      title: `${niche.label} Directory`,
      description: `Complete directory of ${niche.label.toLowerCase()} growth resources.`,
      images: [{ url: buildOgImageUrl(`${niche.label} Directory`, `Complete directory of ${niche.label.toLowerCase()} growth resources.`, vertical), width: 1200, height: 630 }],
    },
  };
}

export default async function VerticalDirectoryPage({ params, searchParams }: Props) {
  const { vertical } = await params;
  const query = await searchParams;
  const niche = getNiche(vertical);
  if (!niche || niche.slug === "general" && vertical !== "general") notFound();

  const category = resolveTemplateCategory(niche.slug);
  const template = INDUSTRY_TEMPLATES[category];
  const testimonials = NICHE_TESTIMONIALS[category] ?? [];
  const calcPreset = CALCULATOR_PRESETS[niche.slug] ?? CALCULATOR_PRESETS.general;

  const headerStore = await headers();
  const profile = resolveExperienceProfile({
    family: "lead-magnet",
    niche,
    supportEmail: tenantConfig.supportEmail,
    source: asString(query.source) ?? "directory",
    intent: "discover",
    returning: asBoolean(query.returning),
    preferredMode: "form-first",
    score: Number(asString(query.score) ?? 30),
    userAgent: headerStore.get("user-agent") ?? undefined,
    referrer: headerStore.get("referer") ?? undefined,
  });

  const painPoints = template
    ? template.painPoints.map((p) => p.replace(/\{\{niche\}\}/g, niche.label))
    : [];
  const offers = template ? template.offers.map((o) => o.replace(/\{\{niche\}\}/g, niche.label)) : [];
  const coldHeadline = template?.headlineTemplates?.cold;

  return (
    <div data-theme="light" className="[color-scheme:light]">
    <ExperienceScaffold
      eyebrow={`${niche.label} directory`}
      title={coldHeadline ? coldHeadline.headline.replace(/\{\{niche\}\}/g, niche.label) : `${niche.label} Growth Directory`}
      summary={`Everything you need to evaluate, plan, and launch a ${niche.label.toLowerCase()} growth system — assessments, guides, calculators, and proof.`}
      profile={profile}
      niche={niche.slug}
      metrics={[
        { label: "Resources available", value: "4", detail: "Industry page, assessment, guide, calculator" },
        { label: "Funnels recommended", value: String(niche.recommendedFunnels.length), detail: niche.recommendedFunnels.join(", ") },
        { label: "Calculator bias", value: niche.calculatorBias, detail: "Primary ROI framing for this vertical" },
      ]}
    >
      {/* ── Quick Navigation ── */}
      <section className="panel text-center">
        <p className="eyebrow">Jump to a resource</p>
        <div className="cta-row justify-center flex-wrap">
          <Link href={`/industries/${niche.slug}`} className="primary">Industry Overview</Link>
          <Link href={`/assess/${niche.slug}`} className="secondary">Take Assessment</Link>
          <Link href={`/resources/${niche.slug}`} className="secondary">Read the Guide</Link>
          <Link href={`/calculator?niche=${niche.slug}`} className="secondary">ROI Calculator</Link>
        </div>
      </section>

      {/* ── Pain Points ── */}
      {painPoints.length > 0 && (
        <section>
          <p className="eyebrow">Common {niche.label.toLowerCase()} challenges</p>
          <div className="grid two">
            {painPoints.map((pain) => (
              <article key={pain} className="panel">
                <p className="m-0 text-sm leading-relaxed">{pain}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ── Solutions ── */}
      {offers.length > 0 && (
        <section>
          <p className="eyebrow">Available {niche.label.toLowerCase()} solutions</p>
          <div className="grid two">
            {offers.map((offer) => (
              <article key={offer} className="panel">
                <p className="m-0 text-sm leading-relaxed">{offer}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ── Testimonials ── */}
      {testimonials.length > 0 && (
        <section>
          <p className="eyebrow">What {niche.label.toLowerCase()} leaders say</p>
          <div className="grid three">
            {testimonials.map((t) => (
              <article key={t.author} className="panel flex flex-col gap-3">
                <p className="italic text-sm leading-relaxed flex-1">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <strong className="text-sm">{t.author}</strong>
                  <span className="muted block text-xs">{t.role}, {t.company}</span>
                </div>
                <span className="inline-block px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold w-fit">
                  {t.metric}
                </span>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ── Calculator Preview ── */}
      {calcPreset && (
        <section className="panel">
          <p className="eyebrow">{niche.label} ROI estimator</p>
          <h2>{calcPreset.resultLabel}</h2>
          <p className="muted">{calcPreset.formula}</p>
          <p className="mt-3 px-4 py-3 rounded-md bg-accent/10 font-bold text-sm">
            {calcPreset.proofPoint}
          </p>
          <div className="cta-row">
            <Link href={`/calculator?niche=${niche.slug}`} className="primary">Open the full calculator</Link>
          </div>
        </section>
      )}

      {/* ── Recommended Funnels ── */}
      <section>
        <p className="eyebrow">Recommended funnel blueprints</p>
        <div className="grid two">
          {niche.recommendedFunnels.map((funnel) => (
            <article key={funnel} className="panel">
              <h3 className="m-0 text-base capitalize">
                {funnel.replace(/-/g, " ")} funnel
              </h3>
              <p className="muted text-sm">
                Pre-built blueprint optimized for {niche.label.toLowerCase()} businesses.
              </p>
              <Link href={`/funnel/${funnel}?niche=${niche.slug}`} className="text-sm text-primary">
                View blueprint →
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* ── Competitor Awareness ── */}
      {(() => {
        const intel = getCustomerIntelligenceOrDefault(niche.slug);
        return (
          <section>
            <p className="eyebrow">How we compare</p>
            <div className="grid two">
              <article className="panel">
                <h3 className="m-0 mb-2 text-sm">Alternatives you may be considering</h3>
                <ul className="m-0 pl-5 text-sm leading-loose">
                  {intel.competitors.alternatives.map((alt) => (
                    <li key={alt}>{alt}</li>
                  ))}
                </ul>
              </article>
              <article className="panel">
                <h3 className="m-0 mb-2 text-sm">What makes Lead OS different</h3>
                <ul className="m-0 pl-5 text-sm leading-loose">
                  {intel.competitors.differentiators.map((diff) => (
                    <li key={diff}>{diff}</li>
                  ))}
                </ul>
              </article>
            </div>
            <p className="muted text-center mt-3 text-xs">
              Switching costs: {intel.competitors.switchingCosts}
            </p>
          </section>
        );
      })()}

      {/* ── Schema.org ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: `${niche.label} Business Directory`,
            description: `Complete directory of ${niche.label.toLowerCase()} growth resources.`,
            url: `${tenantConfig.siteUrl}/directory/${niche.slug}`,
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: 4,
              itemListElement: [
                { "@type": "ListItem", position: 1, url: `${tenantConfig.siteUrl}/industries/${niche.slug}` },
                { "@type": "ListItem", position: 2, url: `${tenantConfig.siteUrl}/assess/${niche.slug}` },
                { "@type": "ListItem", position: 3, url: `${tenantConfig.siteUrl}/resources/${niche.slug}` },
                { "@type": "ListItem", position: 4, url: `${tenantConfig.siteUrl}/calculator?niche=${niche.slug}` },
              ],
            },
          }),
        }}
      />
    </ExperienceScaffold>
    </div>
  );
}

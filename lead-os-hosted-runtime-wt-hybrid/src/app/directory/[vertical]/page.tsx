import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExperienceScaffold } from "@/components/ExperienceScaffold";
import { getNiche, nicheCatalog } from "@/lib/catalog";
import { resolveExperienceProfile } from "@/lib/experience";
import { tenantConfig } from "@/lib/tenant";
import { INDUSTRY_TEMPLATES, type IndustryCategory } from "@/lib/niche-templates";
import { buildOgImageUrl } from "@/lib/og-url";
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
    title: `${niche.label} Package Directory | Lead OS`,
    description: `Directory of ${niche.label.toLowerCase()} package inputs: industry overview, assessment, guide, ROI calculator, proof, and funnel paths.`,
    openGraph: {
      title: `${niche.label} Package Directory`,
      description: `Directory of ${niche.label.toLowerCase()} package inputs.`,
      images: [{ url: buildOgImageUrl(`${niche.label} Package Directory`, `Directory of ${niche.label.toLowerCase()} package inputs.`, vertical), width: 1200, height: 630 }],
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
    <div>
    <ExperienceScaffold
      eyebrow={`${niche.label} directory`}
      title={coldHeadline ? coldHeadline.headline.replace(/\{\{niche\}\}/g, niche.label) : `${niche.label} Package Directory`}
      summary={`Everything you need to match a ${niche.label.toLowerCase()} buyer to the right package: assessment, guide, calculator, proof, and funnel path.`}
      profile={profile}
      niche={niche.slug}
      metrics={[
        { label: "Resources available", value: "4", detail: "Industry page, assessment, guide, calculator" },
        { label: "Funnels recommended", value: String(niche.recommendedFunnels.length), detail: niche.recommendedFunnels.join(", ") },
        { label: "Calculator bias", value: niche.calculatorBias, detail: "Primary ROI framing for this vertical" },
      ]}
    >
      {/* ── Quick Navigation ── */}
      <section className="rounded-xl border border-border bg-card p-6 text-center">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Jump to a resource</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button asChild><Link href={`/industries/${niche.slug}`}>Industry Overview</Link></Button>
          <Button asChild variant="outline"><Link href={`/assess/${niche.slug}`}>Take Assessment</Link></Button>
          <Button asChild variant="outline"><Link href={`/resources/${niche.slug}`}>Read the Guide</Link></Button>
          <Button asChild variant="outline"><Link href={`/calculator?niche=${niche.slug}`}>ROI Calculator</Link></Button>
        </div>
      </section>

      {/* ── Pain Points ── */}
      {painPoints.length > 0 && (
        <section>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Common {niche.label.toLowerCase()} challenges</p>
          <div className="grid md:grid-cols-2 gap-6">
            {painPoints.map((pain) => (
              <article key={pain} className="rounded-xl border border-border bg-card p-6">
                <p className="m-0 text-sm leading-relaxed">{pain}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ── Solutions ── */}
      {offers.length > 0 && (
        <section>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Available {niche.label.toLowerCase()} package paths</p>
          <div className="grid md:grid-cols-2 gap-6">
            {offers.map((offer) => (
              <article key={offer} className="rounded-xl border border-border bg-card p-6">
                <p className="m-0 text-sm leading-relaxed">{offer}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Proof package to attach</p>
        <h2 className="text-foreground">Evidence needed for a trustworthy {niche.label.toLowerCase()} launch</h2>
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["Baseline", "Current response time, manual hours, conversion rate, missed demand, or cost before launch."],
            ["Created outputs", "The launched hub, capture path, routing logic, reports, scripts, and acceptance checks."],
            ["Measured change", "The result tracked after real traffic or client-owned account data is connected."],
            ["Approved proof", "A verified quote, case note, screenshot, or client approval before publishing any testimonial."],
          ].map(([title, detail]) => (
            <article key={title} className="rounded-lg border border-border bg-card p-5">
              <p className="font-semibold text-foreground">{title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{detail}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Calculator Preview ── */}
      {calcPreset && (
        <section className="rounded-xl border border-border bg-card p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{niche.label} ROI estimator</p>
          <h2 className="text-foreground">{calcPreset.resultLabel}</h2>
          <p className="text-muted-foreground">{calcPreset.formula}</p>
          <p className="mt-3 px-4 py-3 rounded-md bg-accent/10 font-bold text-sm">
            {calcPreset.proofPoint}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild><Link href={`/calculator?niche=${niche.slug}`}>Open the full calculator</Link></Button>
          </div>
        </section>
      )}

      {/* ── Recommended Funnels ── */}
      <section>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Recommended funnel blueprints</p>
        <div className="grid md:grid-cols-2 gap-6">
          {niche.recommendedFunnels.map((funnel) => (
            <article key={funnel} className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-foreground m-0 text-base capitalize">
                {funnel.replace(/-/g, " ")} funnel
              </h3>
              <p className="text-muted-foreground text-sm">
                Blueprint that can become the capture and routing path inside a launched package.
              </p>
              <Link href={`/funnel/${funnel}?niche=${niche.slug}`} className="text-sm text-primary">
                View blueprint
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
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">How we compare</p>
            <div className="grid md:grid-cols-2 gap-6">
              <article className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-foreground m-0 mb-2 text-sm">Alternatives you may be considering</h3>
                <ul className="m-0 pl-5 text-sm leading-loose">
                  {intel.competitors.alternatives.map((alt) => (
                    <li key={alt}>{alt}</li>
                  ))}
                </ul>
              </article>
              <article className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-foreground m-0 mb-2 text-sm">What makes Lead OS different</h3>
                <ul className="m-0 pl-5 text-sm leading-loose">
                  {intel.competitors.differentiators.map((diff) => (
                    <li key={diff}>{diff}</li>
                  ))}
                </ul>
              </article>
            </div>
            <p className="text-muted-foreground text-center mt-3 text-xs">
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
            name: `${niche.label} Package Directory`,
            description: `Directory of ${niche.label.toLowerCase()} package inputs.`,
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

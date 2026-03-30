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
import { NICHE_TESTIMONIALS } from "@/lib/niche-testimonials";
import { buildOgImageUrl } from "@/lib/og-url";
import { getCustomerIntelligenceOrDefault } from "@/lib/customer-intelligence";

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
    openGraph: {
      title: `${niche.label} | Lead OS`,
      description: niche.summary,
      images: [{ url: buildOgImageUrl(niche.label, niche.summary, niche.slug), width: 1200, height: 630 }],
    },
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

        {/* ---------- Cross-Links ---------- */}
        <section>
          <h2>Explore more for {niche.label}</h2>
          <div className="grid three">
            <article className="panel">
              <p className="eyebrow">Assessment</p>
              <h3>Score your {niche.label} funnel</h3>
              <p>
                Take a two-minute diagnostic and get a prioritized action plan
                built for {niche.label.toLowerCase()} businesses.
              </p>
              <div className="cta-row">
                <Link href={`/assess/${niche.slug}`} className="primary">
                  Take the assessment
                </Link>
              </div>
            </article>

            <article className="panel">
              <p className="eyebrow">Resources</p>
              <h3>The complete {niche.label} guide</h3>
              <p>
                Strategies, benchmarks, and playbooks written specifically for
                the {niche.label.toLowerCase()} industry.
              </p>
              <div className="cta-row">
                <Link href={`/resources/${niche.slug}`} className="secondary">
                  Read the complete guide
                </Link>
              </div>
            </article>

            <article className="panel">
              <p className="eyebrow">For your role</p>
              <h3>Built for agencies &amp; operators</h3>
              <p>
                See how Lead&nbsp;OS fits your workflow — whether you run an
                agency, a franchise, or an in-house growth team.
              </p>
              <div className="cta-row">
                <Link href="/for/agencies" className="secondary">
                  Built for your role
                </Link>
              </div>
            </article>
          </div>
        </section>

        {/* ---------- Testimonials ---------- */}
        {(() => {
          const testimonials = NICHE_TESTIMONIALS[category] ?? NICHE_TESTIMONIALS.general ?? [];
          if (testimonials.length === 0) return null;
          return (
            <section>
              <p className="eyebrow">What {niche.label.toLowerCase()} leaders are saying</p>
              <div className="grid three">
                {testimonials.map((t) => (
                  <article key={t.author} className="panel" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <p style={{ fontStyle: "italic", fontSize: "0.92rem", lineHeight: 1.6, flex: 1 }}>
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div>
                      <strong style={{ display: "block", fontSize: "0.88rem" }}>{t.author}</strong>
                      <span className="muted" style={{ fontSize: "0.78rem" }}>{t.role}, {t.company}</span>
                    </div>
                    <span style={{
                      display: "inline-block",
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: "var(--accent-soft)",
                      color: "var(--accent-strong)",
                      fontSize: "0.76rem",
                      fontWeight: 700,
                      width: "fit-content",
                    }}>
                      {t.metric}
                    </span>
                  </article>
                ))}
              </div>
            </section>
          );
        })()}

        {/* ---------- Customer Intelligence: Buying Triggers ---------- */}
        {(() => {
          const intel = getCustomerIntelligenceOrDefault(category);
          return (
            <>
              <section>
                <p className="eyebrow">What triggers {niche.label.toLowerCase()} buyers to act</p>
                <div className="grid two">
                  {intel.buyingTriggers.slice(0, 4).map((trigger) => (
                    <article key={trigger.event} className="panel" style={{ borderLeft: `4px solid ${trigger.urgency === "immediate" ? "var(--danger)" : "var(--accent)"}` }}>
                      <h3 style={{ margin: "0 0 6px", fontSize: "0.94rem" }}>{trigger.event}</h3>
                      <p className="muted" style={{ fontSize: "0.82rem", margin: "0 0 4px" }}>{trigger.searchBehavior}</p>
                      <span style={{ fontSize: "0.76rem", fontStyle: "italic", color: "var(--text-soft)" }}>{trigger.emotionalState}</span>
                    </article>
                  ))}
                </div>
              </section>

              <section>
                <p className="eyebrow">Common objections — and how we address them</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {intel.objections.map((obj) => (
                    <details key={obj.objection} className="panel" style={{ cursor: "pointer" }}>
                      <summary style={{ fontWeight: 700, fontSize: "0.94rem" }}>&ldquo;{obj.objection}&rdquo;</summary>
                      <div style={{ marginTop: 12, paddingLeft: 16, borderLeft: "3px solid var(--accent-soft)" }}>
                        <p style={{ margin: "0 0 6px", fontSize: "0.88rem" }}><strong>The real concern:</strong> {obj.underlyingFear}</p>
                        <p style={{ margin: 0, fontSize: "0.88rem" }}><strong>Our response:</strong> {obj.evidenceBasedResponse}</p>
                      </div>
                    </details>
                  ))}
                </div>
              </section>

              <section className="panel" style={{ background: "var(--secondary-soft)" }}>
                <p className="eyebrow">Decision journey for {niche.label.toLowerCase()} buyers</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
                  {intel.decisionJourney.stages.map((stage, i) => (
                    <div key={stage.name} style={{ textAlign: "center" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: "50%", background: "var(--accent)", color: "white", fontWeight: 800, fontSize: "0.88rem", marginBottom: 8 }}>{i + 1}</span>
                      <h4 style={{ margin: "0 0 4px", fontSize: "0.88rem" }}>{stage.name}</h4>
                      <p className="muted" style={{ fontSize: "0.76rem", margin: 0 }}>{stage.primaryAction}</p>
                    </div>
                  ))}
                </div>
                <p style={{ textAlign: "center", marginTop: 16, fontSize: "0.84rem" }}>
                  <strong>Average timeline:</strong> {intel.decisionJourney.totalDays} days &middot; <strong>Touchpoints:</strong> {intel.decisionJourney.touchpointsNeeded} &middot; <strong>Decision-makers:</strong> {intel.decisionJourney.stakeholders}
                </p>
              </section>
            </>
          );
        })()}

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

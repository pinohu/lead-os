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
    title: `The Complete Guide to ${niche.label} | Lead OS Resources`,
    description: `Everything ${niche.label.toLowerCase()} businesses need to know about lead capture, scoring, automation, and growth. Actionable insights backed by real data.`,
  };
}

export default async function ResourcePage({ params, searchParams }: Props) {
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
    source: asString(query.source) ?? "resource-page",
    intent: "discover",
    returning: asBoolean(query.returning),
    milestone: asString(query.milestone),
    preferredMode: asString(query.mode) ?? "form-first",
    score: Number(asString(query.score) ?? 40),
    userAgent: headerStore.get("user-agent") ?? undefined,
    referrer: headerStore.get("referer") ?? undefined,
  });

  const painPoints = template.painPoints
    .slice(0, 6)
    .map((p) => p.replace(/\{\{niche\}\}/g, niche.label));
  const offers = template.offers.map((o) =>
    o.replace(/\{\{niche\}\}/g, niche.label),
  );
  const faqItems = template.assessmentStems.map((stem) => ({
    question: stem.questionTemplate.replace(/\{\{niche\}\}/g, niche.label),
    answer: stem.optionTemplates
      .map(
        (opt) =>
          `${opt.label} ${opt.scoreImpact >= 35 ? "-- this is a common gap that costs revenue." : "-- a solid foundation to build on."}`,
      )
      .join(" "),
  }));

  return (
    <>
      <ExperienceScaffold
        eyebrow="Resource guide"
        title={`The Complete Guide to ${niche.label}`}
        summary={`A practical playbook covering the biggest challenges ${niche.label.toLowerCase()} businesses face and the systems top performers use to solve them.`}
        profile={profile}
        niche={niche.slug}
        metrics={[
          {
            label: "Pain points covered",
            value: String(painPoints.length),
            detail: "Specific challenges addressed in this guide.",
          },
          {
            label: "Solutions mapped",
            value: String(offers.length),
            detail: "Ready-to-deploy playbooks referenced below.",
          },
          {
            label: "FAQ depth",
            value: `${faqItems.length} questions`,
            detail: "Diagnostic questions adapted from our assessment engine.",
          },
        ]}
      >
        {/* ---------- Pain Points ---------- */}
        <section>
          <h2>The biggest challenges in {niche.label} today</h2>
          <div className="grid two">
            {painPoints.map((point, i) => (
              <article key={i} className="panel">
                <p>{point}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ---------- Problem-to-Solution Mapping ---------- */}
        <section>
          <h2>From problem to solution</h2>
          <p className="lede">
            Every pain point above maps to a concrete system you can deploy.
            Here is what top-performing {niche.label.toLowerCase()} organizations
            put in place.
          </p>
          <div className="grid two">
            {painPoints.slice(0, offers.length).map((point, i) => (
              <article key={i} className="panel">
                <p className="eyebrow">Challenge</p>
                <p>{point}</p>
                <p className="eyebrow" style={{ marginTop: "var(--space-3)" }}>
                  Solution
                </p>
                <p>{offers[i]}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ---------- FAQ Section ---------- */}
        <section>
          <h2>Frequently asked questions about {niche.label}</h2>
          {faqItems.map((item, i) => (
            <details key={i} className="panel" style={{ marginBottom: "var(--space-2)" }}>
              <summary>
                <strong>{item.question}</strong>
              </summary>
              <p style={{ marginTop: "var(--space-2)" }}>{item.answer}</p>
            </details>
          ))}
        </section>

        {/* ---------- CTA: Assessment ---------- */}
        <section className="panel">
          <p className="eyebrow">Take the next step</p>
          <h2>Score your {niche.label} growth readiness in two minutes</h2>
          <p>
            Our diagnostic assessment benchmarks your current funnel against
            hundreds of {niche.label.toLowerCase()} businesses and returns a
            prioritized action plan you can execute this week.
          </p>
          <div className="cta-row">
            <Link href={`/assess/${niche.slug}`} className="primary">
              Start the Assessment
            </Link>
            <Link href={`/industries/${niche.slug}`} className="secondary">
              Explore {niche.label} Solutions
            </Link>
          </div>
        </section>

        {/* ---------- Lead Capture ---------- */}
        <AdaptiveLeadCaptureForm
          source="contact_form"
          family="lead-magnet"
          niche={niche.slug}
          service={tenantConfig.defaultService}
          pagePath={`/resources/${niche.slug}`}
          returning={asBoolean(query.returning)}
          profile={profile}
        />
      </ExperienceScaffold>

      {/* ---------- Schema.org FAQPage JSON-LD ---------- */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqItems.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: item.answer,
              },
            })),
          }),
        }}
      />
    </>
  );
}

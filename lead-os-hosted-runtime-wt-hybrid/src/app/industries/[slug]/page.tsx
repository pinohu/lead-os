import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdaptiveLeadCaptureForm } from "@/components/AdaptiveLeadCaptureForm";
import { ExperienceScaffold } from "@/components/ExperienceScaffold";
import { getNiche, nicheCatalog } from "@/lib/catalog";
import { resolveExperienceProfile } from "@/lib/experience";
import { tenantConfig } from "@/lib/tenant";
import { INDUSTRY_TEMPLATES, type IndustryCategory } from "@/lib/niche-templates";
import { buildOgImageUrl } from "@/lib/og-url";
import { getCustomerIntelligenceOrDefault } from "@/lib/customer-intelligence";
import { getIndustryAudienceModel, getIndustryPositioning } from "@/lib/industry-positioning";
import type { FunnelFamily } from "@/lib/runtime-schema";

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

const validFamilies = new Set<string>([
  "lead-magnet",
  "qualification",
  "chat",
  "webinar",
  "authority",
  "checkout",
  "retention",
  "rescue",
  "referral",
  "continuity",
]);

function resolvePrimaryFamily(value?: string): FunnelFamily {
  return validFamilies.has(value ?? "") ? value as FunnelFamily : "lead-magnet";
}

export function generateStaticParams() {
  return Object.keys(nicheCatalog).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const niche = getNiche(slug);
  if (!niche) return {};

  const positioning = getIndustryPositioning(niche.slug);
  return {
    title: `${niche.label} Growth System | Lead OS`,
    description: positioning.summary,
    openGraph: {
      title: positioning.title,
      description: positioning.summary,
      images: [{ url: buildOgImageUrl(positioning.title, positioning.summary, niche.slug), width: 1200, height: 630 }],
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
  const intel = getCustomerIntelligenceOrDefault(category);
  const positioning = getIndustryPositioning(niche.slug);
  const audienceModel = getIndustryAudienceModel(niche.slug);
  const primaryFamily = resolvePrimaryFamily(niche.recommendedFunnels[0]);

  const headerStore = await headers();
  const profile = resolveExperienceProfile({
    family: primaryFamily,
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

  const primaryCta = template.headlineTemplates.cold.ctaText.replace(/\{\{niche\}\}/g, niche.label);

  return (
    <div>
      <ExperienceScaffold
        eyebrow={positioning.eyebrow}
        title={positioning.title}
        summary={positioning.summary}
        profile={profile}
        niche={niche.slug}
        journeyTitle={`A ${audienceModel.model} outcome system for ${niche.label.toLowerCase()}`}
        journeySummary={audienceModel.buyerMessage}
        metrics={[
          {
            label: "Audience model",
            value: audienceModel.model,
            detail: audienceModel.model === "B2B2C" ? "Sold to the operator; experienced by their customers." : "Sold to and used by business operators.",
          },
          {
            label: "Primary buyer",
            value: intel.icp.title,
            detail: intel.icp.companySize,
          },
          {
            label: "Proof metric",
            value: positioning.proofMetric.split(",")[0],
            detail: positioning.proofMetric,
          },
          {
            label: "Buying timeline",
            value: intel.icp.decisionTimeline,
            detail: `${intel.decisionJourney.touchpointsNeeded} touchpoints before trust is usually earned.`,
          },
        ]}
      >
        <section className="space-y-5">
          <article className="rounded-lg border border-border bg-card p-6">
            <Badge variant="secondary" className="mb-3">Built for</Badge>
            <h2 className="text-foreground">A {audienceModel.model} solution for the business operator, not a consumer tool.</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{positioning.audience}</p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-md border border-border bg-background p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Who buys it</p>
                <p className="mt-2 text-sm leading-relaxed text-foreground">{audienceModel.buyer}</p>
              </div>
              <div className="rounded-md border border-border bg-background p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Who uses it internally</p>
                <p className="mt-2 text-sm leading-relaxed text-foreground">{audienceModel.internalUsers}</p>
              </div>
              <div className="rounded-md border border-border bg-background p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Who experiences it</p>
                <p className="mt-2 text-sm leading-relaxed text-foreground">{audienceModel.downstreamAudience}</p>
              </div>
            </div>
            <div className="mt-5 rounded-md border border-border bg-background p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Boundary</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{audienceModel.notFor}</p>
            </div>
            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="font-semibold text-foreground">Business size</dt>
                <dd className="text-muted-foreground">{intel.icp.companySize}</dd>
              </div>
              <div>
                <dt className="font-semibold text-foreground">Buying style</dt>
                <dd className="text-muted-foreground">{intel.icp.buyingAuthority.replace(/-/g, " ")}</dd>
              </div>
              <div>
                <dt className="font-semibold text-foreground">Budget rhythm</dt>
                <dd className="text-muted-foreground">{intel.icp.budgetCycle}</dd>
              </div>
              <div>
                <dt className="font-semibold text-foreground">Current tools</dt>
                <dd className="text-muted-foreground">{intel.icp.techStack.slice(0, 3).join(", ")}</dd>
              </div>
            </dl>
          </article>
        </section>

        <section>
          <article className="rounded-lg border border-border bg-card p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Market truth</p>
            <h2 className="text-foreground">{positioning.marketTruth}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{positioning.primaryPain}</p>
            <div className="mt-5 rounded-md border border-border bg-background p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Promised result</p>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-foreground">{positioning.promisedResult}</p>
            </div>
          </article>
        </section>

        <section>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pain this page must name</p>
          <h2 className="text-foreground">The expensive friction {niche.label.toLowerCase()} teams already recognize</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {positioning.painPoints.map((point) => (
              <article key={point} className="rounded-lg border border-border bg-card p-5">
                <p className="m-0 text-sm leading-relaxed text-muted-foreground">{point}</p>
              </article>
            ))}
          </div>
        </section>

        <section>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Expected outcomes</p>
          <h2 className="text-foreground">What the buyer should receive after onboarding</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {positioning.outcomes.map((outcome) => (
              <article key={outcome.label} className="rounded-lg border border-border bg-card p-5">
                <h3 className="m-0 text-base font-bold text-foreground">{outcome.label}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{outcome.result}</p>
                <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Delivered as</p>
                <p className="mt-1 text-sm leading-relaxed text-foreground">{outcome.deliveredAs}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">What gets installed</p>
          <h2 className="text-foreground">A finished operating workflow, not a tool to figure out</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {positioning.deliverables.map((deliverable) => (
              <div key={deliverable} className="rounded-md border border-border bg-background p-4 text-sm leading-relaxed text-muted-foreground">
                {deliverable}
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild><Link href={`/assess/${niche.slug}`}>{primaryCta}</Link></Button>
            <Button asChild variant="outline"><Link href={`/packages?industry=${niche.slug}`}>See matching packages</Link></Button>
          </div>
        </section>

        <section>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Service blueprint</p>
          <h2 className="text-foreground">How the {niche.label.toLowerCase()} journey should feel</h2>
          <div className="grid gap-4 md:grid-cols-4">
            {positioning.journey.map((step, index) => (
              <article key={step.label} className="rounded-lg border border-border bg-card p-5">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-base font-bold text-foreground">{step.label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.customerReality}</p>
                <p className="mt-3 text-sm leading-relaxed text-foreground">{step.systemResponse}</p>
              </article>
            ))}
          </div>
        </section>

        <section>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Buying triggers</p>
          <h2 className="text-foreground">Moments when {niche.label.toLowerCase()} buyers stop browsing and act</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {intel.buyingTriggers.slice(0, 4).map((trigger) => (
              <article key={trigger.event} className="rounded-lg border border-border bg-card p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={trigger.urgency === "immediate" ? "destructive" : "outline"}>{trigger.urgency.replace(/-/g, " ")}</Badge>
                  <h3 className="m-0 text-base font-bold text-foreground">{trigger.event}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{trigger.searchBehavior}</p>
                <p className="mt-2 text-sm italic leading-relaxed text-muted-foreground">{trigger.emotionalState}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-lg border border-border bg-card p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Objections to answer directly</p>
            <h2 className="text-foreground">What the buyer is really worried about</h2>
            <div className="mt-4 space-y-3">
              {intel.objections.slice(0, 4).map((obj) => (
                <details key={obj.objection} className="rounded-md border border-border bg-background p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-foreground">&ldquo;{obj.objection}&rdquo;</summary>
                  <div className="mt-3 border-l-2 border-primary pl-4">
                    <p className="text-sm leading-relaxed text-muted-foreground"><strong className="text-foreground">Real concern:</strong> {obj.underlyingFear}</p>
                    <p className="text-sm leading-relaxed text-muted-foreground"><strong className="text-foreground">Response:</strong> {obj.evidenceBasedResponse}</p>
                  </div>
                </details>
              ))}
            </div>
          </article>

          <article className="rounded-lg border border-border bg-card p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Proof required</p>
            <h2 className="text-foreground">Claims have to earn trust here.</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A {niche.label.toLowerCase()} buyer should never see vague promises. The page, package, and report should prove the baseline,
              show the installed workflow, and track the outcome metric the offer promised.
            </p>
            <div className="mt-4 grid gap-3">
              {intel.trustSignals.primary.slice(0, 4).map((signal) => (
                <div key={signal} className="rounded-md border border-border bg-background p-3 text-sm text-muted-foreground">
                  {signal}
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Decision journey</p>
          <h2 className="text-foreground">{niche.label} buyers need {intel.decisionJourney.touchpointsNeeded} trust-building touchpoints over about {intel.decisionJourney.totalDays} days.</h2>
          <div className="grid gap-4 md:grid-cols-4">
            {intel.decisionJourney.stages.map((stage, index) => (
              <article key={stage.name} className="rounded-md border border-border bg-background p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Step {index + 1}</p>
                <h3 className="mt-2 text-base font-bold text-foreground">{stage.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{stage.primaryAction}</p>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Risk: {stage.dropOffRisk}</p>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-foreground">Explore more for {niche.label}</h2>
          <div className="grid gap-5 md:grid-cols-3">
            <article className="rounded-lg border border-border bg-card p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Diagnostic</p>
              <h3 className="text-foreground">Score the current leak</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Use the assessment to identify the first workflow that should be installed for this industry.
              </p>
              <Button asChild><Link href={`/assess/${niche.slug}`}>Take the assessment</Link></Button>
            </article>

            <article className="rounded-lg border border-border bg-card p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Resource</p>
              <h3 className="text-foreground">Read the complete guide</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Review benchmarks, buying triggers, and workflow ideas for {niche.label.toLowerCase()} operators.
              </p>
              <Button asChild variant="outline"><Link href={`/resources/${niche.slug}`}>Read the guide</Link></Button>
            </article>

            <article className="rounded-lg border border-border bg-card p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Directory</p>
              <h3 className="text-foreground">See market coverage</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Open the directory path when this industry is sold as a local, regional, or national demand channel.
              </p>
              <Button asChild variant="outline"><Link href={`/directory/${niche.slug}`}>Open directory</Link></Button>
            </article>
          </div>
        </section>

        <AdaptiveLeadCaptureForm
          source="contact_form"
          family={primaryFamily}
          niche={niche.slug}
          service={tenantConfig.defaultService}
          pagePath={`/industries/${niche.slug}`}
          returning={asBoolean(query.returning)}
          profile={profile}
        />
      </ExperienceScaffold>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: `${niche.label} Growth System`,
            description: positioning.summary,
            provider: {
              "@type": "Organization",
              name: tenantConfig.brandName,
              url: tenantConfig.siteUrl,
            },
            areaServed: "US",
            serviceType: "Outcome-based automation and lead operations",
          }),
        }}
      />
    </div>
  );
}

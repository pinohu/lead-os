import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { AdaptiveLeadCaptureForm } from "@/components/AdaptiveLeadCaptureForm";
import { ExperienceScaffold } from "@/components/ExperienceScaffold";
import { getNiche } from "@/lib/catalog";
import { resolveExperienceProfile } from "@/lib/experience";
import { tenantConfig } from "@/lib/tenant";
import { buildOgImageUrl } from "@/lib/og-url";

/* ------------------------------------------------------------------ */
/*  Persona Blueprints                                                 */
/* ------------------------------------------------------------------ */

type PersonaBlueprint = {
  label: string;
  tagline: string;
  painPoints: string[];
  idealServices: string[];
  recommendedNiche: string;
  ctaText: string;
  approachSteps: string[];
};

const PERSONA_BLUEPRINTS: Record<string, PersonaBlueprint> = {
  agencies: {
    label: "Digital Marketing Agencies",
    tagline:
      "Stop managing 8 tools. Run all your clients from one dashboard.",
    painPoints: [
      "Client onboarding takes days instead of minutes",
      "Reporting across platforms eats your team alive every month",
      "No unified view of pipeline health across all client accounts",
      "Scaling past 20 clients means hiring, not automating",
      "White-label limitations force awkward brand compromises",
    ],
    idealServices: [
      "client-portal",
      "process-automation",
      "managed-services",
    ],
    recommendedNiche: "general",
    ctaText: "Book a Strategy Session",
    approachSteps: [
      "Consolidate client accounts into a single command center",
      "Automate reporting, lead routing, and follow-up sequences",
      "Deploy white-label funnels your clients think you built from scratch",
      "Scale to 50+ accounts without adding headcount",
    ],
  },
  "saas-founders": {
    label: "SaaS Founders",
    tagline:
      "Convert free trials into paying customers without adding sales reps.",
    painPoints: [
      "Trial-to-paid conversion hovers below industry benchmarks",
      "Onboarding drop-off kills activation before users see value",
      "Churn outpaces new revenue every quarter",
      "Product-led growth sounds great but nobody owns the funnel",
      "Attribution across touchpoints is a spreadsheet nightmare",
    ],
    idealServices: [
      "onboarding-automation",
      "churn-prevention",
      "product-led-growth",
    ],
    recommendedNiche: "tech",
    ctaText: "See Your Growth Roadmap",
    approachSteps: [
      "Map trial activation milestones to automated nudge sequences",
      "Score users by engagement depth and trigger human outreach at the right moment",
      "Build retention loops that turn power users into advocates",
      "Attribute every dollar to a source so you double down on what works",
    ],
  },
  "lead-gen": {
    label: "Lead Generation Professionals",
    tagline:
      "Deliver higher-quality leads to your clients and prove the ROI in real time.",
    painPoints: [
      "Clients question lead quality because there is no closed-loop reporting",
      "Manual qualification wastes hours every week on dead-end prospects",
      "Multi-channel campaigns are impossible to track in one place",
      "Scaling a new vertical means building everything from scratch",
      "Speed-to-lead gaps let competitors steal deals you generated",
    ],
    idealServices: [
      "lead-scoring",
      "multi-channel-capture",
      "performance-dashboards",
    ],
    recommendedNiche: "general",
    ctaText: "Get Your Lead Gen Audit",
    approachSteps: [
      "Deploy AI-scored intake forms that route only qualified leads",
      "Unify capture across web, social, phone, and chat into one pipeline",
      "Give clients a live dashboard that proves your value without a monthly deck",
      "Clone winning funnels into new verticals in under an hour",
    ],
  },
  consultants: {
    label: "Independent Consultants",
    tagline:
      "Fill your calendar with qualified prospects without cold outreach.",
    painPoints: [
      "Feast-or-famine pipeline makes revenue unpredictable",
      "Spending more time marketing than delivering billable work",
      "No system to nurture prospects who are not ready to buy today",
      "Proposals go into a black hole with zero follow-up automation",
      "Referrals dry up between engagements leaving dangerous gaps",
    ],
    idealServices: [
      "authority-funnel",
      "booking-automation",
      "nurture-sequences",
    ],
    recommendedNiche: "coaching",
    ctaText: "Build Your Pipeline",
    approachSteps: [
      "Publish authority content that attracts inbound inquiries on autopilot",
      "Qualify prospects before they hit your calendar so every call counts",
      "Automate proposal follow-up so nothing falls through the cracks",
      "Build a nurture engine that keeps cold leads warm until they are ready",
    ],
  },
  franchises: {
    label: "Franchise Operators",
    tagline:
      "Give every location the same growth engine without the same overhead.",
    painPoints: [
      "Inconsistent lead handling across locations damages the brand",
      "Corporate marketing spend is impossible to attribute at the unit level",
      "Franchisees resist new tools because onboarding is painful",
      "Compliance and brand guidelines are enforced manually if at all",
      "Top-performing locations hoard best practices instead of sharing them",
    ],
    idealServices: [
      "multi-location-routing",
      "brand-compliance",
      "franchisee-dashboards",
    ],
    recommendedNiche: "franchise",
    ctaText: "Schedule a Demo",
    approachSteps: [
      "Roll out a unified lead routing system that respects territory rules",
      "Enforce brand-compliant funnels while letting locations personalize within guardrails",
      "Give franchisees a simple dashboard that shows their pipeline without IT support",
      "Surface cross-location benchmarks so every unit learns from the best",
    ],
  },
};

/* ------------------------------------------------------------------ */
/*  Static Generation + Metadata                                       */
/* ------------------------------------------------------------------ */

type Props = {
  params: Promise<{ persona: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function asString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function asBoolean(value: string | string[] | undefined) {
  const normalized = asString(value)?.toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

export function generateStaticParams() {
  return Object.keys(PERSONA_BLUEPRINTS).map((persona) => ({ persona }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { persona } = await params;
  const bp = PERSONA_BLUEPRINTS[persona];
  if (!bp) return {};
  return {
    title: `Lead OS for ${bp.label} | Lead OS`,
    description: `${bp.tagline} Discover growth systems designed specifically for ${bp.label.toLowerCase()}.`,
    openGraph: {
      title: `Lead OS for ${bp.label}`,
      description: bp.tagline,
      images: [{ url: buildOgImageUrl(bp.label, bp.tagline, bp.recommendedNiche), width: 1200, height: 630 }],
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default async function PersonaPage({ params, searchParams }: Props) {
  const { persona } = await params;
  const query = await searchParams;
  const bp = PERSONA_BLUEPRINTS[persona];

  if (!bp) notFound();

  const niche = getNiche(bp.recommendedNiche);

  const headerStore = await headers();
  const profile = resolveExperienceProfile({
    family: "lead-magnet",
    niche,
    supportEmail: tenantConfig.supportEmail,
    source: asString(query.source) ?? "persona-page",
    intent: "discover",
    returning: asBoolean(query.returning),
    milestone: asString(query.milestone),
    preferredMode: asString(query.mode) ?? "form-first",
    score: Number(asString(query.score) ?? 50),
    userAgent: headerStore.get("user-agent") ?? undefined,
    referrer: headerStore.get("referer") ?? undefined,
  });

  return (
    <div>
      <ExperienceScaffold
        niche={bp.recommendedNiche}
        eyebrow={`Built for ${bp.label}`}
        title={bp.tagline}
        summary={`Lead OS gives ${bp.label.toLowerCase()} a turnkey growth system that replaces patchwork tools with one platform tuned to the way you sell.`}
        profile={profile}
        metrics={[
          {
            label: "Persona",
            value: bp.label,
            detail: "This experience is tuned specifically for your role.",
          },
          {
            label: "Recommended vertical",
            value: niche.label,
            detail: `Based on typical ${bp.label.toLowerCase()} client profiles.`,
          },
          {
            label: "Core services",
            value: `${bp.idealServices.length} pillars`,
            detail: bp.idealServices.join(", ").replace(/-/g, " "),
          },
        ]}
      >
        {/* ---------- Built for You ---------- */}
        <section>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Built for you</p>
          <h2 className="text-foreground">Core capabilities for {bp.label}</h2>
          <ul className="space-y-2">
            {bp.idealServices.map((svc) => (
              <li key={svc}>{svc.replace(/-/g, " ")}</li>
            ))}
          </ul>
        </section>

        {/* ---------- Pain Points ---------- */}
        <section>
          <h2 className="text-foreground">Problems you are probably solving manually</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {bp.painPoints.map((point, i) => (
              <article key={i} className="rounded-xl border border-border bg-card p-6">
                <p>{point}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ---------- Recommended Approach ---------- */}
        <section className="rounded-xl border border-border bg-card p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Your growth path</p>
          <h2 className="text-foreground">How {bp.label} succeed with Lead OS</h2>
          <ol className="journey-rail">
            {bp.approachSteps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-3">
            <Link href={`/assess/${niche.slug}`} className="primary">
              {bp.ctaText}
            </Link>
            <Link href={`/industries/${niche.slug}`} className="secondary">
              Explore {niche.label} Solutions
            </Link>
          </div>
        </section>

        {/* ---------- Cross-Links ---------- */}
        <section className="rounded-xl border border-border bg-card p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Go deeper</p>
          <h2 className="text-foreground">Resources for {bp.label}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <article className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-foreground">Industry Page</h3>
              <p>
                Explore solutions built for{" "}
                {niche.label.toLowerCase()} businesses.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/industries/${bp.recommendedNiche}`}
                  className="secondary"
                >
                  See the industry
                </Link>
              </div>
            </article>
            <article className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-foreground">Growth Assessment</h3>
              <p>
                Score your readiness in two minutes and get an action plan.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/assess/${bp.recommendedNiche}`}
                  className="secondary"
                >
                  Take the assessment
                </Link>
              </div>
            </article>
            <article className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-foreground">Resource Guide</h3>
              <p>
                Read the complete {niche.label.toLowerCase()} playbook
                with pain points, solutions, and FAQs.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/resources/${bp.recommendedNiche}`}
                  className="secondary"
                >
                  Read the guide
                </Link>
              </div>
            </article>
          </div>
        </section>

        {/* ---------- Lead Capture ---------- */}
        <AdaptiveLeadCaptureForm
          source="contact_form"
          family="lead-magnet"
          niche={niche.slug}
          service={tenantConfig.defaultService}
          pagePath={`/for/${persona}`}
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
            name: `Lead OS for ${bp.label}`,
            description: bp.tagline,
            provider: {
              "@type": "Organization",
              name: tenantConfig.brandName,
              url: tenantConfig.siteUrl,
            },
            audience: {
              "@type": "Audience",
              audienceType: bp.label,
            },
          }),
        }}
      />
    </div>
  );
}

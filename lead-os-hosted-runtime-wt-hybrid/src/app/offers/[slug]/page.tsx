import { headers } from "next/headers";
import type { Metadata } from "next";
import { AdaptiveLeadCaptureForm } from "@/components/AdaptiveLeadCaptureForm";
import { ExperienceScaffold } from "@/components/ExperienceScaffold";
import { getNiche } from "@/lib/catalog";
import { resolveExperienceProfile } from "@/lib/experience";
import { tenantConfig } from "@/lib/tenant";
import { OFFER_TEMPLATES, type Niche as OfferNiche } from "@/lib/offer-engine";
import { buildOgImageUrl } from "@/lib/og-url";
import { getCustomerIntelligenceOrDefault } from "@/lib/customer-intelligence";
import { nicheCatalog } from "@/lib/catalog";

type OfferPageProps = {
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

export function generateStaticParams() {
  return Object.keys(nicheCatalog).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: OfferPageProps): Promise<Metadata> {
  const { slug } = await params;
  const niche = getNiche(slug);
  return {
    title: `${niche.label} Offer Path | Lead OS`,
    description: `${niche.summary} Offer path that can become the capture page, qualification questions, routing, and follow-up for a launched client solution.`,
    openGraph: {
      title: `${niche.label} Offer | Lead OS`,
      description: niche.summary,
      images: [{ url: buildOgImageUrl(`${niche.label} Offer`, niche.summary, niche.slug), width: 1200, height: 630 }],
    },
  };
}

export default async function OfferPage({ params, searchParams }: OfferPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const niche = getNiche(slug);
  const headerStore = await headers();
  const profile = resolveExperienceProfile({
    family: "checkout",
    niche,
    supportEmail: tenantConfig.supportEmail,
    source: asString(query.source) ?? "checkout",
    intent: "solve-now",
    returning: asBoolean(query.returning),
    milestone: asString(query.milestone),
    preferredMode: asString(query.mode) ?? "form-first",
    score: Number(asString(query.score) ?? 90),
    userAgent: headerStore.get("user-agent") ?? undefined,
    referrer: headerStore.get("referer") ?? undefined,
  });

  return (
    <div>
    <ExperienceScaffold
      eyebrow="Offer path"
      title={`${niche.label} offer path for a launched client solution`}
      summary={`${niche.summary} This page defines the promise a client business can make to its own audience, then maps that promise into capture questions, routing rules, and follow-up.`}
      profile={profile}
      niche={niche.slug}
      metrics={[
        {
          label: "Billing integrations",
          value: "Credential-ready",
          detail: "Stripe and cart webhooks activate when the business owner provides the required account access.",
        },
        {
          label: "Recovery ladder",
          value: "Configurable",
          detail: "Design abandonment sequences in nurture workflows. Timing depends on your connected automation setup.",
        },
        {
          label: "Post-purchase",
          value: "Solution-ready",
          detail: "Route won deals into CRM and onboarding playbooks when the required CRM or webhook access is configured.",
        },
      ]}
    >
      <section className="grid md:grid-cols-2 gap-6">
        <article className="rounded-lg border border-border bg-card p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Why this offer path is clear</p>
            <h2 className="text-foreground">One promise, one action, one next step</h2>
          <ul className="space-y-2">
            <li>Primary CTA stays singular so the client business's audience knows exactly what to do.</li>
            <li>Fallback follow-up keeps slower deciders from disappearing.</li>
            <li>Proof and risk-reduction sit next to the action instead of below the fold.</li>
          </ul>
        </article>
        <article className="rounded-lg border border-border bg-card p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">What happens after the decision</p>
          <h2 className="text-foreground">No dead ends after purchase or hesitation</h2>
          <ul className="space-y-2">
            <li>Checkout success can trigger solution onboarding and client delivery hub creation.</li>
            <li>Hesitation can trigger recovery, offer clarification, and second-touch re-entry.</li>
            <li>Returning visitors get a lighter path instead of repeating the same pitch.</li>
          </ul>
        </article>
      </section>

      {/* ---------- Offer Template (pricing psychology) ---------- */}
      {(() => {
        const offerTemplate = OFFER_TEMPLATES[niche.slug as OfferNiche] ?? null;
        if (!offerTemplate) return null;
        return (
          <section>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Why this offer works for {niche.label}</p>
            <h2 className="text-foreground">Niche-specific offer blueprint</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <article className="rounded-lg border border-border bg-card p-6">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Services included</p>
                <ul className="space-y-2">
                  {offerTemplate.services.map((svc) => (
                    <li key={svc}>{svc}</li>
                  ))}
                </ul>
              </article>
              <article className="rounded-lg border border-border bg-card p-6">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pain points addressed</p>
                <ul className="space-y-2">
                  {offerTemplate.language.painPoints.map((pp) => (
                    <li key={pp}>{pp}</li>
                  ))}
                </ul>
              </article>
              <article className="rounded-lg border border-border bg-card p-6">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Desired outcomes</p>
                <ul className="space-y-2">
                  {offerTemplate.language.desiredOutcomes.map((outcome) => (
                    <li key={outcome}>{outcome}</li>
                  ))}
                </ul>
              </article>
              <article className="rounded-lg border border-border bg-card p-6">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Acceptance promise to review</p>
                <p className="text-sm leading-relaxed">
                  <strong>{offerTemplate.guaranteeType.replace(/-/g, " ")} guarantee</strong>{" "}
                  for {offerTemplate.guaranteeDays} days after launch.
                </p>
                <p className="text-muted-foreground text-sm mt-2">
                  Publish only verified proof here: real baseline, delivery evidence, client-approved quote, and the
                  measured outcome this offer improves.
                </p>
              </article>
            </div>
          </section>
        );
      })()}

      <section>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Proof required before this goes public</p>
        <h2 className="text-foreground">Trust assets this offer should collect</h2>
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["Baseline", "What happens before the system launches: response time, missed demand, manual hours, cost, or conversion rate."],
            ["Delivery evidence", "The live URLs, forms, scripts, reports, automations, and acceptance checks created from the onboarding form."],
            ["Measured result", "The outcome the buyer cares about: booked calls, recovered revenue, finished assets, hours saved, or risk reduced."],
            ["Approved quote", "A client-approved testimonial, case note, or internal operator quote after results are observed."],
          ].map(([title, detail]) => (
            <article key={title} className="rounded-lg border border-border bg-card p-5">
              <p className="font-semibold text-foreground">{title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{detail}</p>
            </article>
          ))}
        </div>
      </section>

      {(() => {
        const intel = getCustomerIntelligenceOrDefault(niche.slug);
        return (
          <section>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Addressing your concerns</p>
            <div className="flex flex-col gap-3">
              {intel.objections.map((obj) => (
                <article key={obj.objection} className="rounded-lg border border-border bg-card p-6">
                  <p className="m-0 mb-1.5 font-bold text-sm">&ldquo;{obj.objection}&rdquo;</p>
                  <p className="m-0 text-sm">{obj.evidenceBasedResponse}</p>
                </article>
              ))}
            </div>
            <div className="rounded-lg border border-border bg-card p-6 mt-4 bg-accent/10">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Acceptance angle to review</p>
                <p className="m-0 text-sm font-semibold">
                {intel.conversionPsychology.guaranteePreference === "money-back" ? "Consider a money-back or credit policy only if the client can operationally honor it." :
                 intel.conversionPsychology.guaranteePreference === "results-based" ? "Consider a performance-based promise only for outcomes the client can measure and influence." :
                 intel.conversionPsychology.guaranteePreference === "trial-period" ? "Consider a trial period when fulfillment cost and account access risk are low." :
                 "Use a satisfaction or acceptance-check promise only after legal and delivery review."}
                </p>
            </div>
          </section>
        );
      })()}

      <AdaptiveLeadCaptureForm
        source="checkout"
        family="checkout"
        niche={niche.slug}
        service={tenantConfig.defaultService}
        pagePath={`/offers/${niche.slug}`}
        returning={asBoolean(query.returning)}
        profile={profile}
      />
    </ExperienceScaffold>
    </div>
  );
}

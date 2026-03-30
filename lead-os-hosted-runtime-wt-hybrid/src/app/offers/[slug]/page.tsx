import { headers } from "next/headers";
import type { Metadata } from "next";
import { AdaptiveLeadCaptureForm } from "@/components/AdaptiveLeadCaptureForm";
import { ExperienceScaffold } from "@/components/ExperienceScaffold";
import { getNiche } from "@/lib/catalog";
import { resolveExperienceProfile } from "@/lib/experience";
import { tenantConfig } from "@/lib/tenant";
import { OFFER_TEMPLATES, type Niche as OfferNiche } from "@/lib/offer-engine";
import { NICHE_TESTIMONIALS } from "@/lib/niche-testimonials";
import { buildOgImageUrl } from "@/lib/og-url";

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

export async function generateMetadata({ params }: OfferPageProps): Promise<Metadata> {
  const { slug } = await params;
  const niche = getNiche(slug);
  return {
    title: `${niche.label} Offer | Lead OS`,
    description: `${niche.summary} High-intent offer path with built-in recovery and proof.`,
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
    <ExperienceScaffold
      eyebrow="Offer path"
      title={`${niche.label} offer path built for high-intent visitors`}
      summary={`${niche.summary} This page reduces anxiety around the offer by keeping the proof close, the path short, and the recovery ladder ready if someone hesitates.`}
      profile={profile}
      niche={niche.slug}
      metrics={[
        { label: "Primary engine", value: "ThriveCart", detail: "Checkout and recovery are already connected." },
        { label: "Recovery ladder", value: "1h / 24h / 48h", detail: "Abandonment recovery sequence is prewired." },
        { label: "Post-purchase", value: "Onboarding ready", detail: "Portal invite, activation, and continuity can begin immediately." },
      ]}
    >
      <section className="grid two">
        <article className="panel">
          <p className="eyebrow">Why this offer page feels lighter</p>
          <h2>One ask, one fallback, one reassurance</h2>
          <ul className="check-list">
            <li>Primary CTA stays singular so purchase intent does not fragment.</li>
            <li>Support CTA stays human and non-threatening for slower deciders.</li>
            <li>Proof and risk-reduction sit next to the ask instead of below the fold.</li>
          </ul>
        </article>
        <article className="panel">
          <p className="eyebrow">What happens after the decision</p>
          <h2>No dead ends after purchase or hesitation</h2>
          <ul className="check-list">
            <li>Checkout success triggers onboarding, portal invite, and activation logic.</li>
            <li>Hesitation triggers recovery, coupon rescue, and second-touch re-entry.</li>
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
            <p className="eyebrow">Why this offer works for {niche.label}</p>
            <h2>Niche-specific offer blueprint</h2>
            <div className="grid two">
              <article className="panel">
                <p className="eyebrow">Services included</p>
                <ul className="check-list">
                  {offerTemplate.services.map((svc) => (
                    <li key={svc}>{svc}</li>
                  ))}
                </ul>
              </article>
              <article className="panel">
                <p className="eyebrow">Pain points addressed</p>
                <ul className="check-list">
                  {offerTemplate.language.painPoints.map((pp) => (
                    <li key={pp}>{pp}</li>
                  ))}
                </ul>
              </article>
              <article className="panel">
                <p className="eyebrow">Desired outcomes</p>
                <ul className="check-list">
                  {offerTemplate.language.desiredOutcomes.map((outcome) => (
                    <li key={outcome}>{outcome}</li>
                  ))}
                </ul>
              </article>
              <article className="panel">
                <p className="eyebrow">Guarantee &amp; social proof</p>
                <p style={{ fontSize: "0.92rem", lineHeight: 1.6 }}>
                  <strong>{offerTemplate.guaranteeType.replace(/-/g, " ")} guarantee</strong>{" "}
                  &mdash; {offerTemplate.guaranteeDays} days
                </p>
                <p className="muted" style={{ fontSize: "0.84rem", marginTop: 8 }}>
                  {offerTemplate.language.socialProofTemplate
                    .replace("{{count}}", "100+")
                    .replace("{{rating}}", "4.8")}
                </p>
              </article>
            </div>
          </section>
        );
      })()}

      {/* ---------- Testimonials ---------- */}
      {(() => {
        const testimonials = NICHE_TESTIMONIALS[niche.slug] ?? NICHE_TESTIMONIALS.general ?? [];
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
  );
}

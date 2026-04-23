import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AdaptiveLeadCaptureForm } from "@/components/AdaptiveLeadCaptureForm";
import { ExperienceScaffold } from "@/components/ExperienceScaffold";
import { getNiche, nicheCatalog } from "@/lib/catalog";
import { resolveExperienceProfile } from "@/lib/experience";
import { tenantConfig } from "@/lib/tenant";
import { buildOgImageUrl } from "@/lib/og-url";

type AssessmentPageProps = {
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

export async function generateMetadata({ params }: AssessmentPageProps): Promise<Metadata> {
  const { slug } = await params;
  const niche = getNiche(slug);
  return {
    title: `${niche.assessmentTitle} | CX React`,
    description: `${niche.summary} Take a 2-minute diagnostic and get a tailored action plan.`,
    openGraph: {
      title: niche.assessmentTitle,
      description: niche.summary,
      images: [{ url: buildOgImageUrl(niche.assessmentTitle, niche.summary, niche.slug), width: 1200, height: 630 }],
    },
  };
}

export default async function AssessmentPage({ params, searchParams }: AssessmentPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const niche = getNiche(slug);

  if (!niche) notFound();

  const headerStore = await headers();
  const profile = resolveExperienceProfile({
    family: "qualification",
    niche,
    supportEmail: tenantConfig.supportEmail,
    source: asString(query.source) ?? "assessment",
    intent: asString(query.intent) === "solve-now" ? "solve-now" : "compare",
    returning: asBoolean(query.returning),
    milestone: asString(query.milestone),
    preferredMode: asString(query.mode) ?? "booking-first",
    score: Number(asString(query.score) ?? 75),
    userAgent: headerStore.get("user-agent") ?? undefined,
    referrer: headerStore.get("referer") ?? undefined,
  });

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://leadgen-os.com";
  const assessJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${baseUrl}/assess/${niche.slug}#webpage`,
    url: `${baseUrl}/assess/${niche.slug}`,
    name: niche.assessmentTitle,
    description: niche.summary,
    isPartOf: { "@id": `${baseUrl}/#website` },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(assessJsonLd) }} />
    <div>
    <ExperienceScaffold
      eyebrow="Hosted assessment"
      title={niche.assessmentTitle}
      summary={`${niche.summary} This assessment path is now designed to feel like guided diagnosis instead of a long form. Each answer should earn the next question and move the visitor closer to a credible next step.`}
      profile={profile}
      niche={niche.slug}
      metrics={[
        { label: "Assessment style", value: "Progressive", detail: "Only the next useful question should appear." },
        { label: "Return logic", value: "Milestone-aware", detail: "Visit two and three get lighter, smarter asks." },
        { label: "Output", value: "Tailored next action", detail: "Booking, nurture, or authority path based on fit." },
      ]}
    >
      <section className="grid md:grid-cols-2 gap-6">
        <article className="rounded-xl border border-border bg-card p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Questioning principle</p>
          <h2 className="text-foreground">Never ask before the value is clear</h2>
          <ul className="space-y-2">
            <li>Each question needs a clear reason connected to the visitor&apos;s outcome.</li>
            <li>Progress stays visible so effort never feels ambiguous.</li>
            <li>Back navigation stays light so visitors keep control of the path.</li>
          </ul>
        </article>
        <article className="rounded-xl border border-border bg-card p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Result design</p>
          <h2 className="text-foreground">Diagnosis first, pressure second</h2>
          <ul className="space-y-2">
            <li>The output frames what matters, not internal funnel jargon.</li>
            <li>Hot leads shorten into booking or proposal quickly.</li>
            <li>Unready leads keep a lower-friction second-touch return path.</li>
          </ul>
        </article>
      </section>

      <AdaptiveLeadCaptureForm
        source="assessment"
        family="qualification"
        niche={niche.slug}
        service={tenantConfig.defaultService}
        pagePath={`/assess/${niche.slug}`}
        returning={asBoolean(query.returning)}
        profile={profile}
      />
    </ExperienceScaffold>
    </div>
    </>
  );
}

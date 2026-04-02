import { headers } from "next/headers";
import type { Metadata } from "next";
import { AdaptiveLeadCaptureForm } from "@/components/AdaptiveLeadCaptureForm";
import { ExperienceScaffold } from "@/components/ExperienceScaffold";
import { getNiche } from "@/lib/catalog";
import { resolveExperienceProfile } from "@/lib/experience";
import { tenantConfig } from "@/lib/tenant";
import { CALCULATOR_PRESETS } from "@/lib/calculator-presets";
import { buildOgImageUrl } from "@/lib/og-url";

export const metadata: Metadata = {
  title: "ROI Calculator | Lead OS",
  description: "Estimate the upside of automating your lead capture, scoring, and nurture. Industry-specific calculators for 16 verticals.",
  openGraph: {
    title: "ROI Calculator | Lead OS",
    description: "Estimate the upside of automating your lead capture, scoring, and nurture.",
    images: [{ url: buildOgImageUrl("ROI Calculator", "Estimate the upside of automating your lead pipeline", "general"), width: 1200, height: 630 }],
  },
};

type CalculatorPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function asString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function asBoolean(value: string | string[] | undefined) {
  const normalized = asString(value)?.toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

export default async function CalculatorPage({ searchParams }: CalculatorPageProps) {
  const query = await searchParams;
  const niche = getNiche(asString(query.niche));
  const headerStore = await headers();
  const profile = resolveExperienceProfile({
    family: asString(query.mode) === "chat-first" ? "chat" : "lead-magnet",
    niche,
    supportEmail: tenantConfig.supportEmail,
    source: asString(query.source) ?? "roi_calculator",
    intent: asString(query.intent) === "solve-now" ? "solve-now" : "discover",
    returning: asBoolean(query.returning),
    milestone: asString(query.milestone),
    preferredMode: asString(query.mode) ?? "calculator-first",
    score: Number(asString(query.score) ?? 40),
    userAgent: headerStore.get("user-agent") ?? undefined,
    referrer: headerStore.get("referer") ?? undefined,
  });

  return (
    <div data-theme="light" className="[color-scheme:light]">
    <ExperienceScaffold
      niche={niche.slug}
      eyebrow="Hosted calculator path"
      title={`${niche.label} upside estimator`}
      summary={`This path uses quantified value to earn the next ask. For visitors who need proof before commitment, the calculator should create clarity, not just curiosity.`}
      profile={profile}
      metrics={[
        { label: "Bias", value: niche.calculatorBias, detail: "The main framing angle for this niche." },
        { label: "Primary mode", value: profile.mode, detail: "How the runtime is currently choosing to lead." },
        { label: "Return strategy", value: "Resume, do not restart", detail: "Visit two reduces effort and increases relevance." },
      ]}
    >
      <section className="grid md:grid-cols-2 gap-6">
        <article className="rounded-xl border border-border bg-card p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Calculator principle</p>
          <h2 className="text-foreground">Show the upside before asking for deeper commitment</h2>
          <ul className="space-y-2">
            <li>Visitors should understand what they are estimating in under ten seconds.</li>
            <li>The calculation should frame the cost of inaction without manipulative fear.</li>
            <li>The CTA should feel like the logical next step, not a bait-and-switch.</li>
          </ul>
        </article>
        <article className="rounded-xl border border-border bg-card p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Adaptive behavior</p>
          <h2 className="text-foreground">Calculator-first can still branch into chat or qualification</h2>
          <ul className="space-y-2">
            <li>If the visitor wants speed, we can shorten into a consult path.</li>
            <li>If the visitor wants reassurance, we can route into authority or webinar proof.</li>
            <li>If the visitor wants low friction, we can reopen the conversation in chat.</li>
          </ul>
        </article>
      </section>

      {(() => {
        const preset = CALCULATOR_PRESETS[niche.slug] ?? CALCULATOR_PRESETS.general;
        if (!preset) return null;
        return (
          <section className="rounded-xl border border-border bg-card p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Your {niche.label} ROI estimator</p>
            <h2 className="text-foreground">{preset.resultLabel}</h2>
            <p className="text-muted-foreground">{preset.formula}</p>
            <fieldset className="border-none p-0 m-0">
              <legend className="sr-only">ROI Calculator Inputs</legend>
              <div className="grid md:grid-cols-2 gap-6">
                {preset.inputs.map((input) => (
                  <div key={input.id} className="flex flex-col gap-1">
                    <label className="font-bold text-sm">{input.label}</label>
                    <input
                      type="number"
                      defaultValue={input.defaultValue}
                      min={input.min}
                      max={input.max}
                      step={input.step}
                      aria-label={input.label}
                      readOnly
                      aria-readonly="true"
                    />
                    <span className="text-muted-foreground text-xs">{input.helpText}</span>
                  </div>
                ))}
              </div>
            </fieldset>
            <div aria-live="polite" aria-atomic="true" role="status">
              <p className="mt-4 px-4 py-3 rounded-md bg-accent/10 font-bold text-sm">
                {preset.proofPoint}
              </p>
            </div>
          </section>
        );
      })()}

      <AdaptiveLeadCaptureForm
        source="roi_calculator"
        family={profile.family}
        niche={niche.slug}
        service={tenantConfig.defaultService}
        pagePath={`/calculator?niche=${niche.slug}`}
        returning={asBoolean(query.returning)}
        profile={profile}
      />
    </ExperienceScaffold>
    </div>
  );
}

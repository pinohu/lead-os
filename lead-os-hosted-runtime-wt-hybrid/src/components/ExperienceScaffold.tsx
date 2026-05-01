import Link from "next/link";
import type { ReactNode } from "react";
import type { ExperienceProfile } from "@/lib/experience";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

type ExperienceMetric = {
  label: string;
  value: string;
  detail?: string;
};

type ExperienceScaffoldProps = {
  eyebrow: string;
  title: string;
  summary: string;
  profile: ExperienceProfile;
  metrics: ExperienceMetric[];
  children: ReactNode;
  primaryActionHref?: string;
  primaryActionLabel?: string;
  secondaryActionHref?: string;
  secondaryActionLabel?: string;
  niche?: string;
  journeyTitle?: string;
  journeySummary?: string;
};

export function ExperienceScaffold({
  eyebrow,
  title,
  summary,
  profile,
  metrics,
  children,
  primaryActionHref,
  primaryActionLabel,
  secondaryActionHref,
  secondaryActionLabel,
  niche,
  journeyTitle,
  journeySummary,
}: ExperienceScaffoldProps) {
  return (
    <div data-niche={niche ?? undefined}>
      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="relative max-w-4xl mx-auto text-center px-4 pt-12 pb-8">
          <Badge variant="secondary" className="mb-4 text-sm px-4 py-1.5">
            {eyebrow}
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.1] mb-4">
            {title}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-3">
            {summary}
          </p>
          <p className="text-sm text-muted-foreground mb-6">{profile.trustPromise}</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button asChild size="lg" className="text-base px-8 h-11">
              <Link href={primaryActionHref ?? "#capture-form"}>
                {primaryActionLabel ?? profile.primaryActionLabel}
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base px-8 h-11">
              <a href={secondaryActionHref ?? profile.secondaryActionHref}>
                {secondaryActionLabel ?? profile.secondaryActionLabel}
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Growth Path Summary ───────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-5">
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="outline">{profile.mode.replace("-", " ")}</Badge>
              <Badge variant="outline">{profile.device}</Badge>
              <Badge variant="outline">{profile.family}</Badge>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-1">{journeyTitle ?? profile.heroTitle}</h2>
            <p className="text-sm text-muted-foreground mb-4">{journeySummary ?? profile.heroSummary}</p>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              {profile.progressLabel}
            </p>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
              {profile.progressSteps.map((step) => (
                <div key={step.label} className="rounded-lg border border-border p-3">
                  <p className="font-semibold text-sm text-foreground">{step.label}</p>
                  <p className="text-xs text-muted-foreground">{step.detail}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── Trust Signals ─────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 pb-4" aria-label="Trust signals">
        <div className="flex flex-wrap gap-3 justify-center">
          {profile.proofSignals.map((signal) => (
            <Badge key={signal} variant="secondary" className="text-sm px-3 py-1.5">
              {signal}
            </Badge>
          ))}
        </div>
      </section>

      {/* ── Metrics ───────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 py-6" aria-label="Snapshot">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {metrics.map((metric) => (
            <Card key={metric.label}>
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{metric.label}</p>
                <p className="text-xl font-bold text-foreground">{metric.value}</p>
                {metric.detail && <p className="text-xs text-muted-foreground mt-1">{metric.detail}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Insights ──────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">What makes this usable</p>
              <h2 className="text-lg font-bold text-foreground mb-3">Built to reduce friction before it appears</h2>
              <ul className="space-y-2">
                {profile.supportingSignals.map((signal) => (
                  <li key={signal} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    {signal}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Anxiety reduction</p>
              <h2 className="text-lg font-bold text-foreground mb-3">Clear next steps, easy exits, human fallback</h2>
              <p className="text-sm text-muted-foreground mb-3">{profile.anxietyReducer}</p>
              <div className="space-y-2">
                {profile.objectionBlocks.map((objection) => (
                  <p key={objection} className="text-sm text-foreground border-l-2 border-primary/30 pl-3">{objection}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Page Content ──────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">{children}</div>

      {/* ── Mobile Sticky CTA ─────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background/95 backdrop-blur border-t border-border px-4 py-3" role="complementary" aria-label="Sticky next action">
        <Button asChild size="lg" className="w-full h-11 text-base">
          <Link href={primaryActionHref ?? "#capture-form"}>
            {primaryActionLabel ?? profile.primaryActionLabel}
          </Link>
        </Button>
        <p className="text-xs text-center text-muted-foreground mt-1">{profile.returnOffer}</p>
      </div>
    </div>
  );
}

// ── Niche Trust Signals ───────────────────────────────────────────────
// Renders certifications, licensing context, and trust signals that the
// niche-content data already captures. Builds credibility for E-E-A-T
// signals (Google's Experience-Expertise-Authoritativeness-Trust).

import { ShieldCheck, BadgeCheck, Award } from "lucide-react";

interface Props {
  nicheLabel: string;
  certifications: string[];
  trustSignals: string[];
}

export default function NicheTrustSignals({
  nicheLabel,
  certifications,
  trustSignals,
}: Props) {
  if (certifications.length === 0 && trustSignals.length === 0) return null;

  return (
    <section
      id="trust"
      aria-labelledby="trust-heading"
      className="mx-auto max-w-4xl scroll-mt-28 px-4 py-12 sm:px-6"
    >
      <div className="mb-6 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
        <h2
          id="trust-heading"
          className="text-2xl font-bold tracking-tight"
        >
          What to look for in a {nicheLabel.toLowerCase()} pro
        </h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {certifications.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <BadgeCheck
                className="h-4 w-4 text-primary"
                aria-hidden="true"
              />
              <h3 className="text-sm font-semibold">
                Credentials &amp; licensing
              </h3>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {certifications.map((c) => (
                <li key={c} className="flex gap-2">
                  <span
                    aria-hidden="true"
                    className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                  />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {trustSignals.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" aria-hidden="true" />
              <h3 className="text-sm font-semibold">
                Trust signals that matter
              </h3>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {trustSignals.map((t) => (
                <li key={t} className="flex gap-2">
                  <span
                    aria-hidden="true"
                    className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                  />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

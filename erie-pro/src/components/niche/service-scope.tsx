// ── Niche Service Scope Section ───────────────────────────────────────
// Three persona-aware blocks side by side:
//   1. What providers do (commonServices) — for the researcher
//   2. Emergency-only services — for the urgent visitor
//   3. Seasonal context — for the planner ("when should I do this?")
//
// All three render existing niche-content data inline. Each is optional —
// blocks hide when their data array is empty.

import { CheckCircle2, AlertTriangle, Calendar } from "lucide-react";

interface Props {
  nicheLabel: string;
  commonServices: string[];
  emergencyServices: string[];
  seasonalTips: string[];
}

export default function NicheServiceScope({
  nicheLabel,
  commonServices,
  emergencyServices,
  seasonalTips,
}: Props) {
  const hasEmergency = emergencyServices.length > 0;
  const hasSeasonal = seasonalTips.length > 0;

  return (
    <section
      id="guide"
      aria-labelledby="services-heading"
      className="mx-auto max-w-4xl scroll-mt-28 px-4 py-12 sm:px-6"
    >
      <h2
        id="services-heading"
        className="mb-6 text-2xl font-bold tracking-tight"
      >
        What {nicheLabel.toLowerCase()} providers do
      </h2>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {commonServices.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <CheckCircle2
                className="h-4 w-4 text-emerald-600"
                aria-hidden="true"
              />
              <h3 className="text-sm font-semibold">Standard services</h3>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {commonServices.slice(0, 8).map((s) => (
                <li key={s} className="flex gap-2">
                  <span
                    aria-hidden="true"
                    className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"
                  />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {hasEmergency && (
          <div className="rounded-lg border-2 border-red-200 bg-red-50/50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle
                className="h-4 w-4 text-red-600"
                aria-hidden="true"
              />
              <h3 className="text-sm font-semibold text-red-900">
                Emergency / 24-hour
              </h3>
            </div>
            <ul className="space-y-2 text-sm text-red-900/80">
              {emergencyServices.slice(0, 6).map((s) => (
                <li key={s} className="flex gap-2">
                  <span
                    aria-hidden="true"
                    className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-red-500"
                  />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs font-medium text-red-700">
              For active emergencies, call (814) 200-0328
            </p>
          </div>
        )}

        {hasSeasonal && (
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Calendar
                className="h-4 w-4 text-blue-600"
                aria-hidden="true"
              />
              <h3 className="text-sm font-semibold">Seasonal timing</h3>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {seasonalTips.slice(0, 4).map((s) => (
                <li key={s} className="flex gap-2">
                  <span
                    aria-hidden="true"
                    className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500"
                  />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

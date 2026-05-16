// ── Niche Cost Transparency Section ───────────────────────────────────
// Renders the existing niche-content pricingRanges alongside the intake
// template's priceHint factors. Most local-services directories hide
// pricing; surfacing it on the main page is a substantial differentiation
// and SEO play (long-tail "X cost in Erie" queries).

import { DollarSign, Info } from "lucide-react";
import type { NichePricingRange } from "@/lib/niche-content";
import { getIntakeTemplate } from "@/lib/intake/templates";
import { cityConfig } from "@/lib/city-config";

interface Props {
  nicheSlug: string;
  nicheLabel: string;
  pricingRanges: NichePricingRange[];
}

export default function NicheCostSection({
  nicheSlug,
  nicheLabel,
  pricingRanges,
}: Props) {
  const intake = getIntakeTemplate(nicheSlug);
  const factors = intake.priceHint.factors;

  return (
    <section
      id="costs"
      aria-labelledby="cost-heading"
      className="mx-auto max-w-4xl scroll-mt-28 px-4 py-12 sm:px-6"
    >
      <div className="mb-6 flex items-center gap-2">
        <DollarSign className="h-5 w-5 text-primary" aria-hidden="true" />
        <h2
          id="cost-heading"
          className="text-2xl font-bold tracking-tight"
        >
          {nicheLabel} costs in {cityConfig.name}, {cityConfig.stateCode}
        </h2>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Real price ranges from completed jobs in the {cityConfig.name} area.
        Use these as starting points — your final quote depends on the
        factors below.
      </p>

      {pricingRanges.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <caption className="sr-only">
              {nicheLabel} pricing in {cityConfig.name}
            </caption>
            <thead className="bg-muted/50">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Service
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Typical range
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pricingRanges.map((row) => (
                <tr key={row.service} className="bg-card">
                  <td className="px-4 py-3 font-medium">{row.service}</td>
                  <td className="px-4 py-3 text-right font-mono text-sm tabular-nums">
                    {row.range}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-2">
          <Info
            className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"
            aria-hidden="true"
          />
          <div>
            <h3 className="mb-2 text-sm font-semibold text-amber-900">
              What changes the price
            </h3>
            <ul className="space-y-1 text-sm text-amber-900">
              {factors.map((f) => (
                <li key={f} className="flex gap-2">
                  <span aria-hidden="true">•</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

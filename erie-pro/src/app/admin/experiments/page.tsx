// ── Admin · Experiments Dashboard ────────────────────────────────────
// Per-experiment results: exposures, conversion rates by variant,
// statistical significance vs. control, lift, and a clear winner flag.

import type { Metadata } from "next";
import { EXPERIMENTS, EXPERIMENTS_BY_KEY } from "@/lib/experiments/registry";
import { loadExperimentData } from "@/lib/experiments/runtime";
import {
  computeExperimentAnalytics,
  type ExperimentAnalytics,
} from "@/lib/experiments/analytics";
import { cityConfig } from "@/lib/city-config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Experiments | ${cityConfig.domain}`,
  description: "A/B testing — variant performance, conversion rates, significance.",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ days?: string; exp?: string }>;
}

function pct(n: number, digits = 2): string {
  return `${(n * 100).toFixed(digits)}%`;
}

function signedPct(n: number | null): string {
  if (n == null) return "—";
  const sign = n >= 0 ? "+" : "";
  return `${sign}${(n * 100).toFixed(1)}%`;
}

export default async function ExperimentsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const daysParam = parseInt(params.days ?? "30", 10);
  const days = Number.isFinite(daysParam) && daysParam > 0 && daysParam <= 365 ? daysParam : 30;
  const selectedKey = params.exp ?? EXPERIMENTS[0]?.key;

  const rangeEnd = new Date();
  const rangeStart = new Date(rangeEnd.getTime() - days * 86400000);

  // Load analytics for all experiments (parallel)
  const allAnalytics = await Promise.all(
    EXPERIMENTS.map(async (exp) => {
      const data = await loadExperimentData(exp.key, rangeStart, rangeEnd);
      return computeExperimentAnalytics(exp, data.exposures, data.conversions);
    })
  );

  const selected = allAnalytics.find((a) => a.experimentKey === selectedKey) ?? allAnalytics[0];
  const selectedDef = selected ? EXPERIMENTS_BY_KEY[selected.experimentKey] : undefined;

  return (
    <div className="space-y-6 p-6 max-w-7xl">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Experiments
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Last {days} days · {EXPERIMENTS.length} experiment{EXPERIMENTS.length !== 1 ? "s" : ""} defined
          </p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <a
              key={d}
              href={`?days=${d}&exp=${selectedKey ?? ""}`}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                d === days
                  ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              {d}d
            </a>
          ))}
        </div>
      </div>

      {/* Experiment list */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="text-left py-2 px-4">Experiment</th>
              <th className="text-left py-2 px-2">Status</th>
              <th className="text-right py-2 px-2">Exposures</th>
              <th className="text-right py-2 px-2">Overall CR</th>
              <th className="text-right py-2 px-4">Winner</th>
            </tr>
          </thead>
          <tbody>
            {allAnalytics.map((a) => {
              const def = EXPERIMENTS_BY_KEY[a.experimentKey];
              const isSelected = a.experimentKey === selected?.experimentKey;
              const status = def?.paused
                ? { label: "Paused", tone: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" }
                : def?.endedAt && new Date(def.endedAt) < rangeEnd
                  ? { label: "Ended", tone: "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300" }
                  : { label: "Running", tone: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" };
              return (
                <tr
                  key={a.experimentKey}
                  className={`border-b border-gray-100 dark:border-gray-800 last:border-b-0 ${
                    isSelected ? "bg-sky-50 dark:bg-sky-950" : ""
                  }`}
                >
                  <td className="py-3 px-4">
                    <a
                      href={`?days=${days}&exp=${a.experimentKey}`}
                      className="text-gray-900 dark:text-gray-100 hover:text-sky-700 dark:hover:text-sky-300"
                    >
                      <div className="font-medium font-mono text-xs">{a.experimentKey}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {a.description}
                      </div>
                    </a>
                  </td>
                  <td className="py-3 px-2">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${status.tone}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right text-gray-700 dark:text-gray-300">
                    {a.totalExposures.toLocaleString()}
                  </td>
                  <td className="py-3 px-2 text-right text-gray-700 dark:text-gray-300">
                    {a.totalExposures > 0 ? pct(a.overallConversionRate) : "—"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {a.hasSignificantWinner ? (
                      <span className="text-emerald-700 dark:text-emerald-300 font-medium text-xs">
                        ✓ {a.significantWinnerVariantKey}
                      </span>
                    ) : a.totalExposures < 100 ? (
                      <span className="text-gray-400 dark:text-gray-500 text-xs">
                        Need more data
                      </span>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400 text-xs">
                        No clear winner
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Detail view */}
      {selected && selectedDef && (
        <ExperimentDetail analytics={selected} definition={selectedDef} />
      )}
    </div>
  );
}

function ExperimentDetail({
  analytics,
  definition,
}: {
  analytics: ExperimentAnalytics;
  definition: import("@/lib/experiments/types").ExperimentDef;
}) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 font-mono">
          {analytics.experimentKey}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {analytics.description}
        </p>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Control: <code className="font-mono">{analytics.controlVariantKey}</code> ·
          Started {definition.startedAt.slice(0, 10)}
          {definition.paused && (
            <span className="ml-2 px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded">
              PAUSED
            </span>
          )}
        </div>
      </div>

      <table className="w-full text-sm">
        <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase border-b border-gray-200 dark:border-gray-700">
          <tr>
            <th className="text-left py-2 pr-2">Variant</th>
            <th className="text-right py-2 px-2">Exposures</th>
            <th className="text-right py-2 px-2">Conversions</th>
            <th className="text-right py-2 px-2">Rate</th>
            <th className="text-right py-2 px-2">Lift</th>
            <th className="text-right py-2 px-2">p-value</th>
            <th className="text-right py-2 pl-2">Significance</th>
          </tr>
        </thead>
        <tbody>
          {analytics.variants.map((v) => {
            const variantDef = definition.variants.find((d) => d.key === v.variantKey);
            const winner = v.variantKey === analytics.significantWinnerVariantKey;
            return (
              <tr
                key={v.variantKey}
                className={`border-b border-gray-100 dark:border-gray-800 last:border-b-0 ${
                  v.isControl ? "bg-gray-50 dark:bg-gray-800/50" : ""
                } ${winner ? "bg-emerald-50 dark:bg-emerald-950" : ""}`}
              >
                <td className="py-3 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-gray-900 dark:text-gray-100">
                      {v.variantKey}
                    </span>
                    {v.isControl && (
                      <span className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Control
                      </span>
                    )}
                    {winner && (
                      <span className="text-[10px] uppercase tracking-wide bg-emerald-600 text-white px-1.5 py-0.5 rounded">
                        Winner
                      </span>
                    )}
                  </div>
                  {variantDef?.description && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {variantDef.description}
                    </div>
                  )}
                </td>
                <td className="py-3 px-2 text-right text-gray-700 dark:text-gray-300 tabular-nums">
                  {v.exposures.toLocaleString()}
                </td>
                <td className="py-3 px-2 text-right text-gray-700 dark:text-gray-300 tabular-nums">
                  {v.conversions.toLocaleString()}
                </td>
                <td className="py-3 px-2 text-right text-gray-900 dark:text-gray-100 font-medium tabular-nums">
                  {v.exposures > 0 ? pct(v.conversionRate) : "—"}
                </td>
                <td
                  className={`py-3 px-2 text-right tabular-nums ${
                    v.liftVsControl == null
                      ? "text-gray-400 dark:text-gray-600"
                      : v.liftVsControl > 0
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-red-700 dark:text-red-300"
                  }`}
                >
                  {v.isControl ? "—" : signedPct(v.liftVsControl)}
                </td>
                <td className="py-3 px-2 text-right tabular-nums">
                  {v.pValueVsControl == null ? (
                    <span className="text-gray-400 dark:text-gray-600 text-xs">
                      {v.isControl ? "—" : "n<30"}
                    </span>
                  ) : (
                    <span
                      className={
                        v.pValueVsControl < 0.05
                          ? "text-emerald-700 dark:text-emerald-300 font-medium"
                          : "text-gray-600 dark:text-gray-400"
                      }
                    >
                      {v.pValueVsControl.toFixed(3)}
                    </span>
                  )}
                </td>
                <td className="py-3 pl-2 text-right text-xs">
                  {v.pValueVsControl == null ? (
                    "—"
                  ) : v.pValueVsControl < 0.01 ? (
                    <span className="text-emerald-700 dark:text-emerald-300">Highly sig. (p&lt;0.01)</span>
                  ) : v.pValueVsControl < 0.05 ? (
                    <span className="text-emerald-700 dark:text-emerald-300">Significant (p&lt;0.05)</span>
                  ) : v.pValueVsControl < 0.10 ? (
                    <span className="text-amber-700 dark:text-amber-300">Marginal (p&lt;0.10)</span>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">Not significant</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
        <strong>Interpretation:</strong> p-values use a two-proportion z-test vs. control.
        With n&lt;30 in either group the test is not run (insufficient power).
        Treat p&lt;0.05 as a real signal only if the sample is large enough that you'd expect
        it to keep holding — small samples occasionally hit significance from noise alone.
        For high-stakes decisions, also check whether the result replicates over time.
      </div>
    </div>
  );
}

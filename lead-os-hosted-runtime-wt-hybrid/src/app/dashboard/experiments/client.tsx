"use client";

import Link from "next/link";
import { useEffect, useState, useMemo, useCallback } from "react";

interface ExperimentVariant {
  variantId: string;
  count: number;
}

interface ExperimentPerformance {
  experimentId: string;
  entries: number;
  hotRate: number;
  m1ToM2: number;
  m1ToM3: number;
  conversionRate: number;
  topVariants: ExperimentVariant[];
}

interface DashboardData {
  dashboard: {
    experimentPerformance: ExperimentPerformance[];
    totals: { leads: number; events: number; hotLeads: number };
  };
}

type ExperimentStatus = "running" | "completed" | "paused";

function getExperimentStatus(experiment: ExperimentPerformance): ExperimentStatus {
  if (experiment.entries === 0) return "paused";
  if (experiment.conversionRate > 0 && experiment.entries >= 30) return "completed";
  return "running";
}

function getStatusColor(status: ExperimentStatus): { bg: string; color: string } {
  switch (status) {
    case "running":
      return { bg: "var(--accent-soft)", color: "var(--accent-strong)" };
    case "completed":
      return { bg: "var(--success-soft)", color: "var(--success)" };
    case "paused":
      return { bg: "rgba(20, 33, 29, 0.08)", color: "var(--text-soft)" };
  }
}

function calculateSignificance(variantA: number, variantB: number, totalA: number, totalB: number): { significant: boolean; confidence: number } {
  if (totalA < 10 || totalB < 10) return { significant: false, confidence: 0 };
  const rateA = variantA / totalA;
  const rateB = variantB / totalB;
  const pooledRate = (variantA + variantB) / (totalA + totalB);
  const se = Math.sqrt(pooledRate * (1 - pooledRate) * (1 / totalA + 1 / totalB));
  if (se === 0) return { significant: false, confidence: 0 };
  const zScore = Math.abs(rateA - rateB) / se;
  const confidence = Math.min(99.9, Number((100 * (1 - Math.exp(-0.5 * zScore * zScore))).toFixed(1)));
  return { significant: confidence >= 95, confidence };
}

const DEMO_EXPERIMENTS: DashboardData = {
  dashboard: {
    experimentPerformance: [
      { experimentId: "exp-hero-cta-v2", entries: 312, hotRate: 18.6, m1ToM2: 42.3, m1ToM3: 28.1, conversionRate: 14.7, topVariants: [{ variantId: "control", count: 158 }, { variantId: "variant-b", count: 154 }] },
      { experimentId: "exp-lead-form-short", entries: 241, hotRate: 22.4, m1ToM2: 48.1, m1ToM3: 31.5, conversionRate: 19.5, topVariants: [{ variantId: "control", count: 119 }, { variantId: "3-field", count: 122 }] },
      { experimentId: "exp-nurture-cadence-7d", entries: 178, hotRate: 15.7, m1ToM2: 37.6, m1ToM3: 22.4, conversionRate: 12.4, topVariants: [{ variantId: "5-day", count: 88 }, { variantId: "7-day", count: 90 }] },
      { experimentId: "exp-exit-intent-offer", entries: 95, hotRate: 31.6, m1ToM2: 55.2, m1ToM3: 44.2, conversionRate: 27.4, topVariants: [{ variantId: "10pct-discount", count: 47 }, { variantId: "free-audit", count: 48 }] },
      { experimentId: "exp-sms-opt-in-flow", entries: 0, hotRate: 0, m1ToM2: 0, m1ToM3: 0, conversionRate: 0, topVariants: [] },
    ],
    totals: { leads: 826, events: 4103, hotLeads: 147 },
  },
};

export default function ExperimentsPageClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [expandedExperiment, setExpandedExperiment] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ExperimentStatus | "all">("all");
  const [promoteStatus, setPromoteStatus] = useState<Record<string, string>>({});

  const handlePromoteWinner = useCallback(async (experimentId: string, variantId: string) => {
    setPromoteStatus((prev) => ({ ...prev, [experimentId]: "pending" }));
    try {
      const res = await fetch(`/api/experiments/${experimentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "completed", winner: variantId }),
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      setPromoteStatus((prev) => ({ ...prev, [experimentId]: "done" }));
    } catch {
      setPromoteStatus((prev) => ({ ...prev, [experimentId]: "error" }));
      setTimeout(() => setPromoteStatus((prev) => { const next = { ...prev }; delete next[experimentId]; return next; }), 5000);
    }
  }, []);

  useEffect(() => {
    fetch("/api/dashboard", { credentials: "include" })
      .then((res) => res.ok ? res.json() : null)
      .then((json) => {
        if (json?.dashboard) { setData(json); } else { setData(DEMO_EXPERIMENTS); setIsDemo(true); }
        setLoading(false);
      })
      .catch(() => { setData(DEMO_EXPERIMENTS); setIsDemo(true); setLoading(false); });
  }, []);

  const experiments = useMemo(() => {
    if (!data) return [];
    return data.dashboard.experimentPerformance.map((exp) => ({ ...exp, status: getExperimentStatus(exp) }));
  }, [data]);

  const filteredExperiments = useMemo(() => {
    if (statusFilter === "all") return experiments;
    return experiments.filter((exp) => exp.status === statusFilter);
  }, [experiments, statusFilter]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <section className="rounded-xl border border-border bg-card p-6">
          <p className="text-muted-foreground">Loading experiment data...</p>
        </section>
      </div>
    );
  }

  const totalVariants = experiments.reduce((sum, exp) => sum + exp.topVariants.length, 0);
  const runningCount = experiments.filter((e) => e.status === "running").length;
  const completedCount = experiments.filter((e) => e.status === "completed").length;

  return (
    <div className="min-h-screen">
      {isDemo && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-300 dark:border-amber-800 px-6 py-2.5 text-sm text-amber-800 dark:text-amber-200">
          Demo data — Connect your tenant to see live experiment results.{" "}
          <Link href="/auth/sign-in" className="text-amber-800 underline">Sign in</Link>
        </div>
      )}
      <section className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Experiment performance</p>
          <h1 className="text-foreground">Variant reporting</h1>
          <p className="text-lg text-foreground">
            Compare headline, mode, and device-level experience variants by milestone progression
            instead of just raw capture volume. Statistical significance is calculated when
            sample sizes allow.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Back to dashboard</Link>
          </div>
        </div>
        <aside className="hidden md:block">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Experiment summary</p>
          <ul className="space-y-3 mt-4">
            <li><strong>Experiments</strong><span>{experiments.length}</span></li>
            <li><strong>Variants</strong><span>{totalVariants}</span></li>
            <li><strong>Running</strong><span>{runningCount}</span></li>
            <li><strong>Completed</strong><span>{completedCount}</span></li>
          </ul>
        </aside>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Filter</p>
        <div className="flex flex-wrap gap-3 items-center">
          <label className="flex items-center gap-2 font-bold text-sm">
            Status
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ExperimentStatus | "all")}
              className="min-h-[36px] px-3 py-1.5 rounded-xl border border-border/60 bg-background text-foreground text-sm"
            >
              <option value="all">All statuses</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="paused">Paused</option>
            </select>
          </label>
          <span className="text-sm text-muted-foreground">
            Showing {filteredExperiments.length} of {experiments.length} experiments
          </span>
        </div>
      </section>

      <section className="stack-grid">
        {filteredExperiments.length === 0 ? (
          <article className="rounded-xl border border-border bg-card p-6">
            <p className="text-muted-foreground">No experiments match the selected filter.</p>
          </article>
        ) : (
          filteredExperiments.map((experiment) => {
            const isExpanded = expandedExperiment === experiment.experimentId;
            const statusColors = getStatusColor(experiment.status);
            const targetSampleSize = 100;
            const sampleProgress = Math.min((experiment.entries / targetSampleSize) * 100, 100);

            const bestVariant = experiment.topVariants.length > 0
              ? experiment.topVariants.reduce((best, v) => v.count > best.count ? v : best, experiment.topVariants[0])
              : null;

            return (
              <article key={experiment.experimentId} className="stack-card">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <span
                        className="px-2.5 py-0.5 rounded-full font-extrabold text-[0.72rem] uppercase"
                        style={{ background: statusColors.bg, color: statusColors.color }}
                      >
                        {experiment.status}
                      </span>
                      {experiment.experimentId}
                    </p>
                    <h3 className="text-foreground">{experiment.entries} entries</h3>
                  </div>
                  <div className="text-right text-sm">
                    <p className="m-0">Hot: {experiment.hotRate}%</p>
                    <p className="text-muted-foreground m-0">Conv: {experiment.conversionRate}%</p>
                  </div>
                </div>

                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold">Sample progress</span>
                    <span className="text-muted-foreground">{experiment.entries}/{targetSampleSize}</span>
                  </div>
                  <div className="h-2 bg-teal-900/10 rounded overflow-hidden">
                    <div
                      className="h-full rounded transition-all duration-300"
                      style={{
                        width: `${sampleProgress}%`,
                        background: sampleProgress >= 100 ? "var(--success)" : "var(--accent)",
                      }}
                    />
                  </div>
                </div>

                <p className="text-muted-foreground mt-2 text-sm">
                  M1 to M2: {experiment.m1ToM2}% | M1 to M3: {experiment.m1ToM3}% | Conversion: {experiment.conversionRate}%
                </p>

                <div className="flex gap-2 mt-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setExpandedExperiment(isExpanded ? null : experiment.experimentId)}
                    aria-expanded={isExpanded}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors min-h-[36px] px-3.5 py-1.5"
                  >
                    {isExpanded ? "Hide analysis" : "View analysis"}
                  </button>
                  {bestVariant && experiment.status === "completed" && (
                    <button
                      type="button"
                      className="primary min-h-[36px] px-3.5 py-1.5 text-sm"
                      disabled={promoteStatus[experiment.experimentId] === "pending"}
                      onClick={() => handlePromoteWinner(experiment.experimentId, bestVariant.variantId)}
                    >
                      {promoteStatus[experiment.experimentId] === "pending"
                        ? "Promoting..."
                        : promoteStatus[experiment.experimentId] === "done"
                          ? "Promoted"
                          : promoteStatus[experiment.experimentId] === "error"
                            ? "Failed -- retry?"
                            : `Promote winner: ${bestVariant.variantId}`}
                    </button>
                  )}
                </div>

                {isExpanded && (
                  <div className="mt-4 grid gap-4">
                    <div>
                      <p className="font-bold text-sm mb-2">Variant comparison</p>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-sm">
                          <thead>
                            <tr>
                              <th className="text-left px-3 py-2.5 border-b-2 border-border/50 font-extrabold text-xs uppercase tracking-wider text-muted-foreground">Variant</th>
                              <th className="text-right px-3 py-2.5 border-b-2 border-border/50 font-extrabold text-xs uppercase tracking-wider text-muted-foreground">Entries</th>
                              <th className="text-right px-3 py-2.5 border-b-2 border-border/50 font-extrabold text-xs uppercase tracking-wider text-muted-foreground">Share</th>
                              <th className="text-right px-3 py-2.5 border-b-2 border-border/50 font-extrabold text-xs uppercase tracking-wider text-muted-foreground">Significance</th>
                              <th className="text-left px-3 py-2.5 border-b-2 border-border/50 font-extrabold text-xs uppercase tracking-wider text-muted-foreground">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {experiment.topVariants.map((variant, idx) => {
                              const share = experiment.entries > 0 ? ((variant.count / experiment.entries) * 100).toFixed(1) : "0";
                              const isBest = bestVariant?.variantId === variant.variantId;
                              const sig = idx > 0 && bestVariant
                                ? calculateSignificance(bestVariant.count, variant.count, experiment.entries, experiment.entries)
                                : null;
                              return (
                                <tr key={variant.variantId}>
                                  <td className="px-3 py-2.5 border-b border-border/30">
                                    <span className={isBest ? "font-extrabold" : ""}>
                                      {variant.variantId}
                                      {isBest && (
                                        <span className="ml-1.5 px-2 py-0.5 rounded-full bg-[var(--success-soft)] text-[var(--success)] text-[0.72rem] font-extrabold">
                                          leader
                                        </span>
                                      )}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2.5 border-b border-border/30 text-right">{variant.count}</td>
                                  <td className="px-3 py-2.5 border-b border-border/30 text-right">{share}%</td>
                                  <td className="px-3 py-2.5 border-b border-border/30 text-right">
                                    {sig ? (
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${sig.significant ? "bg-[var(--success-soft)] text-[var(--success)]" : "bg-[var(--danger-soft)] text-[var(--danger)]"}`}>
                                        {sig.confidence}%
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">baseline</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2.5 border-b border-border/30">
                                    <span
                                      className="inline-block w-2 h-2 rounded-full"
                                      style={{ background: isBest ? "var(--success)" : "var(--secondary)" }}
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
                      {[
                        { label: "Hot rate", value: `${experiment.hotRate}%` },
                        { label: "M1 to M2", value: `${experiment.m1ToM2}%` },
                        { label: "M1 to M3", value: `${experiment.m1ToM3}%` },
                        { label: "Conversion", value: `${experiment.conversionRate}%` },
                      ].map((metric) => (
                        <div key={metric.label} className="p-3.5 rounded-xl bg-teal-900/5">
                          <p className="text-[0.72rem] font-extrabold uppercase tracking-widest text-muted-foreground m-0">
                            {metric.label}
                          </p>
                          <p className="text-xl font-extrabold mt-1 m-0">{metric.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}

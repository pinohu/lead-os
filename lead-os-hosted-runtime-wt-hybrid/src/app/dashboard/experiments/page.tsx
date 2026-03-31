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

export default function ExperimentsPage() {
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
        body: JSON.stringify({
          status: "completed",
          winner: variantId,
        }),
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
        if (json?.dashboard) {
          setData(json);
        } else {
          setData(DEMO_EXPERIMENTS);
          setIsDemo(true);
        }
        setLoading(false);
      })
      .catch(() => {
        setData(DEMO_EXPERIMENTS);
        setIsDemo(true);
        setLoading(false);
      });
  }, []);

  const experiments = useMemo(() => {
    if (!data) return [];
    return data.dashboard.experimentPerformance.map((exp) => ({
      ...exp,
      status: getExperimentStatus(exp),
    }));
  }, [data]);

  const filteredExperiments = useMemo(() => {
    if (statusFilter === "all") return experiments;
    return experiments.filter((exp) => exp.status === statusFilter);
  }, [experiments, statusFilter]);

  if (loading) {
    return (
      <main className="experience-page">
        <section className="panel">
          <p className="muted">Loading experiment data...</p>
        </section>
      </main>
    );
  }

  const totalVariants = experiments.reduce((sum, exp) => sum + exp.topVariants.length, 0);
  const runningCount = experiments.filter((e) => e.status === "running").length;
  const completedCount = experiments.filter((e) => e.status === "completed").length;

  return (
    <main className="experience-page">
      {isDemo && (
        <div style={{ background: "#fef3c7", borderBottom: "1px solid #fcd34d", padding: "10px 24px", fontSize: "0.875rem", color: "#92400e" }}>
          Demo data — Connect your tenant to see live experiment results.{" "}
          <Link href="/auth/sign-in" style={{ color: "#92400e", textDecoration: "underline" }}>Sign in</Link>
        </div>
      )}
      <section className="experience-hero">
        <div className="hero-copy">
          <p className="eyebrow">Experiment performance</p>
          <h1>Variant reporting</h1>
          <p className="lede">
            Compare headline, mode, and device-level experience variants by milestone progression
            instead of just raw capture volume. Statistical significance is calculated when
            sample sizes allow.
          </p>
          <div className="cta-row">
            <Link href="/dashboard" className="secondary">Back to dashboard</Link>
          </div>
        </div>
        <aside className="hero-rail">
          <p className="eyebrow">Experiment summary</p>
          <ul className="journey-rail">
            <li>
              <strong>Experiments</strong>
              <span>{experiments.length}</span>
            </li>
            <li>
              <strong>Variants</strong>
              <span>{totalVariants}</span>
            </li>
            <li>
              <strong>Running</strong>
              <span>{runningCount}</span>
            </li>
            <li>
              <strong>Completed</strong>
              <span>{completedCount}</span>
            </li>
          </ul>
        </aside>
      </section>

      <section className="panel">
        <p className="eyebrow">Filter</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: "0.88rem" }}>
            Status
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ExperimentStatus | "all")}
              style={selectStyle}
            >
              <option value="all">All statuses</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="paused">Paused</option>
            </select>
          </label>
          <span style={{ fontSize: "0.82rem", color: "var(--text-soft)" }}>
            Showing {filteredExperiments.length} of {experiments.length} experiments
          </span>
        </div>
      </section>

      <section className="stack-grid">
        {filteredExperiments.length === 0 ? (
          <article className="panel">
            <p className="muted">No experiments match the selected filter.</p>
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <p className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        padding: "2px 10px",
                        borderRadius: 999,
                        background: statusColors.bg,
                        color: statusColors.color,
                        fontWeight: 800,
                        fontSize: "0.72rem",
                        textTransform: "uppercase",
                      }}>
                        {experiment.status}
                      </span>
                      {experiment.experimentId}
                    </p>
                    <h3>{experiment.entries} entries</h3>
                  </div>
                  <div style={{ textAlign: "right", fontSize: "0.82rem" }}>
                    <p style={{ margin: 0 }}>Hot: {experiment.hotRate}%</p>
                    <p className="muted" style={{ margin: 0 }}>Conv: {experiment.conversionRate}%</p>
                  </div>
                </div>

                <div style={{ marginTop: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.76rem", marginBottom: 4 }}>
                    <span style={{ fontWeight: 700 }}>Sample progress</span>
                    <span className="muted">{experiment.entries}/{targetSampleSize}</span>
                  </div>
                  <div style={{ height: 8, background: "rgba(34, 95, 84, 0.08)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${sampleProgress}%`,
                      background: sampleProgress >= 100 ? "var(--success)" : "var(--accent)",
                      borderRadius: 4,
                      transition: "width 0.3s ease",
                    }} />
                  </div>
                </div>

                <p className="muted" style={{ marginTop: 8, fontSize: "0.82rem" }}>
                  M1 to M2: {experiment.m1ToM2}% | M1 to M3: {experiment.m1ToM3}% | Conversion: {experiment.conversionRate}%
                </p>

                <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => setExpandedExperiment(isExpanded ? null : experiment.experimentId)}
                    aria-expanded={isExpanded}
                    className="secondary"
                    style={{ minHeight: 36, padding: "6px 14px", fontSize: "0.82rem" }}
                  >
                    {isExpanded ? "Hide analysis" : "View analysis"}
                  </button>
                  {bestVariant && experiment.status === "completed" && (
                    <button
                      type="button"
                      className="primary"
                      style={{ minHeight: 36, padding: "6px 14px", fontSize: "0.82rem" }}
                      disabled={promoteStatus[experiment.experimentId] === "pending"}
                      onClick={() => handlePromoteWinner(experiment.experimentId, bestVariant.variantId)}
                    >
                      {promoteStatus[experiment.experimentId] === "pending"
                        ? "Promoting..."
                        : promoteStatus[experiment.experimentId] === "done"
                          ? "Promoted"
                          : promoteStatus[experiment.experimentId] === "error"
                            ? "Failed — retry?"
                            : `Promote winner: ${bestVariant.variantId}`}
                    </button>
                  )}
                </div>

                {isExpanded && (
                  <div style={{ marginTop: 16, display: "grid", gap: 16 }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: 8 }}>Variant comparison</p>
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
                          <thead>
                            <tr>
                              <th style={thStyle}>Variant</th>
                              <th style={{ ...thStyle, textAlign: "right" }}>Entries</th>
                              <th style={{ ...thStyle, textAlign: "right" }}>Share</th>
                              <th style={{ ...thStyle, textAlign: "right" }}>Significance</th>
                              <th style={thStyle}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {experiment.topVariants.map((variant, idx) => {
                              const share = experiment.entries > 0
                                ? ((variant.count / experiment.entries) * 100).toFixed(1)
                                : "0";
                              const isBest = bestVariant?.variantId === variant.variantId;
                              const sig = idx > 0 && bestVariant
                                ? calculateSignificance(bestVariant.count, variant.count, experiment.entries, experiment.entries)
                                : null;
                              return (
                                <tr key={variant.variantId}>
                                  <td style={tdStyle}>
                                    <span style={{ fontWeight: isBest ? 800 : 400 }}>
                                      {variant.variantId}
                                      {isBest && (
                                        <span style={{
                                          marginLeft: 6,
                                          padding: "1px 8px",
                                          borderRadius: 999,
                                          background: "var(--success-soft)",
                                          color: "var(--success)",
                                          fontSize: "0.72rem",
                                          fontWeight: 800,
                                        }}>
                                          leader
                                        </span>
                                      )}
                                    </span>
                                  </td>
                                  <td style={{ ...tdStyle, textAlign: "right" }}>{variant.count}</td>
                                  <td style={{ ...tdStyle, textAlign: "right" }}>{share}%</td>
                                  <td style={{ ...tdStyle, textAlign: "right" }}>
                                    {sig ? (
                                      <span style={{
                                        padding: "2px 8px",
                                        borderRadius: 999,
                                        background: sig.significant ? "var(--success-soft)" : "var(--danger-soft)",
                                        color: sig.significant ? "var(--success)" : "var(--danger)",
                                        fontSize: "0.76rem",
                                        fontWeight: 700,
                                      }}>
                                        {sig.confidence}%
                                      </span>
                                    ) : (
                                      <span className="muted">baseline</span>
                                    )}
                                  </td>
                                  <td style={tdStyle}>
                                    <span style={{
                                      display: "inline-block",
                                      width: 8,
                                      height: 8,
                                      borderRadius: "50%",
                                      background: isBest ? "var(--success)" : "var(--secondary)",
                                    }} />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
                      <div style={{ padding: 14, borderRadius: 14, background: "rgba(34, 95, 84, 0.06)" }}>
                        <p style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-soft)", margin: 0 }}>
                          Hot rate
                        </p>
                        <p style={{ fontSize: "1.4rem", fontWeight: 800, margin: "4px 0 0" }}>{experiment.hotRate}%</p>
                      </div>
                      <div style={{ padding: 14, borderRadius: 14, background: "rgba(34, 95, 84, 0.06)" }}>
                        <p style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-soft)", margin: 0 }}>
                          M1 to M2
                        </p>
                        <p style={{ fontSize: "1.4rem", fontWeight: 800, margin: "4px 0 0" }}>{experiment.m1ToM2}%</p>
                      </div>
                      <div style={{ padding: 14, borderRadius: 14, background: "rgba(34, 95, 84, 0.06)" }}>
                        <p style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-soft)", margin: 0 }}>
                          M1 to M3
                        </p>
                        <p style={{ fontSize: "1.4rem", fontWeight: 800, margin: "4px 0 0" }}>{experiment.m1ToM3}%</p>
                      </div>
                      <div style={{ padding: 14, borderRadius: 14, background: "rgba(34, 95, 84, 0.06)" }}>
                        <p style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-soft)", margin: 0 }}>
                          Conversion
                        </p>
                        <p style={{ fontSize: "1.4rem", fontWeight: 800, margin: "4px 0 0" }}>{experiment.conversionRate}%</p>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </section>
    </main>
  );
}

const selectStyle: React.CSSProperties = {
  minHeight: 36,
  padding: "6px 12px",
  borderRadius: 14,
  border: "1px solid rgba(20, 33, 29, 0.14)",
  background: "rgba(255, 255, 255, 0.92)",
  color: "var(--text)",
  fontSize: "0.88rem",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  borderBottom: "2px solid rgba(20, 33, 29, 0.1)",
  fontWeight: 800,
  fontSize: "0.76rem",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--text-soft)",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid rgba(20, 33, 29, 0.06)",
};

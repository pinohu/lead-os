"use client";

import { useEffect, useState, useCallback } from "react";

interface Insight {
  type: "opportunity" | "problem" | "trend";
  severity: "info" | "warning" | "critical";
  message: string;
  metric: string;
  currentValue: number;
  targetValue: number;
  recommendation: string;
}

interface Adjustment {
  type: string;
  target: string;
  oldValue: unknown;
  newValue: unknown;
  reason: string;
  autoApplied: boolean;
}

interface PerformanceMetrics {
  conversionRate: number;
  avgLeadScore: number;
  avgTimeToConvert: number;
  emailPerformance: { openRate: number; clickRate: number };
  scoringAccuracy: number;
  topFunnels: { funnel: string; conversions: number; rate: number }[];
  bottomFunnels: { funnel: string; conversions: number; rate: number }[];
}

interface FeedbackCycle {
  id: string;
  type: string;
  period: string;
  status: string;
  insights: Insight[];
  adjustments: Adjustment[];
  createdAt: string;
  appliedAt?: string;
}

interface KPITarget {
  label: string;
  current: number;
  target: number;
  unit: string;
}

function severityColor(severity: string): { bg: string; color: string; border: string } {
  switch (severity) {
    case "critical":
      return { bg: "#fef2f2", color: "#991b1b", border: "#fecaca" };
    case "warning":
      return { bg: "#fffbeb", color: "#92400e", border: "#fde68a" };
    default:
      return { bg: "#eff6ff", color: "#1e40af", border: "#bfdbfe" };
  }
}

function typeIcon(type: string): string {
  switch (type) {
    case "problem": return "!";
    case "opportunity": return "+";
    case "trend": return "~";
    default: return "?";
  }
}

function statusBadge(status: string): { bg: string; color: string } {
  switch (status) {
    case "applied":
      return { bg: "#dcfce7", color: "#166534" };
    case "analyzed":
      return { bg: "#dbeafe", color: "#1e40af" };
    case "pending":
      return { bg: "#fef3c7", color: "#92400e" };
    default:
      return { bg: "#f3f4f6", color: "#374151" };
  }
}

function GaugeBar({ label, current, target, unit }: KPITarget) {
  const ratio = target > 0 ? Math.min(current / target, 2) : 0;
  const percentage = Math.min(ratio * 50, 100);
  const isGood = current >= target;
  const barColor = isGood ? "#22c55e" : current >= target * 0.7 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
        <span style={{ fontWeight: 600, color: "#374151" }}>{label}</span>
        <span style={{ color: isGood ? "#166534" : "#92400e" }}>
          {current}{unit} / {target}{unit}
        </span>
      </div>
      <div style={{ background: "#e5e7eb", borderRadius: 4, height: 8, overflow: "hidden" }}>
        <div
          style={{
            background: barColor,
            width: `${percentage}%`,
            height: "100%",
            borderRadius: 4,
            transition: "width 300ms ease",
          }}
        />
      </div>
    </div>
  );
}

const DEMO_METRICS: PerformanceMetrics = {
  conversionRate: 18.4,
  avgLeadScore: 72.3,
  avgTimeToConvert: 4.2,
  emailPerformance: { openRate: 41.7, clickRate: 12.3 },
  scoringAccuracy: 87.1,
  topFunnels: [
    { funnel: "qualification", conversions: 61, rate: 25.3 },
    { funnel: "checkout", conversions: 54, rate: 65.1 },
    { funnel: "webinar", conversions: 31, rate: 32.0 },
  ],
  bottomFunnels: [
    { funnel: "drip", conversions: 8, rate: 4.1 },
    { funnel: "continuity", conversions: 11, rate: 6.8 },
  ],
};

const DEMO_INSIGHTS: Insight[] = [
  { type: "opportunity", severity: "info", message: "Email open rate is 41.7% — above the 35% industry benchmark.", metric: "emailOpenRate", currentValue: 41.7, targetValue: 35, recommendation: "A/B test subject line personalization to push toward 48%." },
  { type: "trend", severity: "warning", message: "Avg time to convert increased from 3.8 to 4.2 days over the last 7 days.", metric: "avgTimeToConvert", currentValue: 4.2, targetValue: 3.5, recommendation: "Add urgency trigger at day 3 of the nurture sequence." },
  { type: "problem", severity: "critical", message: "Drip funnel conversion rate (4.1%) is 60% below target.", metric: "dripFunnelRate", currentValue: 4.1, targetValue: 10.0, recommendation: "Review drip email copy and reduce cadence gap from 5 days to 3 days." },
];

const DEMO_HISTORY: FeedbackCycle[] = [
  { id: "fc-demo-001", type: "weekly", period: "2026-W13", status: "applied", insights: DEMO_INSIGHTS.slice(0, 2), adjustments: [{ type: "scoring", target: "engagement-weight", oldValue: 0.25, newValue: 0.30, reason: "High-engagement leads converting 1.4x better", autoApplied: true }], createdAt: "2026-03-25T08:00:00Z", appliedAt: "2026-03-25T08:05:00Z" },
  { id: "fc-demo-002", type: "daily", period: "2026-03-30", status: "analyzed", insights: DEMO_INSIGHTS.slice(2), adjustments: [], createdAt: "2026-03-30T07:00:00Z" },
];

export default function FeedbackPage() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [history, setHistory] = useState<FeedbackCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [metricsRes, insightsRes, historyRes] = await Promise.all([
        fetch("/api/feedback/metrics"),
        fetch("/api/feedback/insights"),
        fetch("/api/feedback/cycle?limit=10"),
      ]);

      const metricsData = metricsRes.ok ? await metricsRes.json() : null;
      const insightsData = insightsRes.ok ? await insightsRes.json() : null;
      const historyData = historyRes.ok ? await historyRes.json() : null;

      const hasLiveData = metricsData?.data || insightsData?.data || historyData?.data;
      if (hasLiveData) {
        if (metricsData?.data) setMetrics(metricsData.data);
        if (insightsData?.data) setInsights(insightsData.data);
        if (historyData?.data) setHistory(historyData.data);
      } else {
        setMetrics(DEMO_METRICS);
        setInsights(DEMO_INSIGHTS);
        setHistory(DEMO_HISTORY);
        setIsDemo(true);
      }
    } catch {
      setMetrics(DEMO_METRICS);
      setInsights(DEMO_INSIGHTS);
      setHistory(DEMO_HISTORY);
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleRunCycle(type: "daily" | "weekly" | "monthly") {
    setRunning(true);
    try {
      const res = await fetch("/api/feedback/cycle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (data.data) {
        setHistory((prev) => [data.data, ...prev]);
      }
      await fetchData();
    } catch {
      setError("Failed to run feedback cycle");
    } finally {
      setRunning(false);
    }
  }

  async function handleApply(cycleId: string) {
    try {
      const res = await fetch(`/api/feedback/cycle/${cycleId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.data) {
        setHistory((prev) =>
          prev.map((c) => (c.id === cycleId ? data.data : c)),
        );
      }
    } catch {
      setError("Failed to apply adjustments");
    }
  }

  if (loading) {
    return (
      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 24px" }}>
        <p style={{ color: "#6b7280", fontSize: 14 }}>Loading feedback data...</p>
      </main>
    );
  }


  const kpis: KPITarget[] = metrics
    ? [
        { label: "Conversion Rate", current: metrics.conversionRate, target: 5, unit: "%" },
        { label: "Avg Lead Score", current: metrics.avgLeadScore, target: 45, unit: "" },
        { label: "Email Open Rate", current: metrics.emailPerformance.openRate, target: 25, unit: "%" },
        { label: "Email Click Rate", current: metrics.emailPerformance.clickRate, target: 5, unit: "%" },
        { label: "Scoring Accuracy", current: Math.round(metrics.scoringAccuracy * 100), target: 70, unit: "%" },
      ]
    : [];

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 24px" }}>
      {isDemo && (
        <div style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 8, padding: "10px 16px", fontSize: "0.875rem", color: "#92400e", marginBottom: 24 }}>
          Demo data — Connect your tenant to see live feedback and performance metrics.
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: 0 }}>
          Feedback Loop
        </h1>
        <div style={{ display: "flex", gap: 8 }}>
          {(["daily", "weekly", "monthly"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleRunCycle(type)}
              disabled={running}
              style={{
                background: running ? "#d1d5db" : "#14b8a6",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 600,
                cursor: running ? "not-allowed" : "pointer",
                minHeight: 36,
              }}
            >
              Run {type}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "12px 16px", marginBottom: 16, color: "#991b1b", fontSize: 13 }}
        >
          {error}
        </div>
      )}

      <section aria-label="KPI Performance" style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: "#374151", marginBottom: 16 }}>
          Performance vs KPI Targets
        </h2>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20 }}>
          {kpis.map((kpi) => (
            <GaugeBar key={kpi.label} {...kpi} />
          ))}
          {kpis.length === 0 && (
            <p style={{ color: "#9ca3af", fontSize: 13, margin: 0 }}>No metrics available yet.</p>
          )}
        </div>
      </section>

      <section aria-label="Current Insights" style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: "#374151", marginBottom: 16 }}>
          Insights ({insights.length})
        </h2>
        {insights.length === 0 && (
          <p style={{ color: "#9ca3af", fontSize: 13 }}>No insights generated yet. Run a feedback cycle to generate insights.</p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {insights.map((insight, i) => {
            const colors = severityColor(insight.severity);
            return (
              <div
                key={i}
                style={{
                  background: colors.bg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                  padding: "12px 16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: colors.color,
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {typeIcon(insight.type)}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: colors.color }}>
                    {insight.severity.toUpperCase()}
                  </span>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>
                    {insight.metric}
                  </span>
                </div>
                <p style={{ margin: "0 0 4px", fontSize: 14, color: "#111827" }}>
                  {insight.message}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
                  {insight.recommendation}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section aria-label="Feedback Cycle History" style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: "#374151", marginBottom: 16 }}>
          Cycle History
        </h2>
        {history.length === 0 && (
          <p style={{ color: "#9ca3af", fontSize: 13 }}>No feedback cycles run yet.</p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {history.map((cycle) => {
            const badge = statusBadge(cycle.status);
            const pendingAdjustments = cycle.adjustments.filter((a) => !a.autoApplied);
            const hasPending = cycle.status !== "applied" && pendingAdjustments.length > 0;

            return (
              <div
                key={cycle.id}
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
                      {cycle.type.charAt(0).toUpperCase() + cycle.type.slice(1)} Cycle
                    </span>
                    <span
                      style={{
                        display: "inline-block",
                        background: badge.bg,
                        color: badge.color,
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 999,
                      }}
                    >
                      {cycle.status}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>
                    {new Date(cycle.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <p style={{ margin: "0 0 8px", fontSize: 12, color: "#6b7280" }}>
                  Period: {cycle.period} | Insights: {cycle.insights.length} | Adjustments: {cycle.adjustments.length}
                </p>

                {cycle.adjustments.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#374151", margin: "0 0 4px" }}>
                      Adjustments:
                    </p>
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "#6b7280" }}>
                      {cycle.adjustments.slice(0, 5).map((adj, i) => (
                        <li key={i} style={{ marginBottom: 2 }}>
                          <span style={{ fontWeight: 600 }}>{adj.type}</span>: {adj.reason}
                          {adj.autoApplied && (
                            <span style={{ color: "#16a34a", marginLeft: 4 }}>(auto-applied)</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {hasPending && (
                  <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => handleApply(cycle.id)}
                      style={{
                        background: "#14b8a6",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        padding: "6px 14px",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        minHeight: 32,
                      }}
                    >
                      Apply {pendingAdjustments.length} pending adjustments
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

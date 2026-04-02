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
      return { bg: "bg-red-50", color: "text-red-800", border: "border-red-200" };
    case "warning":
      return { bg: "bg-amber-50", color: "text-amber-800", border: "border-amber-200" };
    default:
      return { bg: "bg-blue-50", color: "text-blue-800", border: "border-blue-200" };
  }
}

function severityRawColor(severity: string): string {
  switch (severity) {
    case "critical": return "#991b1b";
    case "warning": return "#92400e";
    default: return "#1e40af";
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

function statusBadgeClass(status: string): string {
  switch (status) {
    case "applied": return "bg-green-100 text-green-800";
    case "analyzed": return "bg-blue-100 text-blue-800";
    case "pending": return "bg-amber-100 text-amber-800";
    default: return "bg-gray-100 text-gray-700";
  }
}

function GaugeBar({ label, current, target, unit }: KPITarget) {
  const ratio = target > 0 ? Math.min(current / target, 2) : 0;
  const percentage = Math.min(ratio * 50, 100);
  const isGood = current >= target;
  const barColor = isGood ? "bg-green-500" : current >= target * 0.7 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="mb-4">
      <div className="flex justify-between text-[13px] mb-1">
        <span className="font-semibold text-gray-700">{label}</span>
        <span className={isGood ? "text-green-800" : "text-amber-800"}>
          {current}{unit} / {target}{unit}
        </span>
      </div>
      <div className="bg-gray-200 rounded h-2 overflow-hidden">
        <div
          className={`h-full rounded transition-all duration-300 ${barColor}`}
          style={{ width: `${percentage}%` }}
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
  { type: "opportunity", severity: "info", message: "Email open rate is 41.7% -- above the 35% industry benchmark.", metric: "emailOpenRate", currentValue: 41.7, targetValue: 35, recommendation: "A/B test subject line personalization to push toward 48%." },
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
        setMetrics(DEMO_METRICS); setInsights(DEMO_INSIGHTS); setHistory(DEMO_HISTORY); setIsDemo(true);
      }
    } catch {
      setMetrics(DEMO_METRICS); setInsights(DEMO_INSIGHTS); setHistory(DEMO_HISTORY); setIsDemo(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleRunCycle(type: "daily" | "weekly" | "monthly") {
    setRunning(true);
    try {
      const res = await fetch("/api/feedback/cycle", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type }) });
      const data = await res.json();
      if (data.data) { setHistory((prev) => [data.data, ...prev]); }
      await fetchData();
    } catch { setError("Failed to run feedback cycle"); } finally { setRunning(false); }
  }

  async function handleApply(cycleId: string) {
    try {
      const res = await fetch(`/api/feedback/cycle/${cycleId}/apply`, { method: "POST", headers: { "Content-Type": "application/json" } });
      const data = await res.json();
      if (data.data) { setHistory((prev) => prev.map((c) => (c.id === cycleId ? data.data : c))); }
    } catch { setError("Failed to apply adjustments"); }
  }

  if (loading) {
    return (
      <main className="max-w-[1180px] mx-auto px-6 py-8">
        <p className="text-gray-500 text-sm">Loading feedback data...</p>
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
    <main className="max-w-[1180px] mx-auto px-6 py-8">
      {isDemo && (
        <div className="bg-amber-100 border border-amber-300 rounded-lg px-4 py-2.5 text-sm text-amber-800 mb-6">
          Demo data — Connect your tenant to see live feedback and performance metrics.
        </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 m-0">
          Feedback Loop
        </h1>
        <div className="flex gap-2">
          {(["daily", "weekly", "monthly"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleRunCycle(type)}
              disabled={running}
              className={`border-none rounded-lg px-4 py-2 text-[13px] font-semibold min-h-[36px] ${
                running ? "bg-gray-300 text-white cursor-not-allowed" : "bg-teal-500 text-white cursor-pointer"
              }`}
            >
              Run {type}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div role="alert" className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-red-800 text-[13px]">
          {error}
        </div>
      )}

      <section aria-label="KPI Performance" className="mb-8">
        <h2 className="text-base font-semibold text-gray-700 mb-4">
          Performance vs KPI Targets
        </h2>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          {kpis.map((kpi) => (
            <GaugeBar key={kpi.label} {...kpi} />
          ))}
          {kpis.length === 0 && (
            <p className="text-gray-400 text-[13px] m-0">No metrics available yet.</p>
          )}
        </div>
      </section>

      <section aria-label="Current Insights" className="mb-8">
        <h2 className="text-base font-semibold text-gray-700 mb-4">
          Insights ({insights.length})
        </h2>
        {insights.length === 0 && (
          <p className="text-gray-400 text-[13px]">No insights generated yet. Run a feedback cycle to generate insights.</p>
        )}
        <div className="flex flex-col gap-2">
          {insights.map((insight, i) => {
            const colors = severityColor(insight.severity);
            return (
              <div
                key={i}
                className={`${colors.bg} border ${colors.border} rounded-lg px-4 py-3`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="inline-flex items-center justify-center w-[22px] h-[22px] rounded-full text-white text-xs font-bold"
                    style={{ background: severityRawColor(insight.severity) }}
                  >
                    {typeIcon(insight.type)}
                  </span>
                  <span className={`text-[13px] font-semibold ${colors.color}`}>
                    {insight.severity.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-500">
                    {insight.metric}
                  </span>
                </div>
                <p className="mb-1 text-sm text-gray-900">
                  {insight.message}
                </p>
                <p className="m-0 text-xs text-gray-500">
                  {insight.recommendation}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section aria-label="Feedback Cycle History" className="mb-8">
        <h2 className="text-base font-semibold text-gray-700 mb-4">
          Cycle History
        </h2>
        {history.length === 0 && (
          <p className="text-gray-400 text-[13px]">No feedback cycles run yet.</p>
        )}
        <div className="flex flex-col gap-3">
          {history.map((cycle) => {
            const pendingAdjustments = cycle.adjustments.filter((a) => !a.autoApplied);
            const hasPending = cycle.status !== "applied" && pendingAdjustments.length > 0;

            return (
              <div
                key={cycle.id}
                className="bg-white border border-gray-200 rounded-xl p-4"
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {cycle.type.charAt(0).toUpperCase() + cycle.type.slice(1)} Cycle
                    </span>
                    <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full ${statusBadgeClass(cycle.status)}`}>
                      {cycle.status}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(cycle.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="mb-2 text-xs text-gray-500">
                  Period: {cycle.period} | Insights: {cycle.insights.length} | Adjustments: {cycle.adjustments.length}
                </p>

                {cycle.adjustments.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-semibold text-gray-700 mb-1">
                      Adjustments:
                    </p>
                    <ul className="m-0 pl-4 text-xs text-gray-500">
                      {cycle.adjustments.slice(0, 5).map((adj, i) => (
                        <li key={i} className="mb-0.5">
                          <span className="font-semibold">{adj.type}</span>: {adj.reason}
                          {adj.autoApplied && (
                            <span className="text-green-600 ml-1">(auto-applied)</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {hasPending && (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleApply(cycle.id)}
                      className="bg-teal-500 text-white border-none rounded-md px-3.5 py-1.5 text-xs font-semibold cursor-pointer min-h-[32px]"
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

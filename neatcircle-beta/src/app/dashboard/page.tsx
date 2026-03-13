"use client";

import { useEffect, useState } from "react";

interface Metrics {
  success: boolean;
  generatedAt: string;
  summary: {
    totalRecords: number;
    leadsToday: number;
    leadsThisWeek: number;
    hotLeads: number;
    converted: number;
    conversionRate: number;
    nurtureActive: number;
    errors: number;
  };
  nurtureFunnel: Record<string, number>;
  topNiches: Array<{
    name: string;
    total: number;
    converted: number;
    conversionRate: number;
    hotLeads: number;
  }>;
  topIntakeSources: Array<{ source: string; count: number }>;
  topBehavioralSignals: Array<{ event: string; count: number }>;
  topBlueprints: Array<{ name: string; count: number }>;
  topServices: Array<{ name: string; count: number }>;
  topExperiments: Array<{ name: string; count: number }>;
  topVariants: Array<{ name: string; count: number }>;
  topFunnelSteps: Array<{ name: string; count: number }>;
  topSourceBlueprintPaths: Array<{ name: string; count: number }>;
  traceCoverage: {
    sessionRate: number;
    leadKeyRate: number;
    experimentRate: number;
    blueprintRate: number;
  };
  statusBreakdown: Record<string, number>;
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ background: "#1a1a2e", borderRadius: 12, padding: "24px 20px", minWidth: 160 }}>
      <div style={{ color: "#8b8ba7", fontSize: 13, marginBottom: 4 }}>{label}</div>
      <div style={{ color: "#fff", fontSize: 32, fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ color: "#5865f2", fontSize: 12, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function MetricList({
  title,
  items,
  empty,
}: {
  title: string;
  items: Array<{ name: string; count: number }> | Array<{ source: string; count: number }> | Array<{ event: string; count: number }>;
  empty: string;
}) {
  return (
    <div style={{ background: "#1a1a2e", borderRadius: 12, padding: 24 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>{title}</h2>
      {items.length === 0 ? (
        <p style={{ color: "#8b8ba7" }}>{empty}</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((item) => {
            const label =
              "name" in item ? item.name : "source" in item ? item.source : item.event;
            return (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span style={{ color: "#ccc" }}>{label}</span>
                <strong>{item.count}</strong>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/metrics")
      .then((res) => res.json())
      .then((data: Metrics) => {
        if (data.success) setMetrics(data);
        else setError("Failed to load metrics");
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f0f23", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 18 }}>Loading Lead OS metrics...</div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f0f23", color: "#e74c3c", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div>{error || "No data"}</div>
      </div>
    );
  }

  const {
    summary,
    nurtureFunnel,
    topNiches,
    topIntakeSources,
    topBehavioralSignals,
    topBlueprints,
    topServices,
    topExperiments,
    topVariants,
    topFunnelSteps,
    topSourceBlueprintPaths,
    traceCoverage,
    statusBreakdown,
  } = metrics;

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f23", color: "#fff", padding: 32, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <header style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Lead OS Control Tower</h1>
          <p style={{ color: "#8b8ba7", margin: "4px 0 0", fontSize: 14 }}>
            Last updated: {new Date(metrics.generatedAt).toLocaleString()}
          </p>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 32 }}>
          <StatCard label="Leads Today" value={summary.leadsToday} />
          <StatCard label="Leads This Week" value={summary.leadsThisWeek} />
          <StatCard label="Hot Leads" value={summary.hotLeads} sub="priority >= 80" />
          <StatCard label="Converted" value={summary.converted} sub={`${summary.conversionRate}% rate`} />
          <StatCard label="Nurture Active" value={summary.nurtureActive} />
          <StatCard label="Total Records" value={summary.totalRecords} />
          <StatCard label="Errors" value={summary.errors} />
          <StatCard label="Session Trace" value={`${traceCoverage.sessionRate}%`} />
          <StatCard label="Lead Identity" value={`${traceCoverage.leadKeyRate}%`} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div style={{ background: "#1a1a2e", borderRadius: 12, padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Nurture Funnel</h2>
            {Object.entries(nurtureFunnel).length === 0 ? (
              <p style={{ color: "#8b8ba7" }}>No leads in nurture yet</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Object.entries(nurtureFunnel)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([stage, count]) => (
                    <div key={stage} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#ccc", fontSize: 14 }}>{stage.replace("NURTURE-", "").replace(/_/g, " ")}</span>
                      <span style={{ background: "#5865f2", borderRadius: 12, padding: "2px 10px", fontSize: 13, fontWeight: 600 }}>{count}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div style={{ background: "#1a1a2e", borderRadius: 12, padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Top Niches</h2>
            {topNiches.length === 0 ? (
              <p style={{ color: "#8b8ba7" }}>Not enough data yet</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ color: "#8b8ba7", textAlign: "left" }}>
                    <th style={{ padding: "4px 8px" }}>Niche</th>
                    <th style={{ padding: "4px 8px" }}>Leads</th>
                    <th style={{ padding: "4px 8px" }}>Conv%</th>
                    <th style={{ padding: "4px 8px" }}>Hot</th>
                  </tr>
                </thead>
                <tbody>
                  {topNiches.map((niche) => (
                    <tr key={niche.name} style={{ borderTop: "1px solid #2a2a4a" }}>
                      <td style={{ padding: "6px 8px", color: "#ccc" }}>{niche.name}</td>
                      <td style={{ padding: "6px 8px" }}>{niche.total}</td>
                      <td style={{ padding: "6px 8px", color: niche.conversionRate > 10 ? "#22c55e" : "#f59e0b" }}>
                        {niche.conversionRate}%
                      </td>
                      <td style={{ padding: "6px 8px" }}>{niche.hotLeads}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 24 }}>
          <MetricList title="Top Intake Paths" items={topIntakeSources} empty="No captured leads yet" />
          <MetricList title="Behavioral Signals" items={topBehavioralSignals} empty="No behavioral activity captured yet" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 24 }}>
          <MetricList title="Blueprint Activity" items={topBlueprints} empty="Blueprint attribution starts showing once orchestration events accumulate." />
          <MetricList title="Top Services" items={topServices} empty="No service activity yet" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 24 }}>
          <div style={{ background: "#1a1a2e", borderRadius: 12, padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Experiment Coverage</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#ccc" }}>Experiment IDs</span>
                <strong>{traceCoverage.experimentRate}%</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#ccc" }}>Blueprint IDs</span>
                <strong>{traceCoverage.blueprintRate}%</strong>
              </div>
            </div>
            {topExperiments.length === 0 ? (
              <p style={{ color: "#8b8ba7" }}>Experiments will appear as adaptive experiences accumulate.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {topExperiments.map((item) => (
                  <div key={item.name} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <span style={{ color: "#ccc" }}>{item.name}</span>
                    <strong>{item.count}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ background: "#1a1a2e", borderRadius: 12, padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Variants & Steps</h2>
            {topVariants.length === 0 && topFunnelSteps.length === 0 ? (
              <p style={{ color: "#8b8ba7" }}>Variant and step traces will populate after routed journeys run.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ color: "#8b8ba7", fontSize: 12, textTransform: "uppercase" }}>Variants</div>
                  {topVariants.slice(0, 5).map((item) => (
                    <div key={item.name} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <span style={{ color: "#ccc" }}>{item.name}</span>
                      <strong>{item.count}</strong>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ color: "#8b8ba7", fontSize: 12, textTransform: "uppercase" }}>Funnel Steps</div>
                  {topFunnelSteps.slice(0, 5).map((item) => (
                    <div key={item.name} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <span style={{ color: "#ccc" }}>{item.name}</span>
                      <strong>{item.count}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <MetricList title="Source to Blueprint Paths" items={topSourceBlueprintPaths} empty="Path attribution appears once browser decisions and server intake share trace IDs." />

        <div style={{ background: "#1a1a2e", borderRadius: 12, padding: 24, marginTop: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Status Breakdown</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {Object.entries(statusBreakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([status, count]) => (
                <span
                  key={status}
                  style={{
                    background: status.startsWith("ERROR") ? "#3b1219" : status === "CONVERTED" ? "#14532d" : "#1e1e3f",
                    border: `1px solid ${status.startsWith("ERROR") ? "#7f1d1d" : status === "CONVERTED" ? "#166534" : "#2a2a4a"}`,
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontSize: 12,
                    color: "#ccc",
                  }}
                >
                  {status}: {count}
                </span>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

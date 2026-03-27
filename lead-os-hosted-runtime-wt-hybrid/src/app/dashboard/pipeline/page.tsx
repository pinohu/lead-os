"use client";

import Link from "next/link";
import { useState } from "react";

interface PipelineStage {
  name: string;
  status: "completed" | "failed" | "skipped";
  durationMs: number;
  error?: string;
}

interface PipelineRun {
  id: string;
  leadKey: string;
  niche: string;
  route: string;
  stages: PipelineStage[];
  totalDurationMs: number;
  startedAt: string;
  completedAt: string;
}

interface PipelineStats {
  totalRuns: number;
  avgDurationMs: number;
  stageFailureRates: Record<string, number>;
  routeDistribution: Record<string, number>;
  escalationRate: number;
}

interface TestbedReport {
  id: string;
  nicheSlug: string;
  sampleSize: number;
  routeDistribution: Record<string, number>;
  routePercentages: Record<string, number>;
  averageScores: {
    intent: number;
    fit: number;
    engagement: number;
    urgency: number;
    composite: number;
  };
  avgPipelineDurationMs: number;
  escalationRate: number;
  estimatedRevenuePotential: number;
  recommendations: string[];
}

const NICHE_OPTIONS = [
  "pest-control",
  "immigration-law",
  "roofing",
  "real-estate-syndication",
  "staffing-agency",
];

const STATUS_COLORS: Record<string, string> = {
  completed: "#22c55e",
  failed: "#ef4444",
  skipped: "#eab308",
};

const ROUTE_COLORS: Record<string, string> = {
  "fast-track": "#8b5cf6",
  conversion: "#3b82f6",
  nurture: "#f59e0b",
  drip: "#6b7280",
};

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.7)",
  border: "1px solid rgba(20,33,29,0.08)",
  borderRadius: 12,
  padding: "20px 24px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid rgba(20,33,29,0.15)",
  fontSize: "0.88rem",
  fontFamily: "inherit",
};

const buttonStyle: React.CSSProperties = {
  padding: "10px 20px",
  borderRadius: 8,
  border: "none",
  background: "#14b8a6",
  color: "#fff",
  fontWeight: 700,
  fontSize: "0.88rem",
  cursor: "pointer",
  minHeight: 44,
  minWidth: 44,
};

export default function PipelinePage() {
  const [leadJson, setLeadJson] = useState('{\n  "email": "test@example.com",\n  "source": "organic",\n  "company": "Acme Inc",\n  "pagesViewed": 5,\n  "timeOnSite": 120\n}');
  const [tenantId, setTenantId] = useState("demo-tenant");
  const [niche, setNiche] = useState("pest-control");
  const [pipelineResult, setPipelineResult] = useState<PipelineRun | null>(null);
  const [pipelineLoading, setPipelineLoading] = useState(false);
  const [pipelineError, setPipelineError] = useState<string | null>(null);

  const [recentRuns, setRecentRuns] = useState<PipelineRun[]>([]);
  const [stats, setStats] = useState<PipelineStats | null>(null);

  const [testbedNiche, setTestbedNiche] = useState("pest-control");
  const [testbedSize, setTestbedSize] = useState(10);
  const [testbedReport, setTestbedReport] = useState<TestbedReport | null>(null);
  const [testbedLoading, setTestbedLoading] = useState(false);
  const [testbedError, setTestbedError] = useState<string | null>(null);

  async function handleRunPipeline() {
    setPipelineLoading(true);
    setPipelineError(null);
    setPipelineResult(null);

    try {
      const leadData = JSON.parse(leadJson);
      const res = await fetch("/api/pipeline/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadData, tenantId, nicheSlug: niche }),
      });
      const json = await res.json();
      if (!res.ok) {
        setPipelineError(json.error?.message ?? "Pipeline failed");
        return;
      }
      setPipelineResult(json.data);
      loadHistory();
      loadStats();
    } catch (err: unknown) {
      setPipelineError(err instanceof Error ? err.message : "Failed to run pipeline");
    } finally {
      setPipelineLoading(false);
    }
  }

  async function loadHistory() {
    try {
      const res = await fetch(`/api/pipeline/history?tenantId=${encodeURIComponent(tenantId)}&limit=10`);
      const json = await res.json();
      if (res.ok) setRecentRuns(json.data ?? []);
    } catch {
      // Best effort
    }
  }

  async function loadStats() {
    try {
      const res = await fetch(`/api/pipeline/stats?tenantId=${encodeURIComponent(tenantId)}`);
      const json = await res.json();
      if (res.ok) setStats(json.data ?? null);
    } catch {
      // Best effort
    }
  }

  async function handleRunTestbed() {
    setTestbedLoading(true);
    setTestbedError(null);
    setTestbedReport(null);

    try {
      const res = await fetch("/api/testbed/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nicheSlug: testbedNiche, sampleSize: testbedSize }),
      });
      const json = await res.json();
      if (!res.ok) {
        setTestbedError(json.error?.message ?? "Testbed failed");
        return;
      }
      setTestbedReport(json.data);
    } catch (err: unknown) {
      setTestbedError(err instanceof Error ? err.message : "Failed to run testbed");
    } finally {
      setTestbedLoading(false);
    }
  }

  return (
    <main
      style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 24px" }}
      aria-label="Pipeline dashboard"
    >
      <Link href="/dashboard" style={{ fontSize: "0.82rem", color: "#14b8a6", textDecoration: "none" }}>
        &larr; Dashboard
      </Link>

      <h1 style={{ fontSize: "1.6rem", margin: "16px 0 8px", fontWeight: 800 }}>Revenue Pipeline</h1>
      <p style={{ color: "#666", fontSize: "0.9rem", margin: "0 0 32px" }}>
        Run leads through the full engine pipeline, or calibrate with synthetic data.
      </p>

      {/* Run Pipeline */}
      <section style={cardStyle} aria-labelledby="run-pipeline-heading">
        <h2 id="run-pipeline-heading" style={{ fontSize: "1.1rem", margin: "0 0 16px", fontWeight: 700 }}>Run Pipeline</h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label htmlFor="pipeline-tenant" style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: 4 }}>Tenant ID</label>
            <input id="pipeline-tenant" type="text" value={tenantId} onChange={(e) => setTenantId(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label htmlFor="pipeline-niche" style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: 4 }}>Niche</label>
            <select id="pipeline-niche" value={niche} onChange={(e) => setNiche(e.target.value)} style={inputStyle}>
              {NICHE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label htmlFor="pipeline-lead-json" style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: 4 }}>Lead JSON</label>
          <textarea
            id="pipeline-lead-json"
            value={leadJson}
            onChange={(e) => setLeadJson(e.target.value)}
            rows={8}
            style={{ ...inputStyle, fontFamily: "monospace", fontSize: "0.82rem" }}
          />
        </div>

        <button
          type="button"
          onClick={handleRunPipeline}
          disabled={pipelineLoading}
          style={{ ...buttonStyle, opacity: pipelineLoading ? 0.6 : 1 }}
        >
          {pipelineLoading ? "Running..." : "Run Pipeline"}
        </button>

        {pipelineError && (
          <p role="alert" style={{ color: "#ef4444", marginTop: 12, fontSize: "0.88rem" }}>{pipelineError}</p>
        )}
      </section>

      {/* Pipeline Result */}
      {pipelineResult && (
        <section style={{ ...cardStyle, marginTop: 24 }} aria-labelledby="pipeline-result-heading">
          <h2 id="pipeline-result-heading" style={{ fontSize: "1.1rem", margin: "0 0 16px", fontWeight: 700 }}>
            Pipeline Result
          </h2>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
            <div style={{ background: ROUTE_COLORS[pipelineResult.route] ?? "#6b7280", color: "#fff", padding: "6px 14px", borderRadius: 999, fontWeight: 700, fontSize: "0.82rem" }}>
              Route: {pipelineResult.route}
            </div>
            <div style={{ background: "#f3f4f6", padding: "6px 14px", borderRadius: 999, fontSize: "0.82rem" }}>
              Duration: {pipelineResult.totalDurationMs}ms
            </div>
            <div style={{ background: "#f3f4f6", padding: "6px 14px", borderRadius: 999, fontSize: "0.82rem" }}>
              Lead: {pipelineResult.leadKey.slice(0, 12)}...
            </div>
          </div>

          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: "0 0 8px" }}>Stage Results</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {pipelineResult.stages.map((stage) => (
              <div
                key={stage.name}
                title={stage.error ?? `${stage.durationMs}ms`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: `1px solid ${STATUS_COLORS[stage.status]}33`,
                  background: `${STATUS_COLORS[stage.status]}11`,
                  fontSize: "0.8rem",
                }}
              >
                <span
                  aria-label={`${stage.name} ${stage.status}`}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: STATUS_COLORS[stage.status],
                    display: "inline-block",
                  }}
                />
                {stage.name}
                <span style={{ color: "#999", fontSize: "0.75rem" }}>{stage.durationMs}ms</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Stats */}
      {stats && stats.totalRuns > 0 && (
        <section style={{ ...cardStyle, marginTop: 24 }} aria-labelledby="stats-heading">
          <h2 id="stats-heading" style={{ fontSize: "1.1rem", margin: "0 0 16px", fontWeight: 700 }}>Pipeline Stats</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
            <div>
              <div style={{ fontSize: "0.78rem", color: "#888", fontWeight: 600 }}>Total Runs</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 800 }}>{stats.totalRuns}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.78rem", color: "#888", fontWeight: 600 }}>Avg Duration</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 800 }}>{stats.avgDurationMs}ms</div>
            </div>
            <div>
              <div style={{ fontSize: "0.78rem", color: "#888", fontWeight: 600 }}>Escalation Rate</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 800 }}>{Math.round(stats.escalationRate * 100)}%</div>
            </div>
            {Object.entries(stats.routeDistribution).map(([route, count]) => (
              <div key={route}>
                <div style={{ fontSize: "0.78rem", color: "#888", fontWeight: 600 }}>{route}</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: ROUTE_COLORS[route] ?? "#333" }}>{count}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Runs */}
      {recentRuns.length > 0 && (
        <section style={{ ...cardStyle, marginTop: 24 }} aria-labelledby="recent-runs-heading">
          <h2 id="recent-runs-heading" style={{ fontSize: "1.1rem", margin: "0 0 16px", fontWeight: 700 }}>Recent Runs</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <th scope="col" style={{ textAlign: "left", padding: "8px 4px", fontWeight: 700 }}>Lead</th>
                <th scope="col" style={{ textAlign: "left", padding: "8px 4px", fontWeight: 700 }}>Niche</th>
                <th scope="col" style={{ textAlign: "left", padding: "8px 4px", fontWeight: 700 }}>Route</th>
                <th scope="col" style={{ textAlign: "right", padding: "8px 4px", fontWeight: 700 }}>Duration</th>
                <th scope="col" style={{ textAlign: "right", padding: "8px 4px", fontWeight: 700 }}>Stages</th>
              </tr>
            </thead>
            <tbody>
              {recentRuns.map((run) => (
                <tr key={run.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "8px 4px" }}>{run.leadKey.slice(0, 12)}...</td>
                  <td style={{ padding: "8px 4px" }}>{run.niche}</td>
                  <td style={{ padding: "8px 4px" }}>
                    <span style={{ color: ROUTE_COLORS[run.route] ?? "#333", fontWeight: 700 }}>{run.route}</span>
                  </td>
                  <td style={{ padding: "8px 4px", textAlign: "right" }}>{run.totalDurationMs}ms</td>
                  <td style={{ padding: "8px 4px", textAlign: "right" }}>
                    {run.stages.filter((s) => s.status === "completed").length}/{run.stages.length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Testbed */}
      <section style={{ ...cardStyle, marginTop: 32 }} aria-labelledby="testbed-heading">
        <h2 id="testbed-heading" style={{ fontSize: "1.1rem", margin: "0 0 16px", fontWeight: 700 }}>Vertical Testbed</h2>
        <p style={{ color: "#666", fontSize: "0.85rem", margin: "0 0 16px" }}>
          Run synthetic leads through the pipeline to calibrate scoring, routing, and offers.
        </p>

        <div style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 16 }}>
          <div>
            <label htmlFor="testbed-niche" style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: 4 }}>Niche</label>
            <select id="testbed-niche" value={testbedNiche} onChange={(e) => setTestbedNiche(e.target.value)} style={inputStyle}>
              {NICHE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="testbed-size" style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: 4 }}>Sample Size</label>
            <input
              id="testbed-size"
              type="number"
              min={1}
              max={100}
              value={testbedSize}
              onChange={(e) => setTestbedSize(parseInt(e.target.value, 10) || 10)}
              style={{ ...inputStyle, width: 100 }}
            />
          </div>
          <button
            type="button"
            onClick={handleRunTestbed}
            disabled={testbedLoading}
            style={{ ...buttonStyle, background: "#8b5cf6", opacity: testbedLoading ? 0.6 : 1 }}
          >
            {testbedLoading ? "Running..." : "Run Testbed"}
          </button>
        </div>

        {testbedError && (
          <p role="alert" style={{ color: "#ef4444", fontSize: "0.88rem" }}>{testbedError}</p>
        )}
      </section>

      {/* Testbed Report */}
      {testbedReport && (
        <section style={{ ...cardStyle, marginTop: 24 }} aria-labelledby="testbed-report-heading">
          <h2 id="testbed-report-heading" style={{ fontSize: "1.1rem", margin: "0 0 16px", fontWeight: 700 }}>
            Calibration Report: {testbedReport.nicheSlug}
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: "0.78rem", color: "#888", fontWeight: 600 }}>Sample Size</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 800 }}>{testbedReport.sampleSize}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.78rem", color: "#888", fontWeight: 600 }}>Avg Duration</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 800 }}>{testbedReport.avgPipelineDurationMs}ms</div>
            </div>
            <div>
              <div style={{ fontSize: "0.78rem", color: "#888", fontWeight: 600 }}>Escalation Rate</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 800 }}>{Math.round(testbedReport.escalationRate * 100)}%</div>
            </div>
            <div>
              <div style={{ fontSize: "0.78rem", color: "#888", fontWeight: 600 }}>Revenue Potential</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 800 }}>${testbedReport.estimatedRevenuePotential.toLocaleString()}</div>
            </div>
          </div>

          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: "0 0 8px" }}>Route Distribution</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
            {Object.entries(testbedReport.routePercentages).map(([route, pct]) => (
              <div
                key={route}
                style={{
                  background: ROUTE_COLORS[route] ?? "#6b7280",
                  color: "#fff",
                  padding: "8px 16px",
                  borderRadius: 8,
                  fontSize: "0.85rem",
                  fontWeight: 700,
                }}
              >
                {route}: {pct}% ({testbedReport.routeDistribution[route]})
              </div>
            ))}
          </div>

          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: "0 0 8px" }}>Average Scores</h3>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
            {Object.entries(testbedReport.averageScores).map(([dim, score]) => (
              <div key={dim} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.75rem", color: "#888", fontWeight: 600, marginBottom: 2 }}>{dim}</div>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  border: `3px solid ${score >= 60 ? "#22c55e" : score >= 30 ? "#f59e0b" : "#ef4444"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "1rem",
                }}>
                  {score}
                </div>
              </div>
            ))}
          </div>

          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: "0 0 8px" }}>Recommendations</h3>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {testbedReport.recommendations.map((rec, i) => (
              <li key={i} style={{ fontSize: "0.85rem", marginBottom: 6, color: "#444" }}>{rec}</li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

const STATUS_CLASSES: Record<string, string> = {
  completed: "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400",
  failed: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
  skipped: "border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
};

const STATUS_DOT: Record<string, string> = {
  completed: "bg-green-500",
  failed: "bg-red-500",
  skipped: "bg-yellow-500",
};

const ROUTE_CLASSES: Record<string, string> = {
  "fast-track": "bg-violet-500",
  conversion: "bg-blue-500",
  nurture: "bg-amber-500",
  drip: "bg-gray-500",
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
    <main className="max-w-[1180px] mx-auto px-6 py-8 space-y-6" aria-label="Pipeline dashboard">
      <Link href="/dashboard" className="text-xs text-primary hover:underline">
        &larr; Dashboard
      </Link>

      <div>
        <h1 className="text-2xl font-extrabold mt-4 mb-2">Revenue Pipeline</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Run leads through the full engine pipeline, or calibrate with synthetic data.
        </p>
      </div>

      {/* Run Pipeline */}
      <Card aria-labelledby="run-pipeline-heading">
        <CardContent className="pt-6 space-y-4">
          <h2 id="run-pipeline-heading" className="text-lg font-bold">Run Pipeline</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="pipeline-tenant" className="block text-xs font-semibold mb-1">Tenant ID</label>
              <input
                id="pipeline-tenant"
                type="text"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm font-inherit"
              />
            </div>
            <div>
              <label htmlFor="pipeline-niche" className="block text-xs font-semibold mb-1">Niche</label>
              <select
                id="pipeline-niche"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm"
              >
                {NICHE_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="pipeline-lead-json" className="block text-xs font-semibold mb-1">Lead JSON</label>
            <textarea
              id="pipeline-lead-json"
              value={leadJson}
              onChange={(e) => setLeadJson(e.target.value)}
              rows={8}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono"
            />
          </div>

          <Button
            onClick={handleRunPipeline}
            disabled={pipelineLoading}
          >
            {pipelineLoading ? "Running..." : "Run Pipeline"}
          </Button>

          {pipelineError && (
            <p role="alert" className="text-sm text-destructive mt-3">{pipelineError}</p>
          )}
        </CardContent>
      </Card>

      {/* Pipeline Result */}
      {pipelineResult && (
        <Card aria-labelledby="pipeline-result-heading">
          <CardContent className="pt-6 space-y-4">
            <h2 id="pipeline-result-heading" className="text-lg font-bold">Pipeline Result</h2>

            <div className="flex gap-3 flex-wrap">
              <span className={`${ROUTE_CLASSES[pipelineResult.route] ?? "bg-gray-500"} text-white px-3.5 py-1.5 rounded-full text-xs font-bold`}>
                Route: {pipelineResult.route}
              </span>
              <span className="bg-muted px-3.5 py-1.5 rounded-full text-xs">
                Duration: {pipelineResult.totalDurationMs}ms
              </span>
              <span className="bg-muted px-3.5 py-1.5 rounded-full text-xs">
                Lead: {pipelineResult.leadKey.slice(0, 12)}...
              </span>
            </div>

            <h3 className="text-sm font-bold">Stage Results</h3>
            <div className="flex flex-wrap gap-2">
              {pipelineResult.stages.map((stage) => (
                <div
                  key={stage.name}
                  title={stage.error ?? `${stage.durationMs}ms`}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs ${STATUS_CLASSES[stage.status]}`}
                >
                  <span
                    aria-label={`${stage.name} ${stage.status}`}
                    className={`w-2.5 h-2.5 rounded-full inline-block ${STATUS_DOT[stage.status]}`}
                  />
                  {stage.name}
                  <span className="text-muted-foreground text-[0.75rem]">{stage.durationMs}ms</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {stats && stats.totalRuns > 0 && (
        <Card aria-labelledby="stats-heading">
          <CardContent className="pt-6 space-y-4">
            <h2 id="stats-heading" className="text-lg font-bold">Pipeline Stats</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-muted-foreground font-semibold">Total Runs</div>
                <div className="text-2xl font-extrabold">{stats.totalRuns}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground font-semibold">Avg Duration</div>
                <div className="text-2xl font-extrabold">{stats.avgDurationMs}ms</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground font-semibold">Escalation Rate</div>
                <div className="text-2xl font-extrabold">{Math.round(stats.escalationRate * 100)}%</div>
              </div>
              {Object.entries(stats.routeDistribution).map(([route, count]) => (
                <div key={route}>
                  <div className="text-xs text-muted-foreground font-semibold">{route}</div>
                  <div className="text-2xl font-extrabold">{count}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Runs */}
      {recentRuns.length > 0 && (
        <Card aria-labelledby="recent-runs-heading">
          <CardContent className="pt-6 space-y-4">
            <h2 id="recent-runs-heading" className="text-lg font-bold">Recent Runs</h2>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="text-left p-2 font-bold">Lead</th>
                  <th scope="col" className="text-left p-2 font-bold">Niche</th>
                  <th scope="col" className="text-left p-2 font-bold">Route</th>
                  <th scope="col" className="text-right p-2 font-bold">Duration</th>
                  <th scope="col" className="text-right p-2 font-bold">Stages</th>
                </tr>
              </thead>
              <tbody>
                {recentRuns.map((run) => (
                  <tr key={run.id} className="border-b border-border/40">
                    <td className="p-2">{run.leadKey.slice(0, 12)}...</td>
                    <td className="p-2">{run.niche}</td>
                    <td className="p-2 font-bold">{run.route}</td>
                    <td className="p-2 text-right">{run.totalDurationMs}ms</td>
                    <td className="p-2 text-right">
                      {run.stages.filter((s) => s.status === "completed").length}/{run.stages.length}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Testbed */}
      <Card aria-labelledby="testbed-heading">
        <CardContent className="pt-6 space-y-4">
          <h2 id="testbed-heading" className="text-lg font-bold">Vertical Testbed</h2>
          <p className="text-sm text-muted-foreground">
            Run synthetic leads through the pipeline to calibrate scoring, routing, and offers.
          </p>

          <div className="flex gap-4 items-end flex-wrap">
            <div>
              <label htmlFor="testbed-niche" className="block text-xs font-semibold mb-1">Niche</label>
              <select
                id="testbed-niche"
                value={testbedNiche}
                onChange={(e) => setTestbedNiche(e.target.value)}
                className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
              >
                {NICHE_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="testbed-size" className="block text-xs font-semibold mb-1">Sample Size</label>
              <input
                id="testbed-size"
                type="number"
                min={1}
                max={100}
                value={testbedSize}
                onChange={(e) => setTestbedSize(parseInt(e.target.value, 10) || 10)}
                className="w-24 h-9 rounded-lg border border-border bg-background px-3 text-sm"
              />
            </div>
            <Button
              onClick={handleRunTestbed}
              disabled={testbedLoading}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {testbedLoading ? "Running..." : "Run Testbed"}
            </Button>
          </div>

          {testbedError && (
            <p role="alert" className="text-sm text-destructive">{testbedError}</p>
          )}
        </CardContent>
      </Card>

      {/* Testbed Report */}
      {testbedReport && (
        <Card aria-labelledby="testbed-report-heading">
          <CardContent className="pt-6 space-y-6">
            <h2 id="testbed-report-heading" className="text-lg font-bold">
              Calibration Report: {testbedReport.nicheSlug}
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-muted-foreground font-semibold">Sample Size</div>
                <div className="text-2xl font-extrabold">{testbedReport.sampleSize}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground font-semibold">Avg Duration</div>
                <div className="text-2xl font-extrabold">{testbedReport.avgPipelineDurationMs}ms</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground font-semibold">Escalation Rate</div>
                <div className="text-2xl font-extrabold">{Math.round(testbedReport.escalationRate * 100)}%</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground font-semibold">Revenue Potential</div>
                <div className="text-2xl font-extrabold">${testbedReport.estimatedRevenuePotential.toLocaleString()}</div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold mb-2">Route Distribution</h3>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(testbedReport.routePercentages).map(([route, pct]) => (
                  <div
                    key={route}
                    className={`${ROUTE_CLASSES[route] ?? "bg-gray-500"} text-white px-4 py-2 rounded-lg text-sm font-bold`}
                  >
                    {route}: {pct}% ({testbedReport.routeDistribution[route]})
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold mb-2">Average Scores</h3>
              <div className="flex gap-3 flex-wrap">
                {Object.entries(testbedReport.averageScores).map(([dim, score]) => (
                  <div key={dim} className="text-center">
                    <div className="text-[0.75rem] text-muted-foreground font-semibold mb-0.5">{dim}</div>
                    <div className={`w-14 h-14 rounded-full border-[3px] flex items-center justify-center font-extrabold text-base ${
                      score >= 60 ? "border-green-500" : score >= 30 ? "border-amber-500" : "border-red-500"
                    }`}>
                      {score}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold mb-2">Recommendations</h3>
              <ul className="list-disc pl-5 space-y-1.5">
                {testbedReport.recommendations.map((rec, i) => (
                  <li key={i} className="text-sm text-muted-foreground">{rec}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}

"use client";

import { useState } from "react";

type SmokeResult = {
  route: string;
  method: string;
  ok: boolean;
  status: number;
  payload?: unknown;
};

type SmokeResponse = {
  success: boolean;
  total?: number;
  passed?: number;
  failed?: number;
  results?: SmokeResult[];
  error?: string;
};

export default function AutomationSmokeLab() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SmokeResponse | null>(null);

  async function runSmoke() {
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch("/api/automations/smoke", { method: "POST" });
      const payload = (await response.json()) as SmokeResponse;
      setResult(payload);
    } catch {
      setResult({ success: false, error: "Smoke run failed." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-4">
        <div className="font-semibold text-white">Dry-run automation verification</div>
        <p className="mt-2 text-sm text-slate-300">
          Runs fixture payloads through the live automation routes without creating real CRM records.
          This verifies validation, routing, and response contracts safely.
        </p>
      </div>

      <button
        onClick={runSmoke}
        disabled={loading}
        className="rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-navy transition hover:bg-emerald-300 disabled:opacity-50"
      >
        {loading ? "Running Smoke Tests..." : "Run Automation Smoke Tests"}
      </button>

      {result?.error && (
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
          {result.error}
        </div>
      )}

      {result?.results && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Metric label="Total" value={String(result.total ?? 0)} />
            <Metric label="Passed" value={String(result.passed ?? 0)} />
            <Metric label="Failed" value={String(result.failed ?? 0)} />
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <div className="grid grid-cols-[2fr_1fr_1fr] gap-4 border-b border-white/10 px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-400">
              <div>Route</div>
              <div>Status</div>
              <div>Method</div>
            </div>
            {result.results.map((entry) => (
              <div
                key={entry.route}
                className="grid grid-cols-[2fr_1fr_1fr] gap-4 border-b border-white/5 px-4 py-3 text-sm text-slate-200 last:border-b-0"
              >
                <div className="font-mono text-xs">{entry.route}</div>
                <div className={entry.ok ? "text-emerald-300" : "text-red-300"}>
                  {entry.status} {entry.ok ? "PASS" : "FAIL"}
                </div>
                <div>{entry.method}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-cyan">{label}</div>
      <div className="mt-2 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}

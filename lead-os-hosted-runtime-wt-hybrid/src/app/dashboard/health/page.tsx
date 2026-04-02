"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface HealthFactor {
  loginFrequency: number;
  featureAdoption: number;
  leadVolume: number;
  configCompleteness: number;
  integrationCount: number;
}

interface HealthScore {
  tenantId: string;
  score: number;
  factors: HealthFactor;
  riskLevel: "healthy" | "at-risk" | "churning";
  lastCalculatedAt: string;
}

interface FeatureUsageItem {
  tenantId: string;
  feature: string;
  lastUsedAt: string;
  usageCount: number;
  uniqueUsers: number;
}

interface HealthData {
  healthScore: HealthScore;
  featureUsage: FeatureUsageItem[];
}

interface AtRiskData {
  atRiskTenants: HealthScore[];
}

const DEMO_AT_RISK: AtRiskData = {
  atRiskTenants: [
    { tenantId: "tenant-acme-roofing", score: 28, factors: { loginFrequency: 15, featureAdoption: 30, leadVolume: 20, configCompleteness: 40, integrationCount: 35 }, riskLevel: "churning", lastCalculatedAt: "2026-03-30T08:00:00Z" },
    { tenantId: "tenant-swift-hvac", score: 54, factors: { loginFrequency: 50, featureAdoption: 45, leadVolume: 60, configCompleteness: 55, integrationCount: 62 }, riskLevel: "at-risk", lastCalculatedAt: "2026-03-30T08:00:00Z" },
    { tenantId: "tenant-green-lawn", score: 61, factors: { loginFrequency: 65, featureAdoption: 55, leadVolume: 70, configCompleteness: 60, integrationCount: 50 }, riskLevel: "at-risk", lastCalculatedAt: "2026-03-30T08:00:00Z" },
  ],
};

const DEMO_HEALTH: HealthData = {
  healthScore: { tenantId: "demo-tenant", score: 78, factors: { loginFrequency: 82, featureAdoption: 71, leadVolume: 90, configCompleteness: 68, integrationCount: 75 }, riskLevel: "healthy", lastCalculatedAt: "2026-03-30T08:00:00Z" },
  featureUsage: [
    { tenantId: "demo-tenant", feature: "dashboard.viewed", lastUsedAt: "2026-03-30T07:55:00Z", usageCount: 142, uniqueUsers: 3 },
    { tenantId: "demo-tenant", feature: "lead.captured", lastUsedAt: "2026-03-30T06:30:00Z", usageCount: 89, uniqueUsers: 2 },
    { tenantId: "demo-tenant", feature: "lead.exported", lastUsedAt: "2026-03-29T15:20:00Z", usageCount: 12, uniqueUsers: 2 },
    { tenantId: "demo-tenant", feature: "email.sent", lastUsedAt: "2026-03-30T08:00:00Z", usageCount: 204, uniqueUsers: 2 },
    { tenantId: "demo-tenant", feature: "scoring.configured", lastUsedAt: "2026-03-28T11:00:00Z", usageCount: 7, uniqueUsers: 1 },
    { tenantId: "demo-tenant", feature: "webhook.configured", lastUsedAt: "2026-03-25T14:30:00Z", usageCount: 3, uniqueUsers: 1 },
    { tenantId: "demo-tenant", feature: "attribution.viewed", lastUsedAt: "2026-03-27T09:00:00Z", usageCount: 21, uniqueUsers: 2 },
  ],
};

const KNOWN_FEATURES = [
  "dashboard.viewed",
  "lead.captured",
  "lead.exported",
  "experiment.created",
  "webhook.configured",
  "email.sent",
  "attribution.viewed",
  "scoring.configured",
  "lead-magnet.created",
  "marketplace.listed",
  "automation.configured",
  "billing.updated",
];

const RISK_COLORS: Record<string, string> = {
  healthy: "#22c55e",
  "at-risk": "#f59e0b",
  churning: "#ef4444",
};

const FACTOR_LABELS: Record<string, string> = {
  loginFrequency: "Login Frequency",
  featureAdoption: "Feature Adoption",
  leadVolume: "Lead Volume",
  configCompleteness: "Config Completeness",
  integrationCount: "Integrations",
};

function ScoreGauge({ score, riskLevel }: { score: number; riskLevel: string }) {
  const color = RISK_COLORS[riskLevel] ?? "#6b7280";
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="120" height="120" viewBox="0 0 120 120" role="img" aria-label={`Health score: ${score} out of 100, status: ${riskLevel}`}>
        <circle cx="60" cy="60" r="45" fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle
          cx="60" cy="60" r="45" fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 60 60)"
        />
        <text x="60" y="56" textAnchor="middle" fontSize="28" fontWeight="bold" fill={color}>{score}</text>
        <text x="60" y="74" textAnchor="middle" fontSize="11" fill="#6b7280">/ 100</text>
      </svg>
      <span
        className="inline-block px-2.5 py-0.5 rounded-xl text-[13px] font-semibold text-white capitalize"
        style={{ backgroundColor: color }}
      >
        {riskLevel}
      </span>
    </div>
  );
}

function FactorBar({ label, value }: { label: string; value: number }) {
  const barColor = value >= 60 ? "bg-green-500" : value >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="mb-2.5">
      <div className="flex justify-between text-[13px] mb-0.5">
        <span>{label}</span>
        <span className="font-semibold">{value}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded overflow-hidden">
        <div
          className={`h-full rounded transition-all duration-300 ${barColor}`}
          style={{ width: `${value}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label}: ${value}%`}
        />
      </div>
    </div>
  );
}

export default function HealthDashboardPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [atRisk, setAtRisk] = useState<AtRiskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [tenantId, setTenantId] = useState("");
  const [inputTenantId, setInputTenantId] = useState("");

  useEffect(() => {
    fetch("/api/analytics/health", { credentials: "include" })
      .then((res) => res.ok ? res.json() : null)
      .then((json) => {
        if (json?.data) { setAtRisk(json.data); } else { setAtRisk(DEMO_AT_RISK); setData(DEMO_HEALTH); setIsDemo(true); }
        setLoading(false);
      })
      .catch(() => { setAtRisk(DEMO_AT_RISK); setData(DEMO_HEALTH); setIsDemo(true); setLoading(false); });
  }, []);

  function handleLookup() {
    const id = inputTenantId.trim();
    if (!id) return;
    setTenantId(id);
    setLoading(true);
    fetch(`/api/analytics/health?tenantId=${encodeURIComponent(id)}`, { credentials: "include" })
      .then((res) => res.ok ? res.json() : null)
      .then((json) => { setData(json?.data ?? DEMO_HEALTH); if (!json?.data) setIsDemo(true); setLoading(false); })
      .catch(() => { setData(DEMO_HEALTH); setIsDemo(true); setLoading(false); });
  }

  if (loading && !data && !atRisk) {
    return (
      <main className="experience-page">
        <section className="rounded-xl border border-border bg-card p-6">
          <p className="muted">Loading health data...</p>
        </section>
      </main>
    );
  }

  const usedFeatures = new Set(data?.featureUsage.map((f) => f.feature) ?? []);

  return (
    <main className="experience-page">
      {isDemo && (
        <div className="bg-amber-100 border-b border-amber-300 px-6 py-2.5 text-sm text-amber-800">
          Demo data — Sign in as an operator to see live tenant health scores.{" "}
          <Link href="/auth/sign-in" className="text-amber-800 underline">Sign in</Link>
        </div>
      )}
      <section className="rounded-xl border border-border bg-card p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Product Analytics</p>
        <h1>Tenant Health</h1>
        <p className="muted">Monitor tenant engagement, feature adoption, and churn risk.</p>
      </section>

      <section className="rounded-xl border border-border bg-card p-6 mt-6">
        <h2>Lookup Tenant</h2>
        <div className="flex gap-2 mt-3">
          <label htmlFor="tenant-id-input" className="sr-only">Tenant ID</label>
          <input
            id="tenant-id-input"
            type="text"
            placeholder="Enter tenant ID"
            value={inputTenantId}
            onChange={(e) => setInputTenantId(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleLookup(); }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <button
            type="button"
            onClick={handleLookup}
            className="px-5 py-2 bg-teal-500 text-white border-none rounded-md text-sm font-semibold cursor-pointer min-h-[44px] min-w-[44px]"
          >
            Check Health
          </button>
        </div>
      </section>

      {data && (
        <>
          <section className="rounded-xl border border-border bg-card p-6 mt-6">
            <h2>Health Score</h2>
            <p className="muted mb-4">Tenant: {tenantId}</p>
            <div className="flex gap-10 flex-wrap items-start">
              <ScoreGauge score={data.healthScore.score} riskLevel={data.healthScore.riskLevel} />
              <div className="flex-1 min-w-[240px]">
                {Object.entries(data.healthScore.factors).map(([key, value]) => (
                  <FactorBar key={key} label={FACTOR_LABELS[key] ?? key} value={value} />
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-6 mt-6">
            <h2>Feature Adoption</h2>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3 mt-3">
              {KNOWN_FEATURES.map((feature) => {
                const isUsed = usedFeatures.has(feature);
                const usage = data.featureUsage.find((f) => f.feature === feature);
                return (
                  <div
                    key={feature}
                    className={`px-4 py-3 rounded-lg border ${isUsed ? "border-green-500 bg-green-50" : "border-gray-200 bg-gray-50"}`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[13px] font-medium">{feature}</span>
                      <span className={`text-[11px] font-semibold ${isUsed ? "text-green-500" : "text-gray-400"}`}>
                        {isUsed ? "Active" : "Unused"}
                      </span>
                    </div>
                    {usage && (
                      <div className="text-[11px] text-gray-500 mt-1">
                        {usage.usageCount} uses, {usage.uniqueUsers} user{usage.uniqueUsers !== 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-6 mt-6">
            <h2>Config Completeness Checklist</h2>
            <ul className="list-none p-0 mt-3">
              {[
                { label: "Scoring configured", feature: "scoring.configured" },
                { label: "Webhook configured", feature: "webhook.configured" },
                { label: "Automation configured", feature: "automation.configured" },
                { label: "Email sending active", feature: "email.sent" },
                { label: "Lead magnet created", feature: "lead-magnet.created" },
              ].map((item) => {
                const done = usedFeatures.has(item.feature);
                return (
                  <li
                    key={item.feature}
                    className="flex items-center gap-2.5 py-2 border-b border-gray-100"
                  >
                    <span
                      className={`w-5 h-5 rounded inline-flex items-center justify-center text-xs font-bold text-white shrink-0 ${done ? "bg-green-500" : "bg-gray-200"}`}
                      role="img"
                      aria-label={done ? "Completed" : "Not completed"}
                    >
                      {done ? "\u2713" : ""}
                    </span>
                    <span className={`text-sm ${done ? "text-gray-900" : "text-gray-400"}`}>{item.label}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}

      {atRisk && atRisk.atRiskTenants.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-6 mt-6">
          <h2>At-Risk Tenants</h2>
          <p className="muted mb-3">Tenants with health score below 40 that may churn.</p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200 text-left">
                  <th scope="col" className="px-3 py-2">Tenant ID</th>
                  <th scope="col" className="px-3 py-2">Score</th>
                  <th scope="col" className="px-3 py-2">Risk Level</th>
                  <th scope="col" className="px-3 py-2">Login Freq.</th>
                  <th scope="col" className="px-3 py-2">Feature Adoption</th>
                  <th scope="col" className="px-3 py-2">Lead Volume</th>
                </tr>
              </thead>
              <tbody>
                {atRisk.atRiskTenants.map((tenant) => (
                  <tr key={tenant.tenantId} className="border-b border-gray-100">
                    <td className="px-3 py-2 font-mono text-xs">
                      {tenant.tenantId.slice(0, 12)}...
                    </td>
                    <td className="px-3 py-2 font-semibold">{tenant.score}</td>
                    <td className="px-3 py-2">
                      <span
                        className="inline-block px-2 py-0.5 rounded-[10px] text-xs font-semibold text-white capitalize"
                        style={{ backgroundColor: RISK_COLORS[tenant.riskLevel] ?? "#6b7280" }}
                      >
                        {tenant.riskLevel}
                      </span>
                    </td>
                    <td className="px-3 py-2">{tenant.factors.loginFrequency}%</td>
                    <td className="px-3 py-2">{tenant.factors.featureAdoption}%</td>
                    <td className="px-3 py-2">{tenant.factors.leadVolume}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {atRisk && atRisk.atRiskTenants.length === 0 && !data && (
        <section className="rounded-xl border border-border bg-card p-6 mt-6">
          <h2>All Tenants Healthy</h2>
          <p className="muted">No tenants are currently at risk of churning. Enter a tenant ID above to view detailed health data.</p>
        </section>
      )}
    </main>
  );
}

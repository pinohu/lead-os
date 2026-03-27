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
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg width="120" height="120" viewBox="0 0 120 120" role="img" aria-label={`Health score: ${score} out of 100, status: ${riskLevel}`}>
        <circle cx="60" cy="60" r="45" fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r="45"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
        />
        <text x="60" y="56" textAnchor="middle" fontSize="28" fontWeight="bold" fill={color}>
          {score}
        </text>
        <text x="60" y="74" textAnchor="middle" fontSize="11" fill="#6b7280">
          / 100
        </text>
      </svg>
      <span
        style={{
          display: "inline-block",
          padding: "2px 10px",
          borderRadius: 12,
          fontSize: 13,
          fontWeight: 600,
          color: "#fff",
          backgroundColor: color,
          textTransform: "capitalize",
        }}
      >
        {riskLevel}
      </span>
    </div>
  );
}

function FactorBar({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
        <span>{label}</span>
        <span style={{ fontWeight: 600 }}>{value}%</span>
      </div>
      <div style={{ height: 8, backgroundColor: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${value}%`,
            backgroundColor: value >= 60 ? "#22c55e" : value >= 40 ? "#f59e0b" : "#ef4444",
            borderRadius: 4,
            transition: "width 0.3s",
          }}
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
  const [error, setError] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState("");
  const [inputTenantId, setInputTenantId] = useState("");

  useEffect(() => {
    fetch("/api/analytics/health", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load health data: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        setAtRisk(json.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      });
  }, []);

  function handleLookup() {
    const id = inputTenantId.trim();
    if (!id) return;
    setTenantId(id);
    setLoading(true);
    setError(null);

    fetch(`/api/analytics/health?tenantId=${encodeURIComponent(id)}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load health data: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        setData(json.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      });
  }

  if (loading && !data && !atRisk) {
    return (
      <main className="experience-page">
        <section className="panel">
          <p className="muted">Loading health data...</p>
        </section>
      </main>
    );
  }

  if (error && !data && !atRisk) {
    return (
      <main className="experience-page">
        <section className="panel">
          <p className="eyebrow">Error</p>
          <h2>Failed to load health data</h2>
          <p className="muted">{error}</p>
          <div className="cta-row">
            <Link href="/dashboard" className="secondary">Back to dashboard</Link>
          </div>
        </section>
      </main>
    );
  }

  const usedFeatures = new Set(data?.featureUsage.map((f) => f.feature) ?? []);

  return (
    <main className="experience-page">
      <section className="panel">
        <p className="eyebrow">Product Analytics</p>
        <h1>Tenant Health</h1>
        <p className="muted">Monitor tenant engagement, feature adoption, and churn risk.</p>
      </section>

      <section className="panel" style={{ marginTop: 24 }}>
        <h2>Lookup Tenant</h2>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <label htmlFor="tenant-id-input" className="sr-only">Tenant ID</label>
          <input
            id="tenant-id-input"
            type="text"
            placeholder="Enter tenant ID"
            value={inputTenantId}
            onChange={(e) => setInputTenantId(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleLookup(); }}
            style={{
              flex: 1,
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              fontSize: 14,
            }}
          />
          <button
            type="button"
            onClick={handleLookup}
            style={{
              padding: "8px 20px",
              backgroundColor: "#14b8a6",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              minHeight: 44,
              minWidth: 44,
            }}
          >
            Check Health
          </button>
        </div>
      </section>

      {data && (
        <>
          <section className="panel" style={{ marginTop: 24 }}>
            <h2>Health Score</h2>
            <p className="muted" style={{ marginBottom: 16 }}>Tenant: {tenantId}</p>
            <div style={{ display: "flex", gap: 40, flexWrap: "wrap", alignItems: "flex-start" }}>
              <ScoreGauge score={data.healthScore.score} riskLevel={data.healthScore.riskLevel} />
              <div style={{ flex: 1, minWidth: 240 }}>
                {Object.entries(data.healthScore.factors).map(([key, value]) => (
                  <FactorBar key={key} label={FACTOR_LABELS[key] ?? key} value={value} />
                ))}
              </div>
            </div>
          </section>

          <section className="panel" style={{ marginTop: 24 }}>
            <h2>Feature Adoption</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginTop: 12 }}>
              {KNOWN_FEATURES.map((feature) => {
                const isUsed = usedFeatures.has(feature);
                const usage = data.featureUsage.find((f) => f.feature === feature);
                return (
                  <div
                    key={feature}
                    style={{
                      padding: "12px 16px",
                      border: `1px solid ${isUsed ? "#22c55e" : "#e5e7eb"}`,
                      borderRadius: 8,
                      backgroundColor: isUsed ? "#f0fdf4" : "#fafafa",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{feature}</span>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: isUsed ? "#22c55e" : "#9ca3af",
                      }}>
                        {isUsed ? "Active" : "Unused"}
                      </span>
                    </div>
                    {usage && (
                      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                        {usage.usageCount} uses, {usage.uniqueUsers} user{usage.uniqueUsers !== 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="panel" style={{ marginTop: 24 }}>
            <h2>Config Completeness Checklist</h2>
            <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0" }}>
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
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 0",
                      borderBottom: "1px solid #f3f4f6",
                    }}
                  >
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: done ? "#22c55e" : "#e5e7eb",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                      role="img"
                      aria-label={done ? "Completed" : "Not completed"}
                    >
                      {done ? "\u2713" : ""}
                    </span>
                    <span style={{ fontSize: 14, color: done ? "#111" : "#9ca3af" }}>{item.label}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}

      {atRisk && atRisk.atRiskTenants.length > 0 && (
        <section className="panel" style={{ marginTop: 24 }}>
          <h2>At-Risk Tenants</h2>
          <p className="muted" style={{ marginBottom: 12 }}>Tenants with health score below 40 that may churn.</p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
                  <th scope="col" style={{ padding: "8px 12px" }}>Tenant ID</th>
                  <th scope="col" style={{ padding: "8px 12px" }}>Score</th>
                  <th scope="col" style={{ padding: "8px 12px" }}>Risk Level</th>
                  <th scope="col" style={{ padding: "8px 12px" }}>Login Freq.</th>
                  <th scope="col" style={{ padding: "8px 12px" }}>Feature Adoption</th>
                  <th scope="col" style={{ padding: "8px 12px" }}>Lead Volume</th>
                </tr>
              </thead>
              <tbody>
                {atRisk.atRiskTenants.map((tenant) => (
                  <tr key={tenant.tenantId} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "8px 12px", fontFamily: "monospace", fontSize: 12 }}>
                      {tenant.tenantId.slice(0, 12)}...
                    </td>
                    <td style={{ padding: "8px 12px", fontWeight: 600 }}>{tenant.score}</td>
                    <td style={{ padding: "8px 12px" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: 10,
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#fff",
                        backgroundColor: RISK_COLORS[tenant.riskLevel] ?? "#6b7280",
                        textTransform: "capitalize",
                      }}>
                        {tenant.riskLevel}
                      </span>
                    </td>
                    <td style={{ padding: "8px 12px" }}>{tenant.factors.loginFrequency}%</td>
                    <td style={{ padding: "8px 12px" }}>{tenant.factors.featureAdoption}%</td>
                    <td style={{ padding: "8px 12px" }}>{tenant.factors.leadVolume}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {atRisk && atRisk.atRiskTenants.length === 0 && !data && (
        <section className="panel" style={{ marginTop: 24 }}>
          <h2>All Tenants Healthy</h2>
          <p className="muted">No tenants are currently at risk of churning. Enter a tenant ID above to view detailed health data.</p>
        </section>
      )}
    </main>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

interface UsageRecord {
  tenantId: string;
  period: string;
  leads: number;
  emails: number;
  sms: number;
  whatsapp: number;
  updatedAt: string;
}

interface PlanLimits {
  leadsPerMonth: number;
  emailsPerMonth: number;
  smsPerMonth: number;
  whatsappPerMonth: number;
}

interface PlanInfo {
  id: string;
  name: string;
  monthlyPrice: number;
  limits: PlanLimits;
  features: string[];
}

const PLAN_INFO: Record<string, PlanInfo> = {
  "whitelabel-starter": {
    id: "whitelabel-starter",
    name: "White-Label Starter",
    monthlyPrice: 9900,
    limits: { leadsPerMonth: 100, emailsPerMonth: 1000, smsPerMonth: 100, whatsappPerMonth: 50 },
    features: ["Lead capture", "Basic scoring", "Email nurture", "1 niche"],
  },
  "whitelabel-growth": {
    id: "whitelabel-growth",
    name: "White-Label Growth",
    monthlyPrice: 24900,
    limits: { leadsPerMonth: 500, emailsPerMonth: 5000, smsPerMonth: 500, whatsappPerMonth: 200 },
    features: ["Everything in Starter", "A/B testing", "Attribution", "3 niches", "WhatsApp"],
  },
  "whitelabel-enterprise": {
    id: "whitelabel-enterprise",
    name: "White-Label Enterprise",
    monthlyPrice: 49900,
    limits: { leadsPerMonth: 2000, emailsPerMonth: 25000, smsPerMonth: 2000, whatsappPerMonth: 1000 },
    features: ["Everything in Growth", "Unlimited funnels", "Marketplace access", "Priority support"],
  },
};

const DEFAULT_PLAN = PLAN_INFO["whitelabel-starter"];
const TENANT_ID = "default-tenant";

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

function usagePercent(used: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

function generatePastPeriods(count: number): string[] {
  const periods: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    periods.push(`${year}-${month}`);
  }
  return periods;
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0a0f1a",
    color: "#e2e8f0",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  } as React.CSSProperties,
  container: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "32px 24px",
  } as React.CSSProperties,
  title: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#f8fafc",
    margin: "0 0 24px",
  } as React.CSSProperties,
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 20,
    marginBottom: 24,
  } as React.CSSProperties,
  card: {
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(148, 163, 184, 0.1)",
    borderRadius: 12,
    padding: 24,
  } as React.CSSProperties,
  cardTitle: {
    fontSize: "0.85rem",
    fontWeight: 700,
    color: "#f8fafc",
    margin: "0 0 16px",
  } as React.CSSProperties,
  meterRow: {
    marginBottom: 16,
  } as React.CSSProperties,
  meterLabel: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.82rem",
    marginBottom: 6,
  } as React.CSSProperties,
  meterName: {
    color: "#cbd5e1",
    fontWeight: 600,
  } as React.CSSProperties,
  meterValue: {
    color: "#94a3b8",
  } as React.CSSProperties,
  meterTrack: {
    height: 10,
    background: "rgba(34, 95, 84, 0.12)",
    borderRadius: 5,
    overflow: "hidden",
  } as React.CSSProperties,
  meterFill: (percent: number) => ({
    height: "100%",
    width: `${percent}%`,
    background: percent >= 90 ? "#f87171" : percent >= 70 ? "#fbbf24" : "#14b8a6",
    borderRadius: 5,
    transition: "width 0.4s ease",
  }) as React.CSSProperties,
  planDetail: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
    borderBottom: "1px solid rgba(148, 163, 184, 0.08)",
    fontSize: "0.85rem",
  } as React.CSSProperties,
  planLabel: {
    color: "#94a3b8",
  } as React.CSSProperties,
  planValue: {
    color: "#f1f5f9",
    fontWeight: 600,
  } as React.CSSProperties,
  featureList: {
    listStyle: "none",
    padding: 0,
    margin: "12px 0 0",
  } as React.CSSProperties,
  feature: {
    fontSize: "0.82rem",
    color: "#cbd5e1",
    padding: "3px 0",
  } as React.CSSProperties,
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: "0.85rem",
  } as React.CSSProperties,
  th: {
    textAlign: "left" as const,
    padding: "10px 14px",
    color: "#94a3b8",
    fontWeight: 600,
    fontSize: "0.78rem",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    borderBottom: "1px solid rgba(148, 163, 184, 0.15)",
  } as React.CSSProperties,
  td: {
    padding: "10px 14px",
    borderBottom: "1px solid rgba(148, 163, 184, 0.08)",
    color: "#e2e8f0",
  } as React.CSSProperties,
  buttonRow: {
    display: "flex",
    gap: 12,
    marginTop: 24,
    flexWrap: "wrap" as const,
  } as React.CSSProperties,
  primaryButton: {
    padding: "10px 20px",
    borderRadius: 8,
    border: "none",
    background: "#14b8a6",
    color: "#0a0f1a",
    fontSize: "0.85rem",
    fontWeight: 700,
    cursor: "pointer",
    minHeight: 44,
  } as React.CSSProperties,
  secondaryButton: {
    padding: "10px 20px",
    borderRadius: 8,
    border: "1px solid rgba(148, 163, 184, 0.3)",
    background: "transparent",
    color: "#94a3b8",
    fontSize: "0.85rem",
    fontWeight: 600,
    cursor: "pointer",
    minHeight: 44,
  } as React.CSSProperties,
  muted: {
    color: "#64748b",
    fontSize: "0.85rem",
  } as React.CSSProperties,
};

export default function BillingPage() {
  const [usage, setUsage] = useState<UsageRecord | null>(null);
  const [historyRecords, setHistoryRecords] = useState<UsageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const plan = DEFAULT_PLAN;

  useEffect(() => {
    fetch(`/api/billing/usage?tenantId=${TENANT_ID}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load usage: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        setUsage(json.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      });

    const periods = generatePastPeriods(6);
    Promise.all(
      periods.map((period) =>
        fetch(`/api/billing/usage?tenantId=${TENANT_ID}&period=${period}`, { credentials: "include" })
          .then((res) => res.ok ? res.json() : null)
          .then((json) => json?.data ?? null)
          .catch(() => null)
      ),
    ).then((results) => {
      const records = results.filter((r): r is UsageRecord => r !== null);
      setHistoryRecords(records);
    });
  }, []);

  const handleManageBilling = useCallback(async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: TENANT_ID, returnUrl: window.location.href }),
      });
      const json = await res.json();
      if (json.data?.url) {
        window.location.href = json.data.url;
      }
    } catch {
      setError("Failed to open billing portal");
    } finally {
      setPortalLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <main className="experience-page" style={styles.page}>
        <div style={styles.container}>
          <section className="panel" style={styles.card}>
            <p style={styles.muted}>Loading billing data...</p>
          </section>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="experience-page" style={styles.page}>
        <div style={styles.container}>
          <section className="panel" style={styles.card}>
            <p className="eyebrow" style={{ color: "#94a3b8", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", margin: "0 0 8px" }}>Error</p>
            <h2 style={{ color: "#f8fafc", margin: "0 0 8px", fontSize: "1.25rem" }}>Failed to load billing</h2>
            <p style={styles.muted}>{error}</p>
            <div style={{ marginTop: 16 }}>
              <Link href="/dashboard" style={{ color: "#14b8a6", textDecoration: "none", fontWeight: 600, fontSize: "0.85rem" }}>
                Back to dashboard
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const currentUsage = usage ?? { leads: 0, emails: 0, sms: 0, whatsapp: 0 };

  const meters = [
    { label: "Leads", used: currentUsage.leads, limit: plan.limits.leadsPerMonth },
    { label: "Emails", used: currentUsage.emails, limit: plan.limits.emailsPerMonth },
    { label: "SMS", used: currentUsage.sms, limit: plan.limits.smsPerMonth },
    { label: "WhatsApp", used: currentUsage.whatsapp, limit: plan.limits.whatsappPerMonth },
  ];

  return (
    <main className="experience-page" style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Billing</h1>

        <div style={styles.grid}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Current Period Usage</h2>
            {meters.map((meter) => {
              const pct = usagePercent(meter.used, meter.limit);
              const limitLabel = meter.limit < 0 ? "Unlimited" : meter.limit.toLocaleString();
              return (
                <div key={meter.label} style={styles.meterRow}>
                  <div style={styles.meterLabel}>
                    <span style={styles.meterName}>{meter.label}</span>
                    <span style={styles.meterValue}>
                      {meter.used.toLocaleString()} / {limitLabel}
                      {meter.limit > 0 ? ` (${pct}%)` : ""}
                    </span>
                  </div>
                  <div style={styles.meterTrack} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${meter.label} usage`}>
                    <div style={styles.meterFill(pct)} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Plan Details</h2>
            <div style={styles.planDetail}>
              <span style={styles.planLabel}>Plan</span>
              <span style={styles.planValue}>{plan.name}</span>
            </div>
            <div style={styles.planDetail}>
              <span style={styles.planLabel}>Monthly Price</span>
              <span style={styles.planValue}>{formatCurrency(plan.monthlyPrice)}/mo</span>
            </div>
            <div style={styles.planDetail}>
              <span style={styles.planLabel}>Lead Limit</span>
              <span style={styles.planValue}>{plan.limits.leadsPerMonth < 0 ? "Unlimited" : plan.limits.leadsPerMonth.toLocaleString()}</span>
            </div>
            <div style={styles.planDetail}>
              <span style={styles.planLabel}>Email Limit</span>
              <span style={styles.planValue}>{plan.limits.emailsPerMonth < 0 ? "Unlimited" : plan.limits.emailsPerMonth.toLocaleString()}</span>
            </div>
            <ul style={styles.featureList}>
              {plan.features.map((f) => (
                <li key={f} style={styles.feature}>{f}</li>
              ))}
            </ul>
          </div>
        </div>

        <div style={{ ...styles.card, marginBottom: 24 }}>
          <h2 style={styles.cardTitle}>Usage History</h2>
          {historyRecords.length === 0 ? (
            <p style={styles.muted}>No usage history available</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th scope="col" style={styles.th}>Period</th>
                    <th scope="col" style={styles.th}>Leads</th>
                    <th scope="col" style={styles.th}>Emails</th>
                    <th scope="col" style={styles.th}>SMS</th>
                    <th scope="col" style={styles.th}>WhatsApp</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRecords.map((record) => (
                    <tr key={record.period}>
                      <td style={styles.td}>{record.period}</td>
                      <td style={styles.td}>{record.leads.toLocaleString()}</td>
                      <td style={styles.td}>{record.emails.toLocaleString()}</td>
                      <td style={styles.td}>{record.sms.toLocaleString()}</td>
                      <td style={styles.td}>{record.whatsapp.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={styles.buttonRow}>
          <button
            type="button"
            onClick={handleManageBilling}
            disabled={portalLoading}
            style={{ ...styles.secondaryButton, opacity: portalLoading ? 0.6 : 1 }}
            aria-busy={portalLoading}
          >
            {portalLoading ? "Opening..." : "Manage Billing"}
          </button>
          <Link href="/api/billing/checkout" style={styles.primaryButton}>
            Upgrade Plan
          </Link>
        </div>
      </div>
    </main>
  );
}

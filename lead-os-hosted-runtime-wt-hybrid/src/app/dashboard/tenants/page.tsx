"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

interface TenantRecord {
  tenantId: string;
  slug: string;
  brandName: string;
  siteUrl: string;
  supportEmail: string;
  defaultNiche: string;
  accent: string;
  enabledFunnels: string[];
  channels: Record<string, boolean>;
  revenueModel: string;
  plan: string;
  status: "provisioning" | "active" | "suspended" | "cancelled";
  operatorEmails: string[];
  createdAt: string;
}

const STATUS_STYLES: Record<string, { background: string; color: string; border: string }> = {
  active: { background: "rgba(34, 197, 94, 0.1)", color: "#4ade80", border: "1px solid rgba(34, 197, 94, 0.3)" },
  provisioning: { background: "rgba(250, 204, 21, 0.1)", color: "#fbbf24", border: "1px solid rgba(250, 204, 21, 0.3)" },
  suspended: { background: "rgba(239, 68, 68, 0.1)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.3)" },
  cancelled: { background: "rgba(148, 163, 184, 0.1)", color: "#94a3b8", border: "1px solid rgba(148, 163, 184, 0.3)" },
};

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
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    flexWrap: "wrap" as const,
    gap: 12,
  } as React.CSSProperties,
  title: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#f8fafc",
    margin: 0,
  } as React.CSSProperties,
  provisionButton: {
    display: "inline-flex",
    alignItems: "center",
    padding: "10px 20px",
    borderRadius: 8,
    border: "none",
    background: "#14b8a6",
    color: "#0a0f1a",
    fontSize: "0.85rem",
    fontWeight: 700,
    textDecoration: "none",
    cursor: "pointer",
    minHeight: 44,
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
    padding: "12px 14px",
    borderBottom: "1px solid rgba(148, 163, 184, 0.08)",
    color: "#e2e8f0",
  } as React.CSSProperties,
  row: {
    cursor: "pointer",
    transition: "background 150ms ease",
  } as React.CSSProperties,
  badge: (status: string) => ({
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 999,
    fontSize: "0.72rem",
    fontWeight: 600,
    ...(STATUS_STYLES[status] ?? STATUS_STYLES.cancelled),
  }) as React.CSSProperties,
  expandedRow: {
    background: "rgba(255, 255, 255, 0.02)",
  } as React.CSSProperties,
  expandedContent: {
    padding: "16px 14px 20px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 16,
    fontSize: "0.82rem",
  } as React.CSSProperties,
  detailLabel: {
    color: "#64748b",
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
    marginBottom: 4,
  } as React.CSSProperties,
  detailValue: {
    color: "#cbd5e1",
    fontSize: "0.85rem",
  } as React.CSSProperties,
  card: {
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(148, 163, 184, 0.1)",
    borderRadius: 12,
    overflow: "hidden",
  } as React.CSSProperties,
  muted: {
    color: "#64748b",
    fontSize: "0.85rem",
  } as React.CSSProperties,
};

export default function TenantsPage() {
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tenants", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load tenants: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        setTenants(json.data ?? []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      });
  }, []);

  const toggleExpand = useCallback((tenantId: string) => {
    setExpandedId((prev) => (prev === tenantId ? null : tenantId));
  }, []);

  if (loading) {
    return (
      <main className="experience-page" style={styles.page}>
        <div style={styles.container}>
          <section className="panel" style={styles.card}>
            <div style={{ padding: 32 }}>
              <p style={styles.muted}>Loading tenants...</p>
            </div>
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
            <div style={{ padding: 32 }}>
              <p className="eyebrow" style={{ color: "#94a3b8", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", margin: "0 0 8px" }}>Error</p>
              <h2 style={{ color: "#f8fafc", margin: "0 0 8px", fontSize: "1.25rem" }}>Failed to load tenants</h2>
              <p style={styles.muted}>{error}</p>
              <div style={{ marginTop: 16 }}>
                <Link href="/dashboard" style={{ color: "#14b8a6", textDecoration: "none", fontWeight: 600, fontSize: "0.85rem" }}>
                  Back to dashboard
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const activeChannels = (channels: Record<string, boolean>): string[] =>
    Object.entries(channels).filter(([, v]) => v).map(([k]) => k);

  return (
    <main className="experience-page" style={styles.page}>
      <div style={styles.container}>
        <div style={styles.headerRow}>
          <h1 style={styles.title}>Tenants</h1>
          <Link href="/onboard" style={styles.provisionButton}>
            Provision New Tenant
          </Link>
        </div>

        {tenants.length === 0 ? (
          <div style={{ ...styles.card, padding: 48, textAlign: "center" }}>
            <p style={{ color: "#94a3b8", margin: "0 0 16px", fontSize: "1rem" }}>No tenants yet</p>
            <Link href="/onboard" style={{ color: "#14b8a6", textDecoration: "none", fontWeight: 600 }}>
              Provision your first tenant
            </Link>
          </div>
        ) : (
          <div style={styles.card}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th scope="col" style={styles.th}>Slug</th>
                  <th scope="col" style={styles.th}>Brand</th>
                  <th scope="col" style={styles.th}>Niche</th>
                  <th scope="col" style={styles.th}>Plan</th>
                  <th scope="col" style={styles.th}>Model</th>
                  <th scope="col" style={styles.th}>Status</th>
                  <th scope="col" style={styles.th}>Created</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <>
                    <tr
                      key={tenant.tenantId}
                      style={{
                        ...styles.row,
                        background: expandedId === tenant.tenantId ? "rgba(255, 255, 255, 0.03)" : "transparent",
                      }}
                      onClick={() => toggleExpand(tenant.tenantId)}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && toggleExpand(tenant.tenantId)}
                      aria-expanded={expandedId === tenant.tenantId}
                    >
                      <td style={styles.td}>
                        <code style={{ fontSize: "0.82rem", color: "#5eead4" }}>{tenant.slug}</code>
                      </td>
                      <td style={styles.td}>{tenant.brandName}</td>
                      <td style={styles.td}>{tenant.defaultNiche}</td>
                      <td style={styles.td}>{tenant.plan}</td>
                      <td style={styles.td}>{tenant.revenueModel}</td>
                      <td style={styles.td}>
                        <span style={styles.badge(tenant.status)}>{tenant.status}</span>
                      </td>
                      <td style={styles.td}>{new Date(tenant.createdAt).toLocaleDateString()}</td>
                    </tr>
                    {expandedId === tenant.tenantId && (
                      <tr key={`${tenant.tenantId}-expanded`} style={styles.expandedRow}>
                        <td colSpan={7} style={{ padding: 0 }}>
                          <div style={styles.expandedContent}>
                            <div>
                              <div style={styles.detailLabel}>Site URL</div>
                              <div style={styles.detailValue}>{tenant.siteUrl || "Not set"}</div>
                            </div>
                            <div>
                              <div style={styles.detailLabel}>Operator Emails</div>
                              <div style={styles.detailValue}>{tenant.operatorEmails.join(", ") || "None"}</div>
                            </div>
                            <div>
                              <div style={styles.detailLabel}>Enabled Funnels</div>
                              <div style={styles.detailValue}>{tenant.enabledFunnels.join(", ") || "None"}</div>
                            </div>
                            <div>
                              <div style={styles.detailLabel}>Active Channels</div>
                              <div style={styles.detailValue}>{activeChannels(tenant.channels).join(", ") || "None"}</div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

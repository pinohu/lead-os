"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

interface CredentialPublic {
  id: string;
  tenantId: string;
  provider: string;
  credentialType: string;
  status: "active" | "expired" | "revoked";
  lastVerified?: string;
  capabilities: string[];
  createdAt: string;
  updatedAt: string;
}

interface ProviderDefinition {
  provider: string;
  category: string;
  fields: string[];
  enables: string[];
}

interface FeedbackState {
  type: "success" | "error";
  message: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  deployment: "Deployment",
  communication: "Communication",
  billing: "Billing",
  ai: "AI & Intelligence",
  crm: "CRM",
  scheduling: "Scheduling",
  documents: "Documents",
  growth: "Growth",
  alerts: "Alerts & Notifications",
  data: "Data & Storage",
  automation: "Automation",
  analytics: "Analytics",
  content: "Content & Media",
  marketing: "Marketing",
  sms: "SMS",
  "ai-voice": "AI Voice",
  "ai-chatbot": "AI Chatbot",
  "ai-video": "AI Video",
  "ai-content": "AI Content",
  "page-builder": "Page Builder",
  "conversion-optimization": "Conversion Optimization",
  email: "Email",
  "video-hosting": "Video Hosting",
  "web-scraping": "Web Scraping",
  forms: "Forms",
  "browser-automation": "Browser Automation",
  hosting: "Hosting",
  widgets: "Widgets",
  workflow: "Workflow",
  "mcp-tools": "MCP Tools",
  "agent-orchestration": "Agent Orchestration",
};

function isSecretField(fieldName: string): boolean {
  const lower = fieldName.toLowerCase();
  return lower.includes("key") || lower.includes("secret") || lower.includes("token");
}

function groupByCategory(providers: ProviderDefinition[]): Record<string, ProviderDefinition[]> {
  const grouped: Record<string, ProviderDefinition[]> = {};
  for (const p of providers) {
    if (!grouped[p.category]) grouped[p.category] = [];
    grouped[p.category].push(p);
  }
  return grouped;
}

function findCredential(provider: string, credentials: CredentialPublic[]): CredentialPublic | undefined {
  return credentials.find((c) => c.provider === provider && c.status === "active");
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
    margin: "0 0 4px",
  } as React.CSSProperties,
  lede: {
    color: "#94a3b8",
    fontSize: "0.9rem",
    margin: "0 0 24px",
    maxWidth: 640,
    lineHeight: 1.5,
  } as React.CSSProperties,
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 16,
    marginBottom: 24,
  } as React.CSSProperties,
  summaryCard: {
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(148, 163, 184, 0.1)",
    borderRadius: 12,
    padding: "20px 24px",
  } as React.CSSProperties,
  summaryLabel: {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#94a3b8",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    margin: "0 0 4px",
  } as React.CSSProperties,
  summaryValue: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#f8fafc",
    margin: 0,
  } as React.CSSProperties,
  searchContainer: {
    marginBottom: 24,
  } as React.CSSProperties,
  searchInput: {
    width: "100%",
    maxWidth: 400,
    padding: "10px 16px",
    borderRadius: 8,
    border: "1px solid rgba(148, 163, 184, 0.2)",
    background: "rgba(255, 255, 255, 0.04)",
    color: "#e2e8f0",
    fontSize: "0.9rem",
    outline: "none",
    minHeight: 44,
  } as React.CSSProperties,
  categorySection: {
    marginBottom: 32,
  } as React.CSSProperties,
  categoryTitle: {
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#f8fafc",
    margin: "0 0 12px",
  } as React.CSSProperties,
  providerGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
    gap: 16,
  } as React.CSSProperties,
  card: {
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(148, 163, 184, 0.1)",
    borderRadius: 12,
    padding: 24,
  } as React.CSSProperties,
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  } as React.CSSProperties,
  providerName: {
    fontSize: "0.95rem",
    fontWeight: 700,
    color: "#f8fafc",
    margin: 0,
    textTransform: "capitalize" as const,
  } as React.CSSProperties,
  statusBadge: (connected: boolean) => ({
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 999,
    fontSize: "0.75rem",
    fontWeight: 600,
    background: connected ? "rgba(5, 150, 105, 0.15)" : "rgba(148, 163, 184, 0.1)",
    color: connected ? "#34d399" : "#64748b",
  }) as React.CSSProperties,
  enablesText: {
    color: "#94a3b8",
    fontSize: "0.82rem",
    margin: "4px 0 0",
    lineHeight: 1.4,
  } as React.CSSProperties,
  verifiedText: {
    color: "#64748b",
    fontSize: "0.78rem",
    margin: "6px 0 0",
  } as React.CSSProperties,
  buttonRow: {
    display: "flex",
    gap: 8,
    marginTop: 12,
    flexWrap: "wrap" as const,
  } as React.CSSProperties,
  primaryButton: {
    padding: "8px 16px",
    borderRadius: 8,
    border: "none",
    background: "#14b8a6",
    color: "#0a0f1a",
    fontSize: "0.82rem",
    fontWeight: 700,
    cursor: "pointer",
    minHeight: 44,
    minWidth: 44,
  } as React.CSSProperties,
  secondaryButton: {
    padding: "8px 16px",
    borderRadius: 8,
    border: "1px solid rgba(148, 163, 184, 0.3)",
    background: "transparent",
    color: "#94a3b8",
    fontSize: "0.82rem",
    fontWeight: 600,
    cursor: "pointer",
    minHeight: 44,
    minWidth: 44,
  } as React.CSSProperties,
  dangerButton: {
    padding: "8px 16px",
    borderRadius: 8,
    border: "1px solid rgba(239, 68, 68, 0.3)",
    background: "transparent",
    color: "#f87171",
    fontSize: "0.82rem",
    fontWeight: 600,
    cursor: "pointer",
    minHeight: 44,
    minWidth: 44,
  } as React.CSSProperties,
  formContainer: {
    marginTop: 12,
    padding: 16,
    background: "rgba(255, 255, 255, 0.02)",
    border: "1px solid rgba(148, 163, 184, 0.08)",
    borderRadius: 8,
  } as React.CSSProperties,
  fieldGroup: {
    marginBottom: 12,
  } as React.CSSProperties,
  label: {
    display: "block",
    fontSize: "0.78rem",
    fontWeight: 600,
    color: "#cbd5e1",
    marginBottom: 4,
  } as React.CSSProperties,
  input: {
    width: "100%",
    padding: "8px 12px",
    borderRadius: 6,
    border: "1px solid rgba(148, 163, 184, 0.2)",
    background: "rgba(255, 255, 255, 0.04)",
    color: "#e2e8f0",
    fontSize: "0.85rem",
    outline: "none",
    minHeight: 44,
    boxSizing: "border-box" as const,
  } as React.CSSProperties,
  feedback: (type: "success" | "error") => ({
    marginTop: 8,
    padding: "8px 12px",
    borderRadius: 6,
    fontSize: "0.82rem",
    fontWeight: 600,
    background: type === "success" ? "rgba(5, 150, 105, 0.12)" : "rgba(239, 68, 68, 0.12)",
    color: type === "success" ? "#34d399" : "#f87171",
  }) as React.CSSProperties,
  muted: {
    color: "#64748b",
    fontSize: "0.85rem",
  } as React.CSSProperties,
  navRow: {
    display: "flex",
    gap: 12,
    marginBottom: 24,
    flexWrap: "wrap" as const,
  } as React.CSSProperties,
  navLink: {
    color: "#14b8a6",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: "0.85rem",
  } as React.CSSProperties,
};

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState<CredentialPublic[]>([]);
  const [providers, setProviders] = useState<ProviderDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, FeedbackState>>({});
  const [busyProviders, setBusyProviders] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/credentials", { credentials: "include" });
      if (!res.ok) throw new Error(`Failed to load credentials: ${res.status}`);
      const json = await res.json();
      setCredentials(json.data.credentials);
      setProviders(json.data.providers);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load credentials");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const setBusy = useCallback((provider: string, busy: boolean) => {
    setBusyProviders((prev) => {
      const next = new Set(prev);
      if (busy) {
        next.add(provider);
      } else {
        next.delete(provider);
      }
      return next;
    });
  }, []);

  const setProviderFeedback = useCallback((provider: string, fb: FeedbackState | null) => {
    setFeedback((prev) => {
      if (fb === null) {
        const next = { ...prev };
        delete next[provider];
        return next;
      }
      return { ...prev, [provider]: fb };
    });
  }, []);

  const handleConnect = useCallback(async (provider: ProviderDefinition) => {
    setExpandedProvider((prev) => (prev === provider.provider ? null : provider.provider));
    setProviderFeedback(provider.provider, null);
    const initial: Record<string, string> = {};
    for (const field of provider.fields) {
      initial[field] = "";
    }
    setFormValues(initial);
  }, [setProviderFeedback]);

  const handleSave = useCallback(async (provider: ProviderDefinition) => {
    setBusy(provider.provider, true);
    setProviderFeedback(provider.provider, null);

    try {
      const res = await fetch("/api/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          provider: provider.provider,
          credentialType: "api-key",
          credentials: formValues,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        const msg = json.error?.message || `Failed to save (${res.status})`;
        setProviderFeedback(provider.provider, { type: "error", message: msg });
        return;
      }

      setProviderFeedback(provider.provider, { type: "success", message: "Credential saved successfully" });
      setExpandedProvider(null);
      await fetchData();
    } catch (err) {
      setProviderFeedback(provider.provider, {
        type: "error",
        message: err instanceof Error ? err.message : "Network error",
      });
    } finally {
      setBusy(provider.provider, false);
    }
  }, [formValues, fetchData, setBusy, setProviderFeedback]);

  const handleDisconnect = useCallback(async (providerName: string) => {
    setBusy(providerName, true);
    setProviderFeedback(providerName, null);

    try {
      const res = await fetch(`/api/credentials?provider=${encodeURIComponent(providerName)}`, {
        method: "DELETE",
        credentials: "include",
      });

      const json = await res.json();

      if (!res.ok) {
        const msg = json.error?.message || `Failed to disconnect (${res.status})`;
        setProviderFeedback(providerName, { type: "error", message: msg });
        return;
      }

      setProviderFeedback(providerName, { type: "success", message: "Credential removed" });
      await fetchData();
    } catch (err) {
      setProviderFeedback(providerName, {
        type: "error",
        message: err instanceof Error ? err.message : "Network error",
      });
    } finally {
      setBusy(providerName, false);
    }
  }, [fetchData, setBusy, setProviderFeedback]);

  const handleVerify = useCallback(async (providerName: string) => {
    setBusy(providerName, true);
    setProviderFeedback(providerName, null);

    try {
      const res = await fetch("/api/credentials/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ provider: providerName }),
      });

      const json = await res.json();

      if (!res.ok) {
        const msg = json.error?.message || `Verification failed (${res.status})`;
        setProviderFeedback(providerName, { type: "error", message: msg });
        return;
      }

      const result = json.data;
      setProviderFeedback(providerName, {
        type: result.valid ? "success" : "error",
        message: result.message,
      });
      await fetchData();
    } catch (err) {
      setProviderFeedback(providerName, {
        type: "error",
        message: err instanceof Error ? err.message : "Network error",
      });
    } finally {
      setBusy(providerName, false);
    }
  }, [fetchData, setBusy, setProviderFeedback]);

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <div style={styles.card}>
            <p style={styles.muted}>Loading credentials...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <div style={styles.card}>
            <p style={{ ...styles.summaryLabel, color: "#94a3b8" }}>Error</p>
            <h2 style={{ color: "#f8fafc", margin: "0 0 8px", fontSize: "1.25rem" }}>Failed to load credentials</h2>
            <p style={styles.muted}>{error}</p>
            <div style={{ marginTop: 16 }}>
              <Link href="/dashboard" style={styles.navLink}>
                Back to dashboard
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const connectedCount = credentials.filter((c) => c.status === "active").length;
  const allCapabilities = new Set<string>();
  for (const cred of credentials) {
    if (cred.status === "active") {
      for (const cap of cred.capabilities) {
        allCapabilities.add(cap);
      }
    }
  }

  const filteredProviders = searchQuery
    ? providers.filter((p) =>
        p.provider.replace(/_/g, " ").toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.enables.some((e) => e.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : providers;

  const grouped = groupByCategory(filteredProviders);

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Credentials Vault</h1>
        <p style={styles.lede}>
          Connect your tools to unlock capabilities. Each provider enables specific
          features across the platform. Credentials are encrypted at rest with AES-256-GCM.
        </p>

        <nav style={styles.navRow} aria-label="Credentials navigation">
          <Link href="/dashboard" style={styles.navLink}>
            Back to dashboard
          </Link>
          <Link href="/dashboard/providers" style={styles.navLink}>
            Provider health
          </Link>
        </nav>

        <div style={styles.summaryGrid}>
          <div style={styles.summaryCard}>
            <p style={styles.summaryLabel}>Connected</p>
            <p style={styles.summaryValue}>
              {connectedCount} / {providers.length}
            </p>
          </div>
          <div style={styles.summaryCard}>
            <p style={styles.summaryLabel}>Capabilities</p>
            <p style={styles.summaryValue}>
              {allCapabilities.size} active
            </p>
          </div>
        </div>

        <div style={styles.searchContainer}>
          <label htmlFor="credential-search" style={styles.label}>
            Search providers
          </label>
          <input
            id="credential-search"
            type="search"
            placeholder="Filter by name or capability..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
            aria-label="Search providers by name or capability"
          />
        </div>

        {Object.keys(grouped).length === 0 && (
          <div style={styles.card}>
            <p style={styles.muted}>No providers match your search.</p>
          </div>
        )}

        {Object.entries(grouped)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([category, categoryProviders]) => (
            <section key={category} style={styles.categorySection} aria-label={`${CATEGORY_LABELS[category] || category} providers`}>
              <h2 style={styles.categoryTitle}>
                {CATEGORY_LABELS[category] || category}
              </h2>
              <div style={styles.providerGrid}>
                {categoryProviders.map((provider) => {
                  const cred = findCredential(provider.provider, credentials);
                  const connected = Boolean(cred);
                  const isBusy = busyProviders.has(provider.provider);
                  const isExpanded = expandedProvider === provider.provider;
                  const providerFeedback = feedback[provider.provider];
                  const providerId = provider.provider.replace(/_/g, "-");

                  return (
                    <article
                      key={provider.provider}
                      style={styles.card}
                      aria-label={`${provider.provider.replace(/_/g, " ")} provider`}
                    >
                      <div style={styles.cardHeader}>
                        <h3 style={styles.providerName}>
                          {provider.provider.replace(/_/g, " ")}
                        </h3>
                        <span style={styles.statusBadge(connected)}>
                          {connected ? "Connected" : "Not connected"}
                        </span>
                      </div>

                      <p style={styles.enablesText}>
                        Enables: {provider.enables.join(", ")}
                      </p>

                      {cred?.lastVerified && (
                        <p style={styles.verifiedText}>
                          Last verified: {new Date(cred.lastVerified).toLocaleDateString()}
                        </p>
                      )}

                      {providerFeedback && (
                        <div
                          style={styles.feedback(providerFeedback.type)}
                          role="status"
                          aria-live="polite"
                        >
                          {providerFeedback.message}
                        </div>
                      )}

                      <div style={styles.buttonRow}>
                        {connected ? (
                          <>
                            <button
                              type="button"
                              style={{
                                ...styles.secondaryButton,
                                opacity: isBusy ? 0.6 : 1,
                              }}
                              onClick={() => handleVerify(provider.provider)}
                              disabled={isBusy}
                              aria-busy={isBusy}
                              aria-label={`Verify ${provider.provider.replace(/_/g, " ")} credential`}
                            >
                              {isBusy ? "Verifying..." : "Verify"}
                            </button>
                            <button
                              type="button"
                              style={{
                                ...styles.dangerButton,
                                opacity: isBusy ? 0.6 : 1,
                              }}
                              onClick={() => handleDisconnect(provider.provider)}
                              disabled={isBusy}
                              aria-busy={isBusy}
                              aria-label={`Disconnect ${provider.provider.replace(/_/g, " ")}`}
                            >
                              {isBusy ? "Disconnecting..." : "Disconnect"}
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            style={styles.primaryButton}
                            onClick={() => handleConnect(provider)}
                            aria-expanded={isExpanded}
                            aria-controls={`form-${providerId}`}
                            aria-label={`Connect ${provider.provider.replace(/_/g, " ")}`}
                          >
                            {isExpanded ? "Cancel" : "Connect"}
                          </button>
                        )}
                      </div>

                      {isExpanded && !connected && (
                        <div
                          id={`form-${providerId}`}
                          style={styles.formContainer}
                          role="form"
                          aria-label={`${provider.provider.replace(/_/g, " ")} credentials form`}
                        >
                          {provider.fields.map((field) => {
                            const fieldId = `${providerId}-${field}`;
                            return (
                              <div key={field} style={styles.fieldGroup}>
                                <label htmlFor={fieldId} style={styles.label}>
                                  {field.replace(/_/g, " ")}
                                </label>
                                <input
                                  id={fieldId}
                                  type={isSecretField(field) ? "password" : "text"}
                                  value={formValues[field] || ""}
                                  onChange={(e) =>
                                    setFormValues((prev) => ({
                                      ...prev,
                                      [field]: e.target.value,
                                    }))
                                  }
                                  style={styles.input}
                                  autoComplete="off"
                                  aria-label={`${provider.provider.replace(/_/g, " ")} ${field.replace(/_/g, " ")}`}
                                />
                              </div>
                            );
                          })}
                          <button
                            type="button"
                            style={{
                              ...styles.primaryButton,
                              marginTop: 4,
                              opacity: isBusy ? 0.6 : 1,
                            }}
                            onClick={() => handleSave(provider)}
                            disabled={isBusy}
                            aria-busy={isBusy}
                            aria-label={`Save ${provider.provider.replace(/_/g, " ")} credentials`}
                          >
                            {isBusy ? "Saving..." : "Save"}
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
      </div>
    </main>
  );
}

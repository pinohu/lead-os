"use client";

import { useEffect, useState, useCallback } from "react";

interface TrackedCompetitor {
  id: string;
  tenantId: string;
  url: string;
  name: string;
  nicheSlug?: string;
  lastScrapedAt?: string;
  scrapeCount: number;
  status: "active" | "paused" | "error";
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

interface CompetitorSnapshot {
  id: string;
  competitorId: string;
  tenantId: string;
  scrapedAt: string;
  colorCount: number;
  sectionCount: number;
  headlineCount: number;
  ctaCount: number;
  hasChat: boolean;
  hasBooking: boolean;
  hasPricing: boolean;
  hasTestimonials: boolean;
  confidence: number;
  summary: string;
}

interface CompetitorWithSnapshot {
  competitor: TrackedCompetitor;
  latestSnapshot: CompetitorSnapshot | null;
}

const TENANT_ID = "default-tenant";

const NICHE_OPTIONS = [
  { value: "", label: "— No niche —" },
  { value: "saas", label: "SaaS / Software" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "agency", label: "Agency / Services" },
  { value: "healthcare", label: "Healthcare" },
  { value: "real-estate", label: "Real Estate" },
  { value: "staffing", label: "Staffing" },
  { value: "construction", label: "Construction" },
  { value: "franchise", label: "Franchise" },
];

function formatDate(iso?: string): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function avgConfidence(details: CompetitorWithSnapshot[]): number {
  const withSnap = details.filter((d) => d.latestSnapshot !== null);
  if (withSnap.length === 0) return 0;
  const total = withSnap.reduce((sum, d) => sum + (d.latestSnapshot?.confidence ?? 0), 0);
  return Math.round(total / withSnap.length);
}

function lastAnalyzedDate(details: CompetitorWithSnapshot[]): string {
  const dates = details
    .map((d) => d.latestSnapshot?.scrapedAt)
    .filter((d): d is string => Boolean(d));
  if (dates.length === 0) return "Never";
  const latest = dates.reduce((a, b) => (a > b ? a : b));
  return formatDate(latest);
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
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 16,
    marginBottom: 24,
  } as React.CSSProperties,
  summaryCard: {
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderRadius: 12,
    padding: "20px 24px",
  } as React.CSSProperties,
  summaryLabel: {
    fontSize: "0.78rem",
    fontWeight: 600,
    color: "rgba(255, 255, 255, 0.5)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    margin: "0 0 8px",
  } as React.CSSProperties,
  summaryValue: {
    fontSize: "1.75rem",
    fontWeight: 700,
    color: "#f8fafc",
    margin: 0,
  } as React.CSSProperties,
  summaryMeta: {
    fontSize: "0.78rem",
    color: "rgba(255, 255, 255, 0.4)",
    margin: "4px 0 0",
  } as React.CSSProperties,
  formCard: {
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
  } as React.CSSProperties,
  cardTitle: {
    fontSize: "0.85rem",
    fontWeight: 700,
    color: "#f8fafc",
    margin: "0 0 16px",
  } as React.CSSProperties,
  formRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr auto auto",
    gap: 12,
    alignItems: "end",
  } as React.CSSProperties,
  fieldGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
  } as React.CSSProperties,
  label: {
    fontSize: "0.78rem",
    fontWeight: 600,
    color: "rgba(255, 255, 255, 0.5)",
  } as React.CSSProperties,
  input: {
    background: "rgba(255, 255, 255, 0.06)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    padding: "10px 14px",
    color: "#f1f5f9",
    fontSize: "0.85rem",
    outline: "none",
    minHeight: 44,
    width: "100%",
    boxSizing: "border-box" as const,
  } as React.CSSProperties,
  select: {
    background: "rgba(255, 255, 255, 0.06)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    padding: "10px 14px",
    color: "#f1f5f9",
    fontSize: "0.85rem",
    outline: "none",
    minHeight: 44,
    cursor: "pointer",
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
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,
  secondaryButton: {
    padding: "8px 14px",
    borderRadius: 8,
    border: "1px solid rgba(148, 163, 184, 0.3)",
    background: "transparent",
    color: "#94a3b8",
    fontSize: "0.8rem",
    fontWeight: 600,
    cursor: "pointer",
    minHeight: 44,
  } as React.CSSProperties,
  dangerButton: {
    padding: "8px 14px",
    borderRadius: 8,
    border: "1px solid rgba(239, 68, 68, 0.3)",
    background: "transparent",
    color: "#f87171",
    fontSize: "0.8rem",
    fontWeight: 600,
    cursor: "pointer",
    minHeight: 44,
  } as React.CSSProperties,
  competitorCard: {
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
  } as React.CSSProperties,
  competitorHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  } as React.CSSProperties,
  competitorName: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "#f8fafc",
    margin: "0 0 4px",
  } as React.CSSProperties,
  competitorUrl: {
    fontSize: "0.78rem",
    color: "rgba(255, 255, 255, 0.4)",
    margin: 0,
    wordBreak: "break-all" as const,
  } as React.CSSProperties,
  statusBadge: (status: string) => ({
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 999,
    fontSize: "0.72rem",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    background:
      status === "active"
        ? "rgba(20, 184, 166, 0.15)"
        : status === "error"
          ? "rgba(239, 68, 68, 0.15)"
          : "rgba(148, 163, 184, 0.15)",
    color:
      status === "active"
        ? "#14b8a6"
        : status === "error"
          ? "#f87171"
          : "#94a3b8",
  }) as React.CSSProperties,
  snapshotRow: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 16,
    padding: "12px 0",
    borderTop: "1px solid rgba(255, 255, 255, 0.06)",
    fontSize: "0.8rem",
    color: "rgba(255, 255, 255, 0.5)",
  } as React.CSSProperties,
  snapshotStat: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 2,
  } as React.CSSProperties,
  snapshotStatLabel: {
    fontSize: "0.7rem",
    color: "rgba(255, 255, 255, 0.3)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  } as React.CSSProperties,
  snapshotStatValue: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "rgba(255, 255, 255, 0.8)",
  } as React.CSSProperties,
  cardActions: {
    display: "flex",
    gap: 8,
    marginTop: 12,
  } as React.CSSProperties,
  muted: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: "0.85rem",
  } as React.CSSProperties,
  errorText: {
    color: "#f87171",
    fontSize: "0.82rem",
    margin: "8px 0 0",
  } as React.CSSProperties,
  snapshotSummary: {
    fontSize: "0.8rem",
    color: "rgba(255, 255, 255, 0.5)",
    margin: "8px 0 0",
    fontStyle: "italic" as const,
  } as React.CSSProperties,
  featurePill: (active: boolean) => ({
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: "0.7rem",
    fontWeight: 600,
    background: active ? "rgba(20, 184, 166, 0.12)" : "rgba(255, 255, 255, 0.04)",
    color: active ? "#14b8a6" : "rgba(255, 255, 255, 0.25)",
    border: `1px solid ${active ? "rgba(20, 184, 166, 0.2)" : "rgba(255, 255, 255, 0.06)"}`,
  }) as React.CSSProperties,
};

export default function CompetitorsPage() {
  const [details, setDetails] = useState<CompetitorWithSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [formUrl, setFormUrl] = useState("");
  const [formName, setFormName] = useState("");
  const [formNiche, setFormNiche] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  const loadCompetitors = useCallback(async () => {
    try {
      const res = await fetch(`/api/competitors?tenantId=${TENANT_ID}`, { credentials: "include" });
      if (!res.ok) throw new Error(`Failed to load competitors: ${res.status}`);
      const json = await res.json();
      const competitors: TrackedCompetitor[] = json.data ?? [];

      const detailResults = await Promise.all(
        competitors.map(async (c) => {
          try {
            const dr = await fetch(`/api/competitors/${c.id}`, { credentials: "include" });
            if (!dr.ok) return { competitor: c, latestSnapshot: null };
            const dj = await dr.json();
            return dj.data as CompetitorWithSnapshot;
          } catch {
            return { competitor: c, latestSnapshot: null };
          }
        }),
      );

      setDetails(detailResults);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCompetitors();
  }, [loadCompetitors]);

  const handleAddCompetitor = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFormError(null);

      if (!formUrl.trim() || !formName.trim()) {
        setFormError("URL and name are required.");
        return;
      }

      setFormSubmitting(true);
      try {
        const res = await fetch("/api/competitors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            url: formUrl.trim(),
            name: formName.trim(),
            nicheSlug: formNiche || undefined,
            tenantId: TENANT_ID,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          setFormError(json.error?.message ?? "Failed to add competitor.");
          return;
        }
        setFormUrl("");
        setFormName("");
        setFormNiche("");
        setStatusMessage("Competitor added successfully.");
        await loadCompetitors();
      } catch {
        setFormError("Network error. Please try again.");
      } finally {
        setFormSubmitting(false);
      }
    },
    [formUrl, formName, formNiche, loadCompetitors],
  );

  const handleAnalyze = useCallback(
    async (id: string) => {
      setAnalyzingIds((prev) => new Set(prev).add(id));
      setStatusMessage(null);
      try {
        const res = await fetch(`/api/competitors/${id}/analyze`, {
          method: "POST",
          credentials: "include",
        });
        const json = await res.json();
        if (!res.ok) {
          setStatusMessage(`Analysis failed: ${json.error?.message ?? "Unknown error"}`);
        } else {
          setStatusMessage("Analysis complete.");
          await loadCompetitors();
        }
      } catch {
        setStatusMessage("Network error during analysis.");
      } finally {
        setAnalyzingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [loadCompetitors],
  );

  const handleRemove = useCallback(
    async (id: string) => {
      setRemovingIds((prev) => new Set(prev).add(id));
      setStatusMessage(null);
      try {
        const res = await fetch(`/api/competitors/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (res.ok || res.status === 204) {
          setStatusMessage("Competitor removed.");
          setDetails((prev) => prev.filter((d) => d.competitor.id !== id));
        } else {
          const json = await res.json();
          setStatusMessage(`Failed to remove: ${json.error?.message ?? "Unknown error"}`);
        }
      } catch {
        setStatusMessage("Network error while removing.");
      } finally {
        setRemovingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [],
  );

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <div style={styles.formCard}>
            <p style={styles.muted}>Loading competitor data...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <div style={styles.formCard}>
            <p style={{ color: "#94a3b8", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", margin: "0 0 8px" }}>Error</p>
            <h2 style={{ color: "#f8fafc", margin: "0 0 8px", fontSize: "1.25rem" }}>Failed to load competitors</h2>
            <p style={styles.muted}>{error}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Competitor Intelligence</h1>

        {/* Summary cards */}
        <div style={styles.summaryGrid} role="region" aria-label="Summary statistics">
          <div style={styles.summaryCard}>
            <p style={styles.summaryLabel}>Total Tracked</p>
            <p style={styles.summaryValue}>{details.length}</p>
          </div>
          <div style={styles.summaryCard}>
            <p style={styles.summaryLabel}>Last Analyzed</p>
            <p style={styles.summaryValue} aria-label={`Last analyzed: ${lastAnalyzedDate(details)}`}>
              {lastAnalyzedDate(details)}
            </p>
          </div>
          <div style={styles.summaryCard}>
            <p style={styles.summaryLabel}>Avg Confidence</p>
            <p style={styles.summaryValue}>{details.length > 0 ? `${avgConfidence(details)}%` : "—"}</p>
            <p style={styles.summaryMeta}>based on analyzed competitors</p>
          </div>
        </div>

        {/* Status message (aria-live region) */}
        <div aria-live="polite" aria-atomic="true" style={{ marginBottom: statusMessage ? 16 : 0 }}>
          {statusMessage && (
            <p style={{ color: "#14b8a6", fontSize: "0.85rem", fontWeight: 600, margin: 0 }}>
              {statusMessage}
            </p>
          )}
        </div>

        {/* Add competitor form */}
        <section style={styles.formCard} aria-labelledby="add-competitor-heading">
          <h2 id="add-competitor-heading" style={styles.cardTitle}>Add Competitor</h2>
          <form onSubmit={handleAddCompetitor} noValidate>
            <div style={styles.formRow}>
              <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
                <div style={styles.fieldGroup}>
                  <label htmlFor="competitor-url" style={styles.label}>
                    URL
                  </label>
                  <input
                    id="competitor-url"
                    type="url"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    placeholder="https://competitor.com"
                    required
                    style={styles.input}
                    aria-required="true"
                    aria-describedby={formError ? "form-error" : undefined}
                  />
                </div>
              </fieldset>
              <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
                <div style={styles.fieldGroup}>
                  <label htmlFor="competitor-name" style={styles.label}>
                    Name
                  </label>
                  <input
                    id="competitor-name"
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Acme Corp"
                    required
                    style={styles.input}
                    aria-required="true"
                  />
                </div>
              </fieldset>
              <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
                <div style={styles.fieldGroup}>
                  <label htmlFor="competitor-niche" style={styles.label}>
                    Niche (optional)
                  </label>
                  <select
                    id="competitor-niche"
                    value={formNiche}
                    onChange={(e) => setFormNiche(e.target.value)}
                    style={styles.select}
                  >
                    {NICHE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </fieldset>
              <div style={{ paddingTop: 22 }}>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  style={{ ...styles.primaryButton, opacity: formSubmitting ? 0.6 : 1 }}
                  aria-busy={formSubmitting}
                >
                  {formSubmitting ? "Adding..." : "Add Competitor"}
                </button>
              </div>
            </div>
            {formError && (
              <p id="form-error" role="alert" style={styles.errorText}>
                {formError}
              </p>
            )}
          </form>
        </section>

        {/* Competitor list */}
        <section aria-labelledby="competitor-list-heading">
          <h2 id="competitor-list-heading" style={{ ...styles.cardTitle, marginBottom: 12 }}>
            Tracked Competitors
            {details.length > 0 && (
              <span style={{ fontWeight: 400, color: "rgba(255,255,255,0.4)", marginLeft: 8, fontSize: "0.8rem" }}>
                ({details.length})
              </span>
            )}
          </h2>

          {details.length === 0 ? (
            <div style={styles.formCard}>
              <p style={styles.muted}>No competitors tracked yet. Add one above to get started.</p>
            </div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {details.map(({ competitor, latestSnapshot }) => (
                <li key={competitor.id} style={styles.competitorCard}>
                  <div style={styles.competitorHeader}>
                    <div>
                      <h3 style={styles.competitorName}>{competitor.name}</h3>
                      <p style={styles.competitorUrl}>
                        <a
                          href={competitor.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none" }}
                          aria-label={`Visit ${competitor.name} website`}
                        >
                          {competitor.url}
                        </a>
                      </p>
                      {competitor.nicheSlug && (
                        <p style={{ ...styles.competitorUrl, marginTop: 4 }}>
                          Niche: {competitor.nicheSlug}
                        </p>
                      )}
                    </div>
                    <span style={styles.statusBadge(competitor.status)} aria-label={`Status: ${competitor.status}`}>
                      {competitor.status}
                    </span>
                  </div>

                  {competitor.lastError && (
                    <p role="alert" style={styles.errorText}>
                      Last error: {competitor.lastError}
                    </p>
                  )}

                  {latestSnapshot ? (
                    <>
                      <div style={styles.snapshotRow} aria-label="Latest snapshot statistics">
                        <div style={styles.snapshotStat}>
                          <span style={styles.snapshotStatLabel}>Sections</span>
                          <span style={styles.snapshotStatValue}>{latestSnapshot.sectionCount}</span>
                        </div>
                        <div style={styles.snapshotStat}>
                          <span style={styles.snapshotStatLabel}>Headlines</span>
                          <span style={styles.snapshotStatValue}>{latestSnapshot.headlineCount}</span>
                        </div>
                        <div style={styles.snapshotStat}>
                          <span style={styles.snapshotStatLabel}>CTAs</span>
                          <span style={styles.snapshotStatValue}>{latestSnapshot.ctaCount}</span>
                        </div>
                        <div style={styles.snapshotStat}>
                          <span style={styles.snapshotStatLabel}>Confidence</span>
                          <span style={styles.snapshotStatValue}>{latestSnapshot.confidence}%</span>
                        </div>
                        <div style={styles.snapshotStat}>
                          <span style={styles.snapshotStatLabel}>Analyzed</span>
                          <span style={styles.snapshotStatValue}>{formatDate(latestSnapshot.scrapedAt)}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 4 }} aria-label="Detected features">
                        <span style={styles.featurePill(latestSnapshot.hasChat)}>Chat</span>
                        <span style={styles.featurePill(latestSnapshot.hasBooking)}>Booking</span>
                        <span style={styles.featurePill(latestSnapshot.hasPricing)}>Pricing</span>
                        <span style={styles.featurePill(latestSnapshot.hasTestimonials)}>Testimonials</span>
                      </div>
                      <p style={styles.snapshotSummary}>{latestSnapshot.summary}</p>
                    </>
                  ) : (
                    <p style={{ ...styles.muted, marginTop: 8 }}>
                      Not yet analyzed. Click "Analyze" to scrape this competitor.
                    </p>
                  )}

                  <div style={styles.cardActions}>
                    <button
                      type="button"
                      onClick={() => handleAnalyze(competitor.id)}
                      disabled={analyzingIds.has(competitor.id)}
                      style={{
                        ...styles.secondaryButton,
                        opacity: analyzingIds.has(competitor.id) ? 0.6 : 1,
                      }}
                      aria-busy={analyzingIds.has(competitor.id)}
                      aria-label={`Analyze ${competitor.name}`}
                    >
                      {analyzingIds.has(competitor.id) ? "Analyzing..." : "Analyze"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(competitor.id)}
                      disabled={removingIds.has(competitor.id)}
                      style={{
                        ...styles.dangerButton,
                        opacity: removingIds.has(competitor.id) ? 0.6 : 1,
                      }}
                      aria-busy={removingIds.has(competitor.id)}
                      aria-label={`Remove ${competitor.name}`}
                    >
                      {removingIds.has(competitor.id) ? "Removing..." : "Remove"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

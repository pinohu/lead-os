"use client";

import { useEffect, useState, useCallback } from "react";
import type { MarketingArtifact } from "@/lib/marketing-ingestion";

const TENANT_ID = "default-tenant";

const SOURCE_TYPE_OPTIONS = [
  { value: "flyer", label: "Flyer" },
  { value: "mailer", label: "Mailer" },
  { value: "billboard", label: "Billboard" },
  { value: "business-card", label: "Business Card" },
  { value: "ad", label: "Ad" },
  { value: "brochure", label: "Brochure" },
  { value: "other", label: "Other" },
];

function confidenceColor(score: number): string {
  if (score >= 70) return "#14b8a6";
  if (score >= 40) return "#f59e0b";
  return "#f87171";
}

function topSourceType(artifacts: MarketingArtifact[]): string {
  if (artifacts.length === 0) return "—";
  const counts: Record<string, number> = {};
  for (const a of artifacts) {
    counts[a.sourceType] = (counts[a.sourceType] ?? 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
}

function avgConfidence(artifacts: MarketingArtifact[]): number {
  if (artifacts.length === 0) return 0;
  const total = artifacts.reduce((sum, a) => sum + a.confidence, 0);
  return Math.round(total / artifacts.length);
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
    margin: "0 0 8px",
  } as React.CSSProperties,
  muted: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: "0.85rem",
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
  fieldGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
    marginBottom: 16,
  } as React.CSSProperties,
  label: {
    fontSize: "0.78rem",
    fontWeight: 600,
    color: "rgba(255, 255, 255, 0.5)",
  } as React.CSSProperties,
  textarea: {
    background: "rgba(255, 255, 255, 0.06)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    padding: "10px 14px",
    color: "#f1f5f9",
    fontSize: "0.85rem",
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
    resize: "vertical" as const,
    minHeight: 120,
    fontFamily: "inherit",
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
    width: "100%",
    boxSizing: "border-box" as const,
  } as React.CSSProperties,
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 12,
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
  disabledButton: {
    padding: "8px 14px",
    borderRadius: 8,
    border: "1px solid rgba(255, 255, 255, 0.06)",
    background: "transparent",
    color: "rgba(255, 255, 255, 0.2)",
    fontSize: "0.8rem",
    fontWeight: 600,
    cursor: "not-allowed",
    minHeight: 44,
  } as React.CSSProperties,
  artifactCard: {
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
  } as React.CSSProperties,
  artifactHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  } as React.CSSProperties,
  artifactTitle: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "#f8fafc",
    margin: "0 0 4px",
  } as React.CSSProperties,
  sourceBadge: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 999,
    fontSize: "0.72rem",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    background: "rgba(99, 102, 241, 0.15)",
    color: "#818cf8",
  } as React.CSSProperties,
  confidenceBadge: (score: number) => ({
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 999,
    fontSize: "0.72rem",
    fontWeight: 700,
    background: score >= 70
      ? "rgba(20, 184, 166, 0.15)"
      : score >= 40
        ? "rgba(245, 158, 11, 0.15)"
        : "rgba(239, 68, 68, 0.15)",
    color: confidenceColor(score),
  }) as React.CSSProperties,
  statRow: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 16,
    padding: "12px 0",
    borderTop: "1px solid rgba(255, 255, 255, 0.06)",
    fontSize: "0.8rem",
    color: "rgba(255, 255, 255, 0.5)",
  } as React.CSSProperties,
  stat: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 2,
  } as React.CSSProperties,
  statLabel: {
    fontSize: "0.7rem",
    color: "rgba(255, 255, 255, 0.3)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  } as React.CSSProperties,
  statValue: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "rgba(255, 255, 255, 0.8)",
  } as React.CSSProperties,
  cardActions: {
    display: "flex",
    gap: 8,
    marginTop: 12,
  } as React.CSSProperties,
  errorText: {
    color: "#f87171",
    fontSize: "0.82rem",
    margin: "8px 0 0",
  } as React.CSSProperties,
  offerText: {
    fontSize: "0.8rem",
    color: "rgba(255, 255, 255, 0.5)",
    margin: "8px 0 0",
    fontStyle: "italic" as const,
  } as React.CSSProperties,
  geoText: {
    fontSize: "0.78rem",
    color: "rgba(255, 255, 255, 0.35)",
    margin: "4px 0 0",
  } as React.CSSProperties,
};

export default function MarketingIngestionPage() {
  const [artifacts, setArtifacts] = useState<MarketingArtifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [formText, setFormText] = useState("");
  const [formSourceType, setFormSourceType] = useState<string>("flyer");
  const [formNicheSlug, setFormNicheSlug] = useState("");
  const [formGeoHint, setFormGeoHint] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  const loadArtifacts = useCallback(async () => {
    try {
      const res = await fetch(`/api/ingestion/upload?tenantId=${TENANT_ID}`, { credentials: "include" });
      const json = res.ok ? await res.json() : null;
      setArtifacts(json?.data ?? []);
      setLoading(false);
    } catch (err) {
      // Graceful empty state — show the form even without auth
      setArtifacts([]);
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadArtifacts();
  }, [loadArtifacts]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFormError(null);

      if (!formText.trim()) {
        setFormError("Paste extracted text from a flyer or ad to get started.");
        return;
      }

      setFormSubmitting(true);
      try {
        const res = await fetch("/api/ingestion/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            text: formText.trim(),
            sourceType: formSourceType,
            tenantId: TENANT_ID,
            nicheSlug: formNicheSlug.trim() || undefined,
            geoHint: formGeoHint.trim() || undefined,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          setFormError(json.error?.message ?? "Failed to analyze artifact.");
          return;
        }
        setFormText("");
        setFormNicheSlug("");
        setFormGeoHint("");
        setStatusMessage("Artifact analyzed and added successfully.");
        await loadArtifacts();
      } catch {
        setFormError("Network error. Please try again.");
      } finally {
        setFormSubmitting(false);
      }
    },
    [formText, formSourceType, formNicheSlug, formGeoHint, loadArtifacts],
  );

  const handleRemove = useCallback(
    async (id: string) => {
      setRemovingIds((prev) => new Set(prev).add(id));
      setStatusMessage(null);
      try {
        const res = await fetch(`/api/ingestion/upload?id=${encodeURIComponent(id)}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (res.ok || res.status === 204) {
          setStatusMessage("Artifact removed.");
          setArtifacts((prev) => prev.filter((a) => a.id !== id));
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
            <p style={styles.muted}>Loading marketing intelligence data...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Marketing Intelligence</h1>
        <p style={styles.muted}>
          Extract proven messaging, offers, and design patterns from real-world marketing materials.
        </p>

        {/* Summary cards */}
        <div style={styles.summaryGrid} role="region" aria-label="Summary statistics">
          <div style={styles.summaryCard}>
            <p style={styles.summaryLabel}>Total Artifacts</p>
            <p style={styles.summaryValue}>{artifacts.length}</p>
          </div>
          <div style={styles.summaryCard}>
            <p style={styles.summaryLabel}>Avg Confidence</p>
            <p style={styles.summaryValue}>{artifacts.length > 0 ? `${avgConfidence(artifacts)}%` : "—"}</p>
          </div>
          <div style={styles.summaryCard}>
            <p style={styles.summaryLabel}>Top Source Type</p>
            <p style={{ ...styles.summaryValue, fontSize: "1.25rem" }}>
              {topSourceType(artifacts)}
            </p>
          </div>
        </div>

        {/* Status message */}
        <div aria-live="polite" aria-atomic="true" style={{ marginBottom: statusMessage ? 16 : 0 }}>
          {statusMessage && (
            <p style={{ color: "#14b8a6", fontSize: "0.85rem", fontWeight: 600, margin: 0 }}>
              {statusMessage}
            </p>
          )}
        </div>

        {/* Upload form */}
        <section style={styles.formCard} aria-labelledby="upload-form-heading">
          <h2 id="upload-form-heading" style={styles.cardTitle}>Analyze Artifact</h2>
          <form onSubmit={handleSubmit} noValidate>
            <div style={styles.fieldGroup}>
              <label htmlFor="artifact-text" style={styles.label}>
                Paste extracted text from flyer or ad
              </label>
              <textarea
                id="artifact-text"
                value={formText}
                onChange={(e) => setFormText(e.target.value)}
                placeholder={"EMERGENCY PLUMBING SERVICES\nFast. Reliable. Affordable.\nCALL NOW: (555) 123-4567"}
                required
                style={styles.textarea}
                aria-required="true"
                aria-describedby={formError ? "upload-form-error" : undefined}
              />
            </div>

            <div style={styles.formGrid}>
              <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
                <div style={styles.fieldGroup}>
                  <label htmlFor="artifact-source-type" style={styles.label}>
                    Source type
                  </label>
                  <select
                    id="artifact-source-type"
                    value={formSourceType}
                    onChange={(e) => setFormSourceType(e.target.value)}
                    style={styles.select}
                  >
                    {SOURCE_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </fieldset>

              <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
                <div style={styles.fieldGroup}>
                  <label htmlFor="artifact-niche" style={styles.label}>
                    Niche slug (optional)
                  </label>
                  <input
                    id="artifact-niche"
                    type="text"
                    value={formNicheSlug}
                    onChange={(e) => setFormNicheSlug(e.target.value)}
                    placeholder="e.g. plumbing, roofing"
                    style={styles.input}
                  />
                </div>
              </fieldset>

              <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
                <div style={styles.fieldGroup}>
                  <label htmlFor="artifact-geo" style={styles.label}>
                    City or region hint (optional)
                  </label>
                  <input
                    id="artifact-geo"
                    type="text"
                    value={formGeoHint}
                    onChange={(e) => setFormGeoHint(e.target.value)}
                    placeholder="e.g. Denver, CO"
                    style={styles.input}
                  />
                </div>
              </fieldset>
            </div>

            <div style={{ marginTop: 4 }}>
              <button
                type="submit"
                disabled={formSubmitting}
                style={{ ...styles.primaryButton, opacity: formSubmitting ? 0.6 : 1 }}
                aria-busy={formSubmitting}
              >
                {formSubmitting ? "Analyzing..." : "Analyze Artifact"}
              </button>
            </div>

            {formError && (
              <p id="upload-form-error" role="alert" style={styles.errorText}>
                {formError}
              </p>
            )}
          </form>
        </section>

        {/* Artifact list */}
        <section aria-labelledby="artifact-list-heading">
          <h2 id="artifact-list-heading" style={{ ...styles.cardTitle, marginBottom: 12 }}>
            Analyzed Artifacts
            {artifacts.length > 0 && (
              <span style={{ fontWeight: 400, color: "rgba(255,255,255,0.4)", marginLeft: 8, fontSize: "0.8rem" }}>
                ({artifacts.length})
              </span>
            )}
          </h2>

          {artifacts.length === 0 ? (
            <div style={styles.formCard}>
              <p style={styles.muted}>
                No artifacts yet. Paste text from a flyer or ad above to get started.
              </p>
            </div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {artifacts.map((artifact) => (
                <li key={artifact.id} style={styles.artifactCard}>
                  <div style={styles.artifactHeader}>
                    <div>
                      <h3 style={styles.artifactTitle}>
                        {artifact.headline ?? artifact.extractedText.slice(0, 50).trim()}
                        {!artifact.headline && artifact.extractedText.length > 50 ? "…" : ""}
                      </h3>
                      {artifact.geoContext && (artifact.geoContext.city || artifact.geoContext.state) && (
                        <p style={styles.geoText}>
                          {[artifact.geoContext.city, artifact.geoContext.state].filter(Boolean).join(", ")}
                          {artifact.geoContext.zipCode ? ` ${artifact.geoContext.zipCode}` : ""}
                        </p>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start", flexWrap: "wrap" as const }}>
                      <span style={styles.sourceBadge} aria-label={`Source type: ${artifact.sourceType}`}>
                        {artifact.sourceType}
                      </span>
                      <span
                        style={styles.confidenceBadge(artifact.confidence)}
                        aria-label={`Confidence score: ${artifact.confidence}%`}
                      >
                        {artifact.confidence}% confidence
                      </span>
                    </div>
                  </div>

                  {artifact.offer?.primaryOffer && (
                    <p style={styles.offerText}>{artifact.offer.primaryOffer}</p>
                  )}

                  <div style={styles.statRow} aria-label="Artifact statistics">
                    <div style={styles.stat}>
                      <span style={styles.statLabel}>Urgency</span>
                      <span style={styles.statValue}>{artifact.urgencySignals.length}</span>
                    </div>
                    <div style={styles.stat}>
                      <span style={styles.statLabel}>Trust</span>
                      <span style={styles.statValue}>{artifact.trustSignals.length}</span>
                    </div>
                    <div style={styles.stat}>
                      <span style={styles.statLabel}>CTAs</span>
                      <span style={styles.statValue}>{artifact.ctaLabels.length}</span>
                    </div>
                    <div style={styles.stat}>
                      <span style={styles.statLabel}>Phones</span>
                      <span style={styles.statValue}>{artifact.contactInfo.phones.length}</span>
                    </div>
                    <div style={styles.stat}>
                      <span style={styles.statLabel}>Emails</span>
                      <span style={styles.statValue}>{artifact.contactInfo.emails.length}</span>
                    </div>
                    <div style={styles.stat}>
                      <span style={styles.statLabel}>Websites</span>
                      <span style={styles.statValue}>{artifact.contactInfo.websites.length}</span>
                    </div>
                    {artifact.audience.targetIndustry && (
                      <div style={styles.stat}>
                        <span style={styles.statLabel}>Industry</span>
                        <span style={styles.statValue}>{artifact.audience.targetIndustry}</span>
                      </div>
                    )}
                  </div>

                  <div style={styles.cardActions}>
                    <button
                      type="button"
                      onClick={() => handleRemove(artifact.id)}
                      disabled={removingIds.has(artifact.id)}
                      style={{
                        ...styles.dangerButton,
                        opacity: removingIds.has(artifact.id) ? 0.6 : 1,
                      }}
                      aria-busy={removingIds.has(artifact.id)}
                      aria-label={`Remove artifact: ${artifact.headline ?? artifact.id}`}
                    >
                      {removingIds.has(artifact.id) ? "Removing..." : "Remove"}
                    </button>
                    <button
                      type="button"
                      disabled
                      style={styles.disabledButton}
                      aria-label="Use as Template — coming soon"
                      aria-disabled="true"
                    >
                      Use as Template
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

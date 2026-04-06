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
  if (artifacts.length === 0) return "\u2014";
  const counts: Record<string, number> = {};
  for (const a of artifacts) {
    counts[a.sourceType] = (counts[a.sourceType] ?? 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "\u2014";
}

function avgConfidence(artifacts: MarketingArtifact[]): number {
  if (artifacts.length === 0) return 0;
  const total = artifacts.reduce((sum, a) => sum + a.confidence, 0);
  return Math.round(total / artifacts.length);
}

export default function MarketingIngestionPageClient() {
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
      <div className="min-h-screen bg-background font-sans text-foreground">
        <div className="mx-auto max-w-[1100px] px-6 py-8">
          <div className="rounded-xl border border-border bg-muted p-6">
            <p className="m-0 text-sm text-muted-foreground">Loading marketing intelligence data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <div className="mx-auto max-w-[1100px] px-6 py-8">
        <h1 className="mb-2 text-2xl font-bold text-foreground">Marketing Intelligence</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Extract proven messaging, offers, and design patterns from real-world marketing materials.
        </p>

        {/* Summary cards */}
        <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4" role="region" aria-label="Summary statistics">
          <div className="rounded-xl border border-border bg-muted px-6 py-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Artifacts</p>
            <p className="m-0 text-3xl font-bold text-foreground">{artifacts.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-muted px-6 py-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Avg Confidence</p>
            <p className="m-0 text-3xl font-bold text-foreground">{artifacts.length > 0 ? `${avgConfidence(artifacts)}%` : "\u2014"}</p>
          </div>
          <div className="rounded-xl border border-border bg-muted px-6 py-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Top Source Type</p>
            <p className="m-0 text-xl font-bold text-foreground">
              {topSourceType(artifacts)}
            </p>
          </div>
        </div>

        {/* Status message */}
        <div aria-live="polite" aria-atomic="true" className={statusMessage ? "mb-4" : ""}>
          {statusMessage && (
            <p className="m-0 text-sm font-semibold text-teal-400">
              {statusMessage}
            </p>
          )}
        </div>

        {/* Upload form */}
        <section className="mb-6 rounded-xl border border-border bg-muted p-6" aria-labelledby="upload-form-heading">
          <h2 id="upload-form-heading" className="mb-4 text-sm font-bold text-foreground">Analyze Artifact</h2>
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4 flex flex-col gap-1.5">
              <label htmlFor="artifact-text" className="text-xs font-semibold text-muted-foreground">
                Paste extracted text from flyer or ad
              </label>
              <textarea
                id="artifact-text"
                value={formText}
                onChange={(e) => setFormText(e.target.value)}
                placeholder={"EMERGENCY PLUMBING SERVICES\nFast. Reliable. Affordable.\nCALL NOW: (555) 123-4567"}
                required
                className="min-h-[120px] w-full resize-y rounded-lg border border-border bg-muted px-3.5 py-2.5 font-[inherit] text-sm text-foreground outline-none"
                aria-required="true"
                aria-describedby={formError ? "upload-form-error" : undefined}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <fieldset className="m-0 border-none p-0">
                <div className="mb-4 flex flex-col gap-1.5">
                  <label htmlFor="artifact-source-type" className="text-xs font-semibold text-muted-foreground">
                    Source type
                  </label>
                  <select
                    id="artifact-source-type"
                    value={formSourceType}
                    onChange={(e) => setFormSourceType(e.target.value)}
                    className="min-h-11 w-full cursor-pointer rounded-lg border border-border bg-muted px-3.5 py-2.5 text-sm text-foreground outline-none"
                  >
                    {SOURCE_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </fieldset>

              <fieldset className="m-0 border-none p-0">
                <div className="mb-4 flex flex-col gap-1.5">
                  <label htmlFor="artifact-niche" className="text-xs font-semibold text-muted-foreground">
                    Niche slug (optional)
                  </label>
                  <input
                    id="artifact-niche"
                    type="text"
                    value={formNicheSlug}
                    onChange={(e) => setFormNicheSlug(e.target.value)}
                    placeholder="e.g. plumbing, roofing"
                    className="min-h-11 w-full rounded-lg border border-border bg-muted px-3.5 py-2.5 text-sm text-foreground outline-none"
                  />
                </div>
              </fieldset>

              <fieldset className="m-0 border-none p-0">
                <div className="mb-4 flex flex-col gap-1.5">
                  <label htmlFor="artifact-geo" className="text-xs font-semibold text-muted-foreground">
                    City or region hint (optional)
                  </label>
                  <input
                    id="artifact-geo"
                    type="text"
                    value={formGeoHint}
                    onChange={(e) => setFormGeoHint(e.target.value)}
                    placeholder="e.g. Denver, CO"
                    className="min-h-11 w-full rounded-lg border border-border bg-muted px-3.5 py-2.5 text-sm text-foreground outline-none"
                  />
                </div>
              </fieldset>
            </div>

            <div className="mt-1">
              <button
                type="submit"
                disabled={formSubmitting}
                className="min-h-11 cursor-pointer whitespace-nowrap rounded-lg border-none bg-teal-500 px-5 py-2.5 text-sm font-bold text-[#0a0f1a]"
                style={{ opacity: formSubmitting ? 0.6 : 1 }}
                aria-busy={formSubmitting}
              >
                {formSubmitting ? "Analyzing..." : "Analyze Artifact"}
              </button>
            </div>

            {formError && (
              <p id="upload-form-error" role="alert" className="mt-2 text-sm text-red-400">
                {formError}
              </p>
            )}
          </form>
        </section>

        {/* Artifact list */}
        <section aria-labelledby="artifact-list-heading">
          <h2 id="artifact-list-heading" className="mb-3 text-sm font-bold text-foreground">
            Analyzed Artifacts
            {artifacts.length > 0 && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                ({artifacts.length})
              </span>
            )}
          </h2>

          {artifacts.length === 0 ? (
            <div className="rounded-xl border border-border bg-muted p-6">
              <p className="text-sm text-muted-foreground">
                No artifacts yet. Paste text from a flyer or ad above to get started.
              </p>
            </div>
          ) : (
            <ul className="m-0 list-none p-0">
              {artifacts.map((artifact) => (
                <li key={artifact.id} className="mb-3 rounded-xl border border-border bg-muted p-5">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h3 className="mb-1 text-base font-bold text-foreground">
                        {artifact.headline ?? artifact.extractedText.slice(0, 50).trim()}
                        {!artifact.headline && artifact.extractedText.length > 50 ? "\u2026" : ""}
                      </h3>
                      {artifact.geoContext && (artifact.geoContext.city || artifact.geoContext.state) && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {[artifact.geoContext.city, artifact.geoContext.state].filter(Boolean).join(", ")}
                          {artifact.geoContext.zipCode ? ` ${artifact.geoContext.zipCode}` : ""}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-start gap-2">
                      <span className="inline-block rounded-full bg-indigo-500/15 px-2.5 py-0.5 text-[0.72rem] font-bold uppercase tracking-wider text-indigo-300" aria-label={`Source type: ${artifact.sourceType}`}>
                        {artifact.sourceType}
                      </span>
                      <span
                        className="inline-block rounded-full px-2.5 py-0.5 text-[0.72rem] font-bold"
                        style={{
                          background: artifact.confidence >= 70
                            ? "rgba(20, 184, 166, 0.15)"
                            : artifact.confidence >= 40
                              ? "rgba(245, 158, 11, 0.15)"
                              : "rgba(239, 68, 68, 0.15)",
                          color: confidenceColor(artifact.confidence),
                        }}
                        aria-label={`Confidence score: ${artifact.confidence}%`}
                      >
                        {artifact.confidence}% confidence
                      </span>
                    </div>
                  </div>

                  {artifact.offer?.primaryOffer && (
                    <p className="mt-2 text-xs italic text-muted-foreground">{artifact.offer.primaryOffer}</p>
                  )}

                  <div className="flex flex-wrap gap-4 border-t border-border py-3 text-xs text-muted-foreground" aria-label="Artifact statistics">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[0.7rem] uppercase tracking-wider text-muted-foreground/70">Urgency</span>
                      <span className="text-sm font-semibold text-foreground">{artifact.urgencySignals.length}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[0.7rem] uppercase tracking-wider text-muted-foreground/70">Trust</span>
                      <span className="text-sm font-semibold text-foreground">{artifact.trustSignals.length}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[0.7rem] uppercase tracking-wider text-muted-foreground/70">CTAs</span>
                      <span className="text-sm font-semibold text-foreground">{artifact.ctaLabels.length}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[0.7rem] uppercase tracking-wider text-muted-foreground/70">Phones</span>
                      <span className="text-sm font-semibold text-foreground">{artifact.contactInfo.phones.length}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[0.7rem] uppercase tracking-wider text-muted-foreground/70">Emails</span>
                      <span className="text-sm font-semibold text-foreground">{artifact.contactInfo.emails.length}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[0.7rem] uppercase tracking-wider text-muted-foreground/70">Websites</span>
                      <span className="text-sm font-semibold text-foreground">{artifact.contactInfo.websites.length}</span>
                    </div>
                    {artifact.audience.targetIndustry && (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[0.7rem] uppercase tracking-wider text-muted-foreground/70">Industry</span>
                        <span className="text-sm font-semibold text-foreground">{artifact.audience.targetIndustry}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleRemove(artifact.id)}
                      disabled={removingIds.has(artifact.id)}
                      className="min-h-11 cursor-pointer rounded-lg border border-red-500/30 bg-transparent px-3.5 py-2 text-xs font-semibold text-red-400"
                      style={{ opacity: removingIds.has(artifact.id) ? 0.6 : 1 }}
                      aria-busy={removingIds.has(artifact.id)}
                      aria-label={`Remove artifact: ${artifact.headline ?? artifact.id}`}
                    >
                      {removingIds.has(artifact.id) ? "Removing..." : "Remove"}
                    </button>
                    <button
                      type="button"
                      disabled
                      className="min-h-11 cursor-not-allowed rounded-lg border border-border bg-transparent px-3.5 py-2 text-xs font-semibold text-muted-foreground/50"
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
    </div>
  );
}

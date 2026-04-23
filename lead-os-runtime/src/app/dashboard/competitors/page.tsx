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

const DEMO_COMPETITORS: CompetitorWithSnapshot[] = [
  {
    competitor: { id: "comp-demo-001", tenantId: TENANT_ID, url: "https://www.acme-roofing.com", name: "Acme Roofing Co.", nicheSlug: "construction", lastScrapedAt: "2026-03-28T09:00:00Z", scrapeCount: 12, status: "active", createdAt: "2026-01-15T09:00:00Z", updatedAt: "2026-03-28T09:00:00Z" },
    latestSnapshot: { id: "snap-001", competitorId: "comp-demo-001", tenantId: TENANT_ID, scrapedAt: "2026-03-28T09:00:00Z", colorCount: 4, sectionCount: 7, headlineCount: 12, ctaCount: 6, hasChat: false, hasBooking: true, hasPricing: false, hasTestimonials: true, confidence: 88, summary: "Established roofing brand with strong local SEO. Booking CTA on every page. No chat widget or public pricing." },
  },
  {
    competitor: { id: "comp-demo-002", tenantId: TENANT_ID, url: "https://www.swifthvac.io", name: "Swift HVAC", nicheSlug: "healthcare", lastScrapedAt: "2026-03-27T14:00:00Z", scrapeCount: 8, status: "active", createdAt: "2026-02-01T09:00:00Z", updatedAt: "2026-03-27T14:00:00Z" },
    latestSnapshot: { id: "snap-002", competitorId: "comp-demo-002", tenantId: TENANT_ID, scrapedAt: "2026-03-27T14:00:00Z", colorCount: 3, sectionCount: 5, headlineCount: 9, ctaCount: 3, hasChat: true, hasBooking: false, hasPricing: true, hasTestimonials: false, confidence: 74, summary: "Modern HVAC site with live chat and visible pricing tiers. Lacks testimonials and online booking." },
  },
  {
    competitor: { id: "comp-demo-003", tenantId: TENANT_ID, url: "https://greenlawn-erie.com", name: "Green Lawn Erie", nicheSlug: "construction", lastScrapedAt: "2026-03-20T11:00:00Z", scrapeCount: 4, status: "paused", createdAt: "2026-02-20T09:00:00Z", updatedAt: "2026-03-20T11:00:00Z" },
    latestSnapshot: { id: "snap-003", competitorId: "comp-demo-003", tenantId: TENANT_ID, scrapedAt: "2026-03-20T11:00:00Z", colorCount: 6, sectionCount: 4, headlineCount: 6, ctaCount: 2, hasChat: false, hasBooking: false, hasPricing: false, hasTestimonials: true, confidence: 61, summary: "Small local landscaping site. Minimal CTAs and no online scheduling. Good testimonials section." },
  },
];

const NICHE_OPTIONS = [
  { value: "", label: "-- No niche --" },
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

function statusBadgeClass(status: string): string {
  if (status === "active") return "bg-teal-500/15 text-teal-500";
  if (status === "error") return "bg-red-500/15 text-red-400";
  return "bg-slate-500/15 text-muted-foreground";
}

export default function CompetitorsPage() {
  const [details, setDetails] = useState<CompetitorWithSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
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
      if (!res.ok) throw new Error("not-ok");
      const json = await res.json();
      const competitors: TrackedCompetitor[] = json.data ?? [];

      if (competitors.length === 0) {
        setDetails(DEMO_COMPETITORS);
        setIsDemo(true);
        setLoading(false);
        return;
      }

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
    } catch {
      setDetails(DEMO_COMPETITORS);
      setIsDemo(true);
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
      <main className="min-h-screen bg-background text-foreground">
        <div className="max-w-[1100px] mx-auto px-6 py-8">
          <div className="rounded-xl bg-muted border border-border p-6">
            <p className="text-muted-foreground text-sm">Loading competitor data...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      {isDemo && (
        <div className="bg-indigo-50 dark:bg-indigo-950/30 border-b border-indigo-300 dark:border-indigo-800 px-6 py-2.5 text-sm text-indigo-800 dark:text-indigo-200">
          Demo competitors — Sign in to track and analyze your real competitors.{" "}
        </div>
      )}
      <div className="max-w-[1100px] mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-6">Competitor Intelligence</h1>

        {/* Summary cards */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-6" role="region" aria-label="Summary statistics">
          <div className="rounded-xl bg-muted border border-border px-6 py-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Total Tracked</p>
            <p className="text-3xl font-bold text-foreground">{details.length}</p>
          </div>
          <div className="rounded-xl bg-muted border border-border px-6 py-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Last Analyzed</p>
            <p className="text-3xl font-bold text-foreground" aria-label={`Last analyzed: ${lastAnalyzedDate(details)}`}>
              {lastAnalyzedDate(details)}
            </p>
          </div>
          <div className="rounded-xl bg-muted border border-border px-6 py-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Avg Confidence</p>
            <p className="text-3xl font-bold text-foreground">{details.length > 0 ? `${avgConfidence(details)}%` : "\u2014"}</p>
            <p className="text-xs text-muted-foreground mt-1">based on analyzed competitors</p>
          </div>
        </div>

        {/* Status message */}
        <div aria-live="polite" aria-atomic="true" className={statusMessage ? "mb-4" : ""}>
          {statusMessage && (
            <p className="text-teal-500 text-sm font-semibold m-0">
              {statusMessage}
            </p>
          )}
        </div>

        {/* Add competitor form */}
        <section className="rounded-xl bg-muted border border-border p-6 mb-6" aria-labelledby="add-competitor-heading">
          <h2 id="add-competitor-heading" className="text-sm font-bold text-foreground mb-4">Add Competitor</h2>
          <form onSubmit={handleAddCompetitor} noValidate>
            <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-3 items-end">
              <fieldset className="border-none p-0 m-0">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="competitor-url" className="text-xs font-semibold text-muted-foreground">
                    URL
                  </label>
                  <input
                    id="competitor-url"
                    type="url"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    placeholder="https://competitor.com"
                    required
                    className="bg-muted border border-border rounded-lg px-3.5 py-2.5 text-foreground text-sm outline-none min-h-[44px] w-full box-border"
                    aria-required="true"
                    aria-describedby={formError ? "form-error" : undefined}
                  />
                </div>
              </fieldset>
              <fieldset className="border-none p-0 m-0">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="competitor-name" className="text-xs font-semibold text-muted-foreground">
                    Name
                  </label>
                  <input
                    id="competitor-name"
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Acme Corp"
                    required
                    className="bg-muted border border-border rounded-lg px-3.5 py-2.5 text-foreground text-sm outline-none min-h-[44px] w-full box-border"
                    aria-required="true"
                  />
                </div>
              </fieldset>
              <fieldset className="border-none p-0 m-0">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="competitor-niche" className="text-xs font-semibold text-muted-foreground">
                    Niche (optional)
                  </label>
                  <select
                    id="competitor-niche"
                    value={formNiche}
                    onChange={(e) => setFormNiche(e.target.value)}
                    className="bg-muted border border-border rounded-lg px-3.5 py-2.5 text-foreground text-sm outline-none min-h-[44px] cursor-pointer"
                  >
                    {NICHE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </fieldset>
              <div className="pt-[22px]">
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className={`px-5 py-2.5 rounded-lg border-none bg-teal-500 text-primary-foreground text-sm font-bold cursor-pointer min-h-[44px] whitespace-nowrap ${formSubmitting ? "opacity-60" : ""}`}
                  aria-busy={formSubmitting}
                >
                  {formSubmitting ? "Adding..." : "Add Competitor"}
                </button>
              </div>
            </div>
            {formError && (
              <p id="form-error" role="alert" className="text-red-400 text-sm mt-2">
                {formError}
              </p>
            )}
          </form>
        </section>

        {/* Competitor list */}
        <section aria-labelledby="competitor-list-heading">
          <h2 id="competitor-list-heading" className="text-sm font-bold text-foreground mb-3">
            Tracked Competitors
            {details.length > 0 && (
              <span className="font-normal text-muted-foreground ml-2 text-xs">
                ({details.length})
              </span>
            )}
          </h2>

          {details.length === 0 ? (
            <div className="rounded-xl bg-muted border border-border p-6">
              <p className="text-muted-foreground text-sm">No competitors tracked yet. Add one above to get started.</p>
            </div>
          ) : (
            <ul className="list-none p-0 m-0">
              {details.map(({ competitor, latestSnapshot }) => (
                <li key={competitor.id} className="rounded-xl bg-muted border border-border p-5 mb-3">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-base font-bold text-foreground mb-1">{competitor.name}</h3>
                      <p className="text-xs text-muted-foreground m-0 break-all">
                        <a
                          href={competitor.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground no-underline"
                          aria-label={`Visit ${competitor.name} website`}
                        >
                          {competitor.url}
                        </a>
                      </p>
                      {competitor.nicheSlug && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Niche: {competitor.nicheSlug}
                        </p>
                      )}
                    </div>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[0.72rem] font-bold uppercase tracking-wider ${statusBadgeClass(competitor.status)}`} aria-label={`Status: ${competitor.status}`}>
                      {competitor.status}
                    </span>
                  </div>

                  {competitor.lastError && (
                    <p role="alert" className="text-red-400 text-sm mt-2">
                      Last error: {competitor.lastError}
                    </p>
                  )}

                  {latestSnapshot ? (
                    <>
                      <div className="flex flex-wrap gap-4 py-3 border-t border-border text-xs text-muted-foreground" aria-label="Latest snapshot statistics">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[0.7rem] text-muted-foreground uppercase tracking-wider">Sections</span>
                          <span className="text-sm font-semibold text-foreground">{latestSnapshot.sectionCount}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[0.7rem] text-muted-foreground uppercase tracking-wider">Headlines</span>
                          <span className="text-sm font-semibold text-foreground">{latestSnapshot.headlineCount}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[0.7rem] text-muted-foreground uppercase tracking-wider">CTAs</span>
                          <span className="text-sm font-semibold text-foreground">{latestSnapshot.ctaCount}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[0.7rem] text-muted-foreground uppercase tracking-wider">Confidence</span>
                          <span className="text-sm font-semibold text-foreground">{latestSnapshot.confidence}%</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[0.7rem] text-muted-foreground uppercase tracking-wider">Analyzed</span>
                          <span className="text-sm font-semibold text-foreground">{formatDate(latestSnapshot.scrapedAt)}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap mb-1" aria-label="Detected features">
                        {[
                          { label: "Chat", active: latestSnapshot.hasChat },
                          { label: "Booking", active: latestSnapshot.hasBooking },
                          { label: "Pricing", active: latestSnapshot.hasPricing },
                          { label: "Testimonials", active: latestSnapshot.hasTestimonials },
                        ].map((feat) => (
                          <span
                            key={feat.label}
                            className={`inline-block px-2 py-0.5 rounded-full text-[0.7rem] font-semibold border ${
                              feat.active
                                ? "bg-teal-500/10 text-teal-500 border-teal-500/20"
                                : "bg-muted text-muted-foreground border-border"
                            }`}
                          >
                            {feat.label}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 italic">{latestSnapshot.summary}</p>
                    </>
                  ) : (
                    <p className="text-muted-foreground text-sm mt-2">
                      Not yet analyzed. Click &quot;Analyze&quot; to scrape this competitor.
                    </p>
                  )}

                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => handleAnalyze(competitor.id)}
                      disabled={analyzingIds.has(competitor.id)}
                      className={`px-3.5 py-2 rounded-lg border border-border bg-transparent text-muted-foreground text-xs font-semibold cursor-pointer min-h-[44px] ${analyzingIds.has(competitor.id) ? "opacity-60" : ""}`}
                      aria-busy={analyzingIds.has(competitor.id)}
                      aria-label={`Analyze ${competitor.name}`}
                    >
                      {analyzingIds.has(competitor.id) ? "Analyzing..." : "Analyze"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(competitor.id)}
                      disabled={removingIds.has(competitor.id)}
                      className={`px-3.5 py-2 rounded-lg border border-red-500/30 bg-transparent text-red-400 text-xs font-semibold cursor-pointer min-h-[44px] ${removingIds.has(competitor.id) ? "opacity-60" : ""}`}
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

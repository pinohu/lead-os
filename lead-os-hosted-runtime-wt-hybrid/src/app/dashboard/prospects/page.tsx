"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ProspectStatus =
  | "discovered"
  | "contacted"
  | "qualified"
  | "proposal"
  | "closed"
  | "rejected";

type OpportunityType =
  | "digital_gap"
  | "no_website"
  | "poor_online_presence"
  | "seo_opportunity"
  | "social_media_gap"
  | "reputation_management"
  | "competitor_weakness"
  | "other";

type Priority = "hot" | "warm" | "cool" | "cold";

interface Prospect {
  id: string;
  businessName: string;
  niche: string;
  geo: string;
  website: string | null;
  phone: string | null;
  opportunityType: OpportunityType;
  priority: Priority;
  confidence: number;
  opportunityScore: number;
  digitalGapScore: number;
  estimatedMonthlyValue: number;
  suggestedAction: string;
  outreachTemplate: string;
  reasoning: string[];
  status: ProspectStatus;
  contactAttempts: number;
  createdAt: string;
  lastContactedAt?: string | null;
}

interface ProspectStats {
  total: number;
  hot: number;
  estimatedMonthlyValue: number;
  pipelineLeads: number;
}

interface ProspectsApiResponse {
  data: Prospect[];
  meta: { stats: ProspectStats };
}

interface ScoutResult {
  summary: string;
  prospects: Prospect[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TENANT_ID = "default-tenant";

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string }> = {
  hot: { label: "Hot", color: "#ef4444", bg: "rgba(239, 68, 68, 0.14)" },
  warm: { label: "Warm", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.14)" },
  cool: { label: "Cool", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.14)" },
  cold: { label: "Cold", color: "#6b7280", bg: "rgba(107, 114, 128, 0.14)" },
};

const OPPORTUNITY_LABELS: Record<OpportunityType, string> = {
  digital_gap: "Digital Gap",
  no_website: "No Website",
  poor_online_presence: "Poor Presence",
  seo_opportunity: "SEO Opportunity",
  social_media_gap: "Social Media Gap",
  reputation_management: "Reputation Mgmt",
  competitor_weakness: "Competitor Weakness",
  other: "Other",
};

const STATUS_OPTIONS: { value: ProspectStatus; label: string }[] = [
  { value: "discovered", label: "Discovered" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal", label: "Proposal" },
  { value: "closed", label: "Closed" },
  { value: "rejected", label: "Rejected" },
];

const OPPORTUNITY_OPTIONS: { value: OpportunityType | "all"; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "digital_gap", label: "Digital Gap" },
  { value: "no_website", label: "No Website" },
  { value: "poor_online_presence", label: "Poor Presence" },
  { value: "seo_opportunity", label: "SEO Opportunity" },
  { value: "social_media_gap", label: "Social Media Gap" },
  { value: "reputation_management", label: "Reputation Mgmt" },
  { value: "competitor_weakness", label: "Competitor Weakness" },
  { value: "other", label: "Other" },
];

const PRIORITY_FILTER_OPTIONS: { value: Priority | "all"; label: string }[] = [
  { value: "all", label: "All Priorities" },
  { value: "hot", label: "Hot" },
  { value: "warm", label: "Warm" },
  { value: "cool", label: "Cool" },
  { value: "cold", label: "Cold" },
];

const STATUS_FILTER_OPTIONS: { value: ProspectStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  ...STATUS_OPTIONS,
];

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function formatCurrency(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }
  return `$${value.toLocaleString()}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PriorityBadge({ priority }: { priority: Priority }) {
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <span
      className="inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[0.72rem] font-bold uppercase tracking-wider"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

function OpportunityBadge({ type }: { type: OpportunityType }) {
  return (
    <span className="inline-block whitespace-nowrap rounded-full bg-indigo-500/15 px-2.5 py-0.5 text-[0.72rem] font-bold text-indigo-300">
      {OPPORTUNITY_LABELS[type]}
    </span>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const color =
    value >= 70 ? "#22c55e" : value >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div
      role="meter"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Confidence ${value}%`}
      className="flex items-center gap-2"
    >
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span
        className="min-w-8 text-right text-xs font-bold"
        style={{ color }}
      >
        {value}%
      </span>
    </div>
  );
}

interface ProspectCardProps {
  prospect: Prospect;
  onStatusChange: (id: string, status: ProspectStatus) => Promise<void>;
  onContact: (id: string) => Promise<void>;
  updatingIds: Set<string>;
  contactingIds: Set<string>;
}

function ProspectCard({
  prospect,
  onStatusChange,
  onContact,
  updatingIds,
  contactingIds,
}: ProspectCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isUpdating = updatingIds.has(prospect.id);
  const isContacting = contactingIds.has(prospect.id);

  return (
    <article
      className="mb-3 rounded-xl border border-border bg-muted px-6 py-5"
      aria-label={`Prospect: ${prospect.businessName}`}
    >
      {/* Card header */}
      <div className="mb-3 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="mb-1 truncate text-base font-bold text-foreground">
            {prospect.businessName}
          </h3>
          <p className="m-0 text-xs text-muted-foreground">
            {prospect.niche}
            {prospect.geo ? ` \u00b7 ${prospect.geo}` : ""}
            {prospect.website ? (
              <>
                {" \u00b7 "}
                <a
                  href={prospect.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 no-underline"
                  aria-label={`Visit ${prospect.businessName} website`}
                >
                  {prospect.website.replace(/^https?:\/\//, "")}
                </a>
              </>
            ) : null}
            {prospect.phone ? ` \u00b7 ${prospect.phone}` : ""}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-1.5">
          <PriorityBadge priority={prospect.priority} />
          <OpportunityBadge type={prospect.opportunityType} />
        </div>
      </div>

      {/* Metrics row */}
      <div className="mb-3.5 grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confidence</p>
          <ConfidenceBar value={prospect.confidence} />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Est. Monthly Value</p>
          <p className="m-0 text-lg font-bold text-foreground">
            {formatCurrency(prospect.estimatedMonthlyValue)}
          </p>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Opportunity Score</p>
          <p className="m-0 text-lg font-bold text-foreground">
            {prospect.opportunityScore}
            <span className="ml-0.5 text-[0.72rem] text-muted-foreground">/100</span>
          </p>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact Attempts</p>
          <p className="m-0 text-lg font-bold text-foreground">
            {prospect.contactAttempts}
          </p>
        </div>
      </div>

      {/* Suggested action */}
      {prospect.suggestedAction && (
        <p className="mb-3.5 m-0 text-xs italic text-foreground">
          {prospect.suggestedAction}
        </p>
      )}

      {/* Reasoning chips */}
      {prospect.reasoning.length > 0 && (
        <div className="mb-3.5 flex flex-wrap gap-1.5" aria-label="Discovery reasoning">
          {prospect.reasoning.map((reason, i) => (
            <span
              key={`reason-${i}-${reason.slice(0, 20)}`}
              className="inline-block rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[0.7rem] font-semibold text-purple-300"
            >
              {reason}
            </span>
          ))}
        </div>
      )}

      {/* Action row */}
      <div className="flex flex-wrap items-center gap-2.5 border-t border-border pt-3.5">
        <label
          htmlFor={`status-${prospect.id}`}
          className="whitespace-nowrap text-xs font-semibold text-muted-foreground"
        >
          Status
        </label>
        <select
          id={`status-${prospect.id}`}
          value={prospect.status}
          onChange={(e) => onStatusChange(prospect.id, e.target.value as ProspectStatus)}
          disabled={isUpdating}
          aria-busy={isUpdating}
          className="min-h-9 cursor-pointer rounded-lg border border-border bg-muted px-2.5 py-1.5 font-[inherit] text-xs text-foreground outline-none"
          style={{ opacity: isUpdating ? 0.6 : 1 }}
          aria-label={`Update status for ${prospect.businessName}`}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => onContact(prospect.id)}
          disabled={isContacting}
          aria-busy={isContacting}
          aria-label={`Mark ${prospect.businessName} as contacted`}
          className="min-h-9 cursor-pointer rounded-lg border-none bg-blue-500 px-3.5 py-1.5 font-[inherit] text-xs font-semibold text-white"
          style={{ opacity: isContacting ? 0.6 : 1 }}
        >
          {isContacting ? "Marking..." : "Contact"}
        </button>

        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          aria-controls={`outreach-${prospect.id}`}
          className="min-h-9 cursor-pointer rounded-lg border border-border bg-transparent px-3.5 py-1.5 font-[inherit] text-xs font-semibold text-muted-foreground"
        >
          {expanded ? "Hide template" : "View template"}
        </button>

        <span className="ml-auto text-[0.72rem] text-muted-foreground">
          Added {formatDate(prospect.createdAt)}
          {prospect.lastContactedAt
            ? ` \u00b7 Last contacted ${formatDate(prospect.lastContactedAt)}`
            : ""}
        </span>
      </div>

      {/* Outreach template (expandable) */}
      {expanded && (
        <div
          id={`outreach-${prospect.id}`}
          role="region"
          aria-label={`Outreach template for ${prospect.businessName}`}
          className="mt-3.5 rounded-lg border border-border bg-black/30 px-4 py-3.5"
        >
          <p className="mb-2 text-[0.72rem] font-bold uppercase tracking-wider text-muted-foreground">
            Outreach Template
          </p>
          <pre className="m-0 whitespace-pre-wrap break-words font-[inherit] text-xs leading-relaxed text-foreground">
            {prospect.outreachTemplate}
          </pre>
        </div>
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [stats, setStats] = useState<ProspectStats>({
    total: 0,
    hot: 0,
    estimatedMonthlyValue: 0,
    pipelineLeads: 0,
  });
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [scoutNiche, setScoutNiche] = useState("");
  const [scoutGeo, setScoutGeo] = useState("");
  const [scoutAutoIngest, setScoutAutoIngest] = useState(false);
  const [scoutLoading, setScoutLoading] = useState(false);
  const [scoutError, setScoutError] = useState<string | null>(null);
  const [scoutResult, setScoutResult] = useState<ScoutResult | null>(null);

  const [filterStatus, setFilterStatus] = useState<ProspectStatus | "all">("all");
  const [filterOpportunity, setFilterOpportunity] = useState<OpportunityType | "all">("all");
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all");

  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [contactingIds, setContactingIds] = useState<Set<string>>(new Set());

  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadProspects = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const res = await fetch(
        `/api/prospects?stats=true&tenantId=${encodeURIComponent(TENANT_ID)}`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error(`Failed to load prospects: ${res.status}`);
      const json = (await res.json()) as ProspectsApiResponse;
      setProspects(json.data ?? []);
      if (json.meta?.stats) setStats(json.meta.stats);
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Unknown error loading prospects");
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProspects();
  }, [loadProspects]);

  const handleScout = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!scoutNiche.trim()) {
        setScoutError("Niche is required.");
        return;
      }
      setScoutLoading(true);
      setScoutError(null);
      setScoutResult(null);

      try {
        const res = await fetch("/api/prospects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            niche: scoutNiche.trim(),
            geo: scoutGeo.trim() || undefined,
            autoIngest: scoutAutoIngest,
            minConfidence: 30,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          setScoutError(json.error?.message ?? "Scout failed. Please try again.");
          return;
        }
        setScoutResult(json.data as ScoutResult);
        setStatusMessage("Scout complete. Prospects loaded below.");
        if (scoutAutoIngest) await loadProspects();
      } catch (err) {
        setScoutError(
          err instanceof Error ? err.message : "Network error. Please try again.",
        );
      } finally {
        setScoutLoading(false);
      }
    },
    [scoutNiche, scoutGeo, scoutAutoIngest, loadProspects],
  );

  const handleStatusChange = useCallback(
    async (id: string, status: ProspectStatus) => {
      setUpdatingIds((prev) => new Set(prev).add(id));
      setStatusMessage(null);
      try {
        const res = await fetch(`/api/prospects/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status }),
        });
        const json = await res.json();
        if (!res.ok) {
          setStatusMessage(`Failed to update status: ${json.error?.message ?? "Unknown error"}`);
          return;
        }
        const updated = json.data as Prospect;
        setProspects((prev) =>
          prev.map((p) => (p.id === updated.id ? updated : p)),
        );
        setStatusMessage(`Status updated to "${status}" for ${updated.businessName}.`);
      } catch {
        setStatusMessage("Network error while updating status.");
      } finally {
        setUpdatingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [],
  );

  const handleContact = useCallback(async (id: string) => {
    setContactingIds((prev) => new Set(prev).add(id));
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/prospects/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ lastContactedAt: new Date().toISOString() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setStatusMessage(`Failed to mark contact: ${json.error?.message ?? "Unknown error"}`);
        return;
      }
      const updated = json.data as Prospect;
      setProspects((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p)),
      );
      setStatusMessage(`${updated.businessName} marked as contacted.`);
    } catch {
      setStatusMessage("Network error while marking contact.");
    } finally {
      setContactingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, []);

  const filteredProspects = prospects.filter((p) => {
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    if (filterOpportunity !== "all" && p.opportunityType !== filterOpportunity) return false;
    if (filterPriority !== "all" && p.priority !== filterPriority) return false;
    return true;
  });

  return (
    <main className="min-h-screen bg-background font-sans text-foreground">
      <div className="mx-auto max-w-[1100px] px-6 py-8">

        {/* Page header */}
        <div className="mb-7">
          <Link href="/dashboard" className="text-xs text-blue-400 no-underline">
            &larr; Dashboard
          </Link>
          <h1 className="mb-1.5 mt-3 text-2xl font-bold text-foreground">
            Prospect Discovery
          </h1>
          <p className="text-sm text-muted-foreground">
            Automatically discover high-value businesses, classify opportunities, and feed them
            into your lead pipeline.
          </p>
        </div>

        {/* Summary stats */}
        <div
          className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4"
          role="region"
          aria-label="Prospect summary statistics"
        >
          <div className="rounded-xl border border-border bg-muted px-6 py-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Prospects</p>
            <p className="m-0 text-2xl font-bold text-foreground">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-border bg-muted px-6 py-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hot Prospects</p>
            <p className="m-0 text-2xl font-bold text-red-400">{stats.hot}</p>
          </div>
          <div className="rounded-xl border border-border bg-muted px-6 py-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Est. Monthly Value</p>
            <p className="m-0 text-2xl font-bold text-emerald-400">
              {formatCurrency(stats.estimatedMonthlyValue)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-muted px-6 py-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pipeline Leads</p>
            <p className="m-0 text-2xl font-bold text-blue-400">{stats.pipelineLeads}</p>
          </div>
        </div>

        {/* Aria-live status announcer */}
        <div aria-live="polite" aria-atomic="true" className={statusMessage ? "mb-3 min-h-6" : "min-h-6"}>
          {statusMessage && (
            <p className="mt-2 text-xs text-emerald-400">{statusMessage}</p>
          )}
        </div>

        {/* Scout form */}
        <section
          className="mb-6 rounded-xl border border-border bg-muted px-6 py-5"
          aria-labelledby="scout-form-heading"
        >
          <h2 id="scout-form-heading" className="mb-4 text-sm font-bold text-foreground">
            Scout New Prospects
          </h2>
          <form onSubmit={handleScout} noValidate>
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="scout-niche" className="text-xs font-semibold text-muted-foreground">
                  Niche
                  <span className="ml-0.5 text-red-400" aria-hidden="true">*</span>
                </label>
                <input
                  id="scout-niche"
                  type="text"
                  value={scoutNiche}
                  onChange={(e) => setScoutNiche(e.target.value)}
                  placeholder="e.g. plumbing, dental, roofing"
                  required
                  aria-required="true"
                  aria-describedby={scoutError ? "scout-error" : undefined}
                  className="min-h-11 w-full rounded-lg border border-border bg-muted px-3.5 py-2.5 font-[inherit] text-sm text-foreground outline-none"
                  disabled={scoutLoading}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="scout-geo" className="text-xs font-semibold text-muted-foreground">
                  Location / Geo
                </label>
                <input
                  id="scout-geo"
                  type="text"
                  value={scoutGeo}
                  onChange={(e) => setScoutGeo(e.target.value)}
                  placeholder="e.g. Austin TX, Chicago, New York"
                  className="min-h-11 w-full rounded-lg border border-border bg-muted px-3.5 py-2.5 font-[inherit] text-sm text-foreground outline-none"
                  disabled={scoutLoading}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <label className="flex cursor-pointer select-none items-center gap-2 text-sm font-semibold text-foreground">
                <input
                  type="checkbox"
                  checked={scoutAutoIngest}
                  onChange={(e) => setScoutAutoIngest(e.target.checked)}
                  disabled={scoutLoading}
                  className="h-4 w-4 cursor-pointer accent-blue-500"
                  aria-describedby="auto-ingest-hint"
                />
                Auto-ingest to pipeline
              </label>
              <span id="auto-ingest-hint" className="text-xs text-muted-foreground">
                Automatically adds discovered prospects to your lead pipeline
              </span>

              <button
                type="submit"
                disabled={scoutLoading}
                aria-busy={scoutLoading}
                className="ml-auto min-h-11 cursor-pointer rounded-lg border-none bg-blue-500 px-5 py-2.5 font-[inherit] text-sm font-semibold text-white"
                style={{ opacity: scoutLoading ? 0.6 : 1 }}
              >
                {scoutLoading ? "Scouting..." : "Scout Now"}
              </button>
            </div>

            {scoutError && (
              <p id="scout-error" role="alert" className="mt-2 text-sm text-red-400">
                {scoutError}
              </p>
            )}
          </form>

          {/* Scout results summary */}
          {scoutResult && (
            <div
              role="region"
              aria-label="Scout results"
              className="mt-5 rounded-lg border border-emerald-400/15 bg-emerald-400/[0.06] px-5 py-4"
            >
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
                Scout Complete
              </p>
              <p className="m-0 text-sm text-foreground">
                {scoutResult.summary}
              </p>
              {scoutResult.prospects.length > 0 && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {scoutResult.prospects.length} prospect
                  {scoutResult.prospects.length !== 1 ? "s" : ""} discovered
                  {scoutAutoIngest ? " and ingested to pipeline." : "."}
                </p>
              )}
            </div>
          )}
        </section>

        {/* Filters */}
        <section
          className="mb-5 rounded-xl border border-border bg-muted px-6 py-5"
          aria-labelledby="filters-heading"
        >
          <h2 id="filters-heading" className="mb-4 text-sm font-bold text-foreground">
            Filter Prospects
          </h2>
          <div className="flex flex-wrap items-end gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="filter-status" className="text-xs font-semibold text-muted-foreground">
                Status
              </label>
              <select
                id="filter-status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as ProspectStatus | "all")}
                className="min-h-10 cursor-pointer rounded-lg border border-border bg-muted px-3 py-2 font-[inherit] text-xs text-foreground outline-none"
              >
                {STATUS_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="filter-opportunity" className="text-xs font-semibold text-muted-foreground">
                Opportunity Type
              </label>
              <select
                id="filter-opportunity"
                value={filterOpportunity}
                onChange={(e) => setFilterOpportunity(e.target.value as OpportunityType | "all")}
                className="min-h-10 cursor-pointer rounded-lg border border-border bg-muted px-3 py-2 font-[inherit] text-xs text-foreground outline-none"
              >
                {OPPORTUNITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="filter-priority" className="text-xs font-semibold text-muted-foreground">
                Priority
              </label>
              <select
                id="filter-priority"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value as Priority | "all")}
                className="min-h-10 cursor-pointer rounded-lg border border-border bg-muted px-3 py-2 font-[inherit] text-xs text-foreground outline-none"
              >
                {PRIORITY_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <span className="pb-2.5 text-xs text-muted-foreground" aria-live="polite">
              {filteredProspects.length} of {prospects.length} shown
            </span>
          </div>
        </section>

        {/* Prospect list */}
        <section aria-labelledby="prospects-list-heading">
          <h2
            id="prospects-list-heading"
            className="mb-4 flex items-center gap-2.5 text-sm font-bold text-foreground"
          >
            Discovered Prospects
            {!listLoading && (
              <span className="text-xs font-normal text-muted-foreground">
                ({filteredProspects.length})
              </span>
            )}
          </h2>

          {listLoading && (
            <div className="rounded-xl border border-border bg-muted p-10 text-center">
              <p className="text-sm text-muted-foreground" aria-busy="true">
                Loading prospects...
              </p>
            </div>
          )}

          {listError && !listLoading && (
            <div
              role="alert"
              className="rounded-xl border border-red-500/25 bg-red-500/[0.06] px-6 py-5"
            >
              <p className="mt-2 text-sm text-red-400">{listError}</p>
              <button
                type="button"
                onClick={loadProspects}
                className="mt-2.5 min-h-11 cursor-pointer rounded-lg border border-border bg-transparent px-3.5 py-2 font-[inherit] text-xs font-semibold text-muted-foreground"
              >
                Retry
              </button>
            </div>
          )}

          {!listLoading && !listError && filteredProspects.length === 0 && (
            <div className="rounded-xl border border-border bg-muted p-10 text-center">
              <p className="mb-2 text-base font-bold text-foreground">
                No prospects found.
              </p>
              <p className="m-0 text-sm text-muted-foreground">
                {prospects.length === 0
                  ? "Use the Scout form above to discover new business opportunities."
                  : "Try adjusting your filters to see more results."}
              </p>
            </div>
          )}

          {!listLoading && !listError && filteredProspects.length > 0 && (
            <ul className="m-0 list-none p-0">
              {filteredProspects.map((prospect) => (
                <li key={prospect.id}>
                  <ProspectCard
                    prospect={prospect}
                    onStatusChange={handleStatusChange}
                    onContact={handleContact}
                    updatingIds={updatingIds}
                    contactingIds={contactingIds}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

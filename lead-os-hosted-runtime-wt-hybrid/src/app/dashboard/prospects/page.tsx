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
// Shared style tokens
// ---------------------------------------------------------------------------

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

  card: {
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderRadius: 12,
    padding: "20px 24px",
  } as React.CSSProperties,

  statLabel: {
    fontSize: "0.78rem",
    fontWeight: 600,
    color: "rgba(255, 255, 255, 0.5)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    margin: "0 0 8px",
  } as React.CSSProperties,

  statValue: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#f8fafc",
    margin: 0,
  } as React.CSSProperties,

  sectionTitle: {
    fontSize: "0.92rem",
    fontWeight: 700,
    color: "#f8fafc",
    margin: "0 0 16px",
  } as React.CSSProperties,

  fieldGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
  } as React.CSSProperties,

  fieldLabel: {
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
    fontFamily: "inherit",
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
    fontFamily: "inherit",
  } as React.CSSProperties,

  primaryButton: {
    background: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 20px",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "0.88rem",
    minHeight: 44,
    fontFamily: "inherit",
  } as React.CSSProperties,

  secondaryButton: {
    background: "transparent",
    color: "#94a3b8",
    border: "1px solid rgba(148, 163, 184, 0.3)",
    borderRadius: 8,
    padding: "8px 14px",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "0.8rem",
    minHeight: 44,
    fontFamily: "inherit",
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

  successText: {
    color: "#34d399",
    fontSize: "0.82rem",
    margin: "8px 0 0",
  } as React.CSSProperties,
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PriorityBadge({ priority }: { priority: Priority }) {
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: "0.72rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        background: cfg.bg,
        color: cfg.color,
        whiteSpace: "nowrap",
      }}
    >
      {cfg.label}
    </span>
  );
}

function OpportunityBadge({ type }: { type: OpportunityType }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: "0.72rem",
        fontWeight: 700,
        background: "rgba(99, 102, 241, 0.15)",
        color: "#a5b4fc",
        whiteSpace: "nowrap",
      }}
    >
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
      style={{ display: "flex", alignItems: "center", gap: 8 }}
    >
      <div
        style={{
          flex: 1,
          height: 6,
          borderRadius: 999,
          background: "rgba(255, 255, 255, 0.08)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: "100%",
            background: color,
            borderRadius: 999,
            transition: "width 400ms ease",
          }}
        />
      </div>
      <span
        style={{ fontSize: "0.76rem", fontWeight: 700, color, minWidth: 32, textAlign: "right" }}
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
      style={{
        background: "rgba(255, 255, 255, 0.04)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
        borderRadius: 12,
        padding: "20px 24px",
        marginBottom: 12,
      }}
      aria-label={`Prospect: ${prospect.businessName}`}
    >
      {/* Card header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              color: "#f8fafc",
              margin: "0 0 4px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {prospect.businessName}
          </h3>
          <p
            style={{
              fontSize: "0.78rem",
              color: "rgba(255, 255, 255, 0.4)",
              margin: 0,
            }}
          >
            {prospect.niche}
            {prospect.geo ? ` · ${prospect.geo}` : ""}
            {prospect.website ? (
              <>
                {" · "}
                <a
                  href={prospect.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#60a5fa", textDecoration: "none" }}
                  aria-label={`Visit ${prospect.businessName} website`}
                >
                  {prospect.website.replace(/^https?:\/\//, "")}
                </a>
              </>
            ) : null}
            {prospect.phone ? ` · ${prospect.phone}` : ""}
          </p>
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flexShrink: 0 }}>
          <PriorityBadge priority={prospect.priority} />
          <OpportunityBadge type={prospect.opportunityType} />
        </div>
      </div>

      {/* Metrics row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div>
          <p style={styles.statLabel}>Confidence</p>
          <ConfidenceBar value={prospect.confidence} />
        </div>
        <div>
          <p style={styles.statLabel}>Est. Monthly Value</p>
          <p style={{ ...styles.statValue, fontSize: "1.1rem" }}>
            {formatCurrency(prospect.estimatedMonthlyValue)}
          </p>
        </div>
        <div>
          <p style={styles.statLabel}>Opportunity Score</p>
          <p style={{ ...styles.statValue, fontSize: "1.1rem" }}>
            {prospect.opportunityScore}
            <span
              style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", marginLeft: 2 }}
            >
              /100
            </span>
          </p>
        </div>
        <div>
          <p style={styles.statLabel}>Contact Attempts</p>
          <p style={{ ...styles.statValue, fontSize: "1.1rem" }}>
            {prospect.contactAttempts}
          </p>
        </div>
      </div>

      {/* Suggested action */}
      {prospect.suggestedAction && (
        <p
          style={{
            fontSize: "0.82rem",
            color: "rgba(255, 255, 255, 0.6)",
            margin: "0 0 14px",
            fontStyle: "italic",
          }}
        >
          {prospect.suggestedAction}
        </p>
      )}

      {/* Reasoning chips */}
      {prospect.reasoning.length > 0 && (
        <div
          style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}
          aria-label="Discovery reasoning"
        >
          {prospect.reasoning.map((reason, i) => (
            <span
              key={i}
              style={{
                display: "inline-block",
                padding: "2px 8px",
                borderRadius: 999,
                fontSize: "0.7rem",
                fontWeight: 600,
                background: "rgba(99, 102, 241, 0.1)",
                color: "#c4b5fd",
                border: "1px solid rgba(99, 102, 241, 0.2)",
              }}
            >
              {reason}
            </span>
          ))}
        </div>
      )}

      {/* Action row */}
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
          borderTop: "1px solid rgba(255, 255, 255, 0.06)",
          paddingTop: 14,
        }}
      >
        <label
          htmlFor={`status-${prospect.id}`}
          style={{
            fontSize: "0.76rem",
            fontWeight: 600,
            color: "rgba(255, 255, 255, 0.4)",
            whiteSpace: "nowrap",
          }}
        >
          Status
        </label>
        <select
          id={`status-${prospect.id}`}
          value={prospect.status}
          onChange={(e) => onStatusChange(prospect.id, e.target.value as ProspectStatus)}
          disabled={isUpdating}
          aria-busy={isUpdating}
          style={{
            ...styles.select,
            minHeight: 36,
            padding: "6px 10px",
            fontSize: "0.8rem",
            opacity: isUpdating ? 0.6 : 1,
          }}
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
          style={{
            ...styles.primaryButton,
            minHeight: 36,
            padding: "6px 14px",
            fontSize: "0.8rem",
            opacity: isContacting ? 0.6 : 1,
          }}
        >
          {isContacting ? "Marking..." : "Contact"}
        </button>

        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          aria-controls={`outreach-${prospect.id}`}
          style={{
            ...styles.secondaryButton,
            minHeight: 36,
            padding: "6px 14px",
            fontSize: "0.8rem",
          }}
        >
          {expanded ? "Hide template" : "View template"}
        </button>

        <span
          style={{
            marginLeft: "auto",
            fontSize: "0.72rem",
            color: "rgba(255, 255, 255, 0.25)",
          }}
        >
          Added {formatDate(prospect.createdAt)}
          {prospect.lastContactedAt
            ? ` · Last contacted ${formatDate(prospect.lastContactedAt)}`
            : ""}
        </span>
      </div>

      {/* Outreach template (expandable) */}
      {expanded && (
        <div
          id={`outreach-${prospect.id}`}
          role="region"
          aria-label={`Outreach template for ${prospect.businessName}`}
          style={{
            marginTop: 14,
            background: "rgba(0, 0, 0, 0.3)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            borderRadius: 8,
            padding: "14px 16px",
          }}
        >
          <p
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              color: "rgba(255, 255, 255, 0.35)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              margin: "0 0 8px",
            }}
          >
            Outreach Template
          </p>
          <pre
            style={{
              margin: 0,
              fontSize: "0.82rem",
              color: "rgba(255, 255, 255, 0.65)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontFamily: "inherit",
              lineHeight: 1.6,
            }}
          >
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
  // Prospect list state
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [stats, setStats] = useState<ProspectStats>({
    total: 0,
    hot: 0,
    estimatedMonthlyValue: 0,
    pipelineLeads: 0,
  });
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // Scout form state
  const [scoutNiche, setScoutNiche] = useState("");
  const [scoutGeo, setScoutGeo] = useState("");
  const [scoutAutoIngest, setScoutAutoIngest] = useState(false);
  const [scoutLoading, setScoutLoading] = useState(false);
  const [scoutError, setScoutError] = useState<string | null>(null);
  const [scoutResult, setScoutResult] = useState<ScoutResult | null>(null);

  // Filter state
  const [filterStatus, setFilterStatus] = useState<ProspectStatus | "all">("all");
  const [filterOpportunity, setFilterOpportunity] = useState<OpportunityType | "all">("all");
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all");

  // Per-card action state
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [contactingIds, setContactingIds] = useState<Set<string>>(new Set());

  // Status message (aria-live region)
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Scout handler
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Status update handler
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Contact handler
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Derived filtered list
  // ---------------------------------------------------------------------------

  const filteredProspects = prospects.filter((p) => {
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    if (filterOpportunity !== "all" && p.opportunityType !== filterOpportunity) return false;
    if (filterPriority !== "all" && p.priority !== filterPriority) return false;
    return true;
  });

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        {/* Page header */}
        <div style={{ marginBottom: 28 }}>
          <Link
            href="/dashboard"
            style={{ fontSize: "0.82rem", color: "#60a5fa", textDecoration: "none" }}
          >
            &larr; Dashboard
          </Link>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#f8fafc",
              margin: "12px 0 6px",
            }}
          >
            Prospect Discovery
          </h1>
          <p style={styles.muted}>
            Automatically discover high-value businesses, classify opportunities, and feed them
            into your lead pipeline.
          </p>
        </div>

        {/* Summary stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            marginBottom: 24,
          }}
          role="region"
          aria-label="Prospect summary statistics"
        >
          <div style={styles.card}>
            <p style={styles.statLabel}>Total Prospects</p>
            <p style={styles.statValue}>{stats.total}</p>
          </div>
          <div style={styles.card}>
            <p style={styles.statLabel}>Hot Prospects</p>
            <p style={{ ...styles.statValue, color: "#ef4444" }}>{stats.hot}</p>
          </div>
          <div style={styles.card}>
            <p style={styles.statLabel}>Est. Monthly Value</p>
            <p style={{ ...styles.statValue, color: "#34d399" }}>
              {formatCurrency(stats.estimatedMonthlyValue)}
            </p>
          </div>
          <div style={styles.card}>
            <p style={styles.statLabel}>Pipeline Leads</p>
            <p style={{ ...styles.statValue, color: "#60a5fa" }}>{stats.pipelineLeads}</p>
          </div>
        </div>

        {/* Aria-live status announcer */}
        <div
          aria-live="polite"
          aria-atomic="true"
          style={{ minHeight: 24, marginBottom: statusMessage ? 12 : 0 }}
        >
          {statusMessage && (
            <p style={styles.successText}>{statusMessage}</p>
          )}
        </div>

        {/* Scout form */}
        <section
          style={{ ...styles.card, marginBottom: 24 }}
          aria-labelledby="scout-form-heading"
        >
          <h2 id="scout-form-heading" style={styles.sectionTitle}>
            Scout New Prospects
          </h2>
          <form onSubmit={handleScout} noValidate>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                marginBottom: 16,
              }}
            >
              <div style={styles.fieldGroup}>
                <label htmlFor="scout-niche" style={styles.fieldLabel}>
                  Niche
                  <span style={{ color: "#f87171", marginLeft: 3 }} aria-hidden="true">
                    *
                  </span>
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
                  style={styles.input}
                  disabled={scoutLoading}
                />
              </div>
              <div style={styles.fieldGroup}>
                <label htmlFor="scout-geo" style={styles.fieldLabel}>
                  Location / Geo
                </label>
                <input
                  id="scout-geo"
                  type="text"
                  value={scoutGeo}
                  onChange={(e) => setScoutGeo(e.target.value)}
                  placeholder="e.g. Austin TX, Chicago, New York"
                  style={styles.input}
                  disabled={scoutLoading}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  color: "rgba(255, 255, 255, 0.65)",
                  fontWeight: 600,
                  userSelect: "none",
                }}
              >
                <input
                  type="checkbox"
                  checked={scoutAutoIngest}
                  onChange={(e) => setScoutAutoIngest(e.target.checked)}
                  disabled={scoutLoading}
                  style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#3b82f6" }}
                  aria-describedby="auto-ingest-hint"
                />
                Auto-ingest to pipeline
              </label>
              <span
                id="auto-ingest-hint"
                style={{ fontSize: "0.76rem", color: "rgba(255, 255, 255, 0.3)" }}
              >
                Automatically adds discovered prospects to your lead pipeline
              </span>

              <button
                type="submit"
                disabled={scoutLoading}
                aria-busy={scoutLoading}
                style={{
                  ...styles.primaryButton,
                  marginLeft: "auto",
                  opacity: scoutLoading ? 0.6 : 1,
                }}
              >
                {scoutLoading ? "Scouting..." : "Scout Now"}
              </button>
            </div>

            {scoutError && (
              <p id="scout-error" role="alert" style={styles.errorText}>
                {scoutError}
              </p>
            )}
          </form>

          {/* Scout results summary */}
          {scoutResult && (
            <div
              role="region"
              aria-label="Scout results"
              style={{
                marginTop: 20,
                padding: "16px 20px",
                background: "rgba(52, 211, 153, 0.06)",
                border: "1px solid rgba(52, 211, 153, 0.15)",
                borderRadius: 8,
              }}
            >
              <p
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "#34d399",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  margin: "0 0 6px",
                }}
              >
                Scout Complete
              </p>
              <p style={{ fontSize: "0.85rem", color: "rgba(255, 255, 255, 0.65)", margin: 0 }}>
                {scoutResult.summary}
              </p>
              {scoutResult.prospects.length > 0 && (
                <p
                  style={{
                    fontSize: "0.78rem",
                    color: "rgba(255, 255, 255, 0.4)",
                    margin: "6px 0 0",
                  }}
                >
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
          style={{ ...styles.card, marginBottom: 20 }}
          aria-labelledby="filters-heading"
        >
          <h2 id="filters-heading" style={styles.sectionTitle}>
            Filter Prospects
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "flex-end" }}>
            <div style={styles.fieldGroup}>
              <label htmlFor="filter-status" style={styles.fieldLabel}>
                Status
              </label>
              <select
                id="filter-status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as ProspectStatus | "all")}
                style={{ ...styles.select, minHeight: 40, padding: "8px 12px", fontSize: "0.82rem" }}
              >
                {STATUS_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.fieldGroup}>
              <label htmlFor="filter-opportunity" style={styles.fieldLabel}>
                Opportunity Type
              </label>
              <select
                id="filter-opportunity"
                value={filterOpportunity}
                onChange={(e) =>
                  setFilterOpportunity(e.target.value as OpportunityType | "all")
                }
                style={{ ...styles.select, minHeight: 40, padding: "8px 12px", fontSize: "0.82rem" }}
              >
                {OPPORTUNITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.fieldGroup}>
              <label htmlFor="filter-priority" style={styles.fieldLabel}>
                Priority
              </label>
              <select
                id="filter-priority"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value as Priority | "all")}
                style={{ ...styles.select, minHeight: 40, padding: "8px 12px", fontSize: "0.82rem" }}
              >
                {PRIORITY_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <span
              style={{ fontSize: "0.78rem", color: "rgba(255, 255, 255, 0.35)", paddingBottom: 10 }}
              aria-live="polite"
            >
              {filteredProspects.length} of {prospects.length} shown
            </span>
          </div>
        </section>

        {/* Prospect list */}
        <section aria-labelledby="prospects-list-heading">
          <h2
            id="prospects-list-heading"
            style={{
              ...styles.sectionTitle,
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            Discovered Prospects
            {!listLoading && (
              <span
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 400,
                  color: "rgba(255, 255, 255, 0.35)",
                }}
              >
                ({filteredProspects.length})
              </span>
            )}
          </h2>

          {listLoading && (
            <div style={{ ...styles.card, textAlign: "center", padding: 40 }}>
              <p style={styles.muted} aria-busy="true">
                Loading prospects...
              </p>
            </div>
          )}

          {listError && !listLoading && (
            <div
              role="alert"
              style={{
                ...styles.card,
                border: "1px solid rgba(239, 68, 68, 0.25)",
                background: "rgba(239, 68, 68, 0.06)",
              }}
            >
              <p style={styles.errorText}>{listError}</p>
              <button
                type="button"
                onClick={loadProspects}
                style={{ ...styles.secondaryButton, marginTop: 10 }}
              >
                Retry
              </button>
            </div>
          )}

          {!listLoading && !listError && filteredProspects.length === 0 && (
            <div style={{ ...styles.card, textAlign: "center", padding: 40 }}>
              <p
                style={{
                  fontWeight: 700,
                  color: "#f8fafc",
                  marginBottom: 8,
                  fontSize: "1rem",
                }}
              >
                No prospects found.
              </p>
              <p style={{ ...styles.muted, marginBottom: 0 }}>
                {prospects.length === 0
                  ? "Use the Scout form above to discover new business opportunities."
                  : "Try adjusting your filters to see more results."}
              </p>
            </div>
          )}

          {!listLoading && !listError && filteredProspects.length > 0 && (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
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

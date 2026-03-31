"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MarketplaceLead {
  id: string;
  niche: string;
  qualityScore: number;
  temperature: string;
  city?: string;
  state?: string;
  industry: string;
  summary: string;
  contactFields: string[];
  price: number;
  status: string;
  createdAt: string;
}

interface ClaimedLead extends MarketplaceLead {
  claimedAt: string;
  outcome?: OutcomeKey;
}

type SortKey = "newest" | "price_asc" | "price_desc" | "quality" | "temperature";
type OutcomeKey = "contacted" | "booked" | "converted" | "no_response";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 12;
const TEMPERATURES = ["", "cold", "warm", "hot", "burning"] as const;

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "quality", label: "Quality Score" },
  { value: "temperature", label: "Temperature" },
];

const OUTCOME_OPTIONS: { value: OutcomeKey; label: string; color: string }[] = [
  { value: "contacted", label: "Contacted", color: "#3b82f6" },
  { value: "booked", label: "Booked", color: "#f97316" },
  { value: "converted", label: "Converted", color: "#22c55e" },
  { value: "no_response", label: "No Response", color: "#6b7280" },
];

const TEMPERATURE_RANK: Record<string, number> = {
  burning: 4,
  hot: 3,
  warm: 2,
  cold: 1,
};

const LOADING_TIMEOUT_MS = 3_000;

const DEMO_LEADS: MarketplaceLead[] = [
  {
    id: "demo-1",
    niche: "Plumbing",
    qualityScore: 87,
    temperature: "hot",
    city: "Erie",
    state: "PA",
    industry: "Home Services",
    summary: "Homeowner needs emergency pipe repair in basement. Requested same-day availability.",
    contactFields: ["email", "phone", "address"],
    price: 4500,
    status: "available",
    createdAt: new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
  },
  {
    id: "demo-2",
    niche: "HVAC",
    qualityScore: 72,
    temperature: "warm",
    city: "Erie",
    state: "PA",
    industry: "Home Services",
    summary: "Commercial office requesting HVAC maintenance quote for 3-unit system. Annual contract interest.",
    contactFields: ["email", "phone"],
    price: 3200,
    status: "available",
    createdAt: new Date(Date.now() - 8 * 60 * 60_000).toISOString(),
  },
  {
    id: "demo-3",
    niche: "Roofing",
    qualityScore: 93,
    temperature: "burning",
    city: "Millcreek",
    state: "PA",
    industry: "Home Services",
    summary: "Insurance claim approved for full roof replacement. Homeowner comparing 3 contractors this week.",
    contactFields: ["email", "phone", "address"],
    price: 7500,
    status: "available",
    createdAt: new Date(Date.now() - 30 * 60_000).toISOString(),
  },
  {
    id: "demo-4",
    niche: "Electrician",
    qualityScore: 65,
    temperature: "warm",
    city: "Harborcreek",
    state: "PA",
    industry: "Home Services",
    summary: "New construction wiring estimate for 2,400 sq ft home. Builder needs licensed electrician.",
    contactFields: ["email", "phone"],
    price: 2800,
    status: "available",
    createdAt: new Date(Date.now() - 24 * 60 * 60_000).toISOString(),
  },
  {
    id: "demo-5",
    niche: "Landscaping",
    qualityScore: 58,
    temperature: "cold",
    city: "Erie",
    state: "PA",
    industry: "Home Services",
    summary: "Property management company seeking seasonal landscaping bids for 12-unit complex.",
    contactFields: ["email"],
    price: 1900,
    status: "available",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60_000).toISOString(),
  },
  {
    id: "demo-6",
    niche: "Pest Control",
    qualityScore: 81,
    temperature: "hot",
    city: "Fairview",
    state: "PA",
    industry: "Home Services",
    summary: "Restaurant owner needs immediate pest inspection for health department compliance. Urgent timeline.",
    contactFields: ["email", "phone", "address"],
    price: 3800,
    status: "available",
    createdAt: new Date(Date.now() - 4 * 60 * 60_000).toISOString(),
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function temperatureColor(temp: string): string {
  switch (temp) {
    case "burning": return "#ef4444";
    case "hot": return "#f97316";
    case "warm": return "#eab308";
    case "cold": return "#3b82f6";
    default: return "#6b7280";
  }
}

function temperatureBg(temp: string): string {
  switch (temp) {
    case "burning": return "rgba(239, 68, 68, 0.1)";
    case "hot": return "rgba(249, 115, 22, 0.1)";
    case "warm": return "rgba(234, 179, 8, 0.1)";
    case "cold": return "rgba(59, 130, 246, 0.1)";
    default: return "rgba(107, 114, 128, 0.1)";
  }
}

function temperatureExplanation(temp: string): string {
  switch (temp) {
    case "burning": return "Extremely high intent — responded to outreach and ready to buy now.";
    case "hot": return "Strong interest shown — multiple engagement signals detected.";
    case "warm": return "Has indicated interest — early-stage buying signals present.";
    case "cold": return "Profile match only — no direct engagement signals yet.";
    default: return "Temperature not assessed.";
  }
}

function qualityColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#eab308";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Date(iso).toLocaleDateString();
}

function sortLeads(leads: MarketplaceLead[], sort: SortKey): MarketplaceLead[] {
  const copy = [...leads];
  switch (sort) {
    case "newest":
      return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    case "price_asc":
      return copy.sort((a, b) => a.price - b.price);
    case "price_desc":
      return copy.sort((a, b) => b.price - a.price);
    case "quality":
      return copy.sort((a, b) => b.qualityScore - a.qualityScore);
    case "temperature":
      return copy.sort((a, b) => (TEMPERATURE_RANK[b.temperature] ?? 0) - (TEMPERATURE_RANK[a.temperature] ?? 0));
  }
}

function filterBySearch(leads: MarketplaceLead[], query: string): MarketplaceLead[] {
  const q = query.toLowerCase().trim();
  if (!q) return leads;
  return leads.filter(
    (l) =>
      l.summary.toLowerCase().includes(q) ||
      l.niche.toLowerCase().includes(q) ||
      (l.city ?? "").toLowerCase().includes(q) ||
      (l.state ?? "").toLowerCase().includes(q),
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface QualityBarProps {
  score: number;
  height?: number;
}

function QualityBar({ score, height = 6 }: QualityBarProps) {
  return (
    <div
      role="img"
      aria-label={`Quality score: ${score} out of 100`}
      style={{
        width: "100%",
        height,
        borderRadius: 999,
        background: "rgba(34, 95, 84, 0.1)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${score}%`,
          height: "100%",
          background: qualityColor(score),
          borderRadius: 999,
          transition: "width 0.4s ease",
        }}
      />
    </div>
  );
}

interface FieldControlProps {
  id: string;
  label: string;
  children: React.ReactNode;
}

function FieldControl({ id, label, children }: FieldControlProps) {
  return (
    <div>
      <label
        htmlFor={id}
        style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: 4 }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const SELECT_STYLE: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 6,
  border: "1px solid rgba(34, 95, 84, 0.2)",
  background: "rgba(255, 255, 255, 0.8)",
  fontSize: "0.85rem",
  minWidth: 160,
  minHeight: 38,
};

const INPUT_STYLE: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 6,
  border: "1px solid rgba(34, 95, 84, 0.2)",
  background: "rgba(255, 255, 255, 0.8)",
  fontSize: "0.85rem",
};

// ---------------------------------------------------------------------------
// Lead Preview Modal
// ---------------------------------------------------------------------------

interface LeadPreviewModalProps {
  lead: MarketplaceLead | null;
  onClose: () => void;
  onClaimStart: (leadId: string) => void;
}

function LeadPreviewModal({ lead, onClose, onClaimStart }: LeadPreviewModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (lead) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [lead]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    function handleClose() {
      onClose();
    }

    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    const rect = dialogRef.current?.getBoundingClientRect();
    if (!rect) return;
    const isOutside =
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom;
    if (isOutside) onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      aria-labelledby="modal-title"
      aria-modal="true"
      style={{
        padding: 0,
        border: "none",
        borderRadius: 16,
        maxWidth: 560,
        width: "calc(100vw - 48px)",
        boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
        background: "#fff",
      }}
    >
      {lead && (
        <div style={{ padding: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <span
                style={{
                  display: "inline-block",
                  padding: "2px 10px",
                  borderRadius: 999,
                  background: temperatureBg(lead.temperature),
                  color: temperatureColor(lead.temperature),
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "capitalize",
                  marginBottom: 6,
                }}
              >
                {lead.temperature}
              </span>
              <h2
                id="modal-title"
                style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "var(--accent, #225f54)" }}
              >
                {lead.niche}
                {lead.city && lead.state ? ` — ${lead.city}, ${lead.state}` : ""}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close lead preview"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "1.4rem",
                lineHeight: 1,
                color: "rgba(34, 95, 84, 0.5)",
                padding: 4,
                minWidth: 32,
                minHeight: 32,
              }}
            >
              ×
            </button>
          </div>

          <p style={{ fontSize: "0.9rem", lineHeight: 1.55, marginBottom: 20 }}>{lead.summary}</p>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 700 }}>Quality Score</span>
              <span style={{ fontSize: "0.82rem", fontWeight: 800, color: qualityColor(lead.qualityScore) }}>
                {lead.qualityScore}/100
              </span>
            </div>
            <QualityBar score={lead.qualityScore} height={10} />
          </div>

          <div
            style={{
              padding: "12px 14px",
              borderRadius: 8,
              background: temperatureBg(lead.temperature),
              border: `1px solid ${temperatureColor(lead.temperature)}33`,
              marginBottom: 20,
            }}
          >
            <p
              style={{
                fontSize: "0.78rem",
                fontWeight: 700,
                color: temperatureColor(lead.temperature),
                marginBottom: 4,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Temperature: {lead.temperature}
            </p>
            <p style={{ fontSize: "0.85rem", margin: 0, lineHeight: 1.4 }}>
              {temperatureExplanation(lead.temperature)}
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: "0.78rem", fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em", color: "rgba(34,95,84,0.6)" }}>
              Available contact fields
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {lead.contactFields.map((field) => (
                <span
                  key={field}
                  style={{
                    padding: "3px 10px",
                    borderRadius: 999,
                    background: "rgba(34, 95, 84, 0.08)",
                    color: "var(--accent, #225f54)",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                  }}
                >
                  {field}
                </span>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: 16,
              borderTop: "1px solid rgba(34,95,84,0.1)",
            }}
          >
            <div>
              <p style={{ fontSize: "0.78rem", color: "rgba(34,95,84,0.5)", margin: 0, marginBottom: 2 }}>
                {lead.niche} · Quality {lead.qualityScore}/100
              </p>
              <p style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--accent, #225f54)", margin: 0 }}>
                {formatCents(lead.price)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onClaimStart(lead.id);
              }}
              style={{
                padding: "12px 24px",
                borderRadius: 8,
                border: "none",
                background: "var(--accent, #225f54)",
                color: "#fff",
                fontSize: "0.9rem",
                fontWeight: 700,
                cursor: "pointer",
                minHeight: 44,
              }}
            >
              Claim this lead
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}

// ---------------------------------------------------------------------------
// Lead Card
// ---------------------------------------------------------------------------

interface LeadCardProps {
  lead: MarketplaceLead;
  claimingId: string | null;
  claimTargetId: string | null;
  buyerEmail: string;
  onBuyerEmailChange: (val: string) => void;
  onClaimStart: (id: string) => void;
  onClaimConfirm: () => void;
  onClaimCancel: () => void;
  onPreview: (lead: MarketplaceLead) => void;
}

function LeadCard({
  lead,
  claimingId,
  claimTargetId,
  buyerEmail,
  onBuyerEmailChange,
  onClaimStart,
  onClaimConfirm,
  onClaimCancel,
  onPreview,
}: LeadCardProps) {
  const [hovered, setHovered] = useState(false);
  const isClaiming = claimingId === lead.id;
  const isClaimTarget = claimTargetId === lead.id;

  return (
    <article
      style={{
        padding: 20,
        borderRadius: 12,
        border: `1px solid ${hovered ? "rgba(34, 95, 84, 0.28)" : "rgba(34, 95, 84, 0.12)"}`,
        background: hovered ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.7)",
        transition: "border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease",
        boxShadow: hovered ? "0 4px 20px rgba(34, 95, 84, 0.1)" : "none",
        display: "flex",
        flexDirection: "column",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        onClick={() => onPreview(lead)}
        aria-label={`Preview lead: ${lead.niche}${lead.city ? ` in ${lead.city}` : ""}`}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          textAlign: "left",
          cursor: "pointer",
          flex: 1,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <span
            style={{
              display: "inline-block",
              padding: "2px 10px",
              borderRadius: 999,
              background: temperatureBg(lead.temperature),
              color: temperatureColor(lead.temperature),
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "capitalize",
            }}
          >
            {lead.temperature}
          </span>
          <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--accent, #225f54)" }}>
            {formatCents(lead.price)}
          </span>
        </div>

        <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "rgba(34, 95, 84, 0.6)", marginBottom: 4 }}>
          {lead.niche}
          {lead.city && lead.state ? ` — ${lead.city}, ${lead.state}` : ""}
        </p>

        <p style={{ fontSize: "0.88rem", lineHeight: 1.4, marginBottom: 12, color: "#1a1a1a" }}>
          {lead.summary}
        </p>

        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700 }}>
              Quality: {lead.qualityScore}/100
            </span>
            <span style={{ fontSize: "0.75rem", color: "rgba(34, 95, 84, 0.5)" }}>
              {formatRelativeTime(lead.createdAt)}
            </span>
          </div>
          <QualityBar score={lead.qualityScore} />
        </div>

        <div style={{ fontSize: "0.75rem", color: "rgba(34, 95, 84, 0.5)", marginBottom: 12 }}>
          Contact: {lead.contactFields.join(", ")}
        </div>
      </button>

      {isClaimTarget ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label htmlFor={`buyer-email-${lead.id}`} style={{ fontSize: "0.82rem", fontWeight: 600 }}>
            Your email to claim this lead
          </label>
          <input
            id={`buyer-email-${lead.id}`}
            type="email"
            value={buyerEmail}
            onChange={(e) => onBuyerEmailChange(e.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid rgba(34, 95, 84, 0.2)",
              fontSize: "0.88rem",
              minHeight: 44,
            }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={onClaimConfirm}
              disabled={isClaiming || !buyerEmail.trim()}
              style={{
                flex: 1,
                padding: "10px 16px",
                borderRadius: 8,
                border: "none",
                background: "var(--accent, #225f54)",
                color: "#fff",
                fontSize: "0.88rem",
                fontWeight: 700,
                cursor: isClaiming ? "wait" : "pointer",
                opacity: isClaiming || !buyerEmail.trim() ? 0.6 : 1,
                minHeight: 44,
              }}
              aria-busy={isClaiming}
            >
              {isClaiming ? "Claiming..." : "Confirm claim"}
            </button>
            <button
              type="button"
              onClick={onClaimCancel}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "1px solid rgba(34, 95, 84, 0.2)",
                background: "transparent",
                fontSize: "0.88rem",
                fontWeight: 600,
                cursor: "pointer",
                minHeight: 44,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onClaimStart(lead.id)}
          disabled={isClaiming}
          style={{
            width: "100%",
            padding: "10px 16px",
            borderRadius: 8,
            border: "none",
            background: "var(--accent, #225f54)",
            color: "#fff",
            fontSize: "0.88rem",
            fontWeight: 700,
            cursor: isClaiming ? "wait" : "pointer",
            opacity: isClaiming ? 0.6 : 1,
            minHeight: 44,
          }}
          aria-busy={isClaiming}
        >
          Claim lead
        </button>
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------
// Claimed Leads Section
// ---------------------------------------------------------------------------

interface ClaimedLeadsSectionProps {
  claimedLeads: ClaimedLead[];
  onOutcome: (leadId: string, outcome: OutcomeKey) => void;
  submittingOutcome: string | null;
}

function ClaimedLeadsSection({ claimedLeads, onOutcome, submittingOutcome }: ClaimedLeadsSectionProps) {
  const [expanded, setExpanded] = useState(true);

  if (claimedLeads.length === 0) return null;

  return (
    <section
      style={{
        marginTop: 48,
        borderTop: "2px solid rgba(34, 95, 84, 0.15)",
        paddingTop: 32,
      }}
      aria-labelledby="claimed-leads-heading"
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 id="claimed-leads-heading" style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0 }}>
          Your Claimed Leads
          <span
            style={{
              marginLeft: 10,
              padding: "2px 10px",
              borderRadius: 999,
              background: "rgba(34, 95, 84, 0.1)",
              color: "var(--accent, #225f54)",
              fontSize: "0.78rem",
              fontWeight: 700,
            }}
          >
            {claimedLeads.length}
          </span>
        </h2>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls="claimed-leads-list"
          style={{
            background: "none",
            border: "1px solid rgba(34, 95, 84, 0.2)",
            borderRadius: 6,
            padding: "6px 14px",
            fontSize: "0.82rem",
            fontWeight: 600,
            cursor: "pointer",
            color: "var(--accent, #225f54)",
          }}
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      </div>

      <div
        id="claimed-leads-list"
        hidden={!expanded}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 14,
        }}
      >
        {claimedLeads.map((lead) => (
          <div
            key={lead.id}
            style={{
              padding: 16,
              borderRadius: 10,
              border: "1px solid rgba(34, 95, 84, 0.12)",
              background: "rgba(34, 95, 84, 0.03)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <p style={{ fontSize: "0.82rem", fontWeight: 700, margin: 0 }}>
                {lead.niche}
                {lead.city && lead.state ? ` — ${lead.city}, ${lead.state}` : ""}
              </p>
              <span style={{ fontSize: "0.75rem", color: "rgba(34,95,84,0.5)" }}>
                Claimed {formatRelativeTime(lead.claimedAt)}
              </span>
            </div>

            <p style={{ fontSize: "0.82rem", color: "rgba(0,0,0,0.6)", marginBottom: 12, lineHeight: 1.4 }}>
              {lead.summary.length > 100 ? `${lead.summary.slice(0, 100)}…` : lead.summary}
            </p>

            {lead.outcome ? (
              <div
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  background: `${OUTCOME_OPTIONS.find((o) => o.value === lead.outcome)?.color ?? "#6b7280"}18`,
                  display: "inline-block",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: OUTCOME_OPTIONS.find((o) => o.value === lead.outcome)?.color ?? "#6b7280",
                }}
              >
                {OUTCOME_OPTIONS.find((o) => o.value === lead.outcome)?.label ?? lead.outcome}
              </div>
            ) : (
              <div>
                <p style={{ fontSize: "0.75rem", fontWeight: 600, marginBottom: 6, color: "rgba(34,95,84,0.6)" }}>
                  Report outcome:
                </p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {OUTCOME_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={submittingOutcome === lead.id}
                      onClick={() => onOutcome(lead.id, opt.value)}
                      aria-label={`Mark lead as ${opt.label}`}
                      style={{
                        padding: "5px 11px",
                        borderRadius: 6,
                        border: `1px solid ${opt.color}44`,
                        background: `${opt.color}12`,
                        color: opt.color,
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        cursor: submittingOutcome === lead.id ? "wait" : "pointer",
                        opacity: submittingOutcome === lead.id ? 0.5 : 1,
                        minHeight: 32,
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PublicMarketplacePage() {
  // -- Original state --
  const [leads, setLeads] = useState<MarketplaceLead[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nicheFilter, setNicheFilter] = useState("");
  const [tempFilter, setTempFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimResult, setClaimResult] = useState<string | null>(null);
  const [buyerEmail, setBuyerEmail] = useState("");
  const [claimTargetId, setClaimTargetId] = useState<string | null>(null);

  // -- New state --
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [claimedLeads, setClaimedLeads] = useState<ClaimedLead[]>([]);
  const [previewLead, setPreviewLead] = useState<MarketplaceLead | null>(null);
  const [submittingOutcome, setSubmittingOutcome] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  // Unique niches derived from all loaded leads
  const uniqueNiches = useMemo(
    () => Array.from(new Set(leads.map((l) => l.niche))).sort(),
    [leads],
  );

  // Client-side filtered + sorted view
  const processedLeads = useMemo(() => {
    const filtered = filterBySearch(leads, searchQuery);
    return sortLeads(filtered, sortKey);
  }, [leads, searchQuery, sortKey]);

  // Paginated slice for display
  const displayedLeads = useMemo(
    () => processedLeads.slice(0, page * PAGE_SIZE),
    [processedLeads, page],
  );

  const hasMore = displayedLeads.length < processedLeads.length;
  const serverHasMore = leads.length < totalLeads;

  // -----------------------------------------------------------------------
  // Fetch leads (initial + filter changes reset to first page)
  // -----------------------------------------------------------------------

  const fetchLeads = useCallback(
    (offset: number, append: boolean) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setPage(1);
      }

      const params = new URLSearchParams();
      params.set("status", "available");
      params.set("limit", String(PAGE_SIZE * 3)); // fetch 3 client pages per server request
      params.set("offset", String(offset));
      if (nicheFilter) params.set("niche", nicheFilter);
      if (tempFilter) params.set("temperature", tempFilter);
      if (minPrice) params.set("minPrice", String(Math.round(parseFloat(minPrice) * 100)));
      if (maxPrice) params.set("maxPrice", String(Math.round(parseFloat(maxPrice) * 100)));

      fetch(`/api/marketplace/leads?${params.toString()}`)
        .then((r) => {
          if (!r.ok) throw new Error(`Failed to load leads: ${r.status}`);
          return r.json();
        })
        .then((json) => {
          const incoming: MarketplaceLead[] = json.data ?? [];
          const total: number = json.meta?.total ?? incoming.length;
          setTotalLeads(total);
          if (append) {
            setLeads((prev) => [...prev, ...incoming]);
          } else {
            setLeads(incoming);
          }
          setLoading(false);
          setLoadingMore(false);
        })
        .catch(() => {
          // API unavailable (no database, network error, etc.) — show demo leads
          setError(null);
          setLeads(DEMO_LEADS);
          setTotalLeads(DEMO_LEADS.length);
          setIsDemo(true);
          setLoading(false);
          setLoadingMore(false);
        });
    },
    [nicheFilter, tempFilter, minPrice, maxPrice],
  );

  // Re-fetch from scratch when filters change
  useEffect(() => {
    fetchLeads(0, false);
  }, [fetchLeads]);

  // Loading timeout: if still loading after 3s, fall back to demo leads
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError(null);
        setLeads(DEMO_LEADS);
        setTotalLeads(DEMO_LEADS.length);
        setIsDemo(true);
      }
    }, LOADING_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [loading]);

  // -----------------------------------------------------------------------
  // Load more: try client-side pagination first; fetch from server if needed
  // -----------------------------------------------------------------------

  function handleLoadMore() {
    const nextPage = page + 1;
    const clientHasData = nextPage * PAGE_SIZE <= processedLeads.length;

    if (clientHasData) {
      setPage(nextPage);
    } else if (serverHasMore) {
      fetchLeads(leads.length, true);
      setPage(nextPage);
    } else {
      setPage(nextPage);
    }
  }

  // -----------------------------------------------------------------------
  // Claim workflow (unchanged logic, same API)
  // -----------------------------------------------------------------------

  function handleClaimStart(leadId: string) {
    setClaimTargetId(leadId);
    setClaimResult(null);
  }

  function handleClaimConfirm() {
    if (!claimTargetId || !buyerEmail.trim()) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(buyerEmail.trim())) {
      setClaimResult("Please enter a valid email address.");
      return;
    }

    setClaimingId(claimTargetId);
    setClaimResult(null);

    fetch(`/api/marketplace/leads/${claimTargetId}/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ buyerId: buyerEmail.trim() }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.error) {
          setClaimResult(`Error: ${json.error.message}`);
        } else {
          setClaimResult("Lead claimed successfully! Contact details have been sent to your email.");
          // Track claimed lead for outcome reporting
          const claimedLead = leads.find((l) => l.id === claimTargetId);
          if (claimedLead) {
            setClaimedLeads((prev) => [
              ...prev,
              { ...claimedLead, claimedAt: new Date().toISOString() },
            ]);
          }
          setClaimTargetId(null);
          setBuyerEmail("");
          fetchLeads(0, false);
        }
        setClaimingId(null);
      })
      .catch(() => {
        setClaimResult("Failed to claim lead. Please try again.");
        setClaimingId(null);
      });
  }

  function handleClaimCancel() {
    setClaimTargetId(null);
    setBuyerEmail("");
  }

  // -----------------------------------------------------------------------
  // Outcome reporting
  // -----------------------------------------------------------------------

  function handleOutcome(leadId: string, outcome: OutcomeKey) {
    setSubmittingOutcome(leadId);

    fetch(`/api/marketplace/leads/${leadId}/outcome`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome, buyerId: buyerEmail }),
    })
      .then((r) => r.json())
      .then(() => {
        setClaimedLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, outcome } : l)),
        );
        setSubmittingOutcome(null);
      })
      .catch(() => {
        setSubmittingOutcome(null);
      });
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <main
      style={{
        maxWidth: 1180,
        margin: "0 auto",
        padding: "40px 24px",
      }}
    >
      <section className="experience-hero">
        <div className="hero-copy">
          <p className="eyebrow">Lead marketplace</p>
          <h1>Browse available leads</h1>
          <p className="lede">
            Find and claim high-quality, pre-scored leads across multiple industries and niches.
            All leads are anonymized until purchase.
          </p>
        </div>
      </section>

      {/* Filters + Sort + Search */}
      <section
        className="panel"
        style={{ marginTop: 24 }}
        role="search"
        aria-label="Filter and sort marketplace leads"
      >
        <p className="eyebrow">Filters</p>

        {/* Search */}
        <div style={{ marginBottom: 14 }}>
          <FieldControl id="lead-search" label="Search">
            <input
              id="lead-search"
              type="search"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder="Search by summary, niche, or location…"
              aria-label="Search leads by summary, niche, or location"
              style={{
                ...INPUT_STYLE,
                width: "100%",
                maxWidth: 440,
                minHeight: 38,
                boxSizing: "border-box",
              }}
            />
          </FieldControl>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <FieldControl id="niche-filter" label="Niche">
            <select
              id="niche-filter"
              value={nicheFilter}
              onChange={(e) => setNicheFilter(e.target.value)}
              style={SELECT_STYLE}
            >
              <option value="">All niches</option>
              {uniqueNiches.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </FieldControl>

          <FieldControl id="temp-filter" label="Temperature">
            <select
              id="temp-filter"
              value={tempFilter}
              onChange={(e) => setTempFilter(e.target.value)}
              style={{ ...SELECT_STYLE, minWidth: 140 }}
            >
              {TEMPERATURES.map((t) => (
                <option key={t} value={t}>{t || "All temperatures"}</option>
              ))}
            </select>
          </FieldControl>

          <FieldControl id="min-price" label="Min price ($)">
            <input
              id="min-price"
              type="number"
              min="0"
              step="1"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="0"
              style={{ ...INPUT_STYLE, width: 100, minHeight: 38 }}
            />
          </FieldControl>

          <FieldControl id="max-price" label="Max price ($)">
            <input
              id="max-price"
              type="number"
              min="0"
              step="1"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="No limit"
              style={{ ...INPUT_STYLE, width: 100, minHeight: 38 }}
            />
          </FieldControl>

          <FieldControl id="sort-leads" label="Sort by">
            <select
              id="sort-leads"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              style={SELECT_STYLE}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </FieldControl>
        </div>
      </section>

      {/* Claim result status */}
      {claimResult && (
        <div
          role="status"
          aria-live="polite"
          style={{
            marginTop: 16,
            padding: "12px 16px",
            borderRadius: 8,
            background: claimResult.startsWith("Error")
              ? "rgba(239, 68, 68, 0.1)"
              : "rgba(34, 197, 94, 0.1)",
            border: `1px solid ${claimResult.startsWith("Error") ? "rgba(239, 68, 68, 0.3)" : "rgba(34, 197, 94, 0.3)"}`,
            fontSize: "0.88rem",
            fontWeight: 600,
          }}
        >
          {claimResult}
        </div>
      )}

      {/* Demo mode banner */}
      {isDemo && (
        <div
          role="status"
          style={{
            marginTop: 16,
            padding: "12px 16px",
            borderRadius: 8,
            background: "rgba(234, 179, 8, 0.1)",
            border: "1px solid rgba(234, 179, 8, 0.3)",
            fontSize: "0.85rem",
            fontWeight: 600,
            color: "#92400e",
          }}
        >
          Demo mode — Showing sample leads. Live leads will appear once the system is connected to a database.
        </div>
      )}

      {/* Lead grid */}
      {loading ? (
        <section className="panel" style={{ marginTop: 24 }}>
          <p className="muted">Loading available leads…</p>
        </section>
      ) : error ? (
        <section className="panel" style={{ marginTop: 24 }}>
          <p className="eyebrow">Error</p>
          <p className="muted">{error}</p>
        </section>
      ) : processedLeads.length === 0 ? (
        <section className="panel" style={{ marginTop: 24 }}>
          <p className="muted">
            {searchQuery || nicheFilter || tempFilter || minPrice || maxPrice
              ? "No leads match your filters. Try adjusting your criteria."
              : "No leads available yet. Leads appear here as they enter the system through intake forms, assessments, and chat."}
          </p>
        </section>
      ) : (
        <>
          {/* Counter */}
          <div
            aria-live="polite"
            aria-atomic="true"
            style={{
              marginTop: 20,
              marginBottom: 4,
              fontSize: "0.82rem",
              color: "rgba(34, 95, 84, 0.6)",
              fontWeight: 600,
            }}
          >
            Showing {Math.min(displayedLeads.length, processedLeads.length)} of {processedLeads.length} lead{processedLeads.length !== 1 ? "s" : ""}
            {searchQuery && ` matching "${searchQuery}"`}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 16,
              marginTop: 8,
            }}
          >
            {displayedLeads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                claimingId={claimingId}
                claimTargetId={claimTargetId}
                buyerEmail={buyerEmail}
                onBuyerEmailChange={setBuyerEmail}
                onClaimStart={handleClaimStart}
                onClaimConfirm={handleClaimConfirm}
                onClaimCancel={handleClaimCancel}
                onPreview={setPreviewLead}
              />
            ))}
          </div>

          {/* Load more */}
          {(hasMore || serverHasMore) && (
            <div
              style={{
                marginTop: 32,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
              }}
            >
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                aria-busy={loadingMore}
                style={{
                  padding: "12px 32px",
                  borderRadius: 8,
                  border: "1px solid rgba(34, 95, 84, 0.25)",
                  background: "transparent",
                  color: "var(--accent, #225f54)",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  cursor: loadingMore ? "wait" : "pointer",
                  opacity: loadingMore ? 0.6 : 1,
                  minHeight: 44,
                }}
              >
                {loadingMore ? "Loading…" : "Load more leads"}
              </button>
              <span style={{ fontSize: "0.78rem", color: "rgba(34, 95, 84, 0.5)" }}>
                {displayedLeads.length} of {processedLeads.length} shown
              </span>
            </div>
          )}
        </>
      )}

      {/* Claimed leads with outcome reporting */}
      <ClaimedLeadsSection
        claimedLeads={claimedLeads}
        onOutcome={handleOutcome}
        submittingOutcome={submittingOutcome}
      />

      {/* Lead preview modal */}
      <LeadPreviewModal
        lead={previewLead}
        onClose={() => setPreviewLead(null)}
        onClaimStart={handleClaimStart}
      />
    </main>
  );
}

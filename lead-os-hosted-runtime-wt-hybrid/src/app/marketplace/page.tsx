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
      className="w-full overflow-hidden rounded-full"
      style={{ height, background: "rgba(34, 95, 84, 0.1)" }}
    >
      <div
        className="h-full rounded-full transition-[width] duration-400 ease-in-out"
        style={{ width: `${score}%`, background: qualityColor(score) }}
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
        className="mb-1 block text-[0.78rem] font-semibold"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

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
      className="w-[calc(100vw-48px)] max-w-[560px] rounded-2xl border-none bg-card p-0 shadow-2xl"
    >
      {lead && (
        <div className="p-7">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <span
                className="mb-1.5 inline-block rounded-full px-2.5 py-0.5 text-[0.75rem] font-bold capitalize"
                style={{ background: temperatureBg(lead.temperature), color: temperatureColor(lead.temperature) }}
              >
                {lead.temperature}
              </span>
              <h2
                id="modal-title"
                className="text-[1.1rem] font-extrabold text-[var(--accent,#225f54)]"
              >
                {lead.niche}
                {lead.city && lead.state ? ` — ${lead.city}, ${lead.state}` : ""}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close lead preview"
              className="min-h-[32px] min-w-[32px] border-none bg-transparent p-1 text-[1.4rem] leading-none text-[rgba(34,95,84,0.5)]"
            >
              ×
            </button>
          </div>

          <p className="mb-5 text-[0.9rem] leading-relaxed">{lead.summary}</p>

          <div className="mb-5">
            <div className="mb-1.5 flex justify-between">
              <span className="text-[0.82rem] font-bold">Quality Score</span>
              <span className="text-[0.82rem] font-extrabold" style={{ color: qualityColor(lead.qualityScore) }}>
                {lead.qualityScore}/100
              </span>
            </div>
            <QualityBar score={lead.qualityScore} height={10} />
          </div>

          <div
            className="mb-5 rounded-lg p-3.5"
            style={{ background: temperatureBg(lead.temperature), border: `1px solid ${temperatureColor(lead.temperature)}33` }}
          >
            <p
              className="mb-1 text-[0.78rem] font-bold uppercase tracking-wide"
              style={{ color: temperatureColor(lead.temperature) }}
            >
              Temperature: {lead.temperature}
            </p>
            <p className="text-[0.85rem] leading-snug">
              {temperatureExplanation(lead.temperature)}
            </p>
          </div>

          <div className="mb-5">
            <p className="mb-2 text-[0.78rem] font-bold uppercase tracking-wide text-[rgba(34,95,84,0.6)]">
              Available contact fields
            </p>
            <div className="flex flex-wrap gap-1.5">
              {lead.contactFields.map((field) => (
                <span
                  key={field}
                  className="rounded-full bg-[rgba(34,95,84,0.08)] px-2.5 py-[3px] text-[0.78rem] font-semibold text-[var(--accent,#225f54)]"
                >
                  {field}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[rgba(34,95,84,0.1)] pt-4">
            <div>
              <p className="mb-0.5 text-[0.78rem] text-[rgba(34,95,84,0.5)]">
                {lead.niche} · Quality {lead.qualityScore}/100
              </p>
              <p className="text-[1.5rem] font-black text-[var(--accent,#225f54)]">
                {formatCents(lead.price)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onClaimStart(lead.id);
              }}
              className="min-h-[44px] rounded-lg border-none bg-[var(--accent,#225f54)] px-6 py-3 text-[0.9rem] font-bold text-white"
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
  const isClaiming = claimingId === lead.id;
  const isClaimTarget = claimTargetId === lead.id;

  return (
    <article
      className="flex flex-col rounded-xl border border-[rgba(34,95,84,0.12)] bg-white/70 p-5 transition-all duration-150 hover:border-[rgba(34,95,84,0.28)] hover:bg-white/95 hover:shadow-lg"
    >
      <button
        type="button"
        onClick={() => onPreview(lead)}
        aria-label={`Preview lead: ${lead.niche}${lead.city ? ` in ${lead.city}` : ""}`}
        className="flex-1 border-none bg-transparent p-0 text-left"
      >
        <div className="mb-2 flex items-start justify-between">
          <span
            className="inline-block rounded-full px-2.5 py-0.5 text-[0.75rem] font-bold capitalize"
            style={{ background: temperatureBg(lead.temperature), color: temperatureColor(lead.temperature) }}
          >
            {lead.temperature}
          </span>
          <span className="text-[1.2rem] font-extrabold text-[var(--accent,#225f54)]">
            {formatCents(lead.price)}
          </span>
        </div>

        <p className="mb-1 text-[0.78rem] font-semibold text-[rgba(34,95,84,0.6)]">
          {lead.niche}
          {lead.city && lead.state ? ` — ${lead.city}, ${lead.state}` : ""}
        </p>

        <p className="mb-3 text-[0.88rem] leading-snug text-[#1a1a1a]">
          {lead.summary}
        </p>

        <div className="mb-2.5">
          <div className="mb-1 flex justify-between">
            <span className="text-[0.78rem] font-bold">
              Quality: {lead.qualityScore}/100
            </span>
            <span className="text-[0.75rem] text-[rgba(34,95,84,0.5)]">
              {formatRelativeTime(lead.createdAt)}
            </span>
          </div>
          <QualityBar score={lead.qualityScore} />
        </div>

        <div className="mb-3 text-[0.75rem] text-[rgba(34,95,84,0.5)]">
          Contact: {lead.contactFields.join(", ")}
        </div>
      </button>

      {isClaimTarget ? (
        <div className="flex flex-col gap-2">
          <label htmlFor={`buyer-email-${lead.id}`} className="text-[0.82rem] font-semibold">
            Your email to claim this lead
          </label>
          <input
            id={`buyer-email-${lead.id}`}
            type="email"
            value={buyerEmail}
            onChange={(e) => onBuyerEmailChange(e.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
            className="min-h-[44px] rounded-lg border border-[rgba(34,95,84,0.2)] px-3 py-2.5 text-[0.88rem]"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClaimConfirm}
              disabled={isClaiming || !buyerEmail.trim()}
              className="min-h-[44px] flex-1 rounded-lg border-none bg-[var(--accent,#225f54)] px-4 py-2.5 text-[0.88rem] font-bold text-white"
              aria-busy={isClaiming}
              style={{ cursor: isClaiming ? "wait" : "pointer", opacity: isClaiming || !buyerEmail.trim() ? 0.6 : 1 }}
            >
              {isClaiming ? "Claiming..." : "Confirm claim"}
            </button>
            <button
              type="button"
              onClick={onClaimCancel}
              className="min-h-[44px] rounded-lg border border-[rgba(34,95,84,0.2)] bg-transparent px-4 py-2.5 text-[0.88rem] font-semibold"
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
          className="min-h-[44px] w-full rounded-lg border-none bg-[var(--accent,#225f54)] px-4 py-2.5 text-[0.88rem] font-bold text-white"
          aria-busy={isClaiming}
          style={{ cursor: isClaiming ? "wait" : "pointer", opacity: isClaiming ? 0.6 : 1 }}
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
      className="mt-12 border-t-2 border-[rgba(34,95,84,0.15)] pt-8"
      aria-labelledby="claimed-leads-heading"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 id="claimed-leads-heading" className="text-foreground text-[1.1rem] font-extrabold">
          Your Claimed Leads
          <span className="ml-2.5 rounded-full bg-[rgba(34,95,84,0.1)] px-2.5 py-0.5 text-[0.78rem] font-bold text-[var(--accent,#225f54)]">
            {claimedLeads.length}
          </span>
        </h2>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls="claimed-leads-list"
          className="rounded-md border border-[rgba(34,95,84,0.2)] bg-transparent px-3.5 py-1.5 text-[0.82rem] font-semibold text-[var(--accent,#225f54)]"
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      </div>

      <div
        id="claimed-leads-list"
        hidden={!expanded}
        className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3.5"
      >
        {claimedLeads.map((lead) => (
          <div
            key={lead.id}
            className="rounded-[10px] border border-[rgba(34,95,84,0.12)] bg-[rgba(34,95,84,0.03)] p-4"
          >
            <div className="mb-1.5 flex items-start justify-between">
              <p className="text-[0.82rem] font-bold">
                {lead.niche}
                {lead.city && lead.state ? ` — ${lead.city}, ${lead.state}` : ""}
              </p>
              <span className="text-[0.75rem] text-[rgba(34,95,84,0.5)]">
                Claimed {formatRelativeTime(lead.claimedAt)}
              </span>
            </div>

            <p className="mb-3 text-[0.82rem] leading-snug text-[rgba(0,0,0,0.6)]">
              {lead.summary.length > 100 ? `${lead.summary.slice(0, 100)}…` : lead.summary}
            </p>

            {lead.outcome ? (
              <div
                className="inline-block rounded-md px-3 py-1.5 text-[0.78rem] font-bold"
                style={{
                  background: `${OUTCOME_OPTIONS.find((o) => o.value === lead.outcome)?.color ?? "#6b7280"}18`,
                  color: OUTCOME_OPTIONS.find((o) => o.value === lead.outcome)?.color ?? "#6b7280",
                }}
              >
                {OUTCOME_OPTIONS.find((o) => o.value === lead.outcome)?.label ?? lead.outcome}
              </div>
            ) : (
              <div>
                <p className="mb-1.5 text-[0.75rem] font-semibold text-[rgba(34,95,84,0.6)]">
                  Report outcome:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {OUTCOME_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={submittingOutcome === lead.id}
                      onClick={() => onOutcome(lead.id, opt.value)}
                      aria-label={`Mark lead as ${opt.label}`}
                      className="min-h-[32px] rounded-md px-[11px] py-[5px] text-[0.75rem] font-bold"
                      style={{
                        border: `1px solid ${opt.color}44`,
                        background: `${opt.color}12`,
                        color: opt.color,
                        cursor: submittingOutcome === lead.id ? "wait" : "pointer",
                        opacity: submittingOutcome === lead.id ? 0.5 : 1,
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

  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [claimedLeads, setClaimedLeads] = useState<ClaimedLead[]>([]);
  const [previewLead, setPreviewLead] = useState<MarketplaceLead | null>(null);
  const [submittingOutcome, setSubmittingOutcome] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  const uniqueNiches = useMemo(
    () => Array.from(new Set(leads.map((l) => l.niche))).sort(),
    [leads],
  );

  const processedLeads = useMemo(() => {
    const filtered = filterBySearch(leads, searchQuery);
    return sortLeads(filtered, sortKey);
  }, [leads, searchQuery, sortKey]);

  const displayedLeads = useMemo(
    () => processedLeads.slice(0, page * PAGE_SIZE),
    [processedLeads, page],
  );

  const hasMore = displayedLeads.length < processedLeads.length;
  const serverHasMore = leads.length < totalLeads;

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
      params.set("limit", String(PAGE_SIZE * 3));
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

  useEffect(() => {
    fetchLeads(0, false);
  }, [fetchLeads]);

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

  return (
    <main className="mx-auto max-w-[1180px] px-6 py-10">
      <section className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Lead marketplace</p>
          <h1 className="text-foreground">Browse available leads</h1>
          <p className="text-lg text-muted-foreground">
            Find and claim high-quality, pre-scored leads across multiple industries and niches.
            All leads are anonymized until purchase.
          </p>
        </div>
      </section>

      {/* Filters + Sort + Search */}
      <section
        className="rounded-xl border border-border bg-card p-6 mt-6"
        role="search"
        aria-label="Filter and sort marketplace leads"
      >
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Filters</p>

        <div className="mb-3.5">
          <FieldControl id="lead-search" label="Search">
            <input
              id="lead-search"
              type="search"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder="Search by summary, niche, or location…"
              aria-label="Search leads by summary, niche, or location"
              className="min-h-[38px] w-full max-w-[440px] rounded-md border border-[rgba(34,95,84,0.2)] bg-white/80 px-3 py-2 text-[0.85rem]"
            />
          </FieldControl>
        </div>

        <div className="flex flex-wrap gap-3">
          <FieldControl id="niche-filter" label="Niche">
            <select
              id="niche-filter"
              value={nicheFilter}
              onChange={(e) => setNicheFilter(e.target.value)}
              className="min-h-[38px] min-w-[160px] rounded-md border border-[rgba(34,95,84,0.2)] bg-white/80 px-3 py-2 text-[0.85rem]"
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
              className="min-h-[38px] min-w-[140px] rounded-md border border-[rgba(34,95,84,0.2)] bg-white/80 px-3 py-2 text-[0.85rem]"
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
              className="min-h-[38px] w-[100px] rounded-md border border-[rgba(34,95,84,0.2)] bg-white/80 px-3 py-2 text-[0.85rem]"
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
              className="min-h-[38px] w-[100px] rounded-md border border-[rgba(34,95,84,0.2)] bg-white/80 px-3 py-2 text-[0.85rem]"
            />
          </FieldControl>

          <FieldControl id="sort-leads" label="Sort by">
            <select
              id="sort-leads"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="min-h-[38px] min-w-[160px] rounded-md border border-[rgba(34,95,84,0.2)] bg-white/80 px-3 py-2 text-[0.85rem]"
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
          className={`mt-4 rounded-lg px-4 py-3 text-[0.88rem] font-semibold ${
            claimResult.startsWith("Error")
              ? "border border-red-500/30 bg-red-500/10"
              : "border border-green-500/30 bg-green-500/10"
          }`}
        >
          {claimResult}
        </div>
      )}

      {/* Demo mode banner */}
      {isDemo && (
        <div
          role="status"
          className="mt-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-[0.85rem] font-semibold text-amber-800"
        >
          Demo mode — Showing sample leads. Live leads will appear once the system is connected to a database.
        </div>
      )}

      {/* Lead grid */}
      {loading ? (
        <section className="rounded-xl border border-border bg-card p-6 mt-6">
          <p className="text-muted-foreground">Loading available leads…</p>
        </section>
      ) : error ? (
        <section className="rounded-xl border border-border bg-card p-6 mt-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Error</p>
          <p className="text-muted-foreground">{error}</p>
        </section>
      ) : processedLeads.length === 0 ? (
        <section className="rounded-xl border border-border bg-card p-6 mt-6">
          <p className="text-muted-foreground">
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
            className="mb-1 mt-5 text-[0.82rem] font-semibold text-[rgba(34,95,84,0.6)]"
          >
            Showing {Math.min(displayedLeads.length, processedLeads.length)} of {processedLeads.length} lead{processedLeads.length !== 1 ? "s" : ""}
            {searchQuery && ` matching "${searchQuery}"`}
          </div>

          <div className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
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
            <div className="mt-8 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                aria-busy={loadingMore}
                className="min-h-[44px] rounded-lg border border-[rgba(34,95,84,0.25)] bg-transparent px-8 py-3 text-[0.9rem] font-bold text-[var(--accent,#225f54)]"
                style={{ cursor: loadingMore ? "wait" : "pointer", opacity: loadingMore ? 0.6 : 1 }}
              >
                {loadingMore ? "Loading…" : "Load more leads"}
              </button>
              <span className="text-[0.78rem] text-[rgba(34,95,84,0.5)]">
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

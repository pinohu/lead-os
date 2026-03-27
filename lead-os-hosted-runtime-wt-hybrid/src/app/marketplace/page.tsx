"use client";

import { useEffect, useState, useCallback } from "react";

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

const TEMPERATURES = ["", "cold", "warm", "hot", "burning"] as const;

export default function PublicMarketplacePage() {
  const [leads, setLeads] = useState<MarketplaceLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nicheFilter, setNicheFilter] = useState("");
  const [tempFilter, setTempFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimResult, setClaimResult] = useState<string | null>(null);

  const fetchLeads = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("status", "available");
    params.set("limit", "50");
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
        setLeads(json.data ?? []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      });
  }, [nicheFilter, tempFilter, minPrice, maxPrice]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  function handleClaim(leadId: string) {
    const buyerId = prompt("Enter your buyer ID to claim this lead:");
    if (!buyerId) return;

    setClaimingId(leadId);
    setClaimResult(null);

    fetch(`/api/marketplace/leads/${leadId}/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ buyerId }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.error) {
          setClaimResult(`Error: ${json.error.message}`);
        } else {
          setClaimResult("Lead claimed successfully! Contact details have been revealed.");
          fetchLeads();
        }
        setClaimingId(null);
      })
      .catch(() => {
        setClaimResult("Failed to claim lead. Please try again.");
        setClaimingId(null);
      });
  }

  const uniqueNiches = Array.from(new Set(leads.map((l) => l.niche))).sort();

  return (
    <main
      className="experience-page"
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

      <section
        className="panel"
        style={{ marginTop: 24 }}
        role="search"
        aria-label="Filter marketplace leads"
      >
        <p className="eyebrow">Filters</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
          <div>
            <label
              htmlFor="niche-filter"
              style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: 4 }}
            >
              Niche
            </label>
            <select
              id="niche-filter"
              value={nicheFilter}
              onChange={(e) => setNicheFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid rgba(34, 95, 84, 0.2)",
                background: "rgba(255, 255, 255, 0.8)",
                fontSize: "0.85rem",
                minWidth: 160,
              }}
            >
              <option value="">All niches</option>
              {uniqueNiches.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="temp-filter"
              style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: 4 }}
            >
              Temperature
            </label>
            <select
              id="temp-filter"
              value={tempFilter}
              onChange={(e) => setTempFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid rgba(34, 95, 84, 0.2)",
                background: "rgba(255, 255, 255, 0.8)",
                fontSize: "0.85rem",
                minWidth: 140,
              }}
            >
              {TEMPERATURES.map((t) => (
                <option key={t} value={t}>{t || "All temperatures"}</option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="min-price"
              style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: 4 }}
            >
              Min price ($)
            </label>
            <input
              id="min-price"
              type="number"
              min="0"
              step="1"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="0"
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid rgba(34, 95, 84, 0.2)",
                background: "rgba(255, 255, 255, 0.8)",
                fontSize: "0.85rem",
                width: 100,
              }}
            />
          </div>

          <div>
            <label
              htmlFor="max-price"
              style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: 4 }}
            >
              Max price ($)
            </label>
            <input
              id="max-price"
              type="number"
              min="0"
              step="1"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="No limit"
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid rgba(34, 95, 84, 0.2)",
                background: "rgba(255, 255, 255, 0.8)",
                fontSize: "0.85rem",
                width: 100,
              }}
            />
          </div>
        </div>
      </section>

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

      {loading ? (
        <section className="panel" style={{ marginTop: 24 }}>
          <p className="muted">Loading available leads...</p>
        </section>
      ) : error ? (
        <section className="panel" style={{ marginTop: 24 }}>
          <p className="eyebrow">Error</p>
          <p className="muted">{error}</p>
        </section>
      ) : leads.length === 0 ? (
        <section className="panel" style={{ marginTop: 24 }}>
          <p className="muted">No leads match your filters. Try adjusting your criteria.</p>
        </section>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 16,
            marginTop: 24,
          }}
        >
          {leads.map((lead) => (
            <article
              key={lead.id}
              style={{
                padding: 20,
                borderRadius: 12,
                border: "1px solid rgba(34, 95, 84, 0.12)",
                background: "rgba(255, 255, 255, 0.7)",
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
                {lead.niche} {lead.city && lead.state ? `- ${lead.city}, ${lead.state}` : ""}
              </p>

              <p style={{ fontSize: "0.88rem", lineHeight: 1.4, marginBottom: 12 }}>
                {lead.summary}
              </p>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: "0.82rem" }}>
                  <strong>Score:</strong> {lead.qualityScore}/100
                </div>
                <div style={{ fontSize: "0.78rem", color: "rgba(34, 95, 84, 0.5)" }}>
                  Contact: {lead.contactFields.join(", ")}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleClaim(lead.id)}
                disabled={claimingId === lead.id}
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: "var(--accent, #225f54)",
                  color: "#fff",
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  cursor: claimingId === lead.id ? "wait" : "pointer",
                  opacity: claimingId === lead.id ? 0.6 : 1,
                  minHeight: 44,
                }}
                aria-busy={claimingId === lead.id}
              >
                {claimingId === lead.id ? "Claiming..." : "Claim lead"}
              </button>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

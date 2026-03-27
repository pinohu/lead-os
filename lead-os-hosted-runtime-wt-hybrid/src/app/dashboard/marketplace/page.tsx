"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface MarketplaceStats {
  totalLeads: number;
  available: number;
  claimed: number;
  sold: number;
  totalRevenue: number;
  avgPrice: number;
  topNiches: Array<{ niche: string; revenue: number; count: number }>;
}

interface RevenueData {
  byNiche: Record<string, { revenue: number; count: number }>;
  total: number;
  leadsSold: number;
  avgPrice: number;
}

interface MarketplaceLead {
  id: string;
  niche: string;
  qualityScore: number;
  temperature: string;
  summary: string;
  price: number;
  status: string;
  claimedBy?: string;
  soldAt?: string;
  createdAt: string;
}

interface BuyerAccount {
  id: string;
  email: string;
  company: string;
  totalSpent: number;
  leadsPurchased: number;
  status: string;
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

export default function MarketplaceDashboardPage() {
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [leads, setLeads] = useState<MarketplaceLead[]>([]);
  const [buyers, setBuyers] = useState<BuyerAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/marketplace/revenue", { credentials: "include" }).then((r) => {
        if (!r.ok) throw new Error(`Revenue fetch failed: ${r.status}`);
        return r.json();
      }),
      fetch("/api/marketplace/leads?limit=50", { credentials: "include" }).then((r) => {
        if (!r.ok) throw new Error(`Leads fetch failed: ${r.status}`);
        return r.json();
      }),
      fetch("/api/marketplace/buyers", { credentials: "include" }).then((r) => {
        if (!r.ok) throw new Error(`Buyers fetch failed: ${r.status}`);
        return r.json();
      }),
    ])
      .then(([revenueJson, leadsJson, buyersJson]) => {
        setRevenue(revenueJson.data);
        setLeads(leadsJson.data ?? []);
        setBuyers(buyersJson.data ?? []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <main className="experience-page">
        <section className="panel">
          <p className="muted">Loading marketplace data...</p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="experience-page">
        <section className="panel">
          <p className="eyebrow">Error</p>
          <h2>Failed to load marketplace</h2>
          <p className="muted">{error}</p>
          <div className="cta-row">
            <Link href="/dashboard" className="secondary">Back to dashboard</Link>
          </div>
        </section>
      </main>
    );
  }

  const availableLeads = leads.filter((l) => l.status === "available");
  const claimedLeads = leads.filter((l) => l.status === "claimed");
  const soldLeads = leads.filter((l) => l.status === "sold");

  const temperatureDist: Record<string, number> = {};
  for (const lead of leads) {
    temperatureDist[lead.temperature] = (temperatureDist[lead.temperature] ?? 0) + 1;
  }

  const nicheEntries = revenue
    ? Object.entries(revenue.byNiche)
        .sort(([, a], [, b]) => b.revenue - a.revenue)
        .slice(0, 10)
    : [];

  return (
    <main className="experience-page">
      <section className="experience-hero">
        <div className="hero-copy">
          <p className="eyebrow">Marketplace</p>
          <h1>Lead marketplace</h1>
          <p className="lede">
            Publish, sell, and track lead inventory across niches and buyer accounts.
          </p>
          <div className="cta-row">
            <Link href="/dashboard" className="secondary">Back to dashboard</Link>
            <Link href="/marketplace" className="secondary">Public marketplace</Link>
          </div>
        </div>
        <aside className="hero-rail">
          <p className="eyebrow">Summary</p>
          <ul className="journey-rail">
            <li>
              <strong>Total leads</strong>
              <span>{leads.length}</span>
            </li>
            <li>
              <strong>Available</strong>
              <span>{availableLeads.length}</span>
            </li>
            <li>
              <strong>Claimed</strong>
              <span>{claimedLeads.length}</span>
            </li>
            <li>
              <strong>Sold</strong>
              <span>{soldLeads.length}</span>
            </li>
          </ul>
        </aside>
      </section>

      <section className="metric-grid">
        <article className="metric-card">
          <p className="eyebrow">Total revenue</p>
          <h2>{formatCents(revenue?.total ?? 0)}</h2>
          <p className="muted">Revenue from all sold leads.</p>
        </article>
        <article className="metric-card">
          <p className="eyebrow">Leads sold</p>
          <h2>{revenue?.leadsSold ?? 0}</h2>
          <p className="muted">Total leads with completed sales.</p>
        </article>
        <article className="metric-card">
          <p className="eyebrow">Avg price</p>
          <h2>{formatCents(revenue?.avgPrice ?? 0)}</h2>
          <p className="muted">Average price per lead.</p>
        </article>
        <article className="metric-card">
          <p className="eyebrow">Active buyers</p>
          <h2>{buyers.filter((b) => b.status === "active").length}</h2>
          <p className="muted">Buyer accounts currently active.</p>
        </article>
      </section>

      <section className="panel">
        <p className="eyebrow">Revenue by niche</p>
        <h2>Top niches</h2>
        {nicheEntries.length === 0 ? (
          <p className="muted">No revenue data yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
            {nicheEntries.map(([niche, data]) => {
              const maxRevenue = Math.max(...nicheEntries.map(([, d]) => d.revenue), 1);
              const widthPercent = (data.revenue / maxRevenue) * 100;
              return (
                <div
                  key={niche}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "160px 1fr 120px",
                    alignItems: "center",
                    gap: 12,
                    padding: "8px 0",
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: "0.88rem" }}>{niche}</span>
                  <div
                    style={{
                      position: "relative",
                      height: 28,
                      background: "rgba(34, 95, 84, 0.08)",
                      borderRadius: 6,
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        height: "100%",
                        width: `${widthPercent}%`,
                        background: "var(--accent, #225f54)",
                        borderRadius: 6,
                        transition: "width 300ms ease",
                      }}
                    />
                  </div>
                  <span style={{ fontWeight: 600, fontSize: "0.85rem", textAlign: "right" }}>
                    {formatCents(data.revenue)} ({data.count})
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="panel">
        <p className="eyebrow">Quality distribution</p>
        <h2>Lead temperature</h2>
        {Object.keys(temperatureDist).length === 0 ? (
          <p className="muted">No leads published yet.</p>
        ) : (
          <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
            {(["burning", "hot", "warm", "cold"] as const).map((temp) => (
              <div
                key={temp}
                style={{
                  padding: "12px 20px",
                  borderRadius: 8,
                  background: "rgba(34, 95, 84, 0.05)",
                  border: `2px solid ${temperatureColor(temp)}`,
                  textAlign: "center",
                  minWidth: 100,
                }}
              >
                <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>
                  {temperatureDist[temp] ?? 0}
                </div>
                <div style={{ fontSize: "0.82rem", fontWeight: 600, color: temperatureColor(temp), textTransform: "capitalize" }}>
                  {temp}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <p className="eyebrow">Recent activity</p>
        <h2>Recent sales</h2>
        {soldLeads.length === 0 && claimedLeads.length === 0 ? (
          <p className="muted">No sales activity yet.</p>
        ) : (
          <div style={{ overflowX: "auto", marginTop: 16 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid rgba(34, 95, 84, 0.15)" }}>
                  <th scope="col" style={{ textAlign: "left", padding: "8px 12px", fontWeight: 700 }}>Niche</th>
                  <th scope="col" style={{ textAlign: "left", padding: "8px 12px", fontWeight: 700 }}>Temperature</th>
                  <th scope="col" style={{ textAlign: "right", padding: "8px 12px", fontWeight: 700 }}>Score</th>
                  <th scope="col" style={{ textAlign: "right", padding: "8px 12px", fontWeight: 700 }}>Price</th>
                  <th scope="col" style={{ textAlign: "left", padding: "8px 12px", fontWeight: 700 }}>Status</th>
                  <th scope="col" style={{ textAlign: "left", padding: "8px 12px", fontWeight: 700 }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {[...soldLeads, ...claimedLeads].slice(0, 20).map((lead) => (
                  <tr key={lead.id} style={{ borderBottom: "1px solid rgba(34, 95, 84, 0.08)" }}>
                    <td style={{ padding: "8px 12px" }}>{lead.niche}</td>
                    <td style={{ padding: "8px 12px" }}>
                      <span style={{ color: temperatureColor(lead.temperature), fontWeight: 600, textTransform: "capitalize" }}>
                        {lead.temperature}
                      </span>
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "right" }}>{lead.qualityScore}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right" }}>{formatCents(lead.price)}</td>
                    <td style={{ padding: "8px 12px", textTransform: "capitalize" }}>{lead.status}</td>
                    <td style={{ padding: "8px 12px" }}>
                      {new Date(lead.soldAt ?? lead.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <p className="eyebrow">Accounts</p>
        <h2>Buyer accounts</h2>
        {buyers.length === 0 ? (
          <p className="muted">No buyer accounts created yet.</p>
        ) : (
          <div style={{ overflowX: "auto", marginTop: 16 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid rgba(34, 95, 84, 0.15)" }}>
                  <th scope="col" style={{ textAlign: "left", padding: "8px 12px", fontWeight: 700 }}>Company</th>
                  <th scope="col" style={{ textAlign: "left", padding: "8px 12px", fontWeight: 700 }}>Email</th>
                  <th scope="col" style={{ textAlign: "right", padding: "8px 12px", fontWeight: 700 }}>Leads bought</th>
                  <th scope="col" style={{ textAlign: "right", padding: "8px 12px", fontWeight: 700 }}>Total spent</th>
                  <th scope="col" style={{ textAlign: "left", padding: "8px 12px", fontWeight: 700 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {buyers.map((buyer) => (
                  <tr key={buyer.id} style={{ borderBottom: "1px solid rgba(34, 95, 84, 0.08)" }}>
                    <td style={{ padding: "8px 12px", fontWeight: 600 }}>{buyer.company}</td>
                    <td style={{ padding: "8px 12px" }}>{buyer.email}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right" }}>{buyer.leadsPurchased}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right" }}>{formatCents(buyer.totalSpent)}</td>
                    <td style={{ padding: "8px 12px", textTransform: "capitalize" }}>{buyer.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

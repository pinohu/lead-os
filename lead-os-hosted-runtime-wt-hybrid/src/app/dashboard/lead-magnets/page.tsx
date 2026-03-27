"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";

interface LeadMagnetData {
  leads: Array<{
    leadKey: string;
    firstName: string;
    lastName: string;
    email?: string;
    niche: string;
    source: string;
    family: string;
    stage: string;
    score: number;
    createdAt: string;
    updatedAt: string;
  }>;
}

interface MagnetSummary {
  family: string;
  niche: string;
  totalDelivered: number;
  converted: number;
  conversionRate: number;
  avgScore: number;
  recentDeliveries: Array<{
    leadKey: string;
    firstName: string;
    lastName: string;
    email?: string;
    score: number;
    stage: string;
    createdAt: string;
  }>;
}

export default function LeadMagnetsPage() {
  const [data, setData] = useState<LeadMagnetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [nicheFilter, setNicheFilter] = useState("all");

  useEffect(() => {
    fetch("/api/dashboard/scoring", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load data: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        setData(json.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      });
  }, []);

  const magnetSummaries = useMemo(() => {
    if (!data) return [];
    const leadMagnetLeads = data.leads.filter((l) => l.family === "lead-magnet" || l.family.includes("magnet"));
    const allLeads = leadMagnetLeads.length > 0 ? leadMagnetLeads : data.leads;

    const byFamilyNiche: Record<string, MagnetSummary> = {};
    for (const lead of allLeads) {
      const key = `${lead.family}::${lead.niche}`;
      if (!byFamilyNiche[key]) {
        byFamilyNiche[key] = {
          family: lead.family,
          niche: lead.niche,
          totalDelivered: 0,
          converted: 0,
          conversionRate: 0,
          avgScore: 0,
          recentDeliveries: [],
        };
      }
      const summary = byFamilyNiche[key];
      summary.totalDelivered += 1;
      if (["converted", "onboarding", "active", "retention-risk", "referral-ready"].includes(lead.stage)) {
        summary.converted += 1;
      }
      summary.recentDeliveries.push({
        leadKey: lead.leadKey,
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        score: lead.score,
        stage: lead.stage,
        createdAt: lead.createdAt,
      });
    }

    return Object.values(byFamilyNiche)
      .map((summary) => {
        const totalScore = summary.recentDeliveries.reduce((sum, d) => sum + d.score, 0);
        summary.avgScore = summary.totalDelivered > 0 ? Number((totalScore / summary.totalDelivered).toFixed(1)) : 0;
        summary.conversionRate = summary.totalDelivered > 0
          ? Number(((summary.converted / summary.totalDelivered) * 100).toFixed(1))
          : 0;
        summary.recentDeliveries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        summary.recentDeliveries = summary.recentDeliveries.slice(0, 5);
        return summary;
      })
      .sort((a, b) => b.totalDelivered - a.totalDelivered);
  }, [data]);

  const allCategories = useMemo(() => Array.from(new Set(magnetSummaries.map((m) => m.family))).sort(), [magnetSummaries]);
  const allNiches = useMemo(() => Array.from(new Set(magnetSummaries.map((m) => m.niche))).sort(), [magnetSummaries]);

  const filteredMagnets = useMemo(() => {
    return magnetSummaries.filter((m) => {
      if (categoryFilter !== "all" && m.family !== categoryFilter) return false;
      if (nicheFilter !== "all" && m.niche !== nicheFilter) return false;
      return true;
    });
  }, [magnetSummaries, categoryFilter, nicheFilter]);

  const totalDelivered = filteredMagnets.reduce((sum, m) => sum + m.totalDelivered, 0);
  const totalConverted = filteredMagnets.reduce((sum, m) => sum + m.converted, 0);

  const recentDeliveries = useMemo(() => {
    return filteredMagnets
      .flatMap((m) => m.recentDeliveries.map((d) => ({ ...d, family: m.family, niche: m.niche })))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20);
  }, [filteredMagnets]);

  if (loading) {
    return (
      <main className="experience-page">
        <section className="panel">
          <p className="muted">Loading lead magnet data...</p>
        </section>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="experience-page">
        <section className="panel">
          <p className="eyebrow">Error</p>
          <h2>Failed to load lead magnets</h2>
          <p className="muted">{error}</p>
          <div className="cta-row">
            <Link href="/dashboard" className="secondary">Back to dashboard</Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="experience-page">
      <section className="experience-hero">
        <div className="hero-copy">
          <p className="eyebrow">Lead magnets</p>
          <h1>Lead magnet management</h1>
          <p className="lede">
            Track delivery performance, conversion rates, and engagement across all lead
            magnets organized by category and niche.
          </p>
          <div className="cta-row">
            <Link href="/dashboard" className="secondary">Back to dashboard</Link>
          </div>
        </div>
        <aside className="hero-rail">
          <p className="eyebrow">Summary</p>
          <ul className="journey-rail">
            <li>
              <strong>Total magnets</strong>
              <span>{filteredMagnets.length}</span>
            </li>
            <li>
              <strong>Total delivered</strong>
              <span>{totalDelivered}</span>
            </li>
            <li>
              <strong>Converted</strong>
              <span>{totalConverted} ({totalDelivered > 0 ? ((totalConverted / totalDelivered) * 100).toFixed(1) : 0}%)</span>
            </li>
          </ul>
        </aside>
      </section>

      <section className="panel">
        <p className="eyebrow">Filters</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: "0.88rem" }}>
            Category
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={selectStyle}
            >
              <option value="all">All categories</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: "0.88rem" }}>
            Niche
            <select
              value={nicheFilter}
              onChange={(e) => setNicheFilter(e.target.value)}
              style={selectStyle}
            >
              <option value="all">All niches</option>
              {allNiches.map((niche) => (
                <option key={niche} value={niche}>{niche}</option>
              ))}
            </select>
          </label>
          <span style={{ fontSize: "0.82rem", color: "var(--text-soft)" }}>
            Showing {filteredMagnets.length} magnets
          </span>
        </div>
      </section>

      <section className="stack-grid">
        {filteredMagnets.length === 0 ? (
          <article className="panel">
            <p className="muted">No lead magnets match the selected filters.</p>
          </article>
        ) : (
          filteredMagnets.map((magnet) => (
            <article key={`${magnet.family}::${magnet.niche}`} className="stack-card">
              <p className="eyebrow">{magnet.family}</p>
              <h3>{magnet.niche}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12, marginTop: 8 }}>
                <div>
                  <p style={{ fontSize: "0.76rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-soft)", marginBottom: 2 }}>
                    Delivered
                  </p>
                  <p style={{ fontSize: "1.4rem", fontWeight: 800 }}>{magnet.totalDelivered}</p>
                </div>
                <div>
                  <p style={{ fontSize: "0.76rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-soft)", marginBottom: 2 }}>
                    Converted
                  </p>
                  <p style={{ fontSize: "1.4rem", fontWeight: 800 }}>{magnet.converted}</p>
                </div>
                <div>
                  <p style={{ fontSize: "0.76rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-soft)", marginBottom: 2 }}>
                    Conv. Rate
                  </p>
                  <p style={{ fontSize: "1.4rem", fontWeight: 800 }}>{magnet.conversionRate}%</p>
                </div>
                <div>
                  <p style={{ fontSize: "0.76rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-soft)", marginBottom: 2 }}>
                    Avg Score
                  </p>
                  <p style={{ fontSize: "1.4rem", fontWeight: 800 }}>{magnet.avgScore}</p>
                </div>
              </div>
              <div style={{ marginTop: 12, height: 8, background: "rgba(34, 95, 84, 0.08)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${magnet.conversionRate}%`,
                  background: magnet.conversionRate >= 20 ? "var(--success)" : magnet.conversionRate >= 10 ? "var(--accent)" : "var(--secondary)",
                  borderRadius: 4,
                  minWidth: magnet.converted > 0 ? 4 : 0,
                }} />
              </div>
            </article>
          ))
        )}
      </section>

      <section className="panel">
        <p className="eyebrow">Recent deliveries</p>
        <h2>Latest lead magnet activity</h2>
        {recentDeliveries.length === 0 ? (
          <p className="muted">No recent deliveries to show.</p>
        ) : (
          <div style={{ overflowX: "auto", marginTop: 16 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Lead</th>
                  <th style={thStyle}>Family</th>
                  <th style={thStyle}>Niche</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Score</th>
                  <th style={thStyle}>Stage</th>
                  <th style={thStyle}>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentDeliveries.map((delivery) => (
                  <tr key={delivery.leadKey}>
                    <td style={tdStyle}>
                      <Link href={`/dashboard/leads/${encodeURIComponent(delivery.leadKey)}`} style={{ fontWeight: 600 }}>
                        {delivery.firstName} {delivery.lastName}
                      </Link>
                    </td>
                    <td style={tdStyle}>{delivery.family}</td>
                    <td style={tdStyle}>{delivery.niche}</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>{delivery.score}</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: "2px 10px",
                        borderRadius: 999,
                        background: ["converted", "onboarding", "active"].includes(delivery.stage)
                          ? "var(--success-soft)" : "var(--secondary-soft)",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                      }}>
                        {delivery.stage}
                      </span>
                    </td>
                    <td style={tdStyle}>{new Date(delivery.createdAt).toLocaleDateString()}</td>
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

const selectStyle: React.CSSProperties = {
  minHeight: 36,
  padding: "6px 12px",
  borderRadius: 14,
  border: "1px solid rgba(20, 33, 29, 0.14)",
  background: "rgba(255, 255, 255, 0.92)",
  color: "var(--text)",
  fontSize: "0.88rem",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  borderBottom: "2px solid rgba(20, 33, 29, 0.1)",
  fontWeight: 800,
  fontSize: "0.76rem",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--text-soft)",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid rgba(20, 33, 29, 0.06)",
};

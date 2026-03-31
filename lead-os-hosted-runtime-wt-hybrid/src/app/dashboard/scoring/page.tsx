"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Temperature = "cold" | "warm" | "hot" | "burning";

interface ScoredLead {
  leadKey: string;
  firstName: string;
  lastName: string;
  email?: string;
  niche: string;
  source: string;
  family: string;
  stage: string;
  score: number;
  hot: boolean;
  temperature: Temperature;
  breakdown: { intent: number; fit: number; engagement: number; urgency: number };
  recommendedActions: string[];
  createdAt: string;
  updatedAt: string;
}

interface ScoringData {
  leads: ScoredLead[];
  temperatureDistribution: Record<Temperature, number>;
  scoreByNiche: Array<{ niche: string; avgScore: number; count: number }>;
}

const TEMP_COLORS: Record<Temperature, string> = {
  cold: "#4a90d9",
  warm: "#e8a838",
  hot: "#d35400",
  burning: "#c0392b",
};

const TEMP_LABELS: Record<Temperature, string> = {
  cold: "Cold",
  warm: "Warm",
  hot: "Hot",
  burning: "Burning",
};

function ScoreBar({ label, value }: { label: string; value: number }) {
  const barColor = value >= 75 ? "var(--accent)" : value >= 40 ? "var(--secondary)" : "rgba(20, 33, 29, 0.25)";
  return (
    <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 36px", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: "0.78rem", fontWeight: 600 }}>{label}</span>
      <div style={{ height: 14, background: "rgba(34, 95, 84, 0.08)", borderRadius: 4, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${value}%`,
            background: barColor,
            borderRadius: 4,
            transition: "width 0.3s ease",
          }}
        />
      </div>
      <span style={{ fontSize: "0.78rem", textAlign: "right", color: "var(--text-soft)" }}>{value}</span>
    </div>
  );
}

const DEMO_SCORING: ScoringData = {
  leads: [
    { leadKey: "demo-lead-001", firstName: "James", lastName: "Morrison", email: "james@example.com", niche: "plumbing", source: "organic", family: "qualification", stage: "qualified", score: 84, hot: true, temperature: "burning", breakdown: { intent: 90, fit: 85, engagement: 80, urgency: 82 }, recommendedActions: ["Send hot-lead SMS", "Assign to top provider", "Schedule follow-up call"], createdAt: "2026-03-28T10:15:00Z", updatedAt: "2026-03-29T08:00:00Z" },
    { leadKey: "demo-lead-002", firstName: "Laura", lastName: "Chen", email: "laura@example.com", niche: "hvac", source: "referral", family: "lead-magnet", stage: "nurturing", score: 71, hot: true, temperature: "hot", breakdown: { intent: 75, fit: 70, engagement: 68, urgency: 72 }, recommendedActions: ["Send HVAC cost guide", "Book consultation"], createdAt: "2026-03-27T14:30:00Z", updatedAt: "2026-03-28T09:00:00Z" },
    { leadKey: "demo-lead-003", firstName: "Tom", lastName: "Bradley", email: "tom@example.com", niche: "electrical", source: "direct", family: "chat", stage: "booked", score: 62, hot: false, temperature: "warm", breakdown: { intent: 65, fit: 60, engagement: 58, urgency: 65 }, recommendedActions: ["Confirm appointment", "Send pre-appointment checklist"], createdAt: "2026-03-26T09:45:00Z", updatedAt: "2026-03-27T11:00:00Z" },
    { leadKey: "demo-lead-004", firstName: "Angela", lastName: "Park", email: "angela@example.com", niche: "roofing", source: "organic", family: "qualification", stage: "captured", score: 45, hot: false, temperature: "warm", breakdown: { intent: 50, fit: 42, engagement: 40, urgency: 48 }, recommendedActions: ["Send roofing guide", "Add to nurture sequence"], createdAt: "2026-03-25T16:00:00Z", updatedAt: "2026-03-26T08:00:00Z" },
    { leadKey: "demo-lead-005", firstName: "Kevin", lastName: "Walsh", email: "kevin@example.com", niche: "landscaping", source: "paid-search", family: "lead-magnet", stage: "engaged", score: 28, hot: false, temperature: "cold", breakdown: { intent: 30, fit: 25, engagement: 28, urgency: 29 }, recommendedActions: ["Start cold nurture sequence", "Send seasonal tips content"], createdAt: "2026-03-24T11:20:00Z", updatedAt: "2026-03-24T11:20:00Z" },
  ],
  temperatureDistribution: { cold: 31, warm: 58, hot: 39, burning: 19 },
  scoreByNiche: [
    { niche: "plumbing", avgScore: 68.4, count: 28 },
    { niche: "hvac", avgScore: 64.2, count: 23 },
    { niche: "electrical", avgScore: 61.0, count: 19 },
    { niche: "roofing", avgScore: 70.1, count: 17 },
    { niche: "landscaping", avgScore: 52.3, count: 14 },
    { niche: "legal", avgScore: 73.2, count: 7 },
  ],
};

export default function ScoringPage() {
  const [data, setData] = useState<ScoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [temperatureFilter, setTemperatureFilter] = useState<Temperature | "all">("all");
  const [nicheFilter, setNicheFilter] = useState("all");
  const [expandedLead, setExpandedLead] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/scoring", { credentials: "include" })
      .then((res) => {
        if (!res.ok) {
          setData(DEMO_SCORING);
          setIsDemo(true);
          setLoading(false);
          return;
        }
        return res.json();
      })
      .then((json) => {
        if (!json) return;
        setData(json.data);
        setLoading(false);
      })
      .catch(() => {
        setData(DEMO_SCORING);
        setIsDemo(true);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <main className="experience-page">
        <section className="panel">
          <p className="muted">Loading scoring data...</p>
        </section>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="experience-page">
        <section className="panel">
          <p className="eyebrow">Error</p>
          <h2>Failed to load scoring</h2>
          <div className="cta-row">
            <Link href="/dashboard" className="secondary">Back to dashboard</Link>
          </div>
        </section>
      </main>
    );
  }

  const allNiches = Array.from(new Set(data.leads.map((l) => l.niche))).sort();
  const filteredLeads = data.leads.filter((lead) => {
    if (temperatureFilter !== "all" && lead.temperature !== temperatureFilter) return false;
    if (nicheFilter !== "all" && lead.niche !== nicheFilter) return false;
    return true;
  });

  const totalTemp = data.temperatureDistribution.cold + data.temperatureDistribution.warm +
    data.temperatureDistribution.hot + data.temperatureDistribution.burning;

  return (
    <main className="experience-page">
      {isDemo && (
        <div style={{ background: "#fef3c7", borderBottom: "1px solid #fcd34d", padding: "10px 24px", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 700 }}>Demo data</span>
          <span style={{ color: "#92400e" }}>— Connect your database to see live scoring. <a href="/setup" style={{ textDecoration: "underline" }}>Configure now →</a></span>
        </div>
      )}
      <section className="experience-hero">
        <div className="hero-copy">
          <p className="eyebrow">Lead scoring</p>
          <h1>Scoring dashboard</h1>
          <p className="lede">
            Composite scores with breakdown by intent, fit, engagement, and urgency.
            Filter by temperature and niche to focus on the leads that matter.
          </p>
          <div className="cta-row">
            <Link href="/dashboard" className="secondary">Back to dashboard</Link>
            <Link href="/dashboard/radar" className="secondary">Hot lead radar</Link>
          </div>
        </div>
        <aside className="hero-rail">
          <p className="eyebrow">Temperature distribution</p>
          <ul className="journey-rail">
            {(["burning", "hot", "warm", "cold"] as Temperature[]).map((temp) => (
              <li key={temp}>
                <strong style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: TEMP_COLORS[temp],
                    }}
                  />
                  {TEMP_LABELS[temp]}
                </strong>
                <span>
                  {data.temperatureDistribution[temp]}
                  {totalTemp > 0 && (
                    <span style={{ marginLeft: 8, opacity: 0.7 }}>
                      ({((data.temperatureDistribution[temp] / totalTemp) * 100).toFixed(0)}%)
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="panel">
        <p className="eyebrow">Filters</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: "0.88rem" }}>
            Temperature
            <select
              value={temperatureFilter}
              onChange={(e) => setTemperatureFilter(e.target.value as Temperature | "all")}
              style={selectStyle}
            >
              <option value="all">All</option>
              <option value="burning">Burning</option>
              <option value="hot">Hot</option>
              <option value="warm">Warm</option>
              <option value="cold">Cold</option>
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
            Showing {filteredLeads.length} of {data.leads.length} leads
          </span>
        </div>
      </section>

      <section className="stack-grid">
        {filteredLeads.length === 0 ? (
          <article className="panel">
            <p className="muted">No leads match the selected filters.</p>
          </article>
        ) : (
          filteredLeads.slice(0, 50).map((lead) => {
            const isExpanded = expandedLead === lead.leadKey;
            return (
              <article key={lead.leadKey} className="stack-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <p className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          display: "inline-block",
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: TEMP_COLORS[lead.temperature],
                        }}
                      />
                      {TEMP_LABELS[lead.temperature]} - {lead.stage}
                    </p>
                    <h3 style={{ margin: 0 }}>
                      {lead.firstName} {lead.lastName}
                    </h3>
                    <p className="muted" style={{ fontSize: "0.82rem" }}>
                      {lead.email ?? lead.leadKey} | {lead.niche} | {lead.source}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 52,
                      height: 52,
                      borderRadius: "50%",
                      background: lead.score >= 75
                        ? "var(--accent-soft)"
                        : lead.score >= 40
                          ? "var(--secondary-soft)"
                          : "rgba(20, 33, 29, 0.06)",
                      fontWeight: 800,
                      fontSize: "1.1rem",
                      color: lead.score >= 75 ? "var(--accent-strong)" : "var(--text)",
                    }}>
                      {lead.score}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setExpandedLead(isExpanded ? null : lead.leadKey)}
                  aria-expanded={isExpanded}
                  className="secondary"
                  style={{ marginTop: 8, minHeight: 36, padding: "6px 14px", fontSize: "0.82rem" }}
                >
                  {isExpanded ? "Hide breakdown" : "Show breakdown"}
                </button>

                {isExpanded && (
                  <div style={{ marginTop: 12, display: "grid", gap: 16 }}>
                    <div style={{ display: "grid", gap: 6 }}>
                      <ScoreBar label="Intent" value={lead.breakdown.intent} />
                      <ScoreBar label="Fit" value={lead.breakdown.fit} />
                      <ScoreBar label="Engagement" value={lead.breakdown.engagement} />
                      <ScoreBar label="Urgency" value={lead.breakdown.urgency} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: "0.82rem", marginBottom: 6 }}>Recommended actions</p>
                      <ul className="check-list">
                        {lead.recommendedActions.map((action, i) => (
                          <li key={i}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </section>

      {data.scoreByNiche.length > 0 && (
        <section className="panel">
          <p className="eyebrow">Niche averages</p>
          <h2>Score by niche</h2>
          <div style={{ overflowX: "auto", marginTop: 16 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Niche</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Leads</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Avg Score</th>
                </tr>
              </thead>
              <tbody>
                {data.scoreByNiche.map((niche) => (
                  <tr key={niche.niche}>
                    <td style={tdStyle}>{niche.niche}</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>{niche.count}</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>{niche.avgScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
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

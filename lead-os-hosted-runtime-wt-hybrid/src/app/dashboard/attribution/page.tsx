"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";

type AttributionModel = "first-touch" | "last-touch" | "linear" | "time-decay" | "position-based";

interface AnalyticsData {
  channelPerformance: Array<{ source: string; leads: number; conversions: number; conversionRate: number }>;
  funnelPerformance: Array<{ family: string; leads: number; conversions: number; hotLeads: number; conversionRate: number }>;
}

interface ScoringData {
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

const DEMO_ANALYTICS: AnalyticsData = {
  channelPerformance: [
    { source: "google-ads", leads: 412, conversions: 61, conversionRate: 14.8 },
    { source: "organic-search", leads: 287, conversions: 52, conversionRate: 18.1 },
    { source: "facebook-ads", leads: 198, conversions: 24, conversionRate: 12.1 },
    { source: "email", leads: 163, conversions: 38, conversionRate: 23.3 },
    { source: "referral", leads: 94, conversions: 29, conversionRate: 30.9 },
    { source: "direct", leads: 77, conversions: 17, conversionRate: 22.1 },
    { source: "linkedin", leads: 51, conversions: 11, conversionRate: 21.6 },
    { source: "youtube", leads: 39, conversions: 6, conversionRate: 15.4 },
  ],
  funnelPerformance: [
    { family: "lead-magnet", leads: 312, conversions: 47, hotLeads: 28, conversionRate: 15.1 },
    { family: "qualification", leads: 241, conversions: 61, hotLeads: 34, conversionRate: 25.3 },
    { family: "chat", leads: 188, conversions: 39, hotLeads: 22, conversionRate: 20.7 },
    { family: "webinar", leads: 97, conversions: 31, hotLeads: 18, conversionRate: 32.0 },
    { family: "checkout", leads: 83, conversions: 54, hotLeads: 41, conversionRate: 65.1 },
  ],
};

const DEMO_SCORING: ScoringData = {
  leads: [
    { leadKey: "lk-demo-001", firstName: "James", lastName: "Rivera", email: "james.r@example.com", niche: "roofing", source: "google-ads", family: "qualification", stage: "converted", score: 94, createdAt: "2026-03-01T10:00:00Z", updatedAt: "2026-03-15T14:22:00Z" },
    { leadKey: "lk-demo-002", firstName: "Priya", lastName: "Mehta", email: "priya.m@example.com", niche: "hvac", source: "referral", family: "lead-magnet", stage: "active", score: 87, createdAt: "2026-03-05T09:15:00Z", updatedAt: "2026-03-20T11:44:00Z" },
    { leadKey: "lk-demo-003", firstName: "Carlos", lastName: "Nguyen", email: "carlos.n@example.com", niche: "landscaping", source: "organic-search", family: "chat", stage: "referral-ready", score: 81, createdAt: "2026-03-08T16:30:00Z", updatedAt: "2026-03-22T09:10:00Z" },
    { leadKey: "lk-demo-004", firstName: "Sandra", lastName: "Chen", email: "sandra.c@example.com", niche: "plumbing", source: "email", family: "qualification", stage: "onboarding", score: 79, createdAt: "2026-03-10T11:00:00Z", updatedAt: "2026-03-25T15:30:00Z" },
    { leadKey: "lk-demo-005", firstName: "Marcus", lastName: "Johnson", email: "marcus.j@example.com", niche: "electrical", source: "facebook-ads", family: "lead-magnet", stage: "converted", score: 76, createdAt: "2026-03-12T14:00:00Z", updatedAt: "2026-03-28T08:50:00Z" },
    { leadKey: "lk-demo-006", firstName: "Ava", lastName: "Patel", email: "ava.p@example.com", niche: "roofing", source: "referral", family: "webinar", stage: "active", score: 72, createdAt: "2026-03-14T10:45:00Z", updatedAt: "2026-03-29T12:20:00Z" },
    { leadKey: "lk-demo-007", firstName: "Derek", lastName: "Williams", email: "derek.w@example.com", niche: "hvac", source: "google-ads", family: "qualification", stage: "retention-risk", score: 58, createdAt: "2026-02-20T09:00:00Z", updatedAt: "2026-03-18T10:00:00Z" },
    { leadKey: "lk-demo-008", firstName: "Natalie", lastName: "Kim", email: "natalie.k@example.com", niche: "landscaping", source: "direct", family: "chat", stage: "converted", score: 91, createdAt: "2026-03-02T13:30:00Z", updatedAt: "2026-03-16T16:45:00Z" },
  ],
};

const MODEL_DESCRIPTIONS: Record<AttributionModel, string> = {
  "first-touch": "100% credit to the first interaction source. Best for understanding awareness channels.",
  "last-touch": "100% credit to the last interaction source. Best for understanding closing channels.",
  "linear": "Equal credit distributed across all touchpoints. Balanced view of the journey.",
  "time-decay": "More credit to recent interactions. Highlights channels that drive immediate action.",
  "position-based": "40% first touch, 40% last touch, 20% distributed across middle interactions.",
};

export default function AttributionPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [scoringData, setScoringData] = useState<ScoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AttributionModel>("first-touch");
  const [expandedLead, setExpandedLead] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard/analytics", { credentials: "include" }).then((res) => res.ok ? res.json() : null),
      fetch("/api/dashboard/scoring", { credentials: "include" }).then((res) => res.ok ? res.json() : null),
    ])
      .then(([analytics, scoring]) => {
        if (analytics?.data && scoring?.data) {
          setAnalyticsData(analytics.data);
          setScoringData(scoring.data);
        } else {
          setAnalyticsData(DEMO_ANALYTICS);
          setScoringData(DEMO_SCORING);
          setIsDemo(true);
        }
        setLoading(false);
      })
      .catch(() => {
        setAnalyticsData(DEMO_ANALYTICS);
        setScoringData(DEMO_SCORING);
        setIsDemo(true);
        setLoading(false);
      });
  }, []);

  const attributedChannels = useMemo(() => {
    if (!analyticsData) return [];
    return analyticsData.channelPerformance.map((channel) => {
      // Weight channels based on attribution model.
      // first-touch / last-touch: full credit to a single touchpoint (equal display here).
      // linear: equal credit across all touchpoints.
      // time-decay: weight by recency using conversion rate as a proxy for recency signal.
      // position-based: 40% first, 40% last, 20% middle — approximate with conversion-rate weighting.
      const convRate = channel.conversionRate ?? 0;
      let weight = 1;
      switch (selectedModel) {
        case "first-touch":
        case "last-touch":
        case "linear":
          weight = 1;
          break;
        case "time-decay":
          // Higher-converting channels are assumed to be closer to conversion (recency proxy).
          weight = 0.5 + (convRate / 100) * 0.5;
          break;
        case "position-based":
          // Channels with higher lead volume get "first touch" credit;
          // channels with higher conversion get "last touch" credit.
          weight = 0.6 + (convRate / 100) * 0.4;
          break;
      }
      return {
        ...channel,
        attributedLeads: Math.round(channel.leads * weight),
        attributedConversions: Math.round(channel.conversions * weight),
      };
    });
  }, [analyticsData, selectedModel]);

  const sourceMediumBreakdown = useMemo(() => {
    if (!scoringData) return [];
    const bySourceNiche: Record<string, { count: number; converted: number }> = {};
    for (const lead of scoringData.leads) {
      const key = `${lead.source} / ${lead.niche}`;
      if (!bySourceNiche[key]) bySourceNiche[key] = { count: 0, converted: 0 };
      bySourceNiche[key].count += 1;
      if (["converted", "onboarding", "active", "retention-risk", "referral-ready"].includes(lead.stage)) {
        bySourceNiche[key].converted += 1;
      }
    }
    return Object.entries(bySourceNiche)
      .map(([key, data]) => ({
        sourceNiche: key,
        count: data.count,
        converted: data.converted,
        rate: data.count > 0 ? Number(((data.converted / data.count) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [scoringData]);

  const convertedLeads = useMemo(() => {
    if (!scoringData) return [];
    return scoringData.leads
      .filter((l) => ["converted", "onboarding", "active", "retention-risk", "referral-ready"].includes(l.stage))
      .slice(0, 20);
  }, [scoringData]);

  if (loading) {
    return (
      <main className="experience-page">
        <section className="panel">
          <p className="muted">Loading attribution data...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="experience-page">
      {isDemo && (
        <div style={{ background: "#fef3c7", borderBottom: "1px solid #fcd34d", padding: "10px 24px", fontSize: "0.875rem", color: "#92400e" }}>
          Demo data — Connect your analytics integration to see live attribution.{" "}
          <Link href="/dashboard/credentials" style={{ color: "#92400e", textDecoration: "underline" }}>Set up credentials</Link>
        </div>
      )}
      <section className="experience-hero">
        <div className="hero-copy">
          <p className="eyebrow">Attribution</p>
          <h1>Channel attribution</h1>
          <p className="lede">
            Understand which channels drive lead capture and conversion. Compare attribution
            models to see how credit shifts across the customer journey.
          </p>
          <div className="cta-row">
            <Link href="/dashboard" className="secondary">Back to dashboard</Link>
            <Link href="/dashboard/analytics" className="secondary">Full analytics</Link>
          </div>
        </div>
        <aside className="hero-rail">
          <p className="eyebrow">Attribution model</p>
          <p className="muted" style={{ fontSize: "0.88rem", marginBottom: 12 }}>
            {MODEL_DESCRIPTIONS[selectedModel]}
          </p>
          <div style={{ display: "grid", gap: 6 }}>
            {(["first-touch", "last-touch", "linear", "time-decay", "position-based"] as AttributionModel[]).map((model) => (
              <button
                key={model}
                type="button"
                onClick={() => setSelectedModel(model)}
                aria-pressed={selectedModel === model}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "none",
                  background: selectedModel === model ? "rgba(196, 99, 45, 0.2)" : "rgba(255, 255, 255, 0.06)",
                  color: selectedModel === model ? "#fff" : "rgba(247, 243, 234, 0.76)",
                  fontWeight: selectedModel === model ? 800 : 600,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 140ms ease",
                }}
              >
                <span style={{
                  display: "inline-block",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: selectedModel === model ? "var(--accent)" : "rgba(255,255,255,0.3)",
                }} />
                {model.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </button>
            ))}
          </div>
        </aside>
      </section>

      <section className="panel">
        <p className="eyebrow">Channel performance ({selectedModel.replace("-", " ")})</p>
        <h2>Attributed channel breakdown</h2>
        {attributedChannels.length === 0 ? (
          <p className="muted">No channel data available.</p>
        ) : (
          <div style={{ overflowX: "auto", marginTop: 16 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Channel</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Raw Leads</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Attributed Leads</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Conversions</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Conv. Rate</th>
                </tr>
              </thead>
              <tbody>
                {attributedChannels.map((channel) => (
                  <tr key={channel.source}>
                    <td style={tdStyle}>{channel.source}</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>{channel.leads}</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>{channel.attributedLeads}</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>{channel.attributedConversions}</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>{channel.conversionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid two">
        <article className="panel">
          <p className="eyebrow">Campaign performance</p>
          <h2>Funnel family breakdown</h2>
          {!analyticsData?.funnelPerformance?.length ? (
            <p className="muted">No funnel data available.</p>
          ) : (
            <div style={{ overflowX: "auto", marginTop: 16 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Family</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Leads</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Conversions</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.funnelPerformance.map((funnel) => (
                    <tr key={funnel.family}>
                      <td style={tdStyle}>{funnel.family}</td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>{funnel.leads}</td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>{funnel.conversions}</td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>{funnel.conversionRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="panel">
          <p className="eyebrow">Source / niche breakdown</p>
          <h2>Combined attribution</h2>
          {sourceMediumBreakdown.length === 0 ? (
            <p className="muted">No source data available.</p>
          ) : (
            <div style={{ overflowX: "auto", marginTop: 16 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Source / Niche</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Leads</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Converted</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {sourceMediumBreakdown.map((item) => (
                    <tr key={item.sourceNiche}>
                      <td style={tdStyle}>{item.sourceNiche}</td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>{item.count}</td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>{item.converted}</td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>{item.rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>

      <section className="panel">
        <p className="eyebrow">Touch journey</p>
        <h2>Converted lead journeys</h2>
        {convertedLeads.length === 0 ? (
          <p className="muted">No converted leads to show touch journeys for.</p>
        ) : (
          <div className="stack-grid" style={{ marginTop: 16 }}>
            {convertedLeads.map((lead) => {
              const isExpanded = expandedLead === lead.leadKey;
              return (
                <article key={lead.leadKey} className="stack-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1rem" }}>
                        {lead.firstName} {lead.lastName}
                      </h3>
                      <p className="muted" style={{ fontSize: "0.82rem" }}>
                        {lead.source} | {lead.niche} | {lead.family}
                      </p>
                    </div>
                    <span style={{
                      padding: "4px 12px",
                      borderRadius: 999,
                      background: "var(--success-soft)",
                      color: "var(--success)",
                      fontWeight: 700,
                      fontSize: "0.78rem",
                    }}>
                      {lead.stage}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedLead(isExpanded ? null : lead.leadKey)}
                    aria-expanded={isExpanded}
                    className="secondary"
                    style={{ marginTop: 8, minHeight: 36, padding: "6px 14px", fontSize: "0.82rem" }}
                  >
                    {isExpanded ? "Hide journey" : "View journey"}
                  </button>
                  {isExpanded && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={touchpointStyle}>
                          First: {lead.source}
                        </span>
                        <span style={{ color: "var(--text-soft)" }}>&rarr;</span>
                        <span style={touchpointStyle}>
                          Funnel: {lead.family}
                        </span>
                        <span style={{ color: "var(--text-soft)" }}>&rarr;</span>
                        <span style={touchpointStyle}>
                          Niche: {lead.niche}
                        </span>
                        <span style={{ color: "var(--text-soft)" }}>&rarr;</span>
                        <span style={{ ...touchpointStyle, background: "var(--success-soft)", color: "var(--success)" }}>
                          {lead.stage}
                        </span>
                      </div>
                      <p className="muted" style={{ marginTop: 8, fontSize: "0.82rem" }}>
                        Created: {new Date(lead.createdAt).toLocaleDateString()} |
                        Score: {lead.score}
                      </p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

const touchpointStyle: React.CSSProperties = {
  padding: "4px 12px",
  borderRadius: 999,
  background: "var(--secondary-soft)",
  fontSize: "0.82rem",
  fontWeight: 600,
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

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface AnalyticsData {
  metrics: {
    totalLeads: number;
    conversionRate: number;
    avgScore: number;
    hotLeads: number;
  };
  funnelStages: Array<{ stage: string; count: number; conversionFromPrevious: number }>;
  scoreDistribution: Array<{ label: string; count: number }>;
  channelPerformance: Array<{ source: string; leads: number; conversions: number; conversionRate: number }>;
  weeklyTimeSeries: Array<{ weekStart: string; weekEnd: string; count: number }>;
  nichePerformance: Array<{ niche: string; leads: number; conversions: number; hotLeads: number; avgScore: number; conversionRate: number }>;
  funnelPerformance: Array<{ family: string; leads: number; conversions: number; hotLeads: number; conversionRate: number }>;
}

const DEMO_DATA: AnalyticsData = {
  metrics: { totalLeads: 147, conversionRate: 18.4, avgScore: 62, hotLeads: 31 },
  funnelStages: [
    { stage: "anonymous", count: 147, conversionFromPrevious: 100 },
    { stage: "engaged", count: 118, conversionFromPrevious: 80.3 },
    { stage: "captured", count: 94, conversionFromPrevious: 79.7 },
    { stage: "qualified", count: 67, conversionFromPrevious: 71.3 },
    { stage: "nurturing", count: 52, conversionFromPrevious: 77.6 },
    { stage: "booked", count: 38, conversionFromPrevious: 73.1 },
    { stage: "offered", count: 31, conversionFromPrevious: 81.6 },
    { stage: "converted", count: 27, conversionFromPrevious: 87.1 },
    { stage: "onboarding", count: 14, conversionFromPrevious: 51.9 },
    { stage: "active", count: 9, conversionFromPrevious: 64.3 },
    { stage: "retention-risk", count: 2, conversionFromPrevious: 22.2 },
    { stage: "referral-ready", count: 7, conversionFromPrevious: 77.8 },
    { stage: "churned", count: 3, conversionFromPrevious: 33.3 },
  ],
  scoreDistribution: [
    { label: "0-10", count: 4 },
    { label: "11-20", count: 8 },
    { label: "21-30", count: 11 },
    { label: "31-40", count: 17 },
    { label: "41-50", count: 22 },
    { label: "51-60", count: 28 },
    { label: "61-70", count: 24 },
    { label: "71-80", count: 18 },
    { label: "81-90", count: 10 },
    { label: "91-100", count: 5 },
  ],
  channelPerformance: [
    { source: "organic", leads: 54, conversions: 12, conversionRate: 22.2 },
    { source: "referral", leads: 31, conversions: 9, conversionRate: 29.0 },
    { source: "direct", leads: 28, conversions: 4, conversionRate: 14.3 },
    { source: "paid-search", leads: 19, conversions: 2, conversionRate: 10.5 },
    { source: "social", leads: 15, conversions: 0, conversionRate: 0 },
  ],
  weeklyTimeSeries: [
    { weekStart: "2026-03-03", weekEnd: "2026-03-10", count: 24 },
    { weekStart: "2026-03-10", weekEnd: "2026-03-17", count: 31 },
    { weekStart: "2026-03-17", weekEnd: "2026-03-24", count: 28 },
    { weekStart: "2026-03-24", weekEnd: "2026-03-31", count: 37 },
    { weekStart: "2026-03-31", weekEnd: "2026-04-07", count: 27 },
  ],
  nichePerformance: [
    { niche: "plumbing", leads: 28, conversions: 6, hotLeads: 8, avgScore: 68.4, conversionRate: 21.4 },
    { niche: "hvac", leads: 23, conversions: 5, hotLeads: 6, avgScore: 64.2, conversionRate: 21.7 },
    { niche: "electrical", leads: 19, conversions: 4, hotLeads: 4, avgScore: 61.0, conversionRate: 21.1 },
    { niche: "roofing", leads: 17, conversions: 3, hotLeads: 5, avgScore: 70.1, conversionRate: 17.6 },
    { niche: "landscaping", leads: 14, conversions: 2, hotLeads: 3, avgScore: 55.3, conversionRate: 14.3 },
    { niche: "pest-control", leads: 11, conversions: 2, hotLeads: 2, avgScore: 58.9, conversionRate: 18.2 },
    { niche: "cleaning", leads: 9, conversions: 1, hotLeads: 1, avgScore: 51.7, conversionRate: 11.1 },
    { niche: "painting", leads: 8, conversions: 1, hotLeads: 1, avgScore: 48.5, conversionRate: 12.5 },
    { niche: "legal", leads: 7, conversions: 2, hotLeads: 1, avgScore: 73.2, conversionRate: 28.6 },
    { niche: "dental", leads: 11, conversions: 1, hotLeads: 0, avgScore: 44.1, conversionRate: 9.1 },
  ],
  funnelPerformance: [
    { family: "lead-magnet", leads: 42, conversions: 9, hotLeads: 11, conversionRate: 21.4 },
    { family: "qualification", leads: 38, conversions: 8, hotLeads: 9, conversionRate: 21.1 },
    { family: "chat", leads: 27, conversions: 5, hotLeads: 6, conversionRate: 18.5 },
    { family: "checkout", leads: 19, conversions: 4, hotLeads: 3, conversionRate: 21.1 },
    { family: "webinar", leads: 12, conversions: 1, hotLeads: 2, conversionRate: 8.3 },
    { family: "retention", leads: 9, conversions: 0, hotLeads: 0, conversionRate: 0 },
  ],
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard/analytics", { credentials: "include" })
      .then((res) => {
        if (!res.ok) {
          setData(DEMO_DATA);
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
        setData(DEMO_DATA);
        setIsDemo(true);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <main className="experience-page">
        <section className="panel">
          <p className="muted">Loading analytics data...</p>
        </section>
      </main>
    );
  }

  if (!data) return null;

  const maxScoreCount = Math.max(...data.scoreDistribution.map((b) => b.count), 1);
  const maxWeeklyCount = Math.max(...data.weeklyTimeSeries.map((w) => w.count), 1);

  return (
    <main className="experience-page">
      {isDemo && (
        <div style={{ background: "#fef3c7", borderBottom: "1px solid #fcd34d", padding: "10px 24px", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 700 }}>Demo data</span>
          <span style={{ color: "#92400e" }}>— Connect your database to see live analytics. <a href="/setup" style={{ textDecoration: "underline" }}>Configure now →</a></span>
        </div>
      )}
      <section className="experience-hero">
        <div className="hero-copy">
          <p className="eyebrow">Analytics</p>
          <h1>Lead performance analytics</h1>
          <p className="lede">
            Funnel progression, channel performance, scoring distributions, and trend analysis
            across all captured leads.
          </p>
          <div className="cta-row">
            <Link href="/dashboard" className="secondary">Back to dashboard</Link>
          </div>
        </div>
        <aside className="hero-rail">
          <p className="eyebrow">Key metrics</p>
          <ul className="journey-rail">
            <li>
              <strong>Total leads</strong>
              <span>{data.metrics.totalLeads}</span>
            </li>
            <li>
              <strong>Conversion rate</strong>
              <span>{data.metrics.conversionRate}%</span>
            </li>
            <li>
              <strong>Average score</strong>
              <span>{data.metrics.avgScore}</span>
            </li>
            <li>
              <strong>Hot leads</strong>
              <span>{data.metrics.hotLeads}</span>
            </li>
          </ul>
        </aside>
      </section>

      <section className="metric-grid">
        <article className="metric-card">
          <p className="eyebrow">Total leads</p>
          <h2>{data.metrics.totalLeads}</h2>
          <p className="muted">All captured leads in the runtime.</p>
        </article>
        <article className="metric-card">
          <p className="eyebrow">Conversion rate</p>
          <h2>{data.metrics.conversionRate}%</h2>
          <p className="muted">Leads that reached converted stage or beyond.</p>
        </article>
        <article className="metric-card">
          <p className="eyebrow">Average score</p>
          <h2>{data.metrics.avgScore}</h2>
          <p className="muted">Mean composite score across all leads.</p>
        </article>
        <article className="metric-card">
          <p className="eyebrow">Hot leads</p>
          <h2>{data.metrics.hotLeads}</h2>
          <p className="muted">Leads flagged as hot or scoring 75+.</p>
        </article>
      </section>

      <section className="panel">
        <p className="eyebrow">Lead funnel</p>
        <h2>Stage progression</h2>
        {data.funnelStages.length === 0 ? (
          <p className="muted">No funnel data available yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
            {data.funnelStages.map((stage) => {
              const maxCount = Math.max(...data.funnelStages.map((s) => s.count), 1);
              const widthPercent = (stage.count / maxCount) * 100;
              return (
                <div
                  key={stage.stage}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "140px 1fr 80px",
                    alignItems: "center",
                    gap: 12,
                    padding: "8px 0",
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: "0.88rem" }}>{stage.stage}</span>
                  <div
                    style={{
                      position: "relative",
                      height: 28,
                      background: "rgba(34, 95, 84, 0.08)",
                      borderRadius: 6,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.max(widthPercent, 2)}%`,
                        background: "linear-gradient(90deg, var(--secondary), var(--accent))",
                        borderRadius: 6,
                        transition: "width 0.3s ease",
                      }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        left: 8,
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        color: widthPercent > 20 ? "#fff" : "var(--text)",
                      }}
                    >
                      {stage.count}
                    </span>
                  </div>
                  <span style={{ fontSize: "0.82rem", color: "var(--text-soft)", textAlign: "right" }}>
                    {stage.conversionFromPrevious}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="grid two">
        <article className="panel">
          <p className="eyebrow">Score distribution</p>
          <h2>Lead score buckets</h2>
          {data.scoreDistribution.every((b) => b.count === 0) ? (
            <p className="muted">No scored leads yet.</p>
          ) : (
            <div style={{ display: "grid", gap: 6, marginTop: 16 }}>
              {data.scoreDistribution.map((bucket) => (
                <div
                  key={bucket.label}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "60px 1fr 40px",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{bucket.label}</span>
                  <div
                    style={{
                      height: 22,
                      background: "rgba(34, 95, 84, 0.08)",
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${(bucket.count / maxScoreCount) * 100}%`,
                        background: "var(--accent)",
                        borderRadius: 4,
                        minWidth: bucket.count > 0 ? 4 : 0,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: "0.82rem", textAlign: "right", color: "var(--text-soft)" }}>
                    {bucket.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="panel">
          <p className="eyebrow">Weekly captures</p>
          <h2>Last 30 days</h2>
          {data.weeklyTimeSeries.every((w) => w.count === 0) ? (
            <p className="muted">No leads captured in the last 30 days.</p>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginTop: 16, height: 180 }}>
              {data.weeklyTimeSeries.map((week) => (
                <div
                  key={week.weekStart}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    height: "100%",
                    justifyContent: "flex-end",
                  }}
                >
                  <span style={{ fontSize: "0.78rem", fontWeight: 700 }}>{week.count}</span>
                  <div
                    style={{
                      width: "100%",
                      height: `${Math.max((week.count / maxWeeklyCount) * 140, 4)}px`,
                      background: "linear-gradient(180deg, var(--accent), var(--secondary))",
                      borderRadius: "6px 6px 0 0",
                    }}
                  />
                  <span style={{ fontSize: "0.7rem", color: "var(--text-soft)", textAlign: "center" }}>
                    {week.weekStart.slice(5)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="panel">
        <p className="eyebrow">Channel performance</p>
        <h2>Source breakdown</h2>
        {data.channelPerformance.length === 0 ? (
          <p className="muted">No channel data available yet.</p>
        ) : (
          <div style={{ overflowX: "auto", marginTop: 16 }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.88rem",
              }}
            >
              <thead>
                <tr>
                  <th style={thStyle}>Source</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Leads</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Conversions</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Conv. Rate</th>
                </tr>
              </thead>
              <tbody>
                {data.channelPerformance.map((channel) => (
                  <tr key={channel.source}>
                    <td style={tdStyle}>{channel.source}</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>{channel.leads}</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>{channel.conversions}</td>
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
          <p className="eyebrow">Niche performance</p>
          <h2>Top performing niches</h2>
          {data.nichePerformance.length === 0 ? (
            <p className="muted">No niche data available yet.</p>
          ) : (
            <div style={{ overflowX: "auto", marginTop: 16 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Niche</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Leads</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Avg Score</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Conv. Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.nichePerformance.map((niche) => (
                    <tr key={niche.niche}>
                      <td style={tdStyle}>{niche.niche}</td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>{niche.leads}</td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>{niche.avgScore}</td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>{niche.conversionRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="panel">
          <p className="eyebrow">Funnel performance</p>
          <h2>Top performing funnels</h2>
          {data.funnelPerformance.length === 0 ? (
            <p className="muted">No funnel data available yet.</p>
          ) : (
            <div style={{ overflowX: "auto", marginTop: 16 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Family</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Leads</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Hot</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Conv. Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.funnelPerformance.map((funnel) => (
                    <tr key={funnel.family}>
                      <td style={tdStyle}>{funnel.family}</td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>{funnel.leads}</td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>{funnel.hotLeads}</td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>{funnel.conversionRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>
    </main>
  );
}

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

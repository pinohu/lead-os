"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface ChannelReport {
  channel: string;
  metrics: Record<string, number>;
}

interface DistributionReport {
  tenantId: string;
  period: string;
  channels: ChannelReport[];
  totalTraffic: number;
  totalConversions: number;
}

interface ContentSchedule {
  id: string;
  tenantId: string;
  contentType: string;
  contentId: string;
  title: string;
  publishAt: string;
  status: string;
  createdAt: string;
}

interface TopContent {
  contentId: string;
  channel: string;
  traffic: number;
  conversions: number;
}

interface SeoPage {
  id: string;
  niche: string;
  keyword: string;
  title: string;
  createdAt: string;
}

interface ProgrammaticPage {
  id: string;
  niche: string;
  location: string;
  slug: string;
  title: string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const CHANNEL_COLORS: Record<string, string> = {
  seo: "#14b8a6",
  social: "#6366f1",
  paid: "#f59e0b",
  content: "#ec4899",
};

function getChannelColor(channel: string): string {
  return CHANNEL_COLORS[channel] ?? "#9ca3af";
}

export default function DistributionDashboardPage() {
  const [report, setReport] = useState<DistributionReport | null>(null);
  const [schedules, setSchedules] = useState<ContentSchedule[]>([]);
  const [topContent, setTopContent] = useState<TopContent[]>([]);
  const [seoPages, setSeoPages] = useState<SeoPage[]>([]);
  const [programmaticPages, setProgrammaticPages] = useState<ProgrammaticPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tenantId = "default";

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    try {
      setLoading(true);
      const [reportRes, schedulesRes, topRes, seoRes, progRes] = await Promise.allSettled([
        fetch(`/api/distribution/analytics?tenantId=${tenantId}&period=30d`),
        fetch(`/api/distribution/content?tenantId=${tenantId}`),
        fetch(`/api/distribution/analytics?tenantId=${tenantId}&type=top-content&limit=10`),
        fetch(`/api/distribution/seo?tenantId=${tenantId}`),
        fetch(`/api/distribution/programmatic?tenantId=${tenantId}`),
      ]);

      if (reportRes.status === "fulfilled") {
        const json = await reportRes.value.json();
        if (json.data) setReport(json.data);
      }
      if (schedulesRes.status === "fulfilled") {
        const json = await schedulesRes.value.json();
        if (json.data) setSchedules(json.data);
      }
      if (topRes.status === "fulfilled") {
        const json = await topRes.value.json();
        if (json.data) setTopContent(json.data);
      }
      if (seoRes.status === "fulfilled") {
        const json = await seoRes.value.json();
        if (json.data) setSeoPages(json.data);
      }
      if (progRes.status === "fulfilled") {
        const json = await progRes.value.json();
        if (json.data) setProgrammaticPages(json.data);
      }
    } catch {
      setError("Failed to load distribution data");
    } finally {
      setLoading(false);
    }
  }

  const cardStyle: React.CSSProperties = {
    background: "var(--surface, #111827)",
    borderRadius: 12,
    padding: 24,
    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
  };

  const ghostBtnStyle: React.CSSProperties = {
    padding: "8px 16px",
    borderRadius: 8,
    border: "1px solid var(--text-soft, #374151)",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 600,
    background: "transparent",
    color: "var(--text-soft, #9ca3af)",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
  };

  if (loading) {
    return (
      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 24px" }}>
        <p style={{ color: "var(--text-soft, #9ca3af)" }}>Loading distribution dashboard...</p>
      </main>
    );
  }

  const defaultChannels = ["seo", "social", "paid", "content"];
  const channelData = defaultChannels.map((ch) => {
    const found = report?.channels.find((c) => c.channel === ch);
    return {
      channel: ch,
      traffic: found?.metrics.traffic ?? 0,
      conversions: found?.metrics.conversions ?? 0,
      impressions: found?.metrics.impressions ?? 0,
    };
  });

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>Distribution Engine</h1>
          <p style={{ color: "var(--text-soft, #9ca3af)", marginTop: 4, fontSize: "0.875rem" }}>
            Traffic acquisition across SEO, content, social, and paid channels.
          </p>
        </div>
        <Link href="/dashboard" style={ghostBtnStyle}>
          Back to Dashboard
        </Link>
      </div>

      {error && (
        <div
          role="alert"
          style={{ ...cardStyle, background: "rgba(239, 68, 68, 0.1)", borderLeft: "3px solid #ef4444", marginBottom: 24 }}
        >
          <p style={{ color: "#ef4444", margin: 0 }}>{error}</p>
          <button
            type="button"
            style={{ ...ghostBtnStyle, marginTop: 8 }}
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Channel Performance Cards */}
      <section aria-label="Channel performance">
        <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: 12 }}>Channel Performance</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16, marginBottom: 32 }}>
          {channelData.map((ch) => (
            <div key={ch.channel} style={{ ...cardStyle, borderLeft: `3px solid ${getChannelColor(ch.channel)}` }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", color: getChannelColor(ch.channel), marginBottom: 8 }}>
                {ch.channel}
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 4 }}>
                {ch.traffic.toLocaleString()}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-soft, #9ca3af)" }}>
                traffic
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: "0.8rem" }}>
                <div>
                  <span style={{ color: "var(--text-soft, #9ca3af)" }}>Conversions: </span>
                  <span style={{ fontWeight: 600 }}>{ch.conversions}</span>
                </div>
                <div>
                  <span style={{ color: "var(--text-soft, #9ca3af)" }}>Impressions: </span>
                  <span style={{ fontWeight: 600 }}>{ch.impressions}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Page Counts */}
      <section aria-label="Page inventory">
        <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: 12 }}>Page Inventory</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16, marginBottom: 32 }}>
          <div style={cardStyle}>
            <div style={{ fontSize: "0.8rem", color: "var(--text-soft, #9ca3af)", marginBottom: 4 }}>SEO Pages</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{seoPages.length}</div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: "0.8rem", color: "var(--text-soft, #9ca3af)", marginBottom: 4 }}>Programmatic Pages</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{programmaticPages.length}</div>
          </div>
        </div>
      </section>

      {/* Content Calendar */}
      <section aria-label="Content calendar">
        <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: 12 }}>Content Calendar</h2>
        {schedules.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: "center", padding: 48, marginBottom: 32 }}>
            <p style={{ color: "var(--text-soft, #9ca3af)", margin: 0 }}>
              No scheduled content yet. Use the API to schedule posts and articles.
            </p>
          </div>
        ) : (
          <div style={{ marginBottom: 32 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th scope="col" style={{ textAlign: "left", padding: "8px 12px", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-soft, #9ca3af)", borderBottom: "1px solid var(--text-soft, #374151)" }}>
                    Title
                  </th>
                  <th scope="col" style={{ textAlign: "left", padding: "8px 12px", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-soft, #9ca3af)", borderBottom: "1px solid var(--text-soft, #374151)" }}>
                    Type
                  </th>
                  <th scope="col" style={{ textAlign: "left", padding: "8px 12px", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-soft, #9ca3af)", borderBottom: "1px solid var(--text-soft, #374151)" }}>
                    Publish Date
                  </th>
                  <th scope="col" style={{ textAlign: "left", padding: "8px 12px", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-soft, #9ca3af)", borderBottom: "1px solid var(--text-soft, #374151)" }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((s) => (
                  <tr key={s.id}>
                    <td style={{ padding: "10px 12px", fontSize: "0.875rem", borderBottom: "1px solid rgba(55,65,81,0.3)" }}>
                      {s.title}
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: "0.875rem", borderBottom: "1px solid rgba(55,65,81,0.3)" }}>
                      <span style={{
                        padding: "2px 10px",
                        borderRadius: 9999,
                        fontSize: "0.7rem",
                        fontWeight: 500,
                        background: "rgba(99, 102, 241, 0.15)",
                        color: "#6366f1",
                      }}>
                        {s.contentType}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: "0.875rem", color: "var(--text-soft, #9ca3af)", borderBottom: "1px solid rgba(55,65,81,0.3)" }}>
                      {formatDate(s.publishAt)}
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: "0.875rem", borderBottom: "1px solid rgba(55,65,81,0.3)" }}>
                      <span style={{
                        padding: "2px 10px",
                        borderRadius: 9999,
                        fontSize: "0.7rem",
                        fontWeight: 500,
                        background: s.status === "scheduled"
                          ? "rgba(20, 184, 166, 0.15)"
                          : s.status === "published"
                            ? "rgba(34, 197, 94, 0.15)"
                            : "rgba(239, 68, 68, 0.15)",
                        color: s.status === "scheduled"
                          ? "#14b8a6"
                          : s.status === "published"
                            ? "#22c55e"
                            : "#ef4444",
                      }}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Top Performing Content */}
      <section aria-label="Top performing content">
        <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: 12 }}>Top Performing Content</h2>
        {topContent.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: "center", padding: 48 }}>
            <p style={{ color: "var(--text-soft, #9ca3af)", margin: 0 }}>
              No performance data yet. Track metrics via the analytics API.
            </p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th scope="col" style={{ textAlign: "left", padding: "8px 12px", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-soft, #9ca3af)", borderBottom: "1px solid var(--text-soft, #374151)" }}>
                  Content
                </th>
                <th scope="col" style={{ textAlign: "left", padding: "8px 12px", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-soft, #9ca3af)", borderBottom: "1px solid var(--text-soft, #374151)" }}>
                  Channel
                </th>
                <th scope="col" style={{ textAlign: "right", padding: "8px 12px", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-soft, #9ca3af)", borderBottom: "1px solid var(--text-soft, #374151)" }}>
                  Traffic
                </th>
                <th scope="col" style={{ textAlign: "right", padding: "8px 12px", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-soft, #9ca3af)", borderBottom: "1px solid var(--text-soft, #374151)" }}>
                  Conversions
                </th>
              </tr>
            </thead>
            <tbody>
              {topContent.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ padding: "10px 12px", fontSize: "0.875rem", borderBottom: "1px solid rgba(55,65,81,0.3)" }}>
                    {item.contentId}
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: "0.875rem", borderBottom: "1px solid rgba(55,65,81,0.3)" }}>
                    <span style={{
                      padding: "2px 10px",
                      borderRadius: 9999,
                      fontSize: "0.7rem",
                      fontWeight: 500,
                      background: `${getChannelColor(item.channel)}26`,
                      color: getChannelColor(item.channel),
                    }}>
                      {item.channel}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: "0.875rem", textAlign: "right", borderBottom: "1px solid rgba(55,65,81,0.3)" }}>
                    {item.traffic.toLocaleString()}
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: "0.875rem", textAlign: "right", borderBottom: "1px solid rgba(55,65,81,0.3)" }}>
                    {item.conversions.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}

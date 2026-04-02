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

function statusBadgeClass(status: string): string {
  if (status === "scheduled") return "bg-teal-500/15 text-teal-500";
  if (status === "published") return "bg-green-500/15 text-green-500";
  return "bg-red-500/15 text-red-500";
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

      if (reportRes.status === "fulfilled") { const json = await reportRes.value.json(); if (json.data) setReport(json.data); }
      if (schedulesRes.status === "fulfilled") { const json = await schedulesRes.value.json(); if (json.data) setSchedules(json.data); }
      if (topRes.status === "fulfilled") { const json = await topRes.value.json(); if (json.data) setTopContent(json.data); }
      if (seoRes.status === "fulfilled") { const json = await seoRes.value.json(); if (json.data) setSeoPages(json.data); }
      if (progRes.status === "fulfilled") { const json = await progRes.value.json(); if (json.data) setProgrammaticPages(json.data); }
    } catch {
      setError("Failed to load distribution data");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="max-w-[1180px] mx-auto px-6 py-8">
        <p className="text-muted-foreground">Loading distribution dashboard...</p>
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
    <main className="max-w-[1180px] mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold m-0">Distribution Engine</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Traffic acquisition across SEO, content, social, and paid channels.
          </p>
        </div>
        <Link href="/dashboard" className="px-4 py-2 rounded-lg border border-muted-foreground/30 cursor-pointer text-sm font-semibold bg-transparent text-muted-foreground no-underline inline-flex items-center">
          Back to Dashboard
        </Link>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl bg-red-500/10 border-l-[3px] border-l-red-500 p-6 shadow-sm mb-6"
        >
          <p className="text-red-500 m-0">{error}</p>
          <button
            type="button"
            className="px-4 py-2 rounded-lg border border-muted-foreground/30 cursor-pointer text-sm font-semibold bg-transparent text-muted-foreground mt-2"
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Channel Performance Cards */}
      <section aria-label="Channel performance">
        <h2 className="text-lg font-semibold mb-3">Channel Performance</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4 mb-8">
          {channelData.map((ch) => (
            <div key={ch.channel} className="rounded-xl bg-card p-6 shadow-sm" style={{ borderLeft: `3px solid ${getChannelColor(ch.channel)}` }}>
              <div className="text-xs font-semibold uppercase mb-2" style={{ color: getChannelColor(ch.channel) }}>
                {ch.channel}
              </div>
              <div className="text-2xl font-bold mb-1">
                {ch.traffic.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                traffic
              </div>
              <div className="flex gap-4 mt-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Conversions: </span>
                  <span className="font-semibold">{ch.conversions}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Impressions: </span>
                  <span className="font-semibold">{ch.impressions}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Page Counts */}
      <section aria-label="Page inventory">
        <h2 className="text-lg font-semibold mb-3">Page Inventory</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4 mb-8">
          <div className="rounded-xl bg-card p-6 shadow-sm">
            <div className="text-xs text-muted-foreground mb-1">SEO Pages</div>
            <div className="text-2xl font-bold">{seoPages.length}</div>
          </div>
          <div className="rounded-xl bg-card p-6 shadow-sm">
            <div className="text-xs text-muted-foreground mb-1">Programmatic Pages</div>
            <div className="text-2xl font-bold">{programmaticPages.length}</div>
          </div>
        </div>
      </section>

      {/* Content Calendar */}
      <section aria-label="Content calendar">
        <h2 className="text-lg font-semibold mb-3">Content Calendar</h2>
        {schedules.length === 0 ? (
          <div className="rounded-xl bg-card p-12 shadow-sm text-center mb-8">
            <p className="text-muted-foreground m-0">
              No scheduled content yet. Use the API to schedule posts and articles.
            </p>
          </div>
        ) : (
          <div className="mb-8">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th scope="col" className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground border-b border-muted-foreground/30">Title</th>
                  <th scope="col" className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground border-b border-muted-foreground/30">Type</th>
                  <th scope="col" className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground border-b border-muted-foreground/30">Publish Date</th>
                  <th scope="col" className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground border-b border-muted-foreground/30">Status</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((s) => (
                  <tr key={s.id}>
                    <td className="px-3 py-2.5 text-sm border-b border-border/30">{s.title}</td>
                    <td className="px-3 py-2.5 text-sm border-b border-border/30">
                      <span className="px-2.5 py-0.5 rounded-full text-[0.7rem] font-medium bg-indigo-500/15 text-indigo-500">
                        {s.contentType}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-sm text-muted-foreground border-b border-border/30">{formatDate(s.publishAt)}</td>
                    <td className="px-3 py-2.5 text-sm border-b border-border/30">
                      <span className={`px-2.5 py-0.5 rounded-full text-[0.7rem] font-medium ${statusBadgeClass(s.status)}`}>
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
        <h2 className="text-lg font-semibold mb-3">Top Performing Content</h2>
        {topContent.length === 0 ? (
          <div className="rounded-xl bg-card p-12 shadow-sm text-center">
            <p className="text-muted-foreground m-0">
              No performance data yet. Track metrics via the analytics API.
            </p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th scope="col" className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground border-b border-muted-foreground/30">Content</th>
                <th scope="col" className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground border-b border-muted-foreground/30">Channel</th>
                <th scope="col" className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground border-b border-muted-foreground/30">Traffic</th>
                <th scope="col" className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground border-b border-muted-foreground/30">Conversions</th>
              </tr>
            </thead>
            <tbody>
              {topContent.map((item, idx) => (
                <tr key={idx}>
                  <td className="px-3 py-2.5 text-sm border-b border-border/30">{item.contentId}</td>
                  <td className="px-3 py-2.5 text-sm border-b border-border/30">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[0.7rem] font-medium"
                      style={{ background: `${getChannelColor(item.channel)}26`, color: getChannelColor(item.channel) }}
                    >
                      {item.channel}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-sm text-right border-b border-border/30">{item.traffic.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-sm text-right border-b border-border/30">{item.conversions.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}

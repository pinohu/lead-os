"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Loading analytics data...</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!data) return null;

  const maxScoreCount = Math.max(...data.scoreDistribution.map((b) => b.count), 1);
  const maxWeeklyCount = Math.max(...data.weeklyTimeSeries.map((w) => w.count), 1);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {isDemo && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-md px-6 py-2.5 text-sm flex items-center gap-2">
          <span className="font-bold text-amber-800 dark:text-amber-200">Demo data</span>
          <span className="text-amber-700 dark:text-amber-300">
            &mdash; Connect your database to see live analytics.{" "}
            <Link href="/setup" className="underline">Configure now &rarr;</Link>
          </span>
        </div>
      )}

      {/* Hero */}
      <section className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Analytics</p>
          <h1 className="text-2xl font-bold tracking-tight">Lead performance analytics</h1>
          <p className="text-lg text-foreground">
            Funnel progression, channel performance, scoring distributions, and trend analysis
            across all captured leads.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </div>
        </div>
        <aside className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Key metrics</p>
          <ul className="space-y-3">
            <li className="space-y-0.5">
              <strong className="text-sm font-semibold">Total leads</strong>
              <span className="block text-sm font-semibold text-foreground">{data.metrics.totalLeads}</span>
            </li>
            <li className="space-y-0.5">
              <strong className="text-sm font-semibold">Conversion rate</strong>
              <span className="block text-sm font-semibold text-foreground">{data.metrics.conversionRate}%</span>
            </li>
            <li className="space-y-0.5">
              <strong className="text-sm font-semibold">Average score</strong>
              <span className="block text-sm font-semibold text-foreground">{data.metrics.avgScore}</span>
            </li>
            <li className="space-y-0.5">
              <strong className="text-sm font-semibold">Hot leads</strong>
              <span className="block text-sm font-semibold text-foreground">{data.metrics.hotLeads}</span>
            </li>
          </ul>
        </aside>
      </section>

      {/* Metric cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total leads</p>
            <h2 className="text-2xl font-bold mt-1">{data.metrics.totalLeads}</h2>
            <p className="text-sm text-muted-foreground mt-1">All captured leads in the runtime.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Conversion rate</p>
            <h2 className="text-2xl font-bold mt-1">{data.metrics.conversionRate}%</h2>
            <p className="text-sm text-muted-foreground mt-1">Leads that reached converted stage or beyond.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Average score</p>
            <h2 className="text-2xl font-bold mt-1">{data.metrics.avgScore}</h2>
            <p className="text-sm text-muted-foreground mt-1">Mean composite score across all leads.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Hot leads</p>
            <h2 className="text-2xl font-bold mt-1">{data.metrics.hotLeads}</h2>
            <p className="text-sm text-muted-foreground mt-1">Leads flagged as hot or scoring 75+.</p>
          </CardContent>
        </Card>
      </section>

      {/* Funnel */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Lead funnel</p>
          <h2 className="text-lg font-semibold">Stage progression</h2>
          {data.funnelStages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No funnel data available yet.</p>
          ) : (
            <div className="grid gap-2 mt-4">
              {data.funnelStages.map((stage) => {
                const maxCount = Math.max(...data.funnelStages.map((s) => s.count), 1);
                const widthPercent = (stage.count / maxCount) * 100;
                return (
                  <div key={stage.stage} className="grid grid-cols-[140px_1fr_80px] items-center gap-3 py-2">
                    <span className="text-sm font-bold">{stage.stage}</span>
                    <div className="relative h-7 bg-muted/50 rounded-md overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-md transition-all duration-300"
                        style={{ width: `${Math.max(widthPercent, 2)}%` }}
                      />
                      <span className={`absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold ${widthPercent > 20 ? "text-primary-foreground" : "text-foreground"}`}>
                        {stage.count}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground text-right">
                      {stage.conversionFromPrevious}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Score distribution + Weekly captures */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Score distribution</p>
            <h2 className="text-lg font-semibold">Lead score buckets</h2>
            {data.scoreDistribution.every((b) => b.count === 0) ? (
              <p className="text-sm text-muted-foreground">No scored leads yet.</p>
            ) : (
              <div className="grid gap-1.5 mt-4">
                {data.scoreDistribution.map((bucket) => (
                  <div key={bucket.label} className="grid grid-cols-[60px_1fr_40px] items-center gap-2">
                    <span className="text-xs font-semibold">{bucket.label}</span>
                    <div className="h-5 bg-muted/50 rounded overflow-hidden">
                      <div
                        className="h-full bg-primary rounded"
                        style={{ width: `${(bucket.count / maxScoreCount) * 100}%`, minWidth: bucket.count > 0 ? 4 : 0 }}
                      />
                    </div>
                    <span className="text-xs text-right text-muted-foreground">{bucket.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Weekly captures</p>
            <h2 className="text-lg font-semibold">Last 30 days</h2>
            {data.weeklyTimeSeries.every((w) => w.count === 0) ? (
              <p className="text-sm text-muted-foreground">No leads captured in the last 30 days.</p>
            ) : (
              <div className="flex items-end gap-3 mt-4 h-44">
                {data.weeklyTimeSeries.map((week) => (
                  <div key={week.weekStart} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-xs font-bold">{week.count}</span>
                    <div
                      className="w-full bg-gradient-to-t from-primary to-primary/60 rounded-t-md"
                      style={{ height: `${Math.max((week.count / maxWeeklyCount) * 140, 4)}px` }}
                    />
                    <span className="text-[0.7rem] text-muted-foreground text-center">
                      {week.weekStart.slice(5)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Channel performance */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Channel performance</p>
          <h2 className="text-lg font-semibold">Source breakdown</h2>
          {data.channelPerformance.length === 0 ? (
            <p className="text-sm text-muted-foreground">No channel data available yet.</p>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="text-left px-3 py-2.5 border-b-2 border-border font-extrabold text-xs uppercase tracking-wider text-muted-foreground">Source</th>
                    <th className="text-right px-3 py-2.5 border-b-2 border-border font-extrabold text-xs uppercase tracking-wider text-muted-foreground">Leads</th>
                    <th className="text-right px-3 py-2.5 border-b-2 border-border font-extrabold text-xs uppercase tracking-wider text-muted-foreground">Conversions</th>
                    <th className="text-right px-3 py-2.5 border-b-2 border-border font-extrabold text-xs uppercase tracking-wider text-muted-foreground">Conv. Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.channelPerformance.map((channel) => (
                    <tr key={channel.source}>
                      <td className="px-3 py-2.5 border-b border-border/40">{channel.source}</td>
                      <td className="px-3 py-2.5 border-b border-border/40 text-right">{channel.leads}</td>
                      <td className="px-3 py-2.5 border-b border-border/40 text-right">{channel.conversions}</td>
                      <td className="px-3 py-2.5 border-b border-border/40 text-right">{channel.conversionRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Niche + Funnel performance */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Niche performance</p>
            <h2 className="text-lg font-semibold">Top performing niches</h2>
            {data.nichePerformance.length === 0 ? (
              <p className="text-sm text-muted-foreground">No niche data available yet.</p>
            ) : (
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left px-3 py-2.5 border-b-2 border-border font-extrabold text-xs uppercase tracking-wider text-muted-foreground">Niche</th>
                      <th className="text-right px-3 py-2.5 border-b-2 border-border font-extrabold text-xs uppercase tracking-wider text-muted-foreground">Leads</th>
                      <th className="text-right px-3 py-2.5 border-b-2 border-border font-extrabold text-xs uppercase tracking-wider text-muted-foreground">Avg Score</th>
                      <th className="text-right px-3 py-2.5 border-b-2 border-border font-extrabold text-xs uppercase tracking-wider text-muted-foreground">Conv. Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.nichePerformance.map((niche) => (
                      <tr key={niche.niche}>
                        <td className="px-3 py-2.5 border-b border-border/40">{niche.niche}</td>
                        <td className="px-3 py-2.5 border-b border-border/40 text-right">{niche.leads}</td>
                        <td className="px-3 py-2.5 border-b border-border/40 text-right">{niche.avgScore}</td>
                        <td className="px-3 py-2.5 border-b border-border/40 text-right">{niche.conversionRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Funnel performance</p>
            <h2 className="text-lg font-semibold">Top performing funnels</h2>
            {data.funnelPerformance.length === 0 ? (
              <p className="text-sm text-muted-foreground">No funnel data available yet.</p>
            ) : (
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left px-3 py-2.5 border-b-2 border-border font-extrabold text-xs uppercase tracking-wider text-muted-foreground">Family</th>
                      <th className="text-right px-3 py-2.5 border-b-2 border-border font-extrabold text-xs uppercase tracking-wider text-muted-foreground">Leads</th>
                      <th className="text-right px-3 py-2.5 border-b-2 border-border font-extrabold text-xs uppercase tracking-wider text-muted-foreground">Hot</th>
                      <th className="text-right px-3 py-2.5 border-b-2 border-border font-extrabold text-xs uppercase tracking-wider text-muted-foreground">Conv. Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.funnelPerformance.map((funnel) => (
                      <tr key={funnel.family}>
                        <td className="px-3 py-2.5 border-b border-border/40">{funnel.family}</td>
                        <td className="px-3 py-2.5 border-b border-border/40 text-right">{funnel.leads}</td>
                        <td className="px-3 py-2.5 border-b border-border/40 text-right">{funnel.hotLeads}</td>
                        <td className="px-3 py-2.5 border-b border-border/40 text-right">{funnel.conversionRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

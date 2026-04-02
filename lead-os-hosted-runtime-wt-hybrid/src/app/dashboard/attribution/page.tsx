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
      const convRate = channel.conversionRate ?? 0;
      let weight = 1;
      switch (selectedModel) {
        case "first-touch":
        case "last-touch":
        case "linear":
          weight = 1;
          break;
        case "time-decay":
          weight = 0.5 + (convRate / 100) * 0.5;
          break;
        case "position-based":
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
      <main className="min-h-screen">
        <section className="rounded-xl border border-border bg-card p-6">
          <p className="text-muted-foreground">Loading attribution data...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      {isDemo && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-300 dark:border-amber-800 px-6 py-2.5 text-sm text-amber-800 dark:text-amber-200">
          Demo data — Connect your analytics integration to see live attribution.{" "}
          <Link href="/dashboard/credentials" className="text-amber-800 underline">Set up credentials</Link>
        </div>
      )}
      <section className="max-w-5xl mx-auto px-4 py-16 md:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Attribution</p>
          <h1 className="text-foreground">Channel attribution</h1>
          <p className="text-lg text-foreground">
            Understand which channels drive lead capture and conversion. Compare attribution
            models to see how credit shifts across the customer journey.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Back to dashboard</Link>
            <Link href="/dashboard/analytics" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Full analytics</Link>
          </div>
        </div>
        <aside className="hidden md:block">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Attribution model</p>
          <p className="text-muted-foreground text-sm mb-3">
            {MODEL_DESCRIPTIONS[selectedModel]}
          </p>
          <div className="grid gap-1.5">
            {(["first-touch", "last-touch", "linear", "time-decay", "position-based"] as AttributionModel[]).map((model) => (
              <button
                key={model}
                type="button"
                onClick={() => setSelectedModel(model)}
                aria-pressed={selectedModel === model}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border-none text-sm text-left cursor-pointer transition-colors ${
                  selectedModel === model
                    ? "bg-orange-700/20 text-foreground font-extrabold"
                    : "bg-white/5 text-muted-foreground font-semibold"
                }`}
              >
                <span className={`inline-block w-2 h-2 rounded-full ${
                  selectedModel === model ? "bg-[var(--accent)]" : "bg-muted-foreground/30"
                }`} />
                {model.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </button>
            ))}
          </div>
        </aside>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Channel performance ({selectedModel.replace("-", " ")})</p>
        <h2 className="text-foreground">Attributed channel breakdown</h2>
        {attributedChannels.length === 0 ? (
          <p className="text-muted-foreground">No channel data available.</p>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-left px-3 py-2.5 border-b-2 border-border/50 font-extrabold text-xs uppercase tracking-wider text-muted-foreground">Channel</th>
                  <th className="text-right px-3 py-2.5 border-b-2 border-border/50 font-extrabold text-xs uppercase tracking-wider text-muted-foreground">Raw Leads</th>
                  <th className="text-right px-3 py-2.5 border-b-2 border-border/50 font-extrabold text-xs uppercase tracking-wider text-muted-foreground">Attributed Leads</th>
                  <th className="text-right px-3 py-2.5 border-b-2 border-border/50 font-extrabold text-xs uppercase tracking-wider text-muted-foreground">Conversions</th>
                  <th className="text-right px-3 py-2.5 border-b-2 border-border/50 font-extrabold text-xs uppercase tracking-wider text-muted-foreground">Conv. Rate</th>
                </tr>
              </thead>
              <tbody>
                {attributedChannels.map((channel) => (
                  <tr key={channel.source}>
                    <td className="px-3 py-2.5 border-b border-border/30">{channel.source}</td>
                    <td className="px-3 py-2.5 border-b border-border/30 text-right">{channel.leads}</td>
                    <td className="px-3 py-2.5 border-b border-border/30 text-right">{channel.attributedLeads}</td>
                    <td className="px-3 py-2.5 border-b border-border/30 text-right">{channel.attributedConversions}</td>
                    <td className="px-3 py-2.5 border-b border-border/30 text-right">{channel.conversionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        <article className="rounded-xl border border-border bg-card p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Campaign performance</p>
          <h2 className="text-foreground">Funnel family breakdown</h2>
          {!analyticsData?.funnelPerformance?.length ? (
            <p className="text-muted-foreground">No funnel data available.</p>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="text-left px-3 py-2.5 border-b-2 border-border/50 font-extrabold text-xs uppercase tracking-wider text-muted-foreground">Family</th>
                    <th className="text-right px-3 py-2.5 border-b-2 border-border/50 font-extrabold text-xs uppercase tracking-wider text-muted-foreground">Leads</th>
                    <th className="text-right px-3 py-2.5 border-b-2 border-border/50 font-extrabold text-xs uppercase tracking-wider text-muted-foreground">Conversions</th>
                    <th className="text-right px-3 py-2.5 border-b-2 border-border/50 font-extrabold text-xs uppercase tracking-wider text-muted-foreground">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.funnelPerformance.map((funnel) => (
                    <tr key={funnel.family}>
                      <td className="px-3 py-2.5 border-b border-border/30">{funnel.family}</td>
                      <td className="px-3 py-2.5 border-b border-border/30 text-right">{funnel.leads}</td>
                      <td className="px-3 py-2.5 border-b border-border/30 text-right">{funnel.conversions}</td>
                      <td className="px-3 py-2.5 border-b border-border/30 text-right">{funnel.conversionRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="rounded-xl border border-border bg-card p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Source / niche breakdown</p>
          <h2 className="text-foreground">Combined attribution</h2>
          {sourceMediumBreakdown.length === 0 ? (
            <p className="text-muted-foreground">No source data available.</p>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="text-left px-3 py-2.5 border-b-2 border-border/50 font-extrabold text-xs uppercase tracking-wider text-muted-foreground">Source / Niche</th>
                    <th className="text-right px-3 py-2.5 border-b-2 border-border/50 font-extrabold text-xs uppercase tracking-wider text-muted-foreground">Leads</th>
                    <th className="text-right px-3 py-2.5 border-b-2 border-border/50 font-extrabold text-xs uppercase tracking-wider text-muted-foreground">Converted</th>
                    <th className="text-right px-3 py-2.5 border-b-2 border-border/50 font-extrabold text-xs uppercase tracking-wider text-muted-foreground">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {sourceMediumBreakdown.map((item) => (
                    <tr key={item.sourceNiche}>
                      <td className="px-3 py-2.5 border-b border-border/30">{item.sourceNiche}</td>
                      <td className="px-3 py-2.5 border-b border-border/30 text-right">{item.count}</td>
                      <td className="px-3 py-2.5 border-b border-border/30 text-right">{item.converted}</td>
                      <td className="px-3 py-2.5 border-b border-border/30 text-right">{item.rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Touch journey</p>
        <h2 className="text-foreground">Converted lead journeys</h2>
        {convertedLeads.length === 0 ? (
          <p className="text-muted-foreground">No converted leads to show touch journeys for.</p>
        ) : (
          <div className="stack-grid mt-4">
            {convertedLeads.map((lead) => {
              const isExpanded = expandedLead === lead.leadKey;
              return (
                <article key={lead.leadKey} className="stack-card">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div>
                      <h3 className="text-foreground text-base m-0">
                        {lead.firstName} {lead.lastName}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {lead.source} | {lead.niche} | {lead.family}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-[var(--success-soft)] text-[var(--success)] font-bold text-xs">
                      {lead.stage}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedLead(isExpanded ? null : lead.leadKey)}
                    aria-expanded={isExpanded}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mt-2 min-h-[36px] px-3.5 py-1.5"
                  >
                    {isExpanded ? "Hide journey" : "View journey"}
                  </button>
                  {isExpanded && (
                    <div className="mt-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-3 py-1 rounded-full bg-[var(--secondary-soft)] text-sm font-semibold">
                          First: {lead.source}
                        </span>
                        <span className="text-muted-foreground">&rarr;</span>
                        <span className="px-3 py-1 rounded-full bg-[var(--secondary-soft)] text-sm font-semibold">
                          Funnel: {lead.family}
                        </span>
                        <span className="text-muted-foreground">&rarr;</span>
                        <span className="px-3 py-1 rounded-full bg-[var(--secondary-soft)] text-sm font-semibold">
                          Niche: {lead.niche}
                        </span>
                        <span className="text-muted-foreground">&rarr;</span>
                        <span className="px-3 py-1 rounded-full bg-[var(--success-soft)] text-[var(--success)] text-sm font-semibold">
                          {lead.stage}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-2 text-sm">
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

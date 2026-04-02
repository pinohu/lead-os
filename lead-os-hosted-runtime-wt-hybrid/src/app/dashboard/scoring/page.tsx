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
    <div className="grid grid-cols-[90px_1fr_36px] items-center gap-2">
      <span className="text-xs font-semibold">{label}</span>
      <div className="h-3.5 overflow-hidden rounded bg-[rgba(34,95,84,0.08)]">
        <div
          className="h-full rounded transition-[width] duration-300 ease-out"
          style={{ width: `${value}%`, background: barColor }}
        />
      </div>
      <span className="text-right text-xs text-muted-foreground">{value}</span>
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
      <main className="min-h-screen">
        <section className="rounded-xl border border-border bg-card p-6">
          <p className="text-muted-foreground">Loading scoring data...</p>
        </section>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen">
        <section className="rounded-xl border border-border bg-card p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Error</p>
          <h2 className="text-foreground">Failed to load scoring</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Back to dashboard</Link>
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
    <main className="min-h-screen">
      {isDemo && (
        <div className="flex items-center gap-2 border-b border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-6 py-2.5 text-sm">
          <span className="font-bold">Demo data</span>
          <span className="text-amber-800">— Connect your database to see live scoring. <a href="/setup" className="underline">Configure now &rarr;</a></span>
        </div>
      )}
      <section className="max-w-5xl mx-auto px-4 py-16 md:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Lead scoring</p>
          <h1 className="text-foreground">Scoring dashboard</h1>
          <p className="text-lg text-foreground">
            Composite scores with breakdown by intent, fit, engagement, and urgency.
            Filter by temperature and niche to focus on the leads that matter.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Back to dashboard</Link>
            <Link href="/dashboard/radar" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Hot lead radar</Link>
          </div>
        </div>
        <aside className="hidden md:block">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Temperature distribution</p>
          <ul className="journey-rail">
            {(["burning", "hot", "warm", "cold"] as Temperature[]).map((temp) => (
              <li key={temp}>
                <strong className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ background: TEMP_COLORS[temp] }}
                  />
                  {TEMP_LABELS[temp]}
                </strong>
                <span>
                  {data.temperatureDistribution[temp]}
                  {totalTemp > 0 && (
                    <span className="ml-2 opacity-70">
                      ({((data.temperatureDistribution[temp] / totalTemp) * 100).toFixed(0)}%)
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Filters</p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-bold">
            Temperature
            <select
              value={temperatureFilter}
              onChange={(e) => setTemperatureFilter(e.target.value as Temperature | "all")}
              className="min-h-9 rounded-xl border border-border/40 bg-background px-3 py-1.5 text-sm text-foreground"
            >
              <option value="all">All</option>
              <option value="burning">Burning</option>
              <option value="hot">Hot</option>
              <option value="warm">Warm</option>
              <option value="cold">Cold</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm font-bold">
            Niche
            <select
              value={nicheFilter}
              onChange={(e) => setNicheFilter(e.target.value)}
              className="min-h-9 rounded-xl border border-border/40 bg-background px-3 py-1.5 text-sm text-foreground"
            >
              <option value="all">All niches</option>
              {allNiches.map((niche) => (
                <option key={niche} value={niche}>{niche}</option>
              ))}
            </select>
          </label>
          <span className="text-xs text-muted-foreground">
            Showing {filteredLeads.length} of {data.leads.length} leads
          </span>
        </div>
      </section>

      <section className="stack-grid">
        {filteredLeads.length === 0 ? (
          <article className="rounded-xl border border-border bg-card p-6">
            <p className="text-muted-foreground">No leads match the selected filters.</p>
          </article>
        ) : (
          filteredLeads.slice(0, 50).map((lead) => {
            const isExpanded = expandedLead === lead.leadKey;
            return (
              <article key={lead.leadKey} className="stack-card">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ background: TEMP_COLORS[lead.temperature] }}
                      />
                      {TEMP_LABELS[lead.temperature]} - {lead.stage}
                    </p>
                    <h3 className="text-foreground m-0">
                      {lead.firstName} {lead.lastName}
                    </h3>
                    <p className="text-muted-foreground text-xs">
                      {lead.email ?? lead.leadKey} | {lead.niche} | {lead.source}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex h-[52px] w-[52px] items-center justify-center rounded-full text-lg font-extrabold ${
                      lead.score >= 75
                        ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                        : lead.score >= 40
                          ? "bg-[var(--secondary-soft)] text-foreground"
                          : "bg-[rgba(20,33,29,0.06)] text-foreground"
                    }`}>
                      {lead.score}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setExpandedLead(isExpanded ? null : lead.leadKey)}
                  aria-expanded={isExpanded}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mt-2 min-h-9 px-3.5 py-1.5 text-xs"
                >
                  {isExpanded ? "Hide breakdown" : "Show breakdown"}
                </button>

                {isExpanded && (
                  <div className="mt-3 grid gap-4">
                    <div className="grid gap-1.5">
                      <ScoreBar label="Intent" value={lead.breakdown.intent} />
                      <ScoreBar label="Fit" value={lead.breakdown.fit} />
                      <ScoreBar label="Engagement" value={lead.breakdown.engagement} />
                      <ScoreBar label="Urgency" value={lead.breakdown.urgency} />
                    </div>
                    <div>
                      <p className="mb-1.5 text-xs font-bold">Recommended actions</p>
                      <ul className="space-y-2">
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
        <section className="rounded-xl border border-border bg-card p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Niche averages</p>
          <h2 className="text-foreground">Score by niche</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border-b-2 border-border/30 px-3 py-2.5 text-left text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Niche</th>
                  <th className="border-b-2 border-border/30 px-3 py-2.5 text-right text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Leads</th>
                  <th className="border-b-2 border-border/30 px-3 py-2.5 text-right text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Avg Score</th>
                </tr>
              </thead>
              <tbody>
                {data.scoreByNiche.map((niche) => (
                  <tr key={niche.niche}>
                    <td className="border-b border-border/20 px-3 py-2.5">{niche.niche}</td>
                    <td className="border-b border-border/20 px-3 py-2.5 text-right">{niche.count}</td>
                    <td className="border-b border-border/20 px-3 py-2.5 text-right">{niche.avgScore}</td>
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

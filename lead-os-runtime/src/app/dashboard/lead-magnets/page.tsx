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

const DEMO_LEAD_MAGNET_DATA: LeadMagnetData = {
  leads: [
    { leadKey: "lk-lm-001", firstName: "James", lastName: "Rivera", email: "james.r@example.com", niche: "roofing", source: "google-ads", family: "lead-magnet", stage: "qualified", score: 94, createdAt: "2026-03-28T10:00:00Z", updatedAt: "2026-03-29T14:00:00Z" },
    { leadKey: "lk-lm-002", firstName: "Priya", lastName: "Mehta", email: "priya.m@example.com", niche: "hvac", source: "referral", family: "lead-magnet", stage: "converted", score: 87, createdAt: "2026-03-27T09:00:00Z", updatedAt: "2026-03-29T10:00:00Z" },
    { leadKey: "lk-lm-003", firstName: "Carlos", lastName: "Nguyen", email: "carlos.n@example.com", niche: "landscaping", source: "organic", family: "lead-magnet", stage: "engaged", score: 81, createdAt: "2026-03-26T16:00:00Z", updatedAt: "2026-03-28T09:00:00Z" },
    { leadKey: "lk-lm-004", firstName: "Sandra", lastName: "Chen", email: "sandra.c@example.com", niche: "plumbing", source: "email", family: "lead-magnet", stage: "new", score: 74, createdAt: "2026-03-25T11:00:00Z", updatedAt: "2026-03-25T11:00:00Z" },
    { leadKey: "lk-lm-005", firstName: "Marcus", lastName: "Johnson", email: "marcus.j@example.com", niche: "electrical", source: "facebook-ads", family: "lead-magnet", stage: "contacted", score: 68, createdAt: "2026-03-24T14:00:00Z", updatedAt: "2026-03-26T08:00:00Z" },
    { leadKey: "lk-lm-006", firstName: "Ava", lastName: "Patel", email: "ava.p@example.com", niche: "roofing", source: "referral", family: "lead-magnet", stage: "converted", score: 91, createdAt: "2026-03-23T10:00:00Z", updatedAt: "2026-03-27T12:00:00Z" },
    { leadKey: "lk-lm-007", firstName: "Natalie", lastName: "Kim", email: "natalie.k@example.com", niche: "landscaping", source: "direct", family: "lead-magnet", stage: "qualified", score: 83, createdAt: "2026-03-22T15:00:00Z", updatedAt: "2026-03-26T11:00:00Z" },
    { leadKey: "lk-lm-008", firstName: "Derek", lastName: "Williams", email: "derek.w@example.com", niche: "hvac", source: "google-ads", family: "lead-magnet", stage: "cold", score: 52, createdAt: "2026-03-18T09:00:00Z", updatedAt: "2026-03-20T10:00:00Z" },
  ],
};

export default function LeadMagnetsPage() {
  const [data, setData] = useState<LeadMagnetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [nicheFilter, setNicheFilter] = useState("all");

  useEffect(() => {
    fetch("/api/dashboard/scoring", { credentials: "include" })
      .then((res) => res.ok ? res.json() : null)
      .then((json) => {
        if (json?.data?.leads) {
          setData(json.data);
        } else {
          setData(DEMO_LEAD_MAGNET_DATA);
          setIsDemo(true);
        }
        setLoading(false);
      })
      .catch(() => {
        setData(DEMO_LEAD_MAGNET_DATA);
        setIsDemo(true);
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
      <main className="min-h-screen">
        <section className="rounded-xl border border-border bg-card p-6">
          <p className="text-muted-foreground">Loading lead magnet data...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      {isDemo && (
        <div className="border-b border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-6 py-2.5 text-sm text-amber-800 dark:text-amber-200">
          Demo data — Sign in to manage your live lead magnets.{" "}
          <Link href="/auth/sign-in" className="text-amber-800 underline">Sign in</Link>
        </div>
      )}
      <section className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Lead magnets</p>
          <h1 className="text-foreground">Lead magnet management</h1>
          <p className="text-lg text-foreground">
            Track delivery performance, conversion rates, and engagement across all lead
            magnets organized by category and niche.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Back to dashboard</Link>
          </div>
        </div>
        <aside className="hidden md:block">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Summary</p>
          <ul className="space-y-3 mt-4">
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

      <section className="rounded-xl border border-border bg-card p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Filters</p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-bold">
            Category
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="min-h-9 rounded-xl border border-border/40 bg-background px-3 py-1.5 text-sm text-foreground"
            >
              <option value="all">All categories</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
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
            Showing {filteredMagnets.length} magnets
          </span>
        </div>
      </section>

      <section className="stack-grid">
        {filteredMagnets.length === 0 ? (
          <article className="rounded-xl border border-border bg-card p-6">
            <p className="text-muted-foreground">No lead magnets match the selected filters.</p>
          </article>
        ) : (
          filteredMagnets.map((magnet) => (
            <article key={`${magnet.family}::${magnet.niche}`} className="stack-card">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{magnet.family}</p>
              <h3 className="text-foreground">{magnet.niche}</h3>
              <div className="mt-2 grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-3">
                <div>
                  <p className="mb-0.5 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                    Delivered
                  </p>
                  <p className="text-2xl font-extrabold">{magnet.totalDelivered}</p>
                </div>
                <div>
                  <p className="mb-0.5 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                    Converted
                  </p>
                  <p className="text-2xl font-extrabold">{magnet.converted}</p>
                </div>
                <div>
                  <p className="mb-0.5 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                    Conv. Rate
                  </p>
                  <p className="text-2xl font-extrabold">{magnet.conversionRate}%</p>
                </div>
                <div>
                  <p className="mb-0.5 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                    Avg Score
                  </p>
                  <p className="text-2xl font-extrabold">{magnet.avgScore}</p>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded bg-[rgba(34,95,84,0.08)]">
                <div
                  className="h-full rounded"
                  style={{
                    width: `${magnet.conversionRate}%`,
                    background: magnet.conversionRate >= 20 ? "var(--success)" : magnet.conversionRate >= 10 ? "var(--accent)" : "var(--secondary)",
                    minWidth: magnet.converted > 0 ? 4 : 0,
                  }}
                />
              </div>
            </article>
          ))
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Recent deliveries</p>
        <h2 className="text-foreground">Latest lead magnet activity</h2>
        {recentDeliveries.length === 0 ? (
          <p className="text-muted-foreground">No recent deliveries to show.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border-b-2 border-border/30 px-3 py-2.5 text-left text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Lead</th>
                  <th className="border-b-2 border-border/30 px-3 py-2.5 text-left text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Family</th>
                  <th className="border-b-2 border-border/30 px-3 py-2.5 text-left text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Niche</th>
                  <th className="border-b-2 border-border/30 px-3 py-2.5 text-right text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Score</th>
                  <th className="border-b-2 border-border/30 px-3 py-2.5 text-left text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Stage</th>
                  <th className="border-b-2 border-border/30 px-3 py-2.5 text-left text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentDeliveries.map((delivery) => (
                  <tr key={delivery.leadKey}>
                    <td className="border-b border-border/20 px-3 py-2.5">
                      <Link href={`/dashboard/leads/${encodeURIComponent(delivery.leadKey)}`} className="font-semibold">
                        {delivery.firstName} {delivery.lastName}
                      </Link>
                    </td>
                    <td className="border-b border-border/20 px-3 py-2.5">{delivery.family}</td>
                    <td className="border-b border-border/20 px-3 py-2.5">{delivery.niche}</td>
                    <td className="border-b border-border/20 px-3 py-2.5 text-right">{delivery.score}</td>
                    <td className="border-b border-border/20 px-3 py-2.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        ["converted", "onboarding", "active"].includes(delivery.stage)
                          ? "bg-[var(--success-soft)]" : "bg-[var(--secondary-soft)]"
                      }`}>
                        {delivery.stage}
                      </span>
                    </td>
                    <td className="border-b border-border/20 px-3 py-2.5">{new Date(delivery.createdAt).toLocaleDateString()}</td>
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

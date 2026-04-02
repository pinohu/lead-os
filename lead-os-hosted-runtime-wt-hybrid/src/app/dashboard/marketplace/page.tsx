"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface MarketplaceStats {
  totalLeads: number;
  available: number;
  claimed: number;
  sold: number;
  totalRevenue: number;
  avgPrice: number;
  topNiches: Array<{ niche: string; revenue: number; count: number }>;
}

interface RevenueData {
  byNiche: Record<string, { revenue: number; count: number }>;
  total: number;
  leadsSold: number;
  avgPrice: number;
}

interface MarketplaceLead {
  id: string;
  niche: string;
  qualityScore: number;
  temperature: string;
  summary: string;
  price: number;
  status: string;
  claimedBy?: string;
  soldAt?: string;
  createdAt: string;
}

interface BuyerAccount {
  id: string;
  email: string;
  company: string;
  totalSpent: number;
  leadsPurchased: number;
  status: string;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function temperatureColor(temp: string): string {
  switch (temp) {
    case "burning": return "#ef4444";
    case "hot": return "#f97316";
    case "warm": return "#eab308";
    case "cold": return "#3b82f6";
    default: return "#6b7280";
  }
}

const DEMO_REVENUE: RevenueData = {
  byNiche: {
    roofing: { revenue: 183500, count: 61 },
    hvac: { revenue: 141000, count: 47 },
    landscaping: { revenue: 102000, count: 34 },
    plumbing: { revenue: 93000, count: 31 },
    electrical: { revenue: 84000, count: 28 },
  },
  total: 603500,
  leadsSold: 201,
  avgPrice: 3002,
};

const DEMO_MARKETPLACE_LEADS: MarketplaceLead[] = [
  { id: "ml-001", niche: "roofing", qualityScore: 94, temperature: "burning", summary: "Homeowner needs full roof replacement after hail damage. Has insurance claim approved.", price: 4500, status: "available", createdAt: "2026-03-29T10:00:00Z" },
  { id: "ml-002", niche: "hvac", qualityScore: 87, temperature: "hot", summary: "Commercial property HVAC upgrade for 8,000 sq ft office building.", price: 3800, status: "available", createdAt: "2026-03-28T14:00:00Z" },
  { id: "ml-003", niche: "landscaping", qualityScore: 81, temperature: "hot", summary: "2-acre residential landscaping redesign with irrigation system.", price: 2900, status: "claimed", claimedBy: "buyer-001", createdAt: "2026-03-27T09:00:00Z" },
  { id: "ml-004", niche: "plumbing", qualityScore: 79, temperature: "warm", summary: "Kitchen and two bathroom remodel plumbing package.", price: 2400, status: "sold", soldAt: "2026-03-26T11:00:00Z", createdAt: "2026-03-25T16:00:00Z" },
  { id: "ml-005", niche: "electrical", qualityScore: 76, temperature: "warm", summary: "Panel upgrade and EV charger installation for new build.", price: 2100, status: "available", createdAt: "2026-03-24T08:00:00Z" },
];

const DEMO_BUYERS: BuyerAccount[] = [
  { id: "buyer-001", email: "bids@acme-roofing.com", company: "Acme Roofing Co.", totalSpent: 183500, leadsPurchased: 41, status: "active" },
  { id: "buyer-002", email: "leads@swifthvac.io", company: "Swift HVAC", totalSpent: 141000, leadsPurchased: 34, status: "active" },
  { id: "buyer-003", email: "buy@greenlawn.com", company: "Green Lawn Erie", totalSpent: 56000, leadsPurchased: 19, status: "active" },
];

export default function MarketplaceDashboardPage() {
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [leads, setLeads] = useState<MarketplaceLead[]>([]);
  const [buyers, setBuyers] = useState<BuyerAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/marketplace/revenue", { credentials: "include" }).then((r) => r.ok ? r.json() : null),
      fetch("/api/marketplace/leads?limit=50", { credentials: "include" }).then((r) => r.ok ? r.json() : null),
      fetch("/api/marketplace/buyers", { credentials: "include" }).then((r) => r.ok ? r.json() : null),
    ])
      .then(([revenueJson, leadsJson, buyersJson]) => {
        if (revenueJson?.data || leadsJson?.data || buyersJson?.data) {
          setRevenue(revenueJson?.data ?? null);
          setLeads(leadsJson?.data ?? []);
          setBuyers(buyersJson?.data ?? []);
        } else {
          setRevenue(DEMO_REVENUE);
          setLeads(DEMO_MARKETPLACE_LEADS);
          setBuyers(DEMO_BUYERS);
          setIsDemo(true);
        }
        setLoading(false);
      })
      .catch(() => {
        setRevenue(DEMO_REVENUE);
        setLeads(DEMO_MARKETPLACE_LEADS);
        setBuyers(DEMO_BUYERS);
        setIsDemo(true);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen">
        <section className="rounded-xl border border-border bg-card p-6">
          <p className="text-muted-foreground">Loading marketplace data...</p>
        </section>
      </main>
    );
  }

  const availableLeads = leads.filter((l) => l.status === "available");
  const claimedLeads = leads.filter((l) => l.status === "claimed");
  const soldLeads = leads.filter((l) => l.status === "sold");

  const temperatureDist: Record<string, number> = {};
  for (const lead of leads) {
    temperatureDist[lead.temperature] = (temperatureDist[lead.temperature] ?? 0) + 1;
  }

  const nicheEntries = revenue
    ? Object.entries(revenue.byNiche)
        .sort(([, a], [, b]) => b.revenue - a.revenue)
        .slice(0, 10)
    : [];

  return (
    <main className="min-h-screen">
      {isDemo && (
        <div className="border-b border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-6 py-2.5 text-sm text-amber-800 dark:text-amber-200">
          Demo marketplace data — Connect your tenant to manage live lead inventory.{" "}
          <Link href="/auth/sign-in" className="text-amber-800 underline">Sign in</Link>
        </div>
      )}
      <section className="max-w-5xl mx-auto px-4 py-16 md:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Marketplace</p>
          <h1>Lead marketplace</h1>
          <p className="text-lg text-foreground">
            Publish, sell, and track lead inventory across niches and buyer accounts.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Back to dashboard</Link>
            <Link href="/marketplace" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Public marketplace</Link>
          </div>
        </div>
        <aside className="hidden md:block">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Summary</p>
          <ul className="journey-rail">
            <li>
              <strong>Total leads</strong>
              <span>{leads.length}</span>
            </li>
            <li>
              <strong>Available</strong>
              <span>{availableLeads.length}</span>
            </li>
            <li>
              <strong>Claimed</strong>
              <span>{claimedLeads.length}</span>
            </li>
            <li>
              <strong>Sold</strong>
              <span>{soldLeads.length}</span>
            </li>
          </ul>
        </aside>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <article className="rounded-xl border border-border bg-card p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total revenue</p>
          <h2>{formatCents(revenue?.total ?? 0)}</h2>
          <p className="text-muted-foreground">Revenue from all sold leads.</p>
        </article>
        <article className="rounded-xl border border-border bg-card p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Leads sold</p>
          <h2>{revenue?.leadsSold ?? 0}</h2>
          <p className="text-muted-foreground">Total leads with completed sales.</p>
        </article>
        <article className="rounded-xl border border-border bg-card p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Avg price</p>
          <h2>{formatCents(revenue?.avgPrice ?? 0)}</h2>
          <p className="text-muted-foreground">Average price per lead.</p>
        </article>
        <article className="rounded-xl border border-border bg-card p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Active buyers</p>
          <h2>{buyers.filter((b) => b.status === "active").length}</h2>
          <p className="text-muted-foreground">Buyer accounts currently active.</p>
        </article>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Revenue by niche</p>
        <h2>Top niches</h2>
        {nicheEntries.length === 0 ? (
          <p className="text-muted-foreground">No revenue data yet.</p>
        ) : (
          <div className="mt-4 grid gap-2">
            {nicheEntries.map(([niche, data]) => {
              const maxRevenue = Math.max(...nicheEntries.map(([, d]) => d.revenue), 1);
              const widthPercent = (data.revenue / maxRevenue) * 100;
              return (
                <div
                  key={niche}
                  className="grid grid-cols-[160px_1fr_120px] items-center gap-3 py-2"
                >
                  <span className="text-sm font-bold">{niche}</span>
                  <div className="relative h-7 rounded-md bg-[rgba(34,95,84,0.08)]">
                    <div
                      className="absolute left-0 top-0 h-full rounded-md bg-[var(--accent,#225f54)] transition-[width] duration-300 ease-out"
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                  <span className="text-right text-sm font-semibold">
                    {formatCents(data.revenue)} ({data.count})
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Quality distribution</p>
        <h2>Lead temperature</h2>
        {Object.keys(temperatureDist).length === 0 ? (
          <p className="text-muted-foreground">No leads published yet.</p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-4">
            {(["burning", "hot", "warm", "cold"] as const).map((temp) => (
              <div
                key={temp}
                className="min-w-[100px] rounded-lg bg-[rgba(34,95,84,0.05)] px-5 py-3 text-center"
                style={{ border: `2px solid ${temperatureColor(temp)}` }}
              >
                <div className="text-2xl font-extrabold">
                  {temperatureDist[temp] ?? 0}
                </div>
                <div className="text-xs font-semibold capitalize" style={{ color: temperatureColor(temp) }}>
                  {temp}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Recent activity</p>
        <h2>Recent sales</h2>
        {soldLeads.length === 0 && claimedLeads.length === 0 ? (
          <p className="text-muted-foreground">No sales activity yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-[rgba(34,95,84,0.15)]">
                  <th scope="col" className="px-3 py-2 text-left font-bold">Niche</th>
                  <th scope="col" className="px-3 py-2 text-left font-bold">Temperature</th>
                  <th scope="col" className="px-3 py-2 text-right font-bold">Score</th>
                  <th scope="col" className="px-3 py-2 text-right font-bold">Price</th>
                  <th scope="col" className="px-3 py-2 text-left font-bold">Status</th>
                  <th scope="col" className="px-3 py-2 text-left font-bold">Date</th>
                </tr>
              </thead>
              <tbody>
                {[...soldLeads, ...claimedLeads].slice(0, 20).map((lead) => (
                  <tr key={lead.id} className="border-b border-[rgba(34,95,84,0.08)]">
                    <td className="px-3 py-2">{lead.niche}</td>
                    <td className="px-3 py-2">
                      <span className="font-semibold capitalize" style={{ color: temperatureColor(lead.temperature) }}>
                        {lead.temperature}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">{lead.qualityScore}</td>
                    <td className="px-3 py-2 text-right">{formatCents(lead.price)}</td>
                    <td className="px-3 py-2 capitalize">{lead.status}</td>
                    <td className="px-3 py-2">
                      {new Date(lead.soldAt ?? lead.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Accounts</p>
        <h2>Buyer accounts</h2>
        {buyers.length === 0 ? (
          <p className="text-muted-foreground">No buyer accounts created yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-[rgba(34,95,84,0.15)]">
                  <th scope="col" className="px-3 py-2 text-left font-bold">Company</th>
                  <th scope="col" className="px-3 py-2 text-left font-bold">Email</th>
                  <th scope="col" className="px-3 py-2 text-right font-bold">Leads bought</th>
                  <th scope="col" className="px-3 py-2 text-right font-bold">Total spent</th>
                  <th scope="col" className="px-3 py-2 text-left font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {buyers.map((buyer) => (
                  <tr key={buyer.id} className="border-b border-[rgba(34,95,84,0.08)]">
                    <td className="px-3 py-2 font-semibold">{buyer.company}</td>
                    <td className="px-3 py-2">{buyer.email}</td>
                    <td className="px-3 py-2 text-right">{buyer.leadsPurchased}</td>
                    <td className="px-3 py-2 text-right">{formatCents(buyer.totalSpent)}</td>
                    <td className="px-3 py-2 capitalize">{buyer.status}</td>
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

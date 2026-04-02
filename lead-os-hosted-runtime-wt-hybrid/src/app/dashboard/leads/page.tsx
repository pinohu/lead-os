"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Temperature = "cold" | "warm" | "hot" | "burning";

interface LeadRow {
  leadKey: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  score: number;
  temperature: Temperature;
  niche: string;
  stage: string;
  source: string;
  capturedAt: string;
}

interface LeadsApiResponse {
  leads: LeadRow[];
  total: number;
  page: number;
  pageSize: number;
}

type SortField = "score" | "capturedAt";
type SortDir = "asc" | "desc";

const TEMP_BADGE: Record<Temperature, { label: string; className: string }> = {
  cold: { label: "Cold", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  warm: { label: "Warm", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300" },
  hot: { label: "Hot", className: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300" },
  burning: { label: "Burning", className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" },
};

const PAGE_SIZE = 25;

const DEMO_LEADS: LeadRow[] = [
  { leadKey: "lk-001", firstName: "James", lastName: "Rivera", email: "james.r@example.com", phone: "(814) 555-0101", company: "Rivera Properties", score: 94, temperature: "burning", niche: "roofing", stage: "qualified", source: "google-ads", capturedAt: "2026-03-29T10:15:00Z" },
  { leadKey: "lk-002", firstName: "Priya", lastName: "Mehta", email: "priya.m@example.com", phone: null, company: null, score: 87, temperature: "hot", niche: "hvac", stage: "contacted", source: "referral", capturedAt: "2026-03-28T14:30:00Z" },
  { leadKey: "lk-003", firstName: "Carlos", lastName: "Nguyen", email: "carlos.n@example.com", phone: "(814) 555-0103", company: "Green Valley LLC", score: 81, temperature: "hot", niche: "landscaping", stage: "engaged", source: "organic", capturedAt: "2026-03-27T09:00:00Z" },
  { leadKey: "lk-004", firstName: "Sandra", lastName: "Chen", email: "sandra.c@example.com", phone: "(814) 555-0104", company: "Chen Consulting", score: 79, temperature: "warm", niche: "plumbing", stage: "new", source: "email", capturedAt: "2026-03-26T16:45:00Z" },
  { leadKey: "lk-005", firstName: "Marcus", lastName: "Johnson", email: "marcus.j@example.com", phone: null, company: null, score: 76, temperature: "warm", niche: "electrical", stage: "new", source: "facebook-ads", capturedAt: "2026-03-25T11:20:00Z" },
  { leadKey: "lk-006", firstName: "Ava", lastName: "Patel", email: "ava.p@example.com", phone: "(814) 555-0106", company: "Patel Realty", score: 72, temperature: "warm", niche: "roofing", stage: "converted", source: "referral", capturedAt: "2026-03-24T08:00:00Z" },
  { leadKey: "lk-007", firstName: "Derek", lastName: "Williams", email: "derek.w@example.com", phone: "(814) 555-0107", company: null, score: 58, temperature: "cold", niche: "hvac", stage: "cold", source: "google-ads", capturedAt: "2026-03-20T13:00:00Z" },
  { leadKey: "lk-008", firstName: "Natalie", lastName: "Kim", email: "natalie.k@example.com", phone: "(814) 555-0108", company: "Kim Services", score: 91, temperature: "burning", niche: "landscaping", stage: "qualified", source: "direct", capturedAt: "2026-03-23T15:00:00Z" },
  { leadKey: "lk-009", firstName: "Robert", lastName: "Torres", email: "r.torres@example.com", phone: null, company: "Torres Build", score: 67, temperature: "warm", niche: "roofing", stage: "contacted", source: "organic", capturedAt: "2026-03-22T10:30:00Z" },
  { leadKey: "lk-010", firstName: "Lisa", lastName: "Anderson", email: "lisa.a@example.com", phone: "(814) 555-0110", company: null, score: 83, temperature: "hot", niche: "plumbing", stage: "engaged", source: "email", capturedAt: "2026-03-21T09:15:00Z" },
];

const DEMO_LEADS_RESPONSE: LeadsApiResponse = {
  leads: DEMO_LEADS,
  total: 147,
  page: 1,
  pageSize: PAGE_SIZE,
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i} aria-hidden="true">
          {Array.from({ length: 8 }).map((__, j) => (
            <td key={j} className="px-4 py-3 border-b border-border/40">
              <div
                className="h-3.5 rounded bg-muted animate-pulse"
                style={{ width: `${55 + ((i * 7 + j * 13) % 40)}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function LeadsPage() {
  const [data, setData] = useState<LeadsApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [temperatureFilter, setTemperatureFilter] = useState<Temperature | "all">("all");
  const [nicheFilter, setNicheFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("capturedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [allLeadsOnce, setAllLeadsOnce] = useState<LeadRow[]>([]);

  const fetchLeads = useCallback(() => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
      temperature: temperatureFilter,
      niche: nicheFilter,
      stage: stageFilter,
      search: search.trim(),
    });

    fetch(`/api/dashboard/leads?${params.toString()}`, { credentials: "include" })
      .then((res) => res.ok ? res.json() : null)
      .then((json) => {
        const payload = json?.data as LeadsApiResponse | undefined;
        if (payload?.leads) {
          setData(payload);
          if (allLeadsOnce.length === 0 && page === 1 &&
            temperatureFilter === "all" && nicheFilter === "all" &&
            stageFilter === "all" && search === "") {
            setAllLeadsOnce(payload.leads);
          }
        } else {
          setData(DEMO_LEADS_RESPONSE);
          setAllLeadsOnce(DEMO_LEADS);
          setIsDemo(true);
        }
        setLoading(false);
      })
      .catch(() => {
        setData(DEMO_LEADS_RESPONSE);
        setAllLeadsOnce(DEMO_LEADS);
        setIsDemo(true);
        setLoading(false);
      });
  }, [page, temperatureFilter, nicheFilter, stageFilter, search, allLeadsOnce.length]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const allNiches = useMemo(
    () => Array.from(new Set(allLeadsOnce.map((l) => l.niche).filter(Boolean))).sort(),
    [allLeadsOnce],
  );

  const allStages = useMemo(
    () => Array.from(new Set(allLeadsOnce.map((l) => l.stage).filter(Boolean))).sort(),
    [allLeadsOnce],
  );

  const sortedLeads = useMemo(() => {
    if (!data) return [];
    return [...data.leads].sort((a, b) => {
      if (sortField === "score") {
        return sortDir === "asc" ? a.score - b.score : b.score - a.score;
      }
      const aTime = new Date(a.capturedAt).getTime();
      const bTime = new Date(b.capturedAt).getTime();
      return sortDir === "asc" ? aTime - bTime : bTime - aTime;
    });
  }, [data, sortField, sortDir]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  function handleFilterChange() {
    setPage(1);
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  function downloadCsv() {
    const leads = sortedLeads.length > 0 ? sortedLeads : (data?.leads ?? []);
    if (leads.length === 0) return;
    const headers = ["Lead Key", "First Name", "Last Name", "Email", "Phone", "Company", "Score", "Temperature", "Niche", "Stage", "Source", "Captured At"];
    const rows = leads.map((l) => [
      l.leadKey, l.firstName, l.lastName,
      l.email ?? "", l.phone ?? "", l.company ?? "",
      String(l.score), l.temperature, l.niche, l.stage, l.source,
      new Date(l.capturedAt).toISOString(),
    ].map((v) => `"${v.replace(/"/g, '""')}"`).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {isDemo && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-300 dark:border-amber-800 px-6 py-2.5 text-sm text-amber-800 dark:text-amber-200 rounded-md">
          Demo data (147 sample leads) — Sign in to view and manage your live lead database.{" "}
          <Link href="/auth/sign-in" className="underline font-medium">Sign in</Link>
        </div>
      )}

      {/* Hero */}
      <section className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Lead list</p>
          <h1 className="text-2xl font-bold tracking-tight">All leads</h1>
          <p className="text-lg text-muted-foreground">
            Browse, search, and filter every lead captured by this runtime. Click a row to open the
            full lead detail view.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/scoring">Scoring view</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/radar">Hot lead radar</Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadCsv}
              disabled={!data || data.leads.length === 0}
            >
              Export CSV
            </Button>
          </div>
        </div>
        <aside className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total leads</p>
          <h2 className="text-3xl font-bold">{data?.total ?? "\u2014"}</h2>
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} &mdash; {PAGE_SIZE} per page
          </p>
        </aside>
      </section>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Search and filter</p>
          <div className="flex flex-wrap gap-3 items-center">
            <label className="flex items-center gap-2 text-sm font-semibold">
              Search
              <input
                type="search"
                placeholder="Name or email"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  handleFilterChange();
                }}
                aria-label="Search leads by name or email"
                className="h-9 min-w-[200px] rounded-xl border border-border bg-background px-3 text-sm"
              />
            </label>

            <label className="flex items-center gap-2 text-sm font-semibold">
              Temperature
              <select
                value={temperatureFilter}
                onChange={(e) => {
                  setTemperatureFilter(e.target.value as Temperature | "all");
                  handleFilterChange();
                }}
                className="h-9 rounded-xl border border-border bg-background px-3 text-sm"
              >
                <option value="all">All</option>
                <option value="burning">Burning</option>
                <option value="hot">Hot</option>
                <option value="warm">Warm</option>
                <option value="cold">Cold</option>
              </select>
            </label>

            <label className="flex items-center gap-2 text-sm font-semibold">
              Niche
              <select
                value={nicheFilter}
                onChange={(e) => {
                  setNicheFilter(e.target.value);
                  handleFilterChange();
                }}
                className="h-9 rounded-xl border border-border bg-background px-3 text-sm"
              >
                <option value="all">All niches</option>
                {allNiches.map((niche) => (
                  <option key={niche} value={niche}>{niche}</option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 text-sm font-semibold">
              Stage
              <select
                value={stageFilter}
                onChange={(e) => {
                  setStageFilter(e.target.value);
                  handleFilterChange();
                }}
                className="h-9 rounded-xl border border-border bg-background px-3 text-sm"
              >
                <option value="all">All stages</option>
                {allStages.map((stage) => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
            </label>

            {data && (
              <span className="text-xs text-muted-foreground">
                {data.total} {data.total === 1 ? "lead" : "leads"} found
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table
            className="w-full text-sm border-collapse"
            aria-label="Lead list"
            aria-busy={loading}
          >
            <thead>
              <tr>
                <th scope="col" className="text-left px-4 py-2.5 border-b-2 border-border font-extrabold text-xs uppercase tracking-wider text-muted-foreground bg-muted/40 whitespace-nowrap">
                  Name
                </th>
                <th scope="col" className="text-left px-4 py-2.5 border-b-2 border-border font-extrabold text-xs uppercase tracking-wider text-muted-foreground bg-muted/40 whitespace-nowrap">
                  Email
                </th>
                <th
                  scope="col"
                  className="text-left px-4 py-2.5 border-b-2 border-border font-extrabold text-xs uppercase tracking-wider text-muted-foreground bg-muted/40 whitespace-nowrap cursor-pointer select-none"
                  onClick={() => handleSort("score")}
                  aria-sort={sortField === "score" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                >
                  Score {sortField === "score" ? (sortDir === "asc" ? "\u25B2" : "\u25BC") : "\u2195"}
                </th>
                <th scope="col" className="text-left px-4 py-2.5 border-b-2 border-border font-extrabold text-xs uppercase tracking-wider text-muted-foreground bg-muted/40 whitespace-nowrap">
                  Temperature
                </th>
                <th scope="col" className="text-left px-4 py-2.5 border-b-2 border-border font-extrabold text-xs uppercase tracking-wider text-muted-foreground bg-muted/40 whitespace-nowrap">
                  Niche
                </th>
                <th scope="col" className="text-left px-4 py-2.5 border-b-2 border-border font-extrabold text-xs uppercase tracking-wider text-muted-foreground bg-muted/40 whitespace-nowrap">
                  Stage
                </th>
                <th scope="col" className="text-left px-4 py-2.5 border-b-2 border-border font-extrabold text-xs uppercase tracking-wider text-muted-foreground bg-muted/40 whitespace-nowrap">
                  Source
                </th>
                <th
                  scope="col"
                  className="text-left px-4 py-2.5 border-b-2 border-border font-extrabold text-xs uppercase tracking-wider text-muted-foreground bg-muted/40 whitespace-nowrap cursor-pointer select-none"
                  onClick={() => handleSort("capturedAt")}
                  aria-sort={sortField === "capturedAt" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                >
                  Captured {sortField === "capturedAt" ? (sortDir === "asc" ? "\u25B2" : "\u25BC") : "\u2195"}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows />
              ) : sortedLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center border-b border-border/40">
                    <p className="font-bold text-base mb-2">No leads yet.</p>
                    <p className="text-muted-foreground mb-4">Share your widget to start capturing leads.</p>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/dashboard/settings">Go to settings</Link>
                    </Button>
                  </td>
                </tr>
              ) : (
                sortedLeads.map((lead) => {
                  const badge = TEMP_BADGE[lead.temperature];
                  const leadUrl = `/dashboard/leads/${encodeURIComponent(lead.leadKey)}`;
                  return (
                    <tr
                      key={lead.leadKey}
                      className="cursor-pointer transition-colors hover:bg-muted/40"
                    >
                      <td className="px-4 py-2.5 border-b border-border/40 font-semibold">
                        <Link href={leadUrl} className="text-foreground no-underline block">
                          {lead.firstName} {lead.lastName}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 border-b border-border/40 text-muted-foreground">
                        <Link href={leadUrl} className="text-inherit no-underline">
                          {lead.email ?? <span className="opacity-45">&mdash;</span>}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 border-b border-border/40 text-center font-bold">
                        <Link href={leadUrl} className="text-inherit no-underline">
                          {lead.score}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 border-b border-border/40">
                        <Link href={leadUrl} className="no-underline">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${badge.className}`}>
                            {badge.label}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 border-b border-border/40 text-muted-foreground">
                        <Link href={leadUrl} className="text-inherit no-underline">
                          {lead.niche || <span className="opacity-45">&mdash;</span>}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 border-b border-border/40 text-muted-foreground">
                        <Link href={leadUrl} className="text-inherit no-underline">
                          {lead.stage || <span className="opacity-45">&mdash;</span>}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 border-b border-border/40 text-muted-foreground">
                        <Link href={leadUrl} className="text-inherit no-underline">
                          {lead.source || <span className="opacity-45">&mdash;</span>}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 border-b border-border/40 text-muted-foreground whitespace-nowrap">
                        <Link href={leadUrl} className="text-inherit no-underline">
                          {formatDate(lead.capturedAt)}
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {data && data.total > PAGE_SIZE && (
        <Card>
          <CardContent className="pt-6 flex items-center justify-between gap-4">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              aria-label="Previous page"
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              aria-label="Next page"
            >
              Next
            </Button>
          </CardContent>
        </Card>
      )}
    </main>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

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

const TEMP_BADGE: Record<Temperature, { label: string; bg: string; color: string }> = {
  cold: { label: "Cold", bg: "rgba(74, 144, 217, 0.14)", color: "#2563a8" },
  warm: { label: "Warm", bg: "rgba(232, 168, 56, 0.16)", color: "#a05a00" },
  hot: { label: "Hot", bg: "rgba(211, 84, 0, 0.14)", color: "#c04400" },
  burning: { label: "Burning", bg: "rgba(192, 57, 43, 0.14)", color: "#9b2335" },
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
            <td key={j} style={tdStyle}>
              <div
                style={{
                  height: 14,
                  borderRadius: 4,
                  background: "rgba(20, 33, 29, 0.08)",
                  width: `${55 + ((i * 7 + j * 13) % 40)}%`,
                  animation: "pulse 1.4s ease-in-out infinite",
                }}
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
    <main className="experience-page">
      {isDemo && (
        <div style={{ background: "#fef3c7", borderBottom: "1px solid #fcd34d", padding: "10px 24px", fontSize: "0.875rem", color: "#92400e" }}>
          Demo data (147 sample leads) — Sign in to view and manage your live lead database.{" "}
          <Link href="/auth/sign-in" style={{ color: "#92400e", textDecoration: "underline" }}>Sign in</Link>
        </div>
      )}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
      `}</style>

      <section className="experience-hero">
        <div className="hero-copy">
          <p className="eyebrow">Lead list</p>
          <h1>All leads</h1>
          <p className="lede">
            Browse, search, and filter every lead captured by this runtime. Click a row to open the
            full lead detail view.
          </p>
          <div className="cta-row">
            <Link href="/dashboard" className="secondary">
              Back to dashboard
            </Link>
            <Link href="/dashboard/scoring" className="secondary">
              Scoring view
            </Link>
            <Link href="/dashboard/radar" className="secondary">
              Hot lead radar
            </Link>
            <button
              type="button"
              onClick={downloadCsv}
              className="secondary"
              disabled={!data || data.leads.length === 0}
              title="Export current view as CSV"
            >
              ↓ Export CSV
            </button>
          </div>
        </div>
        <aside className="hero-rail">
          <p className="eyebrow">Total leads</p>
          <h2>{data?.total ?? "—"}</h2>
          <p className="muted">
            Page {page} of {totalPages} &mdash; {PAGE_SIZE} per page
          </p>
        </aside>
      </section>

      <section className="panel">
        <p className="eyebrow">Search and filter</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <label
            style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: "0.88rem" }}
          >
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
              style={{
                ...selectStyle,
                minWidth: 200,
              }}
            />
          </label>

          <label
            style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: "0.88rem" }}
          >
            Temperature
            <select
              value={temperatureFilter}
              onChange={(e) => {
                setTemperatureFilter(e.target.value as Temperature | "all");
                handleFilterChange();
              }}
              style={selectStyle}
            >
              <option value="all">All</option>
              <option value="burning">Burning</option>
              <option value="hot">Hot</option>
              <option value="warm">Warm</option>
              <option value="cold">Cold</option>
            </select>
          </label>

          <label
            style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: "0.88rem" }}
          >
            Niche
            <select
              value={nicheFilter}
              onChange={(e) => {
                setNicheFilter(e.target.value);
                handleFilterChange();
              }}
              style={selectStyle}
            >
              <option value="all">All niches</option>
              {allNiches.map((niche) => (
                <option key={niche} value={niche}>
                  {niche}
                </option>
              ))}
            </select>
          </label>

          <label
            style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: "0.88rem" }}
          >
            Stage
            <select
              value={stageFilter}
              onChange={(e) => {
                setStageFilter(e.target.value);
                handleFilterChange();
              }}
              style={selectStyle}
            >
              <option value="all">All stages</option>
              {allStages.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </label>

          {data && (
            <span style={{ fontSize: "0.82rem", color: "var(--text-soft)" }}>
              {data.total} {data.total === 1 ? "lead" : "leads"} found
            </span>
          )}
        </div>
      </section>

      <section className="panel" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}
            aria-label="Lead list"
            aria-busy={loading}
          >
            <thead>
              <tr>
                <th scope="col" style={thStyle}>
                  Name
                </th>
                <th scope="col" style={thStyle}>
                  Email
                </th>
                <th
                  scope="col"
                  style={{ ...thStyle, cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}
                  onClick={() => handleSort("score")}
                  aria-sort={
                    sortField === "score"
                      ? sortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  Score {sortField === "score" ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
                </th>
                <th scope="col" style={thStyle}>
                  Temperature
                </th>
                <th scope="col" style={thStyle}>
                  Niche
                </th>
                <th scope="col" style={thStyle}>
                  Stage
                </th>
                <th scope="col" style={thStyle}>
                  Source
                </th>
                <th
                  scope="col"
                  style={{ ...thStyle, cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}
                  onClick={() => handleSort("capturedAt")}
                  aria-sort={
                    sortField === "capturedAt"
                      ? sortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  Captured {sortField === "capturedAt" ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows />
              ) : sortedLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ ...tdStyle, textAlign: "center", padding: "48px 24px" }}>
                    <p
                      style={{
                        fontWeight: 700,
                        marginBottom: 8,
                        fontSize: "1rem",
                        color: "var(--text)",
                      }}
                    >
                      No leads yet.
                    </p>
                    <p style={{ color: "var(--text-soft)", marginBottom: 16 }}>
                      Share your widget to start capturing leads.
                    </p>
                    <Link href="/dashboard/settings" className="secondary">
                      Go to settings
                    </Link>
                  </td>
                </tr>
              ) : (
                sortedLeads.map((lead) => {
                  const badge = TEMP_BADGE[lead.temperature];
                  return (
                    <tr
                      key={lead.leadKey}
                      style={{
                        cursor: "pointer",
                        transition: "background 120ms ease",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.background =
                          "rgba(34, 95, 84, 0.04)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.background = "";
                      }}
                    >
                      <td style={{ ...tdStyle, fontWeight: 600 }}>
                        <Link
                          href={`/dashboard/leads/${encodeURIComponent(lead.leadKey)}`}
                          style={{
                            color: "var(--text)",
                            textDecoration: "none",
                            display: "block",
                          }}
                        >
                          {lead.firstName} {lead.lastName}
                        </Link>
                      </td>
                      <td style={{ ...tdStyle, color: "var(--text-soft)" }}>
                        <Link
                          href={`/dashboard/leads/${encodeURIComponent(lead.leadKey)}`}
                          style={{ color: "inherit", textDecoration: "none" }}
                        >
                          {lead.email ?? <span style={{ opacity: 0.45 }}>—</span>}
                        </Link>
                      </td>
                      <td style={{ ...tdStyle, textAlign: "center", fontWeight: 700 }}>
                        <Link
                          href={`/dashboard/leads/${encodeURIComponent(lead.leadKey)}`}
                          style={{ color: "inherit", textDecoration: "none" }}
                        >
                          {lead.score}
                        </Link>
                      </td>
                      <td style={tdStyle}>
                        <Link
                          href={`/dashboard/leads/${encodeURIComponent(lead.leadKey)}`}
                          style={{ textDecoration: "none" }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "3px 10px",
                              borderRadius: 999,
                              fontSize: "0.76rem",
                              fontWeight: 700,
                              background: badge.bg,
                              color: badge.color,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {badge.label}
                          </span>
                        </Link>
                      </td>
                      <td style={{ ...tdStyle, color: "var(--text-soft)" }}>
                        <Link
                          href={`/dashboard/leads/${encodeURIComponent(lead.leadKey)}`}
                          style={{ color: "inherit", textDecoration: "none" }}
                        >
                          {lead.niche || <span style={{ opacity: 0.45 }}>—</span>}
                        </Link>
                      </td>
                      <td style={{ ...tdStyle, color: "var(--text-soft)" }}>
                        <Link
                          href={`/dashboard/leads/${encodeURIComponent(lead.leadKey)}`}
                          style={{ color: "inherit", textDecoration: "none" }}
                        >
                          {lead.stage || <span style={{ opacity: 0.45 }}>—</span>}
                        </Link>
                      </td>
                      <td style={{ ...tdStyle, color: "var(--text-soft)" }}>
                        <Link
                          href={`/dashboard/leads/${encodeURIComponent(lead.leadKey)}`}
                          style={{ color: "inherit", textDecoration: "none" }}
                        >
                          {lead.source || <span style={{ opacity: 0.45 }}>—</span>}
                        </Link>
                      </td>
                      <td
                        style={{ ...tdStyle, color: "var(--text-soft)", whiteSpace: "nowrap" }}
                      >
                        <Link
                          href={`/dashboard/leads/${encodeURIComponent(lead.leadKey)}`}
                          style={{ color: "inherit", textDecoration: "none" }}
                        >
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
      </section>

      {data && data.total > PAGE_SIZE && (
        <section
          className="panel"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}
        >
          <button
            type="button"
            className="secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            aria-label="Previous page"
          >
            Previous
          </button>
          <span style={{ fontSize: "0.88rem", color: "var(--text-soft)" }}>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            aria-label="Next page"
          >
            Next
          </button>
        </section>
      )}
    </main>
  );
}

const selectStyle: React.CSSProperties = {
  minHeight: 36,
  padding: "6px 12px",
  borderRadius: 14,
  border: "1px solid rgba(20, 33, 29, 0.14)",
  background: "rgba(255, 255, 255, 0.92)",
  color: "var(--text)",
  fontSize: "0.88rem",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 16px",
  borderBottom: "2px solid rgba(20, 33, 29, 0.1)",
  fontWeight: 800,
  fontSize: "0.76rem",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--text-soft)",
  background: "rgba(255, 255, 255, 0.6)",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "11px 16px",
  borderBottom: "1px solid rgba(20, 33, 29, 0.06)",
};

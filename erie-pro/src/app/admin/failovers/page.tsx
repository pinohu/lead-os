// ── Admin — Failover Log ──────────────────────────────────────────
// Platform-wide failover trail. Every lead here reached a secondary
// provider because the primary missed SLA. Useful for:
//   - spotting patterns (is one pro consistently failing over?)
//   - crediting the failover recipient
//   - coaching the primary provider before they get churn risk
//
// 7-day window by default; 30-day toggle via ?days=30.

import Link from "next/link"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

function formatDateTime(d: Date | null | undefined): string {
  if (!d) return "—"
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export default async function AdminFailoversPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>
}) {
  const params = await searchParams
  const days = params.days === "30" ? 30 : 7
  const windowStart = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const [failovers, totalThisWindow, byNiche] = await Promise.all([
    prisma.lead.findMany({
      where: {
        routeType: "failover",
        createdAt: { gte: windowStart },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        routedTo: { select: { id: true, businessName: true, niche: true } },
      },
    }),
    prisma.lead.count({
      where: {
        routeType: "failover",
        createdAt: { gte: windowStart },
      },
    }),
    prisma.lead.groupBy({
      by: ["niche"],
      where: {
        routeType: "failover",
        createdAt: { gte: windowStart },
      },
      _count: { _all: true },
      orderBy: { _count: { niche: "desc" } },
      take: 10,
    }),
  ])

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Failover Log
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Leads that rolled to a secondary provider because the primary
            missed SLA. Last {days} days.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Link
            href="/admin/failovers?days=7"
            className={`rounded-md border px-3 py-1.5 font-medium transition-colors ${
              days === 7
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            7 days
          </Link>
          <Link
            href="/admin/failovers?days=30"
            className={`rounded-md border px-3 py-1.5 font-medium transition-colors ${
              days === 30
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            30 days
          </Link>
        </div>
      </div>

      {/* ── Stats row ──────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Total failovers
          </p>
          <p className="mt-1 text-3xl font-bold text-amber-600 dark:text-amber-400">
            {totalThisWindow}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Top niches by failover
          </p>
          {byNiche.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">None</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {byNiche.map((g) => (
                <span
                  key={g.niche}
                  className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
                >
                  {g.niche} · {g._count._all}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Failover list ──────────────────────────────────────── */}
      <section className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent failover trail
          </h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Most recent 100 events in the window.
          </p>
        </div>

        {failovers.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
            No failovers in the last {days} days — SLA compliance is clean.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-2">When</th>
                  <th className="px-4 py-2">Niche / City</th>
                  <th className="px-4 py-2">Temp</th>
                  <th className="px-4 py-2">Routed to</th>
                  <th className="px-4 py-2">Lead</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {failovers.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                    <td className="whitespace-nowrap px-4 py-2 text-gray-700 dark:text-gray-300">
                      {formatDateTime(f.createdAt)}
                    </td>
                    <td className="px-4 py-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {f.niche}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {" · "}
                        {f.city}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${
                          f.temperature === "burning"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            : f.temperature === "hot"
                            ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
                            : f.temperature === "warm"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                        }`}
                      >
                        {f.temperature}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                      {f.routedTo ? (
                        <Link
                          href={`/admin/providers/${f.routedTo.id}`}
                          className="text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {f.routedTo.businessName}
                        </Link>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">
                          unrouted
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        href={`/admin/leads?q=${encodeURIComponent(f.email)}`}
                        className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {f.firstName ?? "Lead"} {f.lastName ?? ""}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

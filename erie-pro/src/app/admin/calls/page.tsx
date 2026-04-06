import Link from "next/link"
import type { Metadata } from "next"
import { prisma } from "@/lib/db"
import { niches } from "@/lib/niches"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Call Tracking -- Admin",
  description: "Track inbound calls, outcomes, and provider routing.",
  robots: { index: false, follow: false },
}

const PAGE_SIZE = 25

const OUTCOME_COLORS: Record<string, string> = {
  connected: "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300",
  voicemail: "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300",
  missed: "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300",
  busy: "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300",
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

export default async function AdminCallsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; outcome?: string; niche?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1)
  const outcomeFilter = params.outcome || undefined
  const nicheFilter = params.niche || undefined

  // Build where clause
  const where: Record<string, unknown> = {}
  if (outcomeFilter && ["connected", "voicemail", "missed", "busy"].includes(outcomeFilter)) {
    where.outcome = outcomeFilter
  }
  if (nicheFilter) {
    where.niche = nicheFilter
  }

  // Fetch calls, total count, and outcome stats in parallel
  const [calls, totalCount, outcomeStats, allDurations] = await Promise.all([
    prisma.trackedCall.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        provider: {
          select: { id: true, businessName: true },
        },
      },
    }),
    prisma.trackedCall.count({ where }),
    prisma.trackedCall.groupBy({
      by: ["outcome"],
      _count: { id: true },
    }),
    prisma.trackedCall.aggregate({
      _avg: { duration: true },
      _count: { id: true },
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  // Parse outcome stats
  const outcomeCounts: Record<string, number> = {}
  for (const stat of outcomeStats) {
    outcomeCounts[stat.outcome] = stat._count.id
  }
  const totalCalls = allDurations._count.id
  const avgDuration = Math.round(allDurations._avg.duration ?? 0)

  // Build query string helper
  function buildQuery(overrides: Record<string, string | undefined>) {
    const base: Record<string, string> = {}
    if (outcomeFilter) base.outcome = outcomeFilter
    if (nicheFilter) base.niche = nicheFilter
    base.page = String(page)
    for (const [k, v] of Object.entries(overrides)) {
      if (v === undefined || v === "") delete base[k]
      else base[k] = v
    }
    const qs = new URLSearchParams(base).toString()
    return qs ? `?${qs}` : ""
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Call Tracking
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-600">
          Inbound call log with routing and outcome tracking
        </p>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-600">
            Total Calls
          </p>
          <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
            {totalCalls.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-600">
            Connected
          </p>
          <p className="mt-1 text-3xl font-bold text-green-600 dark:text-green-400">
            {(outcomeCounts.connected ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-600">
            Voicemail
          </p>
          <p className="mt-1 text-3xl font-bold text-blue-600 dark:text-blue-400">
            {(outcomeCounts.voicemail ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-600">
            Missed
          </p>
          <p className="mt-1 text-3xl font-bold text-red-600 dark:text-red-400">
            {(outcomeCounts.missed ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-600">
            Avg Duration
          </p>
          <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
            {formatDuration(avgDuration)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {/* Outcome filter */}
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-1">
          <span className="px-2 text-xs text-gray-500 dark:text-gray-600">Outcome:</span>
          <Link
            href={`/admin/calls${buildQuery({ outcome: undefined, page: "1" })}`}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              !outcomeFilter
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "text-gray-600 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            All
          </Link>
          {(["connected", "voicemail", "missed", "busy"] as const).map((o) => (
            <Link
              key={o}
              href={`/admin/calls${buildQuery({ outcome: o, page: "1" })}`}
              className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                outcomeFilter === o
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : "text-gray-600 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {o}
            </Link>
          ))}
        </div>

        {/* Niche filter */}
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-1">
          <span className="px-2 text-xs text-gray-500 dark:text-gray-600">Niche:</span>
          <Link
            href={`/admin/calls${buildQuery({ niche: undefined, page: "1" })}`}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              !nicheFilter
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "text-gray-600 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            All
          </Link>
          {niches.slice(0, 8).map((n) => (
            <Link
              key={n.slug}
              href={`/admin/calls${buildQuery({ niche: n.slug, page: "1" })}`}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                nicheFilter === n.slug
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : "text-gray-600 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              title={n.label}
            >
              {n.icon}
            </Link>
          ))}
          {niches.length > 8 && (
            <span className="px-2 text-xs text-gray-600 dark:text-gray-500">
              +{niches.length - 8}
            </span>
          )}
        </div>
      </div>

      {/* Call Log Table */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        {calls.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-500 dark:text-gray-600">
            No calls match the current filters.
          </p>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="min-w-[640px] w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-600">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-600">
                    Niche
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-600">
                    Caller Phone
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-600">
                    Tracking #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-600">
                    Routed To
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-600">
                    Provider
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-600">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-600">
                    Outcome
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-600">
                    Recording
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {calls.map((call) => {
                  const nicheData = niches.find((n) => n.slug === call.niche)
                  return (
                    <tr key={call.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300">
                        {call.createdAt.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-gray-700 dark:text-gray-300">
                          {nicheData?.icon} {nicheData?.label ?? call.niche}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-gray-700 dark:text-gray-300">
                        {call.callerPhone}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-gray-500 dark:text-gray-600">
                        {call.trackingNumber}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-gray-700 dark:text-gray-300">
                        {call.routedTo}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {call.provider ? (
                          <Link
                            href={`/admin/providers/${call.provider.id}`}
                            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                          >
                            {call.provider.businessName}
                          </Link>
                        ) : (
                          <span className="text-gray-600 dark:text-gray-500">--</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right font-mono text-gray-900 dark:text-white">
                        {formatDuration(call.duration)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                            OUTCOME_COLORS[call.outcome] ?? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-600"
                          }`}
                        >
                          {call.outcome}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {call.recordingUrl ? (
                          <a
                            href={call.recordingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Listen
                          </a>
                        ) : (
                          <span className="text-xs text-gray-600 dark:text-gray-500">--</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 px-4 py-3">
            <p className="text-xs text-gray-500 dark:text-gray-600">
              Showing {(page - 1) * PAGE_SIZE + 1}--
              {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount.toLocaleString()}
            </p>
            <div className="flex items-center gap-1">
              {page > 1 && (
                <Link
                  href={`/admin/calls${buildQuery({ page: String(page - 1) })}`}
                  className="rounded-md border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Previous
                </Link>
              )}
              <span className="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-600">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/admin/calls${buildQuery({ page: String(page + 1) })}`}
                  className="rounded-md border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

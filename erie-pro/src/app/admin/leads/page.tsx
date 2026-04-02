import { prisma } from "@/lib/db"
import { niches } from "@/lib/niches"
import Link from "next/link"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Lead Management -- Admin",
  description: "View, filter, and manage all leads across the platform.",
  robots: { index: false, follow: false },
}

const PAGE_SIZE = 25

const TEMP_COLORS: Record<string, string> = {
  cold: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  warm: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  hot: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  burning: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

const ROUTE_COLORS: Record<string, string> = {
  primary: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  failover: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  overflow: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  unmatched: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    niche?: string
    route?: string
    temp?: string
    q?: string
  }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1)
  const nicheFilter = params.niche || undefined
  const routeFilter = params.route || undefined
  const tempFilter = params.temp || undefined
  const searchQuery = params.q || undefined

  // Build Prisma where clause
  const where: Record<string, unknown> = {}

  if (nicheFilter) {
    where.niche = nicheFilter
  }

  if (routeFilter && ["primary", "failover", "overflow", "unmatched"].includes(routeFilter)) {
    where.routeType = routeFilter
  }

  if (tempFilter && ["cold", "warm", "hot", "burning"].includes(tempFilter)) {
    where.temperature = tempFilter
  }

  if (searchQuery) {
    where.OR = [
      { firstName: { contains: searchQuery, mode: "insensitive" } },
      { lastName: { contains: searchQuery, mode: "insensitive" } },
      { email: { contains: searchQuery, mode: "insensitive" } },
      { phone: { contains: searchQuery, mode: "insensitive" } },
    ]
  }

  // Fetch leads and counts in parallel
  const [leads, totalCount, matchedCount, unmatchedCount, todayCount] =
    await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          routedTo: { select: { businessName: true } },
        },
      }),
      prisma.lead.count({ where }),
      prisma.lead.count({
        where: { ...where, routeType: { not: "unmatched" } },
      }),
      prisma.lead.count({
        where: { ...where, routeType: "unmatched" },
      }),
      prisma.lead.count({
        where: {
          ...where,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ])

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  // Build URL helper for filters/pagination
  function buildUrl(overrides: Record<string, string | undefined>) {
    const merged: Record<string, string> = {}
    if (params.niche) merged.niche = params.niche
    if (params.route) merged.route = params.route
    if (params.temp) merged.temp = params.temp
    if (params.q) merged.q = params.q
    if (params.page) merged.page = params.page

    for (const [key, val] of Object.entries(overrides)) {
      if (val === undefined || val === "") {
        delete merged[key]
      } else {
        merged[key] = val
      }
    }

    // Reset to page 1 when filters change (unless page itself is being set)
    if (!("page" in overrides)) {
      delete merged.page
    }

    const qs = new URLSearchParams(merged).toString()
    return `/admin/leads${qs ? `?${qs}` : ""}`
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Lead Management
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            All leads across the platform with routing and temperature data
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Back to Dashboard
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Total Leads
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {totalCount.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Matched
          </p>
          <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
            {matchedCount.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Unmatched
          </p>
          <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">
            {unmatchedCount.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Leads Today
          </p>
          <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
            {todayCount.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <label
            htmlFor="search"
            className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400"
          >
            Search
          </label>
          <form method="get" action="/admin/leads">
            {nicheFilter && (
              <input type="hidden" name="niche" value={nicheFilter} />
            )}
            {routeFilter && (
              <input type="hidden" name="route" value={routeFilter} />
            )}
            {tempFilter && (
              <input type="hidden" name="temp" value={tempFilter} />
            )}
            <div className="flex gap-2">
              <input
                type="text"
                id="search"
                name="q"
                placeholder="Name, email, or phone..."
                defaultValue={searchQuery ?? ""}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
              />
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Niche Filter */}
        <div className="min-w-[160px]">
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
            Niche
          </label>
          <div className="flex flex-wrap gap-1">
            <Link
              href={buildUrl({ niche: undefined })}
              className={`rounded-md px-3 py-2 text-xs font-medium ${
                !nicheFilter
                  ? "bg-blue-600 text-white"
                  : "border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              All Niches
            </Link>
            {nicheFilter && (
              <span className="flex items-center rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white">
                {niches.find((n) => n.slug === nicheFilter)?.icon}{" "}
                {niches.find((n) => n.slug === nicheFilter)?.label ??
                  nicheFilter}
              </span>
            )}
          </div>
          {!nicheFilter && (
            <div className="mt-2 flex max-h-32 flex-wrap gap-1 overflow-y-auto">
              {niches.map((n) => (
                <Link
                  key={n.slug}
                  href={buildUrl({ niche: n.slug })}
                  className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  {n.icon} {n.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Route Type Filter */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
            Route Type
          </label>
          <div className="flex gap-1">
            <Link
              href={buildUrl({ route: undefined })}
              className={`rounded-md px-3 py-2 text-xs font-medium ${
                !routeFilter
                  ? "bg-blue-600 text-white"
                  : "border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              All
            </Link>
            {(["primary", "failover", "overflow", "unmatched"] as const).map(
              (rt) => (
                <Link
                  key={rt}
                  href={buildUrl({ route: rt })}
                  className={`rounded-md px-3 py-2 text-xs font-medium capitalize ${
                    routeFilter === rt
                      ? "bg-blue-600 text-white"
                      : "border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                >
                  {rt}
                </Link>
              )
            )}
          </div>
        </div>

        {/* Temperature Filter */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
            Temperature
          </label>
          <div className="flex gap-1">
            <Link
              href={buildUrl({ temp: undefined })}
              className={`rounded-md px-3 py-2 text-xs font-medium ${
                !tempFilter
                  ? "bg-blue-600 text-white"
                  : "border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              All
            </Link>
            {(["cold", "warm", "hot", "burning"] as const).map((t) => (
              <Link
                key={t}
                href={buildUrl({ temp: t })}
                className={`rounded-md px-3 py-2 text-xs font-medium capitalize ${
                  tempFilter === t
                    ? "bg-blue-600 text-white"
                    : "border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
              >
                {t}
              </Link>
            ))}
          </div>
        </div>

        {/* Clear Filters */}
        {(nicheFilter || routeFilter || tempFilter || searchQuery) && (
          <Link
            href="/admin/leads"
            className="rounded-md border border-red-300 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            Clear All
          </Link>
        )}
      </div>

      {/* Leads Table */}
      <div className="overflow-x-auto -mx-4 sm:mx-0 rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        {leads.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
            No leads found matching the current filters.
          </div>
        ) : (
          <table className="min-w-[640px] w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Date
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Niche
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Customer
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Email
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Phone
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Message
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Temp
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Routed To
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Route Type
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {leads.map((lead) => {
                const name =
                  `${lead.firstName ?? ""} ${lead.lastName ?? ""}`.trim() ||
                  "Unknown"
                const nicheData = niches.find((n) => n.slug === lead.niche)

                return (
                  <tr
                    key={lead.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        className="hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        {lead.createdAt.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                        <br />
                        <span className="text-gray-400 dark:text-gray-500">
                          {lead.createdAt.toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2 py-0.5 text-xs font-medium capitalize dark:border-gray-700">
                        {nicheData?.icon}{" "}
                        {nicheData?.label ?? lead.niche}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900 dark:text-white">
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        className="hover:text-blue-600 hover:underline dark:hover:text-blue-400"
                      >
                        {name}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-300">
                      <a
                        href={`mailto:${lead.email}`}
                        className="hover:text-blue-600 hover:underline dark:hover:text-blue-400"
                      >
                        {lead.email}
                      </a>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-300">
                      {lead.phone ? (
                        <a
                          href={`tel:${lead.phone}`}
                          className="hover:text-blue-600 hover:underline dark:hover:text-blue-400"
                        >
                          {lead.phone}
                        </a>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">
                          --
                        </span>
                      )}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-gray-600 dark:text-gray-400">
                      {lead.message
                        ? lead.message.length > 60
                          ? `${lead.message.substring(0, 60)}...`
                          : lead.message
                        : "--"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                          TEMP_COLORS[lead.temperature] ?? ""
                        }`}
                      >
                        {lead.temperature}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      {lead.routedTo?.businessName ?? (
                        <span className="font-medium text-red-600 dark:text-red-400">
                          Unmatched
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                          ROUTE_COLORS[lead.routeType] ?? ""
                        }`}
                      >
                        {lead.routeType}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {(page - 1) * PAGE_SIZE + 1}--
            {Math.min(page * PAGE_SIZE, totalCount)} of{" "}
            {totalCount.toLocaleString()} leads
          </p>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={buildUrl({ page: String(page - 1) })}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Previous
              </Link>
            ) : (
              <span className="cursor-not-allowed rounded-md border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-400 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-600">
                Previous
              </span>
            )}
            <span className="flex items-center px-3 text-sm text-gray-500 dark:text-gray-400">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={buildUrl({ page: String(page + 1) })}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Next
              </Link>
            ) : (
              <span className="cursor-not-allowed rounded-md border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-400 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-600">
                Next
              </span>
            )}
          </div>
        </div>
      )}
    </main>
  )
}

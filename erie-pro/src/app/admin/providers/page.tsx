import { prisma } from "@/lib/db"
import { niches, getNicheBySlug } from "@/lib/niches"
import Link from "next/link"
import {
  Users,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Star,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Provider Management -- Admin",
  robots: "noindex, nofollow",
}

interface PageProps {
  searchParams: Promise<{
    status?: string
    niche?: string
    q?: string
    page?: string
  }>
}

const PAGE_SIZE = 25

export default async function ProvidersListPage({ searchParams }: PageProps) {
  const params = await searchParams
  const statusFilter = params.status || ""
  const nicheFilter = params.niche || ""
  const searchQuery = params.q || ""
  const currentPage = Math.max(1, parseInt(params.page || "1", 10))

  // Build where clause
  const where: Record<string, unknown> = {}
  if (statusFilter) {
    if (statusFilter === "past_due") {
      where.subscriptionStatus = "expired"
    } else {
      where.subscriptionStatus = statusFilter
    }
  }
  if (nicheFilter) {
    where.niche = nicheFilter
  }
  if (searchQuery) {
    where.OR = [
      { businessName: { contains: searchQuery, mode: "insensitive" } },
      { email: { contains: searchQuery, mode: "insensitive" } },
    ]
  }

  // Parallel queries
  const [providers, totalCount, allProviders] = await Promise.all([
    prisma.provider.findMany({
      where,
      include: { territories: true },
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.provider.count({ where }),
    // Summary stats across all providers (no filter)
    prisma.provider.findMany({
      select: {
        subscriptionStatus: true,
        monthlyFee: true,
      },
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  // Summary metrics
  const totalProviders = allProviders.length
  const activeCount = allProviders.filter(
    (p) => p.subscriptionStatus === "active"
  ).length
  const trialCount = allProviders.filter(
    (p) => p.subscriptionStatus === "trial"
  ).length
  const atRiskCount = allProviders.filter(
    (p) =>
      p.subscriptionStatus === "expired" ||
      p.subscriptionStatus === "cancelled"
  ).length
  const totalMRR = allProviders
    .filter(
      (p) =>
        p.subscriptionStatus === "active" || p.subscriptionStatus === "trial"
    )
    .reduce((sum, p) => sum + p.monthlyFee, 0)

  // Build query string helper
  function buildQuery(overrides: Record<string, string>) {
    const base: Record<string, string> = {}
    if (statusFilter) base.status = statusFilter
    if (nicheFilter) base.niche = nicheFilter
    if (searchQuery) base.q = searchQuery
    const merged = { ...base, ...overrides }
    // Remove empty values
    Object.keys(merged).forEach((k) => {
      if (!merged[k]) delete merged[k]
    })
    const qs = new URLSearchParams(merged).toString()
    return qs ? `?${qs}` : ""
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Provider Management
          </h1>
          <p className="text-sm text-muted-foreground">
            {totalCount} provider{totalCount !== 1 ? "s" : ""} found
          </p>
        </div>
      </div>

      {/* ── Summary Cards ──────────────────────────────────── */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Providers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalProviders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Trial</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{trialCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Past Due / At Risk
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{atRiskCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              ${totalMRR.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Filters ────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center">
        <form
          method="GET"
          className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center"
        >
          {/* Preserve existing filters */}
          {statusFilter && (
            <input type="hidden" name="status" value={statusFilter} />
          )}
          {nicheFilter && (
            <input type="hidden" name="niche" value={nicheFilter} />
          )}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              name="q"
              defaultValue={searchQuery}
              placeholder="Search by name or email..."
              className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/providers${buildQuery({ status: "", page: "" })}`}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              !statusFilter
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            All
          </Link>
          {["active", "trial", "expired", "cancelled"].map((s) => (
            <Link
              key={s}
              href={`/admin/providers${buildQuery({
                status: s,
                page: "",
              })}`}
              className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {s === "expired" ? "Past Due" : s}
            </Link>
          ))}
        </div>

        <div>
          <select
            onChange={() => {}}
            defaultValue={nicheFilter}
            className="rounded-md border bg-background px-3 py-1.5 text-xs"
          >
            <option value="">All Niches</option>
            {niches.map((n) => (
              <option key={n.slug} value={n.slug}>
                {n.icon} {n.label}
              </option>
            ))}
          </select>
          {/* Niche filter requires JS; for SSR use links */}
          {nicheFilter && (
            <Link
              href={`/admin/providers${buildQuery({ niche: "", page: "" })}`}
              className="ml-2 text-xs text-muted-foreground underline"
            >
              Clear niche
            </Link>
          )}
        </div>
      </div>

      {/* ── Provider Table ─────────────────────────────────── */}
      <div className="rounded-lg border bg-card overflow-x-auto -mx-4 sm:mx-0">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow>
              <TableHead>Business Name</TableHead>
              <TableHead>Niche</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>MRR</TableHead>
              <TableHead>Total Leads</TableHead>
              <TableHead>Conv. Rate</TableHead>
              <TableHead>Avg Response</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Email Verified</TableHead>
              <TableHead>Last Lead</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {providers.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={11}
                  className="py-8 text-center text-muted-foreground"
                >
                  No providers found matching your filters.
                </TableCell>
              </TableRow>
            )}
            {providers.map((provider) => {
              const niche = getNicheBySlug(provider.niche)
              const convRate =
                provider.totalLeads > 0
                  ? Math.round(
                      (provider.convertedLeads / provider.totalLeads) * 100
                    )
                  : 0
              const avgMin =
                provider.avgResponseTime > 0
                  ? Math.round(provider.avgResponseTime / 60)
                  : null

              const isPastDue =
                provider.subscriptionStatus === "expired" ||
                provider.subscriptionStatus === "cancelled"
              const isTrial = provider.subscriptionStatus === "trial"

              return (
                <TableRow
                  key={provider.id}
                  className={
                    isPastDue
                      ? "bg-red-50/60 dark:bg-red-950/20"
                      : isTrial
                      ? "bg-yellow-50/60 dark:bg-yellow-950/20"
                      : ""
                  }
                >
                  <TableCell>
                    <Link
                      href={`/admin/providers/${provider.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {provider.businessName}
                    </Link>
                    {provider.territories.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {provider.territories.length} territor
                        {provider.territories.length === 1 ? "y" : "ies"}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="whitespace-nowrap text-sm">
                      {niche?.icon ?? ""} {niche?.label ?? provider.niche}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize text-xs">
                      {provider.tier}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      ${provider.monthlyFee.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>{provider.totalLeads}</TableCell>
                  <TableCell>{convRate}%</TableCell>
                  <TableCell>
                    {avgMin !== null ? `${avgMin}m` : "N/A"}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {provider.avgRating > 0
                        ? provider.avgRating.toFixed(1)
                        : "N/A"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        provider.subscriptionStatus === "active"
                          ? "default"
                          : provider.subscriptionStatus === "trial"
                          ? "secondary"
                          : "destructive"
                      }
                      className="capitalize text-xs"
                    >
                      {provider.subscriptionStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {provider.emailVerified ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {provider.lastLeadAt
                      ? new Date(provider.lastLeadAt).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" }
                        )
                      : "Never"}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* ── Pagination ─────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Link
                href={`/admin/providers${buildQuery({
                  page: String(currentPage - 1),
                })}`}
                className="rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Previous
              </Link>
            )}
            {currentPage < totalPages && (
              <Link
                href={`/admin/providers${buildQuery({
                  page: String(currentPage + 1),
                })}`}
                className="rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Admin Disputes Management ────────────────────────────────────────
// Review and resolve lead disputes filed by providers.
// Displays summary cards, filterable table, and action buttons.

import type { Metadata } from "next"
import Link from "next/link"
import { prisma } from "@/lib/db"
import { cityConfig } from "@/lib/city-config"
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
import { Button } from "@/components/ui/button"
import { DisputeActions } from "./dispute-actions"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: `Disputes | Admin | ${cityConfig.domain}`,
  description: "Review and resolve lead disputes filed by providers.",
  robots: { index: false, follow: false },
}

const REASON_LABELS: Record<string, string> = {
  wrong_number: "Wrong Number",
  spam: "Spam / Fake",
  out_of_area: "Out of Area",
  duplicate: "Duplicate Lead",
  other: "Other",
}

const STATUS_STYLES: Record<string, string> = {
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  approved:
    "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  denied: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
}

const PER_PAGE = 25

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>
}

export default async function AdminDisputesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const statusFilter = params.status
  const currentPage = Math.max(1, parseInt(params.page ?? "1", 10) || 1)

  // Build the where clause
  const where =
    statusFilter && ["pending", "approved", "denied"].includes(statusFilter)
      ? { status: statusFilter as "pending" | "approved" | "denied" }
      : {}

  // Fetch counts for summary cards
  const [totalCount, pendingCount, approvedCount, deniedCount] =
    await Promise.all([
      prisma.leadDispute.count(),
      prisma.leadDispute.count({ where: { status: "pending" } }),
      prisma.leadDispute.count({ where: { status: "approved" } }),
      prisma.leadDispute.count({ where: { status: "denied" } }),
    ])

  // Filtered count for pagination
  const filteredCount = await prisma.leadDispute.count({ where })
  const totalPages = Math.max(1, Math.ceil(filteredCount / PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)

  // Fetch disputes with relations, sorted pending-first then by createdAt desc
  const disputes = await prisma.leadDispute.findMany({
    where,
    include: {
      lead: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          niche: true,
          message: true,
        },
      },
      provider: {
        select: {
          businessName: true,
          email: true,
        },
      },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    // "asc" on the enum puts pending first (alphabetical: approved, denied, pending)
    // We'll re-sort in JS below for exact pending-first ordering
    take: PER_PAGE,
    skip: (safePage - 1) * PER_PAGE,
  })

  // Re-sort: pending first, then by createdAt desc within each group
  const sorted = disputes.sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1
    if (a.status !== "pending" && b.status === "pending") return 1
    return b.createdAt.getTime() - a.createdAt.getTime()
  })

  // Check for overdue disputes (> 48 hours old and still pending)
  const now = new Date()
  const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000
  const overdueDisputes = sorted.filter(
    (d) =>
      d.status === "pending" &&
      now.getTime() - d.createdAt.getTime() > FORTY_EIGHT_HOURS
  )
  // Also check globally for any overdue pending disputes (even if on another page)
  const globalOverdueCount =
    pendingCount > 0
      ? await prisma.leadDispute.count({
          where: {
            status: "pending",
            createdAt: { lt: new Date(now.getTime() - FORTY_EIGHT_HOURS) },
          },
        })
      : 0

  function daysSince(date: Date): number {
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  }

  function buildFilterUrl(status?: string, page?: number): string {
    const parts: string[] = []
    if (status) parts.push(`status=${status}`)
    if (page && page > 1) parts.push(`page=${page}`)
    return parts.length > 0 ? `?${parts.join("&")}` : ""
  }

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Dispute Management
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-600">
          Review and resolve lead disputes filed by providers. Platform SLA: 48-hour resolution.
        </p>
      </div>

      {/* ── Overdue Warning Banner ──────────────────────────── */}
      {globalOverdueCount > 0 && (
        <div className="rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/50 p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl" aria-hidden="true">
              !!
            </span>
            <div>
              <p className="font-semibold text-red-800 dark:text-red-300">
                {globalOverdueCount} dispute{globalOverdueCount > 1 ? "s" : ""} overdue
              </p>
              <p className="text-sm text-red-700 dark:text-red-400">
                These disputes have been pending for more than 48 hours, exceeding the platform&apos;s
                promised review window. Resolve them immediately to maintain provider trust.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Summary Cards ───────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-600">
              Total Disputes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {totalCount}
            </p>
          </CardContent>
        </Card>

        <Card
          className={
            pendingCount > 0
              ? "border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20"
              : ""
          }
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-600">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-3xl font-bold ${
                pendingCount > 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-gray-900 dark:text-white"
              }`}
            >
              {pendingCount}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-600">
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {approvedCount}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-600">
              Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {deniedCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Status Filters ──────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-600 mr-1">
          Filter:
        </span>
        {[
          { label: "All", value: undefined, count: totalCount },
          { label: "Pending", value: "pending", count: pendingCount },
          { label: "Approved", value: "approved", count: approvedCount },
          { label: "Denied", value: "denied", count: deniedCount },
        ].map((filter) => {
          const isActive = statusFilter === filter.value || (!statusFilter && !filter.value)
          return (
            <Link
              key={filter.label}
              href={`/admin/disputes${buildFilterUrl(filter.value)}`}
            >
              <Button
                variant={isActive ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs"
              >
                {filter.label}
                <span className="ml-1.5 opacity-70">({filter.count})</span>
              </Button>
            </Link>
          )
        })}
      </div>

      {/* ── Disputes Table ──────────────────────────────────── */}
      <Card>
        <CardContent className="p-0">
          {sorted.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-600">
                {statusFilter
                  ? `No ${statusFilter} disputes found.`
                  : "No disputes have been filed yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <Table className="min-w-[640px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Filed Date</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Lead Name</TableHead>
                    <TableHead>Lead Contact</TableHead>
                    <TableHead>Niche</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="min-w-[160px]">Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Age</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((dispute) => {
                    const leadName =
                      `${dispute.lead.firstName ?? ""} ${dispute.lead.lastName ?? ""}`.trim() ||
                      "Unknown"
                    const age = daysSince(dispute.createdAt)
                    const isOverdue =
                      dispute.status === "pending" &&
                      now.getTime() - dispute.createdAt.getTime() > FORTY_EIGHT_HOURS

                    return (
                      <TableRow
                        key={dispute.id}
                        className={
                          isOverdue
                            ? "bg-red-50/50 dark:bg-red-950/20"
                            : ""
                        }
                      >
                        <TableCell className="whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {dispute.createdAt.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                          <br />
                          <span className="text-xs text-gray-600 dark:text-gray-500">
                            {dispute.createdAt.toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                        </TableCell>

                        <TableCell>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {dispute.provider.businessName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-600">
                              {dispute.provider.email}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell className="text-sm font-medium text-gray-900 dark:text-white">
                          {leadName}
                        </TableCell>

                        <TableCell>
                          <div>
                            <p className="text-xs">
                              <a
                                href={`mailto:${dispute.lead.email}`}
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {dispute.lead.email}
                              </a>
                            </p>
                            {dispute.lead.phone && (
                              <p className="text-xs text-gray-500 dark:text-gray-600">
                                <a href={`tel:${dispute.lead.phone}`}>
                                  {dispute.lead.phone}
                                </a>
                              </p>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className="capitalize text-xs">
                            {dispute.lead.niche}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-sm text-gray-700 dark:text-gray-300">
                          {REASON_LABELS[dispute.reason] ?? dispute.reason}
                        </TableCell>

                        <TableCell className="max-w-[200px]">
                          {dispute.description ? (
                            <p
                              className="text-xs text-gray-600 dark:text-gray-600 truncate"
                              title={dispute.description}
                            >
                              {dispute.description}
                            </p>
                          ) : (
                            <span className="text-xs text-gray-600 dark:text-gray-500 italic">
                              No description
                            </span>
                          )}
                        </TableCell>

                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
                              STATUS_STYLES[dispute.status] ?? ""
                            }`}
                          >
                            {dispute.status}
                          </span>
                        </TableCell>

                        <TableCell className="text-right">
                          <span
                            className={`text-sm font-mono ${
                              isOverdue
                                ? "font-bold text-red-600 dark:text-red-400"
                                : "text-gray-600 dark:text-gray-600"
                            }`}
                          >
                            {age}d
                          </span>
                        </TableCell>

                        <TableCell className="text-right">
                          {dispute.status === "pending" ? (
                            <DisputeActions
                              disputeId={dispute.id}
                              providerName={dispute.provider.businessName}
                              leadName={leadName}
                            />
                          ) : (
                            <span className="text-xs text-gray-600 dark:text-gray-500">
                              {dispute.resolvedAt
                                ? `Resolved ${dispute.resolvedAt.toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })}`
                                : "Resolved"}
                              {dispute.creditAmount != null && dispute.creditAmount > 0 && (
                                <>
                                  <br />
                                  <span className="text-green-600 dark:text-green-400 font-medium">
                                    ${dispute.creditAmount.toFixed(2)} credit
                                  </span>
                                </>
                              )}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Pagination ──────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-600">
            Showing {(safePage - 1) * PER_PAGE + 1}--
            {Math.min(safePage * PER_PAGE, filteredCount)} of {filteredCount} disputes
          </p>
          <div className="flex items-center gap-2">
            {safePage > 1 && (
              <Link
                href={`/admin/disputes${buildFilterUrl(statusFilter, safePage - 1)}`}
              >
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  Previous
                </Button>
              </Link>
            )}

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === totalPages ||
                  Math.abs(p - safePage) <= 2
              )
              .reduce<(number | "ellipsis")[]>((acc, p, i, arr) => {
                if (i > 0 && arr[i - 1] !== undefined && p - (arr[i - 1] as number) > 1) {
                  acc.push("ellipsis")
                }
                acc.push(p)
                return acc
              }, [])
              .map((item, idx) =>
                item === "ellipsis" ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-1 text-gray-600 dark:text-gray-500"
                  >
                    ...
                  </span>
                ) : (
                  <Link
                    key={item}
                    href={`/admin/disputes${buildFilterUrl(statusFilter, item as number)}`}
                  >
                    <Button
                      variant={item === safePage ? "default" : "outline"}
                      size="sm"
                      className="h-8 w-8 p-0 text-xs"
                    >
                      {item}
                    </Button>
                  </Link>
                )
              )}

            {safePage < totalPages && (
              <Link
                href={`/admin/disputes${buildFilterUrl(statusFilter, safePage + 1)}`}
              >
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  Next
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

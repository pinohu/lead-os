import type { Metadata } from "next"
import Link from "next/link"
import {
  Mail,
  Inbox,
  Eye,
  CheckCircle2,
  MessageSquare,
  Phone,
  User,
  Tag,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { prisma } from "@/lib/db"
import { cityConfig } from "@/lib/city-config"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { MessageActions } from "./message-actions"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: `Contact Messages -- ${cityConfig.domain}`,
  description: "Admin inbox for contact form submissions.",
  robots: { index: false, follow: false },
}

const PAGE_SIZE = 25

const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Unread", value: "unread" },
  { label: "Read", value: "read" },
  { label: "Replied", value: "replied" },
] as const

function getStatusBadgeClasses(status: string): string {
  switch (status) {
    case "unread":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    case "read":
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    case "replied":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
  }
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffSec < 60) return "just now"
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>
}

export default async function AdminMessagesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const statusFilter = params.status ?? ""
  const currentPage = Math.max(1, parseInt(params.page ?? "1", 10))

  // ── Build where clause ─────────────────────────────────────────
  const where = statusFilter
    ? { status: statusFilter }
    : {}

  // ── Fetch counts for summary ───────────────────────────────────
  const [totalCount, unreadCount, readCount, repliedCount] = await Promise.all([
    prisma.contactMessage.count(),
    prisma.contactMessage.count({ where: { status: "unread" } }),
    prisma.contactMessage.count({ where: { status: "read" } }),
    prisma.contactMessage.count({ where: { status: "replied" } }),
  ])

  // ── Fetch filtered + paginated messages ────────────────────────
  const filteredCount = statusFilter
    ? { unread: unreadCount, read: readCount, replied: repliedCount }[statusFilter] ?? 0
    : totalCount

  const totalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)

  const messages = await prisma.contactMessage.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (safePage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  })

  // ── Helpers for pagination URLs ────────────────────────────────
  function buildUrl(page: number, status: string) {
    const params = new URLSearchParams()
    if (status) params.set("status", status)
    if (page > 1) params.set("page", String(page))
    const qs = params.toString()
    return `/admin/messages${qs ? `?${qs}` : ""}`
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="mr-1">
              <Link href="/admin">
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Contact Messages
            </h1>
          </div>
          <p className="mt-1 pl-10 text-sm text-muted-foreground">
            Inbox for contact form submissions
          </p>
        </div>
      </div>

      {/* ── Summary Cards ───────────────────────────────────── */}
      <div className="mb-6 grid gap-3 grid-cols-2 sm:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Unread
            </CardTitle>
            <Inbox className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {unreadCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Read
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{readCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Replied
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {repliedCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Status Filter Tabs ──────────────────────────────── */}
      <div className="mb-6 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => {
          const isActive = statusFilter === f.value
          return (
            <Button
              key={f.value}
              asChild
              variant={isActive ? "default" : "outline"}
              size="sm"
            >
              <Link href={buildUrl(1, f.value)}>{f.label}</Link>
            </Button>
          )
        })}
      </div>

      <Separator className="mb-6" />

      {/* ── Message Cards ───────────────────────────────────── */}
      {messages.length === 0 ? (
        <div className="py-16 text-center">
          <Mail className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">
            {statusFilter
              ? `No ${statusFilter} messages found.`
              : "No messages yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <Card
              key={msg.id}
              className={`transition-colors ${
                msg.status === "unread"
                  ? "border-l-4 border-l-blue-500 dark:border-l-blue-400"
                  : ""
              }`}
            >
              <CardContent className="pt-5 pb-4">
                {/* Top row: sender info + status + timestamp */}
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-semibold">
                        {msg.name ?? "Anonymous"}
                      </span>
                    </div>

                    <a
                      href={`mailto:${msg.email}`}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      {msg.email}
                    </a>

                    {msg.phone && (
                      <a
                        href={`tel:${msg.phone}`}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        {msg.phone}
                      </a>
                    )}

                    {msg.niche && (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Tag className="h-3.5 w-3.5" />
                        <span className="capitalize">{msg.niche}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${getStatusBadgeClasses(
                        msg.status
                      )}`}
                    >
                      {msg.status}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatRelativeTime(msg.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Message body */}
                {msg.message && (
                  <p className="mt-3 text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                    {msg.message}
                  </p>
                )}

                {/* Action buttons */}
                <MessageActions
                  messageId={msg.id}
                  status={msg.status}
                  email={msg.email}
                  name={msg.name}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Pagination ──────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {safePage} of {totalPages} ({filteredCount} message
            {filteredCount === 1 ? "" : "s"})
          </p>
          <div className="flex gap-2">
            {safePage > 1 && (
              <Button asChild variant="outline" size="sm">
                <Link href={buildUrl(safePage - 1, statusFilter)}>
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Link>
              </Button>
            )}
            {safePage < totalPages && (
              <Button asChild variant="outline" size="sm">
                <Link href={buildUrl(safePage + 1, statusFilter)}>
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </main>
  )
}

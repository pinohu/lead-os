// ── Admin Dashboard — Command Center ────────────────────────────────
// Overview hub: KPI cards, alert banners, recent activity, quick links.
// Detailed views live on their own pages (linked from sidebar).

import Link from "next/link"
import type { Metadata } from "next"
import {
  Users,
  TrendingUp,
  MapPin,
  Star,
  Activity,
  DollarSign,
  ChevronRight,
  AlertCircle,
  AlertTriangle,
  MessageSquare,
  Inbox,
} from "lucide-react"
import { getAllProviders, getProviderStats } from "@/lib/provider-store"
import { getDirectoryListingCount } from "@/lib/directory-store"
import { prisma } from "@/lib/db"
import { cityConfig } from "@/lib/city-config"
import { niches } from "@/lib/niches"
import {
  Card,
  CardContent,
  CardDescription,
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

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: `Admin Dashboard -- ${cityConfig.domain}`,
  robots: { index: false, follow: false },
}

function getStatusColor(status: string) {
  switch (status) {
    case "converted":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    case "responded":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    case "pending":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    case "unmatched":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    case "no_response":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
  }
}

export default async function AdminDashboard() {
  const providers = await getAllProviders()
  const stats = await getProviderStats()

  // Fetch real data for the overview
  const now = new Date()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(now.getDate() - 30)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const [
    recentLeads,
    leadsToday,
    unmatchedCount,
    pendingDisputes,
    overdueDisputes,
    unreadMessages,
    directoryListingCount,
  ] = await Promise.all([
    prisma.lead.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        routedTo: { select: { businessName: true } },
        outcomes: { select: { outcome: true }, take: 1, orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.lead.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.lead.count({ where: { routedToId: null, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.leadDispute.count({ where: { status: "pending" } }),
    prisma.leadDispute.count({
      where: {
        status: "pending",
        createdAt: { lt: new Date(now.getTime() - 48 * 60 * 60 * 1000) },
      },
    }),
    prisma.contactMessage.count({ where: { status: "unread" } }),
    getDirectoryListingCount(),
  ])

  const activeProviders = providers.filter((p) => p.subscriptionStatus === "active")
  const claimedNiches = new Set(
    activeProviders.filter((p) => p.tier === "primary").map((p) => p.niche)
  )
  const totalMRR = activeProviders.reduce((s, p) => s + p.monthlyFee, 0)

  // Build alert items
  const alerts: { type: "error" | "warning" | "info"; message: string; href: string; label: string }[] = []

  if (overdueDisputes > 0) {
    alerts.push({
      type: "error",
      message: `${overdueDisputes} dispute${overdueDisputes > 1 ? "s" : ""} overdue (48+ hours without review)`,
      href: "/admin/disputes?status=pending",
      label: "Review now",
    })
  }
  if (pendingDisputes > 0 && overdueDisputes === 0) {
    alerts.push({
      type: "warning",
      message: `${pendingDisputes} pending dispute${pendingDisputes > 1 ? "s" : ""} awaiting review`,
      href: "/admin/disputes?status=pending",
      label: "Review",
    })
  }
  if (unreadMessages > 0) {
    alerts.push({
      type: "info",
      message: `${unreadMessages} unread contact message${unreadMessages > 1 ? "s" : ""}`,
      href: "/admin/messages?status=unread",
      label: "View inbox",
    })
  }
  if (unmatchedCount > 0) {
    alerts.push({
      type: "warning",
      message: `${unmatchedCount} unmatched lead${unmatchedCount > 1 ? "s" : ""} in the last 30 days — revenue waiting for providers`,
      href: "/admin/leads?route=unmatched",
      label: "View leads",
    })
  }

  return (
    <div className="space-y-8">
      {/* ── Header ──────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {cityConfig.domain} -- {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      {/* ── Alert Banners ───────────────────────────────────── */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <div
              key={i}
              className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
                alert.type === "error"
                  ? "border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-900/20"
                  : alert.type === "warning"
                  ? "border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-900/20"
                  : "border-blue-200 bg-blue-50 dark:border-blue-800/50 dark:bg-blue-900/20"
              }`}
            >
              <div className="flex items-center gap-3">
                {alert.type === "error" ? (
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
                ) : alert.type === "warning" ? (
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                ) : (
                  <Inbox className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                )}
                <p className={`text-sm font-medium ${
                  alert.type === "error"
                    ? "text-red-800 dark:text-red-200"
                    : alert.type === "warning"
                    ? "text-amber-800 dark:text-amber-200"
                    : "text-blue-800 dark:text-blue-200"
                }`}>
                  {alert.message}
                </p>
              </div>
              <Link
                href={alert.href}
                className={`text-sm font-semibold whitespace-nowrap ${
                  alert.type === "error"
                    ? "text-red-700 dark:text-red-300 hover:text-red-900"
                    : alert.type === "warning"
                    ? "text-amber-700 dark:text-amber-300 hover:text-amber-900"
                    : "text-blue-700 dark:text-blue-300 hover:text-blue-900"
                }`}
              >
                {alert.label} &rarr;
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* ── KPI Cards ───────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Link href="/admin/revenue">
          <Card className="hover:border-green-300 dark:hover:border-green-800 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">MRR</CardTitle>
              <DollarSign className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">${totalMRR.toLocaleString()}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">${(totalMRR * 12).toLocaleString()} ARR</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/leads">
          <Card className="hover:border-blue-300 dark:hover:border-blue-800 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Leads</CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalLeads.toLocaleString()}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {leadsToday} today &middot; {stats.totalConverted} converted ({stats.totalLeads > 0 ? Math.round((stats.totalConverted / stats.totalLeads) * 100) : 0}%)
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/providers">
          <Card className="hover:border-purple-300 dark:hover:border-purple-800 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Providers</CardTitle>
              <Users className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.active}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{stats.total} total registered</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/territories">
          <Card className="hover:border-amber-300 dark:hover:border-amber-800 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Territories</CardTitle>
              <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{claimedNiches.size} / {niches.length}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{niches.length - claimedNiches.size} available</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/disputes">
          <Card className={`hover:border-red-300 dark:hover:border-red-800 transition-colors cursor-pointer ${pendingDisputes > 0 ? "border-red-200 dark:border-red-800/50" : ""}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Disputes</CardTitle>
              <AlertCircle className={`h-4 w-4 ${pendingDisputes > 0 ? "text-red-500" : "text-gray-400 dark:text-gray-500"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${pendingDisputes > 0 ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"}`}>{pendingDisputes}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">pending review</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* ── Recent Leads ────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Recent Leads
              </CardTitle>
              <CardDescription>Latest leads across all niches</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/leads">
                View all <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentLeads.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">No leads yet. Leads will appear here as they come in.</p>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <Table className="min-w-[640px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Niche</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Routed To</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentLeads.map((lead) => {
                    const leadName = `${lead.firstName ?? ""} ${lead.lastName ?? ""}`.trim() || "Unknown"
                    const outcome = lead.outcomes[0]?.outcome
                    const status = outcome ?? (lead.routedToId ? "pending" : "unmatched")
                    return (
                      <TableRow key={lead.id}>
                        <TableCell className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {lead.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}{" "}
                          {lead.createdAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{lead.niche}</Badge>
                        </TableCell>
                        <TableCell>
                          <Link href={`/admin/leads/${lead.id}`} className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:underline">
                            {leadName}
                          </Link>
                          {lead.message && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">{lead.message}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <p className="text-xs"><a href={`mailto:${lead.email}`} className="text-blue-600 dark:text-blue-400 hover:underline">{lead.email}</a></p>
                          {lead.phone && <p className="text-xs text-gray-500 dark:text-gray-400">{lead.phone}</p>}
                        </TableCell>
                        <TableCell className="text-sm">
                          {lead.routedTo?.businessName ? (
                            <span className="text-gray-900 dark:text-white">{lead.routedTo.businessName}</span>
                          ) : (
                            <span className="text-red-600 dark:text-red-400 font-medium">Unmatched</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${getStatusColor(status)}`}>
                            {status.replace("_", " ")}
                          </span>
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

      {/* ── Quick Links ─────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickLink
          href="/admin/leads?route=unmatched"
          icon="📋"
          label="Unmatched Leads"
          description="Leads with no provider match"
          count={unmatchedCount}
          countColor="text-red-600 dark:text-red-400"
        />
        <QuickLink
          href="/admin/messages"
          icon="💬"
          label="Contact Inbox"
          description="Contact form submissions"
          count={unreadMessages}
          countColor="text-blue-600 dark:text-blue-400"
        />
        <QuickLink
          href="/admin/listings"
          icon="🏢"
          label="Directory Listings"
          description="Scraped Google Places listings"
          count={directoryListingCount}
          countColor="text-purple-600 dark:text-purple-400"
        />
        <QuickLink
          href="/admin/territories?filter=available"
          icon="📍"
          label="Available Territories"
          description="Unclaimed niches for sale"
          count={niches.length - claimedNiches.size}
          countColor="text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* ── Territory Map (compact) ─────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                Territory Map
              </CardTitle>
              <CardDescription>{claimedNiches.size} of {niches.length} niches claimed</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/territories">
                Manage <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {niches.map((n) => {
              const isClaimed = claimedNiches.has(n.slug)
              return (
                <div
                  key={n.slug}
                  className={`rounded border p-2 text-center text-xs transition-colors ${
                    isClaimed
                      ? "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                      : "border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30"
                  }`}
                  title={`${n.label} — $${n.monthlyFee}/mo — ${isClaimed ? "Claimed" : "Available"}`}
                >
                  <span className="text-base">{n.icon}</span>
                  <p className="mt-0.5 text-[10px] font-medium leading-tight truncate">{n.label}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Providers (compact) ─────────────────────────────── */}
      {providers.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  Providers
                </CardTitle>
                <CardDescription>{stats.active} active, {stats.total} total</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/providers">
                  View all <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <Table className="min-w-[640px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Niche</TableHead>
                    <TableHead className="text-right">MRR</TableHead>
                    <TableHead className="text-right">Leads</TableHead>
                    <TableHead className="text-right">Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {providers.slice(0, 10).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link href={`/admin/providers/${p.id}`} className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:underline">
                          {p.businessName}
                        </Link>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{p.email}</p>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{p.niche}</Badge></TableCell>
                      <TableCell className="text-right font-medium text-green-600 dark:text-green-400">${p.monthlyFee}</TableCell>
                      <TableCell className="text-right font-medium">{p.totalLeads}</TableCell>
                      <TableCell className="text-right">
                        <span className="flex items-center justify-end gap-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {p.avgRating > 0 ? p.avgRating.toFixed(1) : "N/A"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.subscriptionStatus === "active" ? "default" : p.subscriptionStatus === "trial" ? "secondary" : "destructive"} className="capitalize">
                          {p.subscriptionStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/providers/${p.id}`}><ChevronRight className="h-4 w-4" /></Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ── Quick Link Card ─────────────────────────────────────────────────

function QuickLink({
  href,
  icon,
  label,
  description,
  count,
  countColor,
}: {
  href: string
  icon: string
  label: string
  description: string
  count?: number
  countColor?: string
}) {
  return (
    <Link href={href}>
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 hover:border-blue-300 dark:hover:border-blue-800 transition-colors cursor-pointer">
        <div className="flex items-center justify-between">
          <span className="text-2xl">{icon}</span>
          {count !== undefined && count > 0 && (
            <span className={`text-2xl font-bold ${countColor ?? "text-gray-900 dark:text-white"}`}>{count}</span>
          )}
        </div>
        <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </div>
    </Link>
  )
}

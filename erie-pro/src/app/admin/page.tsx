import Link from "next/link"
import type { Metadata } from "next"
import {
  Users,
  TrendingUp,
  MapPin,
  Phone,
  Clock,
  Star,
  Activity,
  DollarSign,
  Globe,
  ChevronRight,
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Shield,
  Crown,
  ExternalLink,
} from "lucide-react"
import { getAllProviders, getProviderStats } from "@/lib/provider-store"
import { cityConfig } from "@/lib/city-config"
import { niches } from "@/lib/niches"
import {
  TIER_BENEFITS,
  calculateMonthlyFee,
  getBadgeLabel,
  getTierColor,
  type ProviderTier,
} from "@/lib/premium-rewards"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: `Admin Dashboard -- ${cityConfig.domain}`,
  description:
    "Comprehensive admin dashboard for monitoring leads, providers, territories, and revenue.",
  robots: "noindex, nofollow",
}

// ── Sample Data ────────────────────────────────────────────────────

const recentLeads = [
  {
    id: "lead-abc123",
    niche: "plumbing",
    name: "Mike Henderson",
    phone: "(814) 555-8001",
    message: "Water heater leaking, need urgent repair",
    routedTo: "Johnson Plumbing & Drain",
    status: "responded",
    timestamp: "2026-03-30T09:15:00Z",
    outcome: "Appointment set",
  },
  {
    id: "lead-def456",
    niche: "hvac",
    name: "Sarah Collins",
    phone: "(814) 555-8002",
    message: "AC unit not cooling, house is 85 degrees",
    routedTo: "Erie Comfort HVAC",
    status: "converted",
    timestamp: "2026-03-29T14:30:00Z",
    outcome: "$4,200 system replacement",
  },
  {
    id: "lead-ghi789",
    niche: "dental",
    name: "Tom Richards",
    phone: "(814) 555-8003",
    message: "Looking for a new family dentist, 4 people",
    routedTo: "Lakeshore Family Dental",
    status: "responded",
    timestamp: "2026-03-29T11:00:00Z",
    outcome: "Consultation booked",
  },
  {
    id: "lead-jkl012",
    niche: "electrical",
    name: "Linda Park",
    phone: "(814) 555-8004",
    message: "Need panel upgrade for older home",
    routedTo: "Bayfront Electric Services",
    status: "pending",
    timestamp: "2026-03-30T08:45:00Z",
    outcome: "Awaiting response",
  },
  {
    id: "lead-mno345",
    niche: "legal",
    name: "James Wright",
    phone: "(814) 555-8005",
    message: "Personal injury consultation needed",
    routedTo: "Erie Law Partners LLC",
    status: "converted",
    timestamp: "2026-03-28T16:20:00Z",
    outcome: "Retained - $8,500 case",
  },
  {
    id: "lead-pqr678",
    niche: "roofing",
    name: "Amy Chen",
    phone: "(814) 555-8006",
    message: "Storm damage assessment needed ASAP",
    routedTo: "Great Lakes Roofing Co.",
    status: "responded",
    timestamp: "2026-03-30T07:30:00Z",
    outcome: "Inspection scheduled",
  },
  {
    id: "lead-stu901",
    niche: "plumbing",
    name: "Robert Davis",
    phone: "(814) 555-8007",
    message: "Bathroom remodel plumbing rough-in",
    routedTo: "Johnson Plumbing & Drain",
    status: "converted",
    timestamp: "2026-03-27T10:15:00Z",
    outcome: "$3,800 project signed",
  },
]

const backlinkSources = [
  { domain: "homeadvisor.com", da: 92, pages: 3, status: "live" },
  { domain: "angi.com", da: 88, pages: 2, status: "live" },
  { domain: "bbb.org", da: 94, pages: 1, status: "live" },
  { domain: "yelp.com", da: 94, pages: 6, status: "live" },
  { domain: "erienewsnow.com", da: 45, pages: 1, status: "pending" },
  { domain: "goerie.com", da: 68, pages: 2, status: "live" },
]

const cityExpansion = [
  { city: "Erie", status: "live", providers: 6, pages: 384, mrr: 3700 },
  { city: "Meadville", status: "planned", providers: 0, pages: 0, mrr: 0 },
  { city: "Warren", status: "planned", providers: 0, pages: 0, mrr: 0 },
  { city: "Edinboro", status: "template", providers: 0, pages: 0, mrr: 0 },
  { city: "Corry", status: "template", providers: 0, pages: 0, mrr: 0 },
]

function getStatusColor(status: string) {
  switch (status) {
    case "converted":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    case "responded":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    case "pending":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
  }
}

export default function AdminDashboard() {
  const providers = getAllProviders()
  const stats = getProviderStats()

  const activeProviders = providers.filter(
    (p) => p.subscriptionStatus === "active"
  )
  const claimedNiches = new Set(
    activeProviders.filter((p) => p.tier === "primary").map((p) => p.niche)
  )
  const activeTerritories = claimedNiches.size

  // Revenue calculations
  const totalMRR = activeProviders.reduce((s, p) => s + p.monthlyFee, 0)
  const mrrByNiche = activeProviders.reduce<Record<string, number>>(
    (acc, p) => {
      acc[p.niche] = (acc[p.niche] || 0) + p.monthlyFee
      return acc
    },
    {}
  )

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-muted-foreground">
            {cityConfig.domain} -- Site management and revenue operations
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          Last updated: {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </Badge>
      </div>

      {/* ── 1. Overview Cards ───────────────────────────────── */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              MRR
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              ${totalMRR.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              ${(totalMRR * 12).toLocaleString()} ARR
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Leads
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.totalLeads.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalConverted} converted (
              {stats.totalLeads > 0
                ? Math.round((stats.totalConverted / stats.totalLeads) * 100)
                : 0}
              %)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Providers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total} total registered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Territories
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {activeTerritories} / {niches.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {niches.length - activeTerritories} available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cities Live
            </CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {cityExpansion.filter((c) => c.status === "live").length}
            </div>
            <p className="text-xs text-muted-foreground">
              {cityExpansion.length} total planned
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. Lead Pipeline ───────────────────────────────── */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Lead Pipeline
          </CardTitle>
          <CardDescription>
            Recent leads with routing status and outcomes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead ID</TableHead>
                <TableHead>Niche</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Routed To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-mono text-xs">
                    {lead.id}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {lead.niche}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{lead.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {lead.message.substring(0, 40)}...
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{lead.routedTo}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${getStatusColor(
                        lead.status
                      )}`}
                    >
                      {lead.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {lead.outcome}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(lead.timestamp).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── 3. Provider Management ─────────────────────────── */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Provider Management
          </CardTitle>
          <CardDescription>
            All providers with tier, performance, and actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Niche</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead className="text-right">MRR</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">Conv. Rate</TableHead>
                <TableHead className="text-right">Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{p.businessName}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {p.niche}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        p.tier === "primary"
                          ? "default"
                          : p.tier === "backup"
                          ? "secondary"
                          : "outline"
                      }
                      className="capitalize"
                    >
                      {p.tier}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium text-green-600 dark:text-green-400">
                    ${p.monthlyFee}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {p.totalLeads}
                  </TableCell>
                  <TableCell className="text-right">
                    {p.totalLeads > 0
                      ? `${Math.round(
                          (p.convertedLeads / p.totalLeads) * 100
                        )}%`
                      : "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="flex items-center justify-end gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {p.avgRating > 0 ? p.avgRating.toFixed(1) : "N/A"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        p.subscriptionStatus === "active"
                          ? "default"
                          : p.subscriptionStatus === "trial"
                          ? "secondary"
                          : "destructive"
                      }
                      className="capitalize"
                    >
                      {p.subscriptionStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/providers/${p.id}`}>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── 4. Territory Map ───────────────────────────────── */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Territory Map
          </CardTitle>
          <CardDescription>
            All {niches.length} niches -- claimed vs. available
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {niches.map((n) => {
              const isClaimed = claimedNiches.has(n.slug)
              return (
                <div
                  key={n.slug}
                  className={`rounded-lg border p-3 text-center text-sm transition-colors ${
                    isClaimed
                      ? "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                      : "border-dashed border-muted-foreground/30 bg-muted/30"
                  }`}
                >
                  <span className="text-xl">{n.icon}</span>
                  <p className="mt-1 text-xs font-medium leading-tight">
                    {n.label}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    ${n.monthlyFee}/mo
                  </p>
                  {isClaimed ? (
                    <Badge
                      variant="default"
                      className="mt-1 text-[10px] px-1.5 py-0"
                    >
                      Claimed
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="mt-1 text-[10px] px-1.5 py-0"
                    >
                      Available
                    </Badge>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── 5. Revenue Breakdown ───────────────────────────── */}
      <div className="mb-8 grid gap-6 md:grid-cols-2">
        {/* MRR by niche */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-primary" />
              MRR by Niche
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(mrrByNiche)
                .sort((a, b) => b[1] - a[1])
                .map(([nicheSlug, mrr]) => {
                  const nicheData = niches.find((n) => n.slug === nicheSlug)
                  const pct = totalMRR > 0 ? (mrr / totalMRR) * 100 : 0
                  return (
                    <div key={nicheSlug}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize">
                          {nicheData?.icon} {nicheData?.label ?? nicheSlug}
                        </span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          ${mrr.toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>

        {/* MRR by tier */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Crown className="h-4 w-4 text-primary" />
              Revenue Potential by Tier
            </CardTitle>
            <CardDescription>
              If all {niches.length} niches were filled at each tier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(["standard", "premium", "elite"] as ProviderTier[]).map(
                (tier) => {
                  const totalPotential = niches.reduce(
                    (s, n) =>
                      s + calculateMonthlyFee(n.monthlyFee, tier),
                    0
                  )
                  return (
                    <div
                      key={tier}
                      className="rounded-lg border p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {tier === "elite" ? (
                            <Crown className="h-4 w-4 text-purple-500" />
                          ) : tier === "premium" ? (
                            <Star className="h-4 w-4 text-amber-500" />
                          ) : (
                            <Shield className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="text-sm font-semibold capitalize">
                            {tier}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({TIER_BENEFITS[tier].monthlyMultiplier}x)
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600 dark:text-green-400">
                            ${totalPotential.toLocaleString()}/mo
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ${(totalPotential * 12).toLocaleString()}/yr
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                }
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 6. National Authority / Backlinks ──────────────── */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            National Authority -- Backlink Report
          </CardTitle>
          <CardDescription>
            External sites linking to {cityConfig.domain}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domain</TableHead>
                <TableHead className="text-right">DA</TableHead>
                <TableHead className="text-right">Pages</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backlinkSources.map((bl) => (
                <TableRow key={bl.domain}>
                  <TableCell>
                    <span className="flex items-center gap-1 text-sm font-medium">
                      {bl.domain}
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {bl.da}
                  </TableCell>
                  <TableCell className="text-right">{bl.pages}</TableCell>
                  <TableCell>
                    <Badge
                      variant={bl.status === "live" ? "default" : "secondary"}
                      className="capitalize"
                    >
                      {bl.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── 7. City Expansion ──────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            City Expansion
          </CardTitle>
          <CardDescription>
            Multi-city rollout status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>City</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Providers</TableHead>
                <TableHead className="text-right">Pages</TableHead>
                <TableHead className="text-right">MRR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cityExpansion.map((c) => (
                <TableRow key={c.city}>
                  <TableCell className="font-medium">{c.city}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        c.status === "live"
                          ? "default"
                          : c.status === "template"
                          ? "secondary"
                          : "outline"
                      }
                      className="capitalize"
                    >
                      {c.status === "live" && (
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                      )}
                      {c.status === "planned" && (
                        <AlertCircle className="mr-1 h-3 w-3" />
                      )}
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{c.providers}</TableCell>
                  <TableCell className="text-right">
                    {c.pages > 0 ? c.pages.toLocaleString() : "--"}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {c.mrr > 0 ? (
                      <span className="text-green-600 dark:text-green-400">
                        ${c.mrr.toLocaleString()}
                      </span>
                    ) : (
                      "--"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  )
}

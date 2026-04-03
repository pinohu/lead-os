import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import {
  ArrowLeft,
  Phone,
  Mail,
  Globe,
  MapPin,
  Star,
  Clock,
  TrendingUp,
  DollarSign,
  Shield,
  CheckCircle2,
  AlertCircle,
  Users,
  Calendar,
  BarChart3,
  Award,
  Activity,
  FileWarning,
  ScrollText,
} from "lucide-react"
import { getProvider } from "@/lib/provider-store"
import { prisma } from "@/lib/db"
import { cityConfig } from "@/lib/city-config"
import { getNicheBySlug } from "@/lib/niches"
import { getBadgeLabel, getTierColor } from "@/lib/premium-rewards"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import ProviderActions from "./provider-actions"

type Props = { params: Promise<{ id: string }> }

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const provider = await getProvider(id)
  if (!provider) return { title: "Provider Not Found" }
  return {
    title: `${provider.businessName} -- Admin -- ${cityConfig.domain}`,
    robots: "noindex, nofollow",
  }
}

function getTemperatureColor(temp: string) {
  switch (temp) {
    case "burning":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    case "hot":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
    case "warm":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    case "cold":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
  }
}

function getOutcomeColor(outcome: string) {
  switch (outcome) {
    case "converted":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    case "responded":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    case "no_response":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    case "declined":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
    case "cancelled":
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
  }
}

function getDisputeStatusColor(status: string) {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    case "denied":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    case "pending":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
  }
}

function formatResponseTime(seconds: number | null | undefined): string {
  if (seconds == null || seconds <= 0) return "N/A"
  if (seconds < 60) return `${Math.round(seconds)}s`
  return `${Math.round(seconds / 60)}m`
}

export default async function ProviderDetailPage({ params }: Props) {
  const { id } = await params
  const provider = await getProvider(id)
  if (!provider) notFound()

  const niche = getNicheBySlug(provider.niche)

  // Fetch real data from database in parallel
  const [leads, disputes, auditEntries] = await Promise.all([
    prisma.lead.findMany({
      where: { routedToId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        outcomes: {
          select: { outcome: true, responseTimeSeconds: true },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.leadDispute.findMany({
      where: { providerId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        lead: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    }),
    prisma.auditLog.findMany({
      where: { providerId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ])

  const convRate =
    provider.totalLeads > 0
      ? Math.round((provider.convertedLeads / provider.totalLeads) * 100)
      : 0
  const avgResponseMin =
    provider.avgResponseTime > 0
      ? Math.round(provider.avgResponseTime / 60)
      : 0

  return (
    <>
      {/* ── Back link ──────────────────────────────────────── */}
      <Button asChild variant="ghost" size="sm" className="mb-6">
        <Link href="/admin/providers">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Providers
        </Link>
      </Button>

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {provider.businessName}
            </h1>
            <Badge
              variant={
                provider.subscriptionStatus === "active"
                  ? "default"
                  : provider.subscriptionStatus === "trial"
                  ? "secondary"
                  : "destructive"
              }
              className="capitalize"
            >
              {provider.subscriptionStatus}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {provider.tier}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {niche?.icon} {niche?.label} -- {provider.city},{" "}
            {provider.address.state}
          </p>
        </div>

        <ProviderActions
          providerId={provider.id}
          currentTier={provider.tier}
          businessName={provider.businessName}
        />
      </div>

      {/* ── Profile + Performance ──────────────────────────── */}
      <div className="mb-8 grid gap-6 md:grid-cols-3">
        {/* Contact card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              {provider.phone}
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              {provider.email}
            </div>
            {provider.website && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a
                  href={provider.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {provider.website.replace("https://", "")}
                </a>
              </div>
            )}
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <span>
                {provider.address.street}, {provider.address.city},{" "}
                {provider.address.state} {provider.address.zip}
              </span>
            </div>
            <Separator />
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Est. {provider.yearEstablished}
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              {provider.employeeCount} employees
            </div>
            {provider.license && (
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                License: {provider.license}
              </div>
            )}
            <div className="flex items-center gap-2">
              {provider.insurance ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              {provider.insurance ? "Insured" : "Not insured"}
            </div>
          </CardContent>
        </Card>

        {/* Performance metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-3 text-center">
                <TrendingUp className="mx-auto h-5 w-5 text-primary" />
                <p className="mt-1 text-2xl font-bold">{provider.totalLeads}</p>
                <p className="text-xs text-muted-foreground">Total Leads</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <CheckCircle2 className="mx-auto h-5 w-5 text-green-600" />
                <p className="mt-1 text-2xl font-bold">
                  {provider.convertedLeads}
                </p>
                <p className="text-xs text-muted-foreground">Converted</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <BarChart3 className="mx-auto h-5 w-5 text-blue-600" />
                <p className="mt-1 text-2xl font-bold">{convRate}%</p>
                <p className="text-xs text-muted-foreground">Conv. Rate</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <Clock className="mx-auto h-5 w-5 text-amber-600" />
                <p className="mt-1 text-2xl font-bold">
                  {avgResponseMin > 0 ? `${avgResponseMin}m` : "N/A"}
                </p>
                <p className="text-xs text-muted-foreground">Avg Response</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <Star className="mx-auto h-5 w-5 fill-amber-400 text-amber-400" />
                <p className="mt-1 text-2xl font-bold">
                  {provider.avgRating > 0
                    ? provider.avgRating.toFixed(1)
                    : "N/A"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Rating ({provider.reviewCount} reviews)
                </p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <MapPin className="mx-auto h-5 w-5 text-muted-foreground" />
                <p className="mt-1 text-2xl font-bold">
                  {provider.serviceAreas.length}
                </p>
                <p className="text-xs text-muted-foreground">Service Areas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Subscription Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Monthly Fee
                </span>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${provider.monthlyFee}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>Annual value</span>
                <span>${(provider.monthlyFee * 12).toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Niche</span>
                <span className="font-medium capitalize">
                  {niche?.icon} {niche?.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tier</span>
                <Badge variant="outline" className="capitalize">
                  {provider.tier}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge
                  variant={
                    provider.subscriptionStatus === "active"
                      ? "default"
                      : "destructive"
                  }
                  className="capitalize"
                >
                  {provider.subscriptionStatus}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Claimed</span>
                <span>
                  {new Date(provider.claimedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              {provider.lastLeadAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Lead</span>
                  <span>
                    {new Date(provider.lastLeadAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>

            {provider.stripeCustomerId && (
              <div className="rounded border bg-muted/30 p-3 text-xs">
                <p className="text-muted-foreground">
                  Stripe Customer: {provider.stripeCustomerId}
                </p>
                {provider.stripeSubscriptionId && (
                  <p className="text-muted-foreground">
                    Subscription: {provider.stripeSubscriptionId}
                  </p>
                )}
              </div>
            )}

            <div className="pt-2">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Service Areas
              </p>
              <div className="flex flex-wrap gap-1">
                {provider.serviceAreas.map((area) => (
                  <Badge key={area} variant="outline" className="text-xs">
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Lead History ───────────────────────────────────── */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Lead History
          </CardTitle>
          <CardDescription>
            Recent leads routed to {provider.businessName} ({leads.length} shown)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No leads have been routed to this provider yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Temperature</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead>Response Time</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => {
                    const outcome = lead.outcomes[0]?.outcome ?? "pending"
                    const responseSeconds =
                      lead.outcomes[0]?.responseTimeSeconds ?? null

                    return (
                      <TableRow key={lead.id}>
                        <TableCell className="font-mono text-xs">
                          {lead.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell className="text-sm font-medium whitespace-nowrap">
                          {[lead.firstName, lead.lastName]
                            .filter(Boolean)
                            .join(" ") || "Unknown"}
                        </TableCell>
                        <TableCell className="text-xs">
                          <a
                            href={`mailto:${lead.email}`}
                            className="text-primary hover:underline"
                          >
                            {lead.email}
                          </a>
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {lead.phone || "N/A"}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                          {lead.message || "No message"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${getTemperatureColor(
                              lead.temperature
                            )}`}
                          >
                            {lead.temperature}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${getOutcomeColor(
                              outcome
                            )}`}
                          >
                            {outcome.replace("_", " ")}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {formatResponseTime(responseSeconds)}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(lead.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
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

      {/* ── Disputes ───────────────────────────────────────── */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileWarning className="h-5 w-5 text-orange-500" />
            Disputes
          </CardTitle>
          <CardDescription>
            Lead disputes filed by {provider.businessName} ({disputes.length}{" "}
            shown)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {disputes.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No disputes filed by this provider.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dispute ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Credit</TableHead>
                    <TableHead>Filed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disputes.map((dispute) => (
                    <TableRow key={dispute.id}>
                      <TableCell className="font-mono text-xs">
                        {dispute.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="text-sm font-medium whitespace-nowrap">
                        {[dispute.lead.firstName, dispute.lead.lastName]
                          .filter(Boolean)
                          .join(" ") || "Unknown"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {dispute.lead.email ? (
                          <a
                            href={`mailto:${dispute.lead.email}`}
                            className="text-primary hover:underline"
                          >
                            {dispute.lead.email}
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-xs">
                          {dispute.reason.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                        {dispute.description || "No description"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${getDisputeStatusColor(
                            dispute.status
                          )}`}
                        >
                          {dispute.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {dispute.creditAmount != null
                          ? `$${dispute.creditAmount.toFixed(2)}`
                          : "--"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(dispute.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Audit Trail ────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-muted-foreground" />
            Audit Trail
          </CardTitle>
          <CardDescription>
            Recent activity for {provider.businessName} ({auditEntries.length}{" "}
            shown)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {auditEntries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No audit log entries for this provider.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity Type</TableHead>
                    <TableHead>Entity ID</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Metadata</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {entry.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm capitalize">
                        {entry.entityType}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {entry.entityId
                          ? `${entry.entityId.slice(0, 8)}...`
                          : "--"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {entry.ipAddress || "--"}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                        {entry.metadata
                          ? JSON.stringify(entry.metadata).slice(0, 80)
                          : "--"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(entry.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}{" "}
                        {new Date(entry.createdAt).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}

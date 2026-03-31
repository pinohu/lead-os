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
} from "lucide-react"
import { getAllProviders, getProvider } from "@/lib/provider-store"
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

type Props = { params: Promise<{ id: string }> }

export function generateStaticParams() {
  return getAllProviders().map((p) => ({ id: p.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const provider = getProvider(id)
  if (!provider) return { title: "Provider Not Found" }
  return {
    title: `${provider.businessName} -- Admin -- ${cityConfig.domain}`,
    robots: "noindex, nofollow",
  }
}

// Sample lead history for the provider
function getSampleLeads(providerName: string) {
  return [
    {
      id: "lead-001",
      customer: "Mike Henderson",
      message: "Water heater leaking urgently",
      status: "converted",
      value: "$1,200",
      date: "2026-03-28",
      responseTime: "7 min",
    },
    {
      id: "lead-002",
      customer: "Sarah Collins",
      message: "Annual maintenance check needed",
      status: "converted",
      value: "$250",
      date: "2026-03-25",
      responseTime: "12 min",
    },
    {
      id: "lead-003",
      customer: "Tom Richards",
      message: "New construction rough-in quote",
      status: "responded",
      value: "Pending",
      date: "2026-03-22",
      responseTime: "22 min",
    },
    {
      id: "lead-004",
      customer: "Linda Park",
      message: "Bathroom remodel plumbing",
      status: "converted",
      value: "$3,800",
      date: "2026-03-18",
      responseTime: "5 min",
    },
    {
      id: "lead-005",
      customer: "James Wright",
      message: "Emergency pipe burst",
      status: "converted",
      value: "$850",
      date: "2026-03-15",
      responseTime: "3 min",
    },
    {
      id: "lead-006",
      customer: "Amy Chen",
      message: "Drain cleaning appointment",
      status: "no-response",
      value: "Lost",
      date: "2026-03-12",
      responseTime: "N/A",
    },
    {
      id: "lead-007",
      customer: "Robert Davis",
      message: "Kitchen faucet replacement",
      status: "responded",
      value: "Pending",
      date: "2026-03-10",
      responseTime: "15 min",
    },
    {
      id: "lead-008",
      customer: "Jennifer Smith",
      message: "Sewer line inspection request",
      status: "converted",
      value: "$2,400",
      date: "2026-03-05",
      responseTime: "9 min",
    },
  ]
}

function getStatusColor(status: string) {
  switch (status) {
    case "converted":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    case "responded":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    case "no-response":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export default async function ProviderDetailPage({ params }: Props) {
  const { id } = await params
  const provider = getProvider(id)
  if (!provider) notFound()

  const niche = getNicheBySlug(provider.niche)
  const leads = getSampleLeads(provider.businessName)
  const convRate =
    provider.totalLeads > 0
      ? Math.round((provider.convertedLeads / provider.totalLeads) * 100)
      : 0
  const avgResponseMin =
    provider.avgResponseTime > 0
      ? Math.round(provider.avgResponseTime / 60)
      : 0

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* ── Back link ──────────────────────────────────────── */}
      <Button asChild variant="ghost" size="sm" className="mb-6">
        <Link href="/admin">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Dashboard
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

        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Upgrade Tier
          </Button>
          <Button variant="outline" size="sm">
            Swap Territory
          </Button>
          <Button variant="destructive" size="sm">
            Suspend
          </Button>
        </div>
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Lead History
          </CardTitle>
          <CardDescription>
            Recent leads routed to {provider.businessName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Request</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Response Time</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-mono text-xs">
                    {lead.id}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {lead.customer}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                    {lead.message}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${getStatusColor(
                        lead.status
                      )}`}
                    >
                      {lead.status.replace("-", " ")}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {lead.value}
                  </TableCell>
                  <TableCell className="text-xs">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {lead.responseTime}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(lead.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
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


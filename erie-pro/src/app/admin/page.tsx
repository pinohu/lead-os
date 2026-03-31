import type { Metadata } from "next";
import {
  Users,
  TrendingUp,
  MapPin,
  Phone,
  Clock,
  Star,
  Activity,
} from "lucide-react";
import { getAllProviders, getProviderStats } from "@/lib/provider-store";
import { cityConfig } from "@/lib/city-config";
import { niches } from "@/lib/niches";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = {
  title: `Admin Dashboard — ${cityConfig.domain}`,
  description: "Internal admin dashboard for monitoring leads, providers, and territory performance.",
  robots: "noindex, nofollow",
};

// Sample recent leads for display purposes
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
  },
];

function getStatusColor(status: string) {
  switch (status) {
    case "converted":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "responded":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "pending":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  }
}

export default function AdminDashboard() {
  const providers = getAllProviders();
  const stats = getProviderStats();
  const claimedNiches = new Set(
    providers
      .filter((p) => p.subscriptionStatus === "active" && p.tier === "primary")
      .map((p) => p.niche)
  );
  const activeTerritories = claimedNiches.size;

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          {cityConfig.domain} &mdash; Internal monitoring and management
        </p>
      </div>

      {/* ── Stat Cards ───────────────────────────────────────── */}
      <div className="mb-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Leads
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalLeads.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalConverted} converted ({stats.totalLeads > 0 ? Math.round((stats.totalConverted / stats.totalLeads) * 100) : 0}%)
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
              Active Territories
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
              Avg Provider Rating
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.avgRating}</div>
            <p className="text-xs text-muted-foreground">
              Across all providers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Leads ─────────────────────────────────────── */}
      <Card className="mb-10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Recent Leads
          </CardTitle>
          <CardDescription>
            Latest leads routed through the system
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
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${getStatusColor(lead.status)}`}
                    >
                      {lead.status}
                    </span>
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

      {/* ── Provider Performance Table ────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Provider Performance
          </CardTitle>
          <CardDescription>
            Active providers and their key metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Niche</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">Converted</TableHead>
                <TableHead className="text-right">Conv. Rate</TableHead>
                <TableHead className="text-right">Avg Response</TableHead>
                <TableHead className="text-right">Rating</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{p.businessName}</p>
                      <p className="text-xs text-muted-foreground">{p.email}</p>
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
                  <TableCell className="text-right font-medium">
                    {p.totalLeads}
                  </TableCell>
                  <TableCell className="text-right">{p.convertedLeads}</TableCell>
                  <TableCell className="text-right">
                    {p.totalLeads > 0
                      ? `${Math.round((p.convertedLeads / p.totalLeads) * 100)}%`
                      : "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="flex items-center justify-end gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {p.avgResponseTime > 0
                        ? `${Math.round(p.avgResponseTime / 60)}m`
                        : "N/A"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="flex items-center justify-end gap-1">
                      <Star className="h-3 w-3 fill-warning text-warning" />
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}

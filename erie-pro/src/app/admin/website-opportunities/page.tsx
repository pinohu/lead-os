import Link from "next/link"
import type { Metadata } from "next"
import {
  ArrowUpRight,
  ExternalLink,
  Globe2,
  Phone,
  Star,
  Target,
} from "lucide-react"
import { prisma } from "@/lib/db"
import { cityConfig } from "@/lib/city-config"
import { getNicheBySlug } from "@/lib/niches"
import {
  previewPathForListing,
  serviceLabelForNiche,
  websiteOpportunityStatusLabels,
  websiteOpportunityStatuses,
  websitePackages,
  type WebsiteOpportunityStatus,
} from "@/lib/website-opportunities"
import { updateWebsiteOpportunity } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: `Website Opportunities -- Admin -- ${cityConfig.domain}`,
  robots: { index: false, follow: false },
}

type Props = {
  searchParams: Promise<{ status?: string; page?: string }>
}

type OpportunityRow = {
  id: string
  status: WebsiteOpportunityStatus
  score: number
  package_key: string
  qualification_notes: string[]
  preview_created_at: Date | null
  last_contacted_at: Date | null
  listing_id: string
  slug: string
  businessName: string
  niche: string
  phone: string | null
  email: string | null
  addressCity: string | null
  rating: number | null
  reviewCount: number
  categories: string[]
}

type StatusCount = {
  status: WebsiteOpportunityStatus
  count: number
}

const statusColors: Record<WebsiteOpportunityStatus, string> = {
  qualified: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  needs_manual_review: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  not_a_business: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  already_has_website: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  do_not_contact: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  preview_created: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  contacted: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
  claimed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  sold: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  declined: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
}

export default async function WebsiteOpportunitiesPage({ searchParams }: Props) {
  const params = await searchParams
  const requestedStatus = params.status
  const statusFilter = websiteOpportunityStatuses.includes(requestedStatus as WebsiteOpportunityStatus)
    ? (requestedStatus as WebsiteOpportunityStatus)
    : undefined
  const page = Math.max(1, parseInt(params.page ?? "1", 10))
  const perPage = 50
  const whereStatus = statusFilter ? "WHERE wo.status = $1" : ""
  const queryParams = statusFilter ? [statusFilter, perPage, (page - 1) * perPage] : [perPage, (page - 1) * perPage]
  const countParams = statusFilter ? [statusFilter] : []

  const [rows, counts, totalResult] = await Promise.all([
    prisma.$queryRawUnsafe<OpportunityRow[]>(
      `
        SELECT
          wo.id,
          wo.status,
          wo.score,
          wo.package_key,
          wo.qualification_notes,
          wo.preview_created_at,
          wo.last_contacted_at,
          dl.id AS listing_id,
          dl.slug,
          dl."businessName",
          dl.niche,
          dl.phone,
          dl.email,
          dl."addressCity",
          dl.rating,
          dl."reviewCount",
          dl.categories
        FROM website_opportunities wo
        JOIN directory_listings dl ON dl.id = wo.listing_id
        ${whereStatus}
        ORDER BY wo.score DESC, dl."reviewCount" DESC, dl."businessName" ASC
        LIMIT $${statusFilter ? 2 : 1}
        OFFSET $${statusFilter ? 3 : 2}
      `,
      ...queryParams
    ),
    prisma.$queryRawUnsafe<StatusCount[]>(`
      SELECT status, count(*)::int AS count
      FROM website_opportunities
      GROUP BY status
      ORDER BY count DESC, status
    `),
    prisma.$queryRawUnsafe<{ count: number }[]>(
      `SELECT count(*)::int AS count FROM website_opportunities wo ${whereStatus}`,
      ...countParams
    ),
  ])

  const totalCount = totalResult[0]?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage))
  const qualifiedCount = counts.find((count) => count.status === "qualified")?.count ?? 0
  const previewCount = counts
    .filter((count) => ["preview_created", "contacted", "claimed", "sold"].includes(count.status))
    .reduce((sum, count) => sum + count.count, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Website Opportunities
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Claimable preview websites for service providers without a website.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/website-opportunities?status=qualified">
            <Target className="mr-2 h-4 w-4" />
            Work Qualified
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{totalCount}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Qualified</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{qualifiedCount}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Preview+</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{previewCount}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Starter Offer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$299</div>
            <p className="text-xs text-gray-500">plus $49/mo</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/website-opportunities">
              <Badge variant={!statusFilter ? "default" : "outline"} className="cursor-pointer">
                All
              </Badge>
            </Link>
            {counts.map((count) => (
              <Link key={count.status} href={`/admin/website-opportunities?status=${count.status}`}>
                <Badge
                  variant={statusFilter === count.status ? "default" : "outline"}
                  className="cursor-pointer"
                >
                  {websiteOpportunityStatusLabels[count.status]} ({count.count})
                </Badge>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <Table className="min-w-[1100px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Proof</TableHead>
                  <TableHead>Preview</TableHead>
                  <TableHead>Update</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const niche = getNicheBySlug(row.niche)
                  const previewPath = previewPathForListing(row)
                  return (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="max-w-[280px]">
                          <Link
                            href={`/${row.niche}/${row.slug}`}
                            target="_blank"
                            className="font-medium text-gray-900 hover:text-blue-600 dark:text-white"
                          >
                            {row.businessName}
                          </Link>
                          <div className="mt-1 flex flex-wrap gap-1">
                            <Badge variant="outline">
                              {niche?.icon} {serviceLabelForNiche(row.niche)}
                            </Badge>
                            {row.addressCity && <Badge variant="secondary">{row.addressCity}</Badge>}
                          </div>
                          {row.qualification_notes.length > 0 && (
                            <p className="mt-2 text-xs text-gray-500">
                              {row.qualification_notes.slice(0, 3).join(" · ")}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-lg font-bold">{row.score}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[row.status]}>
                          {websiteOpportunityStatusLabels[row.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-xs">
                          {row.phone ? (
                            <a className="flex items-center gap-1 text-blue-600" href={`tel:${row.phone.replace(/\D/g, "")}`}>
                              <Phone className="h-3 w-3" />
                              {row.phone}
                            </a>
                          ) : (
                            <span className="text-gray-400">No phone</span>
                          )}
                          {row.email ? (
                            <span className="flex items-center gap-1 text-gray-600">
                              <Globe2 className="h-3 w-3" />
                              Email present
                            </span>
                          ) : (
                            <span className="text-gray-400">No email</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {row.rating?.toFixed(1) ?? "N/A"} · {row.reviewCount} reviews
                          </div>
                          <p className="mt-1 max-w-[220px] truncate text-gray-500">
                            {row.categories?.slice(0, 3).join(", ") || "No categories"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={previewPath} target="_blank">
                              Preview
                              <ExternalLink className="ml-2 h-3 w-3" />
                            </Link>
                          </Button>
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`${previewPath}/claim`} target="_blank">
                              Claim page
                              <ArrowUpRight className="ml-2 h-3 w-3" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <form action={updateWebsiteOpportunity} className="space-y-2">
                          <input type="hidden" name="id" value={row.id} />
                          <select
                            name="status"
                            defaultValue={row.status}
                            className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
                          >
                            {websiteOpportunityStatuses.map((status) => (
                              <option key={status} value={status}>
                                {websiteOpportunityStatusLabels[status]}
                              </option>
                            ))}
                          </select>
                          <select
                            name="packageKey"
                            defaultValue={row.package_key}
                            className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
                          >
                            {websitePackages.map((pkg) => (
                              <option key={pkg.key} value={pkg.key}>
                                {pkg.name}
                              </option>
                            ))}
                          </select>
                          <input
                            name="note"
                            placeholder="Optional note"
                            className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
                          />
                          <Button size="sm" className="w-full" type="submit">
                            Save
                          </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/website-opportunities?${statusFilter ? `status=${statusFilter}&` : ""}page=${page - 1}`}>
                    Previous
                  </Link>
                </Button>
              )}
              {page < totalPages && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/website-opportunities?${statusFilter ? `status=${statusFilter}&` : ""}page=${page + 1}`}>
                    Next
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

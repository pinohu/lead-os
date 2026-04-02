// ── Admin: Directory Listings ────────────────────────────────────────
// Browse, filter, and manage scraped Google Places directory listings.

import Link from "next/link"
import type { Metadata } from "next"
import { Building2, Star, MapPin, Phone, Globe, ExternalLink, ChevronRight } from "lucide-react"
import { prisma } from "@/lib/db"
import { cityConfig } from "@/lib/city-config"
import { getNicheBySlug } from "@/lib/niches"
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
  title: `Directory Listings -- Admin -- ${cityConfig.domain}`,
  robots: { index: false, follow: false },
}

type Props = {
  searchParams: Promise<{ niche?: string; claimed?: string; page?: string }>
}

export default async function AdminListingsPage({ searchParams }: Props) {
  const params = await searchParams
  const nicheFilter = params.niche ?? undefined
  const claimedFilter = params.claimed
  const page = Math.max(1, parseInt(params.page ?? "1", 10))
  const perPage = 50

  const where = {
    isActive: true,
    ...(nicheFilter ? { niche: nicheFilter } : {}),
    ...(claimedFilter === "yes"
      ? { claimedByProviderId: { not: null } }
      : claimedFilter === "no"
      ? { claimedByProviderId: null }
      : {}),
  }

  const [listings, totalCount, nicheStats] = await Promise.all([
    prisma.directoryListing.findMany({
      where,
      orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.directoryListing.count({ where }),
    prisma.directoryListing.groupBy({
      by: ["niche"],
      where: { isActive: true },
      _count: true,
      orderBy: { _count: { niche: "desc" } },
    }),
  ])

  const totalPages = Math.ceil(totalCount / perPage)

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Directory Listings
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {totalCount} listings{nicheFilter ? ` in ${nicheFilter}` : ""} from Google Places
          </p>
        </div>
      </div>

      {/* ── Stats by Niche ──────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Listings by Niche</CardTitle>
          <CardDescription>Top niches by listing count</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/listings">
              <Badge
                variant={!nicheFilter ? "default" : "outline"}
                className="cursor-pointer"
              >
                All ({nicheStats.reduce((s, n) => s + n._count, 0)})
              </Badge>
            </Link>
            {nicheStats.map((ns) => {
              const niche = getNicheBySlug(ns.niche)
              return (
                <Link key={ns.niche} href={`/admin/listings?niche=${ns.niche}`}>
                  <Badge
                    variant={nicheFilter === ns.niche ? "default" : "outline"}
                    className="cursor-pointer"
                  >
                    {niche?.icon} {niche?.label ?? ns.niche} ({ns._count})
                  </Badge>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Listings Table ──────────────────────────────────── */}
      <Card>
        <CardContent className="pt-6">
          {listings.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              No listings found. Run the scraper to populate directory listings.
            </p>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <Table className="min-w-[640px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead>Niche</TableHead>
                    <TableHead className="text-right">Rating</TableHead>
                    <TableHead className="text-right">Reviews</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listings.map((listing) => {
                    const niche = getNicheBySlug(listing.niche)
                    return (
                      <TableRow key={listing.id}>
                        <TableCell>
                          <div className="min-w-0">
                            <Link
                              href={`/${listing.niche}/${listing.slug}`}
                              className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                              target="_blank"
                            >
                              {listing.businessName}
                            </Link>
                            {listing.website && (
                              <a
                                href={listing.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600"
                              >
                                <Globe className="h-3 w-3" />
                                Website
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize whitespace-nowrap">
                            {niche?.icon} {niche?.label ?? listing.niche}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {listing.rating ? (
                            <span className="flex items-center justify-end gap-1">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              {listing.rating.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {listing.reviewCount}
                        </TableCell>
                        <TableCell>
                          {listing.phone ? (
                            <a
                              href={`tel:${listing.phone.replace(/\D/g, "")}`}
                              className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
                            >
                              <Phone className="h-3 w-3" />
                              {listing.phone}
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {listing.addressCity ? (
                            <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                              <MapPin className="h-3 w-3" />
                              {listing.addressCity}, {listing.addressState ?? "PA"}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {listing.claimedByProviderId ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              Claimed
                            </Badge>
                          ) : listing.email ? (
                            <Badge variant="secondary">Has Email</Badge>
                          ) : (
                            <Badge variant="outline">Unclaimed</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/${listing.niche}/${listing.slug}`} target="_blank">
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* ── Pagination ──────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <p>
                Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, totalCount)} of {totalCount}
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/listings?${new URLSearchParams({ ...(nicheFilter ? { niche: nicheFilter } : {}), page: String(page - 1) }).toString()}`}>
                      Previous
                    </Link>
                  </Button>
                )}
                {page < totalPages && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/listings?${new URLSearchParams({ ...(nicheFilter ? { niche: nicheFilter } : {}), page: String(page + 1) }).toString()}`}>
                      Next
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

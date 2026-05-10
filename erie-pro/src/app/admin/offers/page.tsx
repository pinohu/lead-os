import type { Metadata } from "next"
import Link from "next/link"
import { AlertTriangle, ArrowRight, DollarSign, PackageCheck, RefreshCcw, ShoppingCart } from "lucide-react"
import { prisma } from "@/lib/db"
import { syncAutomatedOfferCatalog } from "@/lib/offer-catalog-sync"
import { automatedOffers } from "@/lib/automated-offers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  title: "Automated Offers -- Erie.Pro Admin",
  robots: { index: false, follow: false },
}

function money(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export default async function AdminOffersPage() {
  await syncAutomatedOfferCatalog().catch(() => null)

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const [
    purchases,
    recentPurchases,
    pendingJobs,
    failedJobs,
    interactions,
    serviceMapsCount,
  ] = await Promise.all([
    prisma.offerPurchase.findMany({
      where: { createdAt: { gte: since } },
      include: { offer: true, customer: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.offerPurchase.findMany({
      take: 15,
      include: { offer: true, customer: true, generatedAssets: { take: 1, orderBy: { createdAt: "desc" } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.fulfillmentJob.count({ where: { status: { in: ["pending", "generating"] } } }),
    prisma.fulfillmentJob.count({ where: { status: "failed" } }),
    prisma.offerInteraction.count({ where: { createdAt: { gte: since } } }),
    prisma.serviceOfferMap.count(),
  ])

  const revenueCents = purchases.reduce((sum, purchase) => sum + purchase.amountCents, 0)
  const fulfilled = purchases.filter((purchase) => purchase.status === "fulfilled").length

  const revenueByOffer = automatedOffers.map((offer) => {
    const matching = purchases.filter((purchase) => purchase.offer.slug === offer.slug)
    return {
      offer,
      purchases: matching.length,
      revenueCents: matching.reduce((sum, purchase) => sum + purchase.amountCents, 0),
    }
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Automated Offers</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Self-fulfilling productized offers, ThriveCart events, generated assets, and sync health.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/api/offers?sync=1">
            <RefreshCcw className="mr-2 h-4 w-4" />
            Sync catalog
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">30-day revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-3xl font-bold text-green-700">
              <DollarSign className="h-6 w-6" />
              {money(revenueCents).replace("$", "")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-3xl font-bold">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
              {purchases.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Fulfilled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-3xl font-bold">
              <PackageCheck className="h-6 w-6 text-teal-700" />
              {fulfilled}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingJobs}</div>
          </CardContent>
        </Card>
        <Card className={failedJobs > 0 ? "border-red-200" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Failures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-3xl font-bold text-red-600">
              <AlertTriangle className="h-6 w-6" />
              {failedJobs}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Offer Catalog</CardTitle>
          <CardDescription>
            {automatedOffers.length} offers mapped across {serviceMapsCount} service-specific recommendations.
            {interactions > 0 ? ` ${interactions} offer interactions in the last 30 days.` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Offer</TableHead>
                <TableHead>Fulfillment</TableHead>
                <TableHead>Repo signal</TableHead>
                <TableHead className="text-right">Base price</TableHead>
                <TableHead className="text-right">30-day sales</TableHead>
                <TableHead className="text-right">30-day revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {revenueByOffer.map(({ offer, purchases: count, revenueCents: offerRevenue }) => (
                <TableRow key={offer.slug}>
                  <TableCell>
                    <div className="font-medium">{offer.title}</div>
                    <div className="text-xs text-gray-500">{offer.description}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{offer.fulfillmentType.replace(/_/g, " ")}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[220px] text-xs text-gray-500">{offer.repoSource}</TableCell>
                  <TableCell className="text-right font-medium">{offer.basePriceCents === 0 ? "Free" : money(offer.basePriceCents)}</TableCell>
                  <TableCell className="text-right">{count}</TableCell>
                  <TableCell className="text-right font-medium">{money(offerRevenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Purchases</CardTitle>
          <CardDescription>Latest automated offer records, generated assets, and sync statuses.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Buyer</TableHead>
                <TableHead>Offer</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sync</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentPurchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell>
                    <div className="font-medium">{purchase.customer.companyName || purchase.customer.fullName || purchase.customer.email}</div>
                    <div className="text-xs text-gray-500">{purchase.customer.email}</div>
                  </TableCell>
                  <TableCell>{purchase.offer.shortTitle ?? purchase.offer.title}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{purchase.serviceLabel}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={purchase.status === "fulfilled" ? "default" : purchase.status === "failed" ? "destructive" : "outline"}>
                      {purchase.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    Boost: {purchase.boostspaceSyncStatus}
                    <br />
                    SuiteDash: {purchase.suitedashSyncStatus}
                  </TableCell>
                  <TableCell className="text-right font-medium">{money(purchase.amountCents)}</TableCell>
                  <TableCell className="text-right">
                    {purchase.generatedAssets[0] ? (
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/offer-assets/${purchase.generatedAssets[0].publicToken}`}>
                          Open
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
              {recentPurchases.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-gray-500">
                    No automated offer purchases yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

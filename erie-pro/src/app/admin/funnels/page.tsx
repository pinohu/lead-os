import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, GitBranch, Layers3, MousePointerClick, PackageCheck, type LucideIcon } from "lucide-react"
import { prisma } from "@/lib/db"
import { getDigitalProductsLessons, getOfferFunnelCoverage, getServiceFamilySummary, salesFunnels } from "@/lib/sales-funnels"
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
  title: "Funnel System -- Erie.Pro Admin",
  robots: { index: false, follow: false },
}

function label(value: string) {
  return value.replace(/-/g, " ")
}

export default async function AdminFunnelsPage() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const [interactions, checkoutClicks, purchases] = await Promise.all([
    prisma.offerInteraction.count({
      where: {
        createdAt: { gte: since },
        eventType: { contains: "funnel" },
      },
    }).catch(() => 0),
    prisma.offerInteraction.count({
      where: {
        createdAt: { gte: since },
        eventType: { contains: "checkout" },
      },
    }).catch(() => 0),
    prisma.offerPurchase.count({ where: { createdAt: { gte: since } } }).catch(() => 0),
  ])
  const families = getServiceFamilySummary()
  const coverage = getOfferFunnelCoverage()
  const lessons = getDigitalProductsLessons()
  const metricCards: Array<[string, number, LucideIcon]> = [
    ["Funnel families", salesFunnels.length, GitBranch],
    ["Service families", families.length, Layers3],
    ["30-day funnel events", interactions, MousePointerClick],
    ["30-day purchases", purchases, PackageCheck],
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Funnel System</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            GERU-informed funnel families, service routing, entry/exit points, offer coverage, and 30-day interaction signals.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/funnels">
            Public funnel library
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Digital Products Lessons Adopted</CardTitle>
          <CardDescription>
            Extracted from {lessons.sourceRepository} and applied as Erie.Pro funnel operating rules.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {lessons.adoptedPrinciples.map((principle) => (
            <div key={principle} className="rounded-md border bg-gray-50 p-3 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
              {principle}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map(([labelText, value, Icon]) => (
          <Card key={String(labelText)}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{String(labelText)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-3xl font-bold">
                <Icon className="h-6 w-6 text-teal-700" />
                {String(value)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Funnel Families</CardTitle>
          <CardDescription>
            {checkoutClicks > 0 ? `${checkoutClicks} checkout-related events in the last 30 days.` : "Checkout event tracking is ready for live traffic."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Funnel</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Temperature</TableHead>
                <TableHead>Primary offer</TableHead>
                <TableHead>Order bump</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesFunnels.map((funnel) => {
                const offerCoverage = coverage.find((item) => item.offer.slug === funnel.primaryOfferSlug)
                const bumpCoverage = coverage.find((item) => item.offer.slug === funnel.orderBumpSlug)
                return (
                  <TableRow key={funnel.slug}>
                    <TableCell>
                      <div className="font-medium">{funnel.title}</div>
                      <div className="max-w-xl text-xs text-gray-500">{funnel.purpose}</div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{label(funnel.primaryAudience)}</Badge></TableCell>
                    <TableCell><Badge variant="secondary">{label(funnel.temperature)}</Badge></TableCell>
                    <TableCell className="text-sm text-gray-600">{offerCoverage?.offer.title ?? "Behavioral / operational"}</TableCell>
                    <TableCell className="text-sm text-gray-600">{bumpCoverage?.offer.title ?? "None"}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/funnels/${funnel.slug}`}>Open</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Value Ladder and Sprint Model</CardTitle>
          <CardDescription>
            The offer ladder and one-project-at-a-time execution cadence now govern future Erie.Pro productized offers.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Value ladder</h2>
            <div className="space-y-2">
              {lessons.valueLadder.map((rung) => (
                <div key={rung.rung} className="rounded-md border p-3 text-sm dark:border-gray-800">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-gray-900 dark:text-white">{rung.rung}</span>
                    <Badge variant="secondary">{rung.price}</Badge>
                  </div>
                  <p className="mt-1 text-gray-500 dark:text-gray-400">{rung.role}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Implementation sprint</h2>
            <div className="space-y-2">
              {lessons.sprintModel.map((item) => (
                <div key={item} className="rounded-md border p-3 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-300">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Service Family Routing</CardTitle>
          <CardDescription>Each service family receives a different provider journey and offer priority.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service family</TableHead>
                <TableHead className="text-right">Services</TableHead>
                <TableHead>Primary funnel sequence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {families.map((family) => (
                <TableRow key={family.family}>
                  <TableCell className="font-medium">{family.family}</TableCell>
                  <TableCell className="text-right">{family.count}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {family.primaryFunnels.map((funnel) => (
                        <Badge key={funnel} variant="secondary">{label(funnel)}</Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

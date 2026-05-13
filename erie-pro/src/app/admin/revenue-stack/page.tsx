import type { Metadata } from "next"
import { ArrowRight, CheckCircle2, CircleDashed, Database, GitBranch, LockKeyhole, Workflow } from "lucide-react"
import { automatedOffers, getOfferBySlug } from "@/lib/automated-offers"
import { prisma } from "@/lib/db"
import { revenueActionPlaybook } from "@/lib/revenue-actions"
import { getCoreEventPath, getRevenueToolStackSummary, revenueToolStack } from "@/lib/revenue-tool-stack"
import { getThriveCartReadiness } from "@/lib/thrivecart-readiness"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  title: "Revenue Tool Stack -- Erie.Pro Admin",
  robots: { index: false, follow: false },
}

function label(value: string) {
  return value.replace(/-/g, " ")
}

function statusVariant(status: string) {
  if (status === "active") return "default"
  if (status === "selective") return "secondary"
  return "outline"
}

function money(cents: number) {
  if (cents === 0) return "Free"
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100)
}

export default async function RevenueToolStackPage() {
  const summary = getRevenueToolStackSummary()
  const corePath = getCoreEventPath()
  const thriveCartOffers = automatedOffers.filter((offer) => offer.thriveCartFunnel)
  const readiness = getThriveCartReadiness()
  let actionCounts: Array<{ eventType: string; count: number }> = []
  let recentActions: Awaited<ReturnType<typeof prisma.offerInteraction.findMany>> = []
  try {
    [actionCounts, recentActions] = await Promise.all([
      Promise.all(revenueActionPlaybook.map(async (item) => ({
        eventType: `revenue_action.${item.outcome}`,
        count: await prisma.offerInteraction.count({ where: { eventType: `revenue_action.${item.outcome}` } }),
      }))),
      prisma.offerInteraction.findMany({
        where: { eventType: { startsWith: "revenue_action." } },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ])
  } catch {
    actionCounts = []
    recentActions = []
  }
  const countFor = (outcome: string) =>
    actionCounts.find((item) => item.eventType === `revenue_action.${outcome}`)?.count ?? 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Revenue Tool Stack</h1>
        <p className="mt-1 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
          Hub-and-spoke operating map for Erie.Pro: Neon is canonical, ThriveCart optimizes checkout revenue,
          Boost.space orchestrates syncs, SuiteDash manages operations, and selective tools are activated only when they have a clean job.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Tools mapped", summary.totalTools, Workflow],
          ["Active core tools", summary.activeTools, CheckCircle2],
          ["Selective tools", summary.selectiveTools, CircleDashed],
          ["Connected checkouts", `${readiness.connected}/${readiness.total}`, GitBranch],
        ].map(([title, value, Icon]) => {
          const Visual = Icon as typeof Workflow
          return (
            <Card key={String(title)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">{String(title)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-3xl font-bold">
                  <Visual className="h-6 w-6 text-teal-700" />
                  {String(value)}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Core Event Path</CardTitle>
          <CardDescription>No revenue event should be trapped in an external tool.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {corePath.map((step, index) => (
              <div key={step} className="rounded-md border bg-gray-50 p-4 text-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="mb-3 flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  {index === 2 ? <Database className="h-4 w-4 text-teal-700" /> : <ArrowRight className="h-4 w-4 text-teal-700" />}
                </div>
                <p className="font-medium text-gray-900 dark:text-white">{step}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deliver, Recover, Route, Learn</CardTitle>
          <CardDescription>
            Every revenue event now creates action records. Paid events deliver, lifecycle-risk events recover, every event routes and learns.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-4">
          {revenueActionPlaybook.map((item) => (
            <div key={item.outcome} className="rounded-md border bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold capitalize text-gray-900 dark:text-white">{item.outcome}</h2>
                <Badge>{countFor(item.outcome)}</Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">{item.description}</p>
              <p className="mt-3 text-xs font-medium text-gray-500">Owner: {item.defaultOwner}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Revenue Actions</CardTitle>
          <CardDescription>Newest planned actions created from checkout, lifecycle, and revenue events.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Outcome</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentActions.length > 0 ? recentActions.map((action) => (
                <TableRow key={action.id}>
                  <TableCell><Badge variant="secondary">{action.eventType.replace("revenue_action.", "")}</Badge></TableCell>
                  <TableCell>{action.serviceLabel ?? action.serviceSlug ?? "Not captured"}</TableCell>
                  <TableCell className="text-sm text-gray-600">{action.sourcePageType ?? "revenue event"}</TableCell>
                  <TableCell className="text-sm text-gray-500">{action.createdAt.toLocaleString()}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center text-sm text-gray-500">
                    Revenue action tracking is ready; records will appear as ThriveCart and funnel events arrive.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tool Roles</CardTitle>
          <CardDescription>Each owned tool has one clear job, activation rule, and fallback.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tool</TableHead>
                <TableHead>Phase</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Activation rule</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {revenueToolStack.map((tool) => (
                <TableRow key={tool.id}>
                  <TableCell>
                    <div className="font-medium">{tool.name}</div>
                    <div className="text-xs text-gray-500">{tool.ownerRole}</div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{label(tool.phase)}</Badge></TableCell>
                  <TableCell><Badge variant={statusVariant(tool.status)}>{label(tool.status)}</Badge></TableCell>
                  <TableCell className="max-w-md text-sm text-gray-600 dark:text-gray-300">{tool.job}</TableCell>
                  <TableCell className="max-w-sm text-sm text-gray-600 dark:text-gray-300">{tool.activationRule}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ThriveCart Revenue Architecture</CardTitle>
          <CardDescription>Paid offers now declare checkout, bump, upsell, downsell, recovery, coupons, affiliates, and fulfillment channels.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Offer</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Order bump</TableHead>
                <TableHead>Upsell</TableHead>
                <TableHead>Downsell</TableHead>
                <TableHead>Channels</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {thriveCartOffers.map((offer) => {
                const funnel = offer.thriveCartFunnel
                return (
                  <TableRow key={offer.slug}>
                    <TableCell>
                      <div className="font-medium">{offer.shortTitle}</div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <LockKeyhole className="h-3 w-3" />
                        {funnel?.productId}
                      </div>
                    </TableCell>
                    <TableCell>{money(offer.basePriceCents)}</TableCell>
                    <TableCell className="text-sm">{funnel?.orderBumpSlug ? getOfferBySlug(funnel.orderBumpSlug)?.shortTitle : "None"}</TableCell>
                    <TableCell className="text-sm">{funnel?.upsellSlug ? getOfferBySlug(funnel.upsellSlug)?.shortTitle : "None"}</TableCell>
                    <TableCell className="text-sm">{funnel?.downsellSlug ? getOfferBySlug(funnel.downsellSlug)?.shortTitle : "None"}</TableCell>
                    <TableCell>
                      <div className="flex max-w-md flex-wrap gap-1.5">
                        {(offer.fulfillmentChannels ?? []).map((channel) => (
                          <Badge key={`${offer.slug}-${channel.toolId}`} variant={channel.required ? "default" : "secondary"}>
                            {channel.toolId}
                          </Badge>
                        ))}
                      </div>
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
          <CardTitle>ThriveCart Checkout Readiness</CardTitle>
          <CardDescription>
            Local connection audit for product IDs, checkout URLs, success paths, bumps, upsells, downsells, coupons, and split-test targets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Offer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Success path</TableHead>
                <TableHead>Issues</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {readiness.items.map((item) => (
                <TableRow key={item.offerSlug}>
                  <TableCell>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-gray-500">{item.checkoutUrl}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.connected ? "default" : "destructive"}>
                      {item.connected ? "Connected" : "Needs work"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{item.successPath}</TableCell>
                  <TableCell>
                    <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                      {item.issues.length === 0 ? "Ready" : item.issues.map((issue) => (
                        <div key={`${item.offerSlug}-${issue.message}`}>
                          {issue.severity}: {issue.message}
                        </div>
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

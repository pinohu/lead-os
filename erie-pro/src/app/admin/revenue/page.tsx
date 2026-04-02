import Link from "next/link"
import type { Metadata } from "next"
import { prisma } from "@/lib/db"
import { niches } from "@/lib/niches"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Revenue Overview -- Admin",
  description: "MRR, ARR, and revenue breakdown by niche, tier, and provider.",
  robots: { index: false, follow: false },
}

export default async function AdminRevenuePage() {
  // Fetch all active providers and recent checkout sessions in parallel
  const [providers, checkoutSessions] = await Promise.all([
    prisma.provider.findMany({
      where: { subscriptionStatus: "active" },
      orderBy: { monthlyFee: "desc" },
    }),
    prisma.checkoutSession.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ])

  // Revenue calculations
  const totalMRR = providers.reduce((s, p) => s + p.monthlyFee, 0)
  const totalARR = totalMRR * 12
  const avgRevenuePerProvider = providers.length > 0 ? Math.round(totalMRR / providers.length) : 0
  const fullSoldMRR = niches.reduce((s, n) => s + n.monthlyFee, 0)

  // MRR by niche
  const mrrByNiche: Record<string, number> = {}
  for (const p of providers) {
    mrrByNiche[p.niche] = (mrrByNiche[p.niche] ?? 0) + p.monthlyFee
  }
  const sortedNicheMRR = Object.entries(mrrByNiche).sort((a, b) => b[1] - a[1])
  const maxNicheMRR = sortedNicheMRR.length > 0 ? sortedNicheMRR[0][1] : 1

  // MRR by tier
  const mrrByTier: Record<string, { count: number; revenue: number }> = {}
  for (const p of providers) {
    const tier = p.tier ?? "primary"
    if (!mrrByTier[tier]) mrrByTier[tier] = { count: 0, revenue: 0 }
    mrrByTier[tier].count++
    mrrByTier[tier].revenue += p.monthlyFee
  }

  // Unclaimed niches (revenue opportunities)
  const claimedSlugs = new Set(providers.map((p) => p.niche))
  const unclaimed = niches
    .filter((n) => !claimedSlugs.has(n.slug))
    .sort((a, b) => b.monthlyFee - a.monthlyFee)
  const missedMRR = unclaimed.reduce((s, n) => s + n.monthlyFee, 0)

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Revenue Overview
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Platform revenue metrics and opportunities
        </p>
      </div>

      {/* Top-Level Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Total MRR
          </p>
          <p className="mt-1 text-3xl font-bold text-green-600 dark:text-green-400">
            ${totalMRR.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            ARR
          </p>
          <p className="mt-1 text-3xl font-bold text-green-600 dark:text-green-400">
            ${totalARR.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Avg Revenue / Provider
          </p>
          <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
            ${avgRevenuePerProvider.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {providers.length} active provider{providers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Revenue if Fully Sold
          </p>
          <p className="mt-1 text-3xl font-bold text-blue-600 dark:text-blue-400">
            ${fullSoldMRR.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            all {niches.length} niches claimed
          </p>
        </div>
      </div>

      {/* MRR by Niche + MRR by Tier */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        {/* MRR by Niche */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
            MRR by Niche
          </h2>
          {sortedNicheMRR.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              No active subscriptions yet.
            </p>
          ) : (
            <div className="space-y-3">
              {sortedNicheMRR.map(([slug, mrr]) => {
                const nicheData = niches.find((n) => n.slug === slug)
                const pct = (mrr / maxNicheMRR) * 100
                return (
                  <div key={slug}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">
                        {nicheData?.icon} {nicheData?.label ?? slug}
                      </span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        ${mrr.toLocaleString()}/mo
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className="h-full rounded-full bg-green-500 dark:bg-green-400 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* MRR by Tier */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
            MRR by Tier
          </h2>
          {Object.keys(mrrByTier).length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              No active subscriptions yet.
            </p>
          ) : (
            <div className="space-y-4">
              {Object.entries(mrrByTier)
                .sort((a, b) => b[1].revenue - a[1].revenue)
                .map(([tier, data]) => (
                  <div
                    key={tier}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-semibold capitalize text-gray-900 dark:text-white">
                          {tier}
                        </span>
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          {data.count} provider{data.count !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                          ${data.revenue.toLocaleString()}/mo
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          ${(data.revenue * 12).toLocaleString()}/yr
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Provider Revenue Table */}
      <div className="mb-8 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-800 p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Provider Revenue
          </h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            All active providers with their monthly contribution
          </p>
        </div>
        {providers.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No active providers yet.
          </p>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="min-w-[640px] w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Provider
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Niche
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Tier
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Monthly Fee
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Payment
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {providers.map((p) => {
                  const nicheData = niches.find((n) => n.slug === p.niche)
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {p.businessName}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-gray-700 dark:text-gray-300">
                          {nicheData?.icon} {nicheData?.label ?? p.niche}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs font-medium capitalize text-gray-700 dark:text-gray-300">
                          {p.tier}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-green-600 dark:text-green-400">
                        ${p.monthlyFee.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/40 px-2 py-0.5 text-xs font-medium capitalize text-green-800 dark:text-green-300">
                          {p.subscriptionStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          p.stripeCustomerId
                            ? "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300"
                            : "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300"
                        }`}>
                          {p.stripeCustomerId ? "Stripe linked" : "No payment"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/providers/${p.id}`}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Revenue Opportunities */}
      <div className="mb-8 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-800 p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Revenue Opportunities
          </h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {unclaimed.length} unclaimed niches -- ${missedMRR.toLocaleString()}/mo
            revenue on the table
          </p>
        </div>
        {unclaimed.length === 0 ? (
          <p className="py-8 text-center text-sm text-green-600 dark:text-green-400 font-medium">
            All niches are claimed. Full revenue achieved.
          </p>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="min-w-[640px] w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Niche
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Monthly Fee
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Annual Value
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Avg Project Value
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {unclaimed.map((n) => (
                  <tr key={n.slug} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2 text-gray-900 dark:text-white">
                        <span className="text-lg">{n.icon}</span>
                        <span className="font-medium">{n.label}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-green-600 dark:text-green-400">
                      ${n.monthlyFee.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                      ${(n.monthlyFee * 12).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {n.avgProjectValue}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Checkout Sessions */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-800 p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Recent Checkout Sessions
          </h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Latest Stripe checkout activity
          </p>
        </div>
        {checkoutSessions.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No checkout sessions recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="min-w-[640px] w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Niche
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Provider Email
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {checkoutSessions.map((cs) => {
                  const statusColor =
                    cs.status === "completed"
                      ? "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300"
                      : cs.status === "pending"
                      ? "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300"
                      : cs.status === "expired"
                      ? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                      : "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300"
                  return (
                    <tr key={cs.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {cs.createdAt.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColor}`}>
                          {cs.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        <span className="capitalize">
                          {cs.sessionType.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          const nicheData = niches.find((n) => n.slug === cs.niche)
                          return (
                            <span className="text-gray-700 dark:text-gray-300">
                              {nicheData?.icon} {nicheData?.label ?? cs.niche}
                            </span>
                          )
                        })()}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {cs.providerEmail}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                        {cs.price != null ? `$${cs.price.toLocaleString()}` : cs.monthlyFee != null ? `$${cs.monthlyFee}/mo` : "--"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

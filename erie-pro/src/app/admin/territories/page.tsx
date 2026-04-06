import Link from "next/link"
import type { Metadata } from "next"
import { prisma } from "@/lib/db"
import { niches } from "@/lib/niches"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Territory Management -- Admin",
  description: "View all niches, claim status, and territory performance.",
  robots: { index: false, follow: false },
}

type FilterType = "all" | "claimed" | "available" | "paused"
type SortType = "name" | "fee" | "leads"

export default async function AdminTerritoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; sort?: string }>
}) {
  const params = await searchParams
  const filter = (params.filter || "all") as FilterType
  const sort = (params.sort || "name") as SortType

  // Fetch territories and banked leads in parallel
  const [territories, bankedCounts] = await Promise.all([
    prisma.territory.findMany({
      where: { deactivatedAt: null },
      include: {
        provider: {
          select: {
            id: true,
            businessName: true,
            subscriptionStatus: true,
            totalLeads: true,
            tier: true,
          },
        },
      },
    }),
    prisma.lead.groupBy({
      by: ["niche"],
      where: { routedToId: null },
      _count: { id: true },
    }),
  ])

  // Build lookup maps
  const territoryByNiche = new Map(
    territories.map((t) => [t.niche, t])
  )
  const bankedByNiche = new Map(
    bankedCounts.map((b) => [b.niche, b._count.id])
  )

  // Compute summary stats
  const claimed = niches.filter((n) => {
    const t = territoryByNiche.get(n.slug)
    return t && !t.isPaused
  }).length
  const paused = niches.filter((n) => {
    const t = territoryByNiche.get(n.slug)
    return t && t.isPaused
  }).length
  const available = niches.length - claimed - paused
  const totalPotentialMRR = niches.reduce((s, n) => s + n.monthlyFee, 0)

  // Build enriched card data
  type CardData = {
    slug: string
    label: string
    icon: string
    monthlyFee: number
    status: "claimed" | "available" | "paused"
    providerName?: string
    providerId?: string
    subscriptionStatus?: string
    tier?: string
    claimedDate?: Date
    leadCount?: number
    bankedLeads: number
  }

  let cards: CardData[] = niches.map((n) => {
    const t = territoryByNiche.get(n.slug)
    const banked = bankedByNiche.get(n.slug) ?? 0

    if (t && !t.isPaused) {
      return {
        slug: n.slug,
        label: n.label,
        icon: n.icon,
        monthlyFee: n.monthlyFee,
        status: "claimed" as const,
        providerName: t.provider?.businessName ?? "Unknown",
        providerId: t.provider?.id,
        subscriptionStatus: t.provider?.subscriptionStatus ?? "unknown",
        tier: t.provider?.tier ?? t.tier,
        claimedDate: t.activatedAt ?? undefined,
        leadCount: t.provider?.totalLeads ?? 0,
        bankedLeads: banked,
      }
    }

    if (t && t.isPaused) {
      return {
        slug: n.slug,
        label: n.label,
        icon: n.icon,
        monthlyFee: n.monthlyFee,
        status: "paused" as const,
        providerName: t.provider?.businessName ?? undefined,
        providerId: t.provider?.id,
        tier: t.provider?.tier ?? t.tier,
        bankedLeads: banked,
      }
    }

    return {
      slug: n.slug,
      label: n.label,
      icon: n.icon,
      monthlyFee: n.monthlyFee,
      status: "available" as const,
      bankedLeads: banked,
    }
  })

  // Apply filter
  if (filter === "claimed") cards = cards.filter((c) => c.status === "claimed")
  else if (filter === "available") cards = cards.filter((c) => c.status === "available")
  else if (filter === "paused") cards = cards.filter((c) => c.status === "paused")

  // Apply sort
  if (sort === "name") cards.sort((a, b) => a.label.localeCompare(b.label))
  else if (sort === "fee") cards.sort((a, b) => b.monthlyFee - a.monthlyFee)
  else if (sort === "leads") cards.sort((a, b) => (b.leadCount ?? b.bankedLeads) - (a.leadCount ?? a.bankedLeads))

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Territory Management
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-600">
          All {niches.length} niches and their claim status
        </p>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-600">
            Total Niches
          </p>
          <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
            {niches.length}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-600">
            Claimed
          </p>
          <p className="mt-1 text-3xl font-bold text-green-600 dark:text-green-400">
            {claimed}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-600">
            Available
          </p>
          <p className="mt-1 text-3xl font-bold text-blue-600 dark:text-blue-400">
            {available}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-600">
            Paused
          </p>
          <p className="mt-1 text-3xl font-bold text-amber-600 dark:text-amber-400">
            {paused}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-600">
            Potential MRR
          </p>
          <p className="mt-1 text-3xl font-bold text-green-600 dark:text-green-400">
            ${totalPotentialMRR.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-600">
            if all {niches.length} claimed
          </p>
        </div>
      </div>

      {/* Filters & Sort */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-1">
          {(["all", "claimed", "available", "paused"] as FilterType[]).map((f) => (
            <Link
              key={f}
              href={`/admin/territories?filter=${f}&sort=${sort}`}
              className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                filter === f
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : "text-gray-600 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {f}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-1">
          <span className="px-2 text-xs text-gray-500 dark:text-gray-600">Sort:</span>
          {([
            { key: "name", label: "Name" },
            { key: "fee", label: "Fee" },
            { key: "leads", label: "Leads" },
          ] as { key: SortType; label: string }[]).map((s) => (
            <Link
              key={s.key}
              href={`/admin/territories?filter=${filter}&sort=${s.key}`}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                sort === s.key
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : "text-gray-600 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Territory Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.slug}
            className={`rounded-lg border p-4 transition-colors ${
              card.status === "claimed"
                ? "border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/10"
                : card.status === "paused"
                ? "border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10"
                : "border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
            }`}
          >
            {/* Card header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{card.icon}</span>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {card.label}
                  </h3>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-600">
                    ${card.monthlyFee}/mo
                  </p>
                </div>
              </div>

              {/* Status badge */}
              {card.status === "claimed" && (
                <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/40 px-2 py-0.5 text-[10px] font-semibold text-green-800 dark:text-green-300">
                  Claimed
                </span>
              )}
              {card.status === "paused" && (
                <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:text-amber-300">
                  Paused
                </span>
              )}
              {card.status === "available" && (
                <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-[10px] font-semibold text-blue-800 dark:text-blue-300">
                  Available
                </span>
              )}
            </div>

            {/* Card body */}
            <div className="mt-3 space-y-1.5 text-xs">
              {card.status === "claimed" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-600">Provider</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {card.providerName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-600">Status</span>
                    <span className={`capitalize font-medium ${
                      card.subscriptionStatus === "active"
                        ? "text-green-600 dark:text-green-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`}>
                      {card.subscriptionStatus}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-600">Tier</span>
                    <span className="capitalize font-medium text-gray-900 dark:text-white">
                      {card.tier}
                    </span>
                  </div>
                  {card.claimedDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-600">Claimed</span>
                      <span className="text-gray-900 dark:text-white">
                        {card.claimedDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-600">Leads</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {card.leadCount}
                    </span>
                  </div>
                  {card.providerId && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <Link
                        href={`/admin/providers/${card.providerId}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline text-xs font-medium"
                      >
                        View Provider &rarr;
                      </Link>
                    </div>
                  )}
                </>
              )}

              {card.status === "paused" && (
                <>
                  {card.providerName && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-600">Provider</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {card.providerName}
                      </span>
                    </div>
                  )}
                  {card.tier && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-600">Tier</span>
                      <span className="capitalize font-medium text-gray-900 dark:text-white">
                        {card.tier}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-600">Banked leads</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {card.bankedLeads}
                    </span>
                  </div>
                </>
              )}

              {card.status === "available" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-600">Monthly fee</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      ${card.monthlyFee}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-600">Banked leads waiting</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {card.bankedLeads}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {cards.length === 0 && (
        <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-600">
          No territories match the selected filter.
        </div>
      )}
    </div>
  )
}

// erie-pro/src/scripts/audit-gbp-urls.ts
import dotenv from "dotenv"
dotenv.config({ path: ".env.production.local" })
dotenv.config({ path: ".env.local" })
import { prisma } from "@/lib/db"
import { getOutscraperApiKey } from "@/lib/outscraper"

async function main() {
  const total = await prisma.directoryListing.count({ where: { isActive: true } })
  const withPlaceId = await prisma.directoryListing.count({
    where: { isActive: true, googlePlaceId: { not: null } },
  })
  const withGbpUrl = await prisma.directoryListing.count({
    where: {
      isActive: true,
      googleBusinessUrl: { not: null },
      NOT: { googleBusinessUrl: "" },
    },
  })
  const missingGbp = await prisma.directoryListing.count({
    where: {
      isActive: true,
      googlePlaceId: { not: null },
      OR: [{ googleBusinessUrl: null }, { googleBusinessUrl: "" }],
    },
  })
  const byNiche = await prisma.directoryListing.groupBy({
    by: ["niche"],
    _count: { _all: true },
    where: { isActive: true },
  })

  const sample = await prisma.directoryListing.findMany({
    take: 5,
    where: { googlePlaceId: { not: null }, isActive: true },
    select: {
      businessName: true,
      niche: true,
      googlePlaceId: true,
      googleBusinessUrl: true,
      source: true,
    },
  })

  console.log(
    JSON.stringify(
      {
        totalActive: total,
        withGooglePlaceId: withPlaceId,
        withGoogleBusinessUrl: withGbpUrl,
        missingGoogleBusinessUrl: missingGbp,
        coveragePct:
          withPlaceId > 0 ? Number(((withGbpUrl / withPlaceId) * 100).toFixed(1)) : 0,
        outscraperApiKeyConfigured: Boolean(getOutscraperApiKey()),
        activeNiches: byNiche.length,
        topNiches: byNiche.sort((a, b) => b._count._all - a._count._all).slice(0, 10),
        sample,
      },
      null,
      2,
    ),
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

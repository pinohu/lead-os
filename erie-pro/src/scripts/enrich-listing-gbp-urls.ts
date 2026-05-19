// erie-pro/src/scripts/enrich-listing-gbp-urls.ts
// Backfill directory_listings.googleBusinessUrl from Outscraper (location_link) or place_id.
import dotenv from "dotenv"
dotenv.config({ path: ".env.production.local" })
dotenv.config({ path: ".env.local" })
//
// Usage:
//   OUTSCRAPER_API_KEY=... npx tsx src/scripts/enrich-listing-gbp-urls.ts
//   npx tsx src/scripts/enrich-listing-gbp-urls.ts --import=./exports/outscraper-gbp.json
//   npx tsx src/scripts/enrich-listing-gbp-urls.ts --dry-run --limit=50

import { readFileSync } from "fs"
import { prisma } from "@/lib/db"
import {
  buildGoogleBusinessUrlFromPlace,
  buildGoogleBusinessUrlFromPlaceId,
  isGoogleMapsUrl,
} from "@/lib/google-business-url"
import { getOutscraperApiKey, searchPlaces, type OutscraperPlace } from "@/lib/outscraper"

const dryRun = process.argv.includes("--dry-run")
const placeIdOnly = process.argv.includes("--place-id-only")
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="))
const importArg = process.argv.find((arg) => arg.startsWith("--import="))
const limit = limitArg ? Number(limitArg.split("=")[1]) : 0
const importPath = importArg?.split("=")[1]

type ImportRow = {
  place_id?: string
  googlePlaceId?: string
  location_link?: string
  link?: string
  googleBusinessUrl?: string
}

function normalizePlaceId(value: string | null | undefined) {
  if (!value?.trim()) return null
  const trimmed = value.trim()
  const nicheScoped = trimmed.match(/^(ChIJ[A-Za-z0-9_-]+):[a-z0-9-]+$/)
  if (nicheScoped) return nicheScoped[1]
  return trimmed
}

async function applyPlaceIdFallback() {
  const listings = await prisma.directoryListing.findMany({
    where: {
      isActive: true,
      googlePlaceId: { not: null },
      OR: [{ googleBusinessUrl: null }, { googleBusinessUrl: "" }],
    },
    select: { id: true, googlePlaceId: true, businessName: true, niche: true },
    orderBy: { updatedAt: "asc" },
    take: limit > 0 ? limit : undefined,
  })

  console.log(`Backfilling place_id GBP URLs for ${listings.length} listings...`)
  let updated = 0

  for (const listing of listings) {
    const placeId = normalizePlaceId(listing.googlePlaceId)
    const url = buildGoogleBusinessUrlFromPlaceId(placeId)
    if (!url) continue

    if (dryRun) {
      console.log(`  [dry-run] ${listing.niche}/${listing.businessName} → ${url}`)
      updated++
      continue
    }

    await prisma.directoryListing.update({
      where: { id: listing.id },
      data: { googleBusinessUrl: url },
    })
    updated++
  }

  console.log(`Place-id fallback complete: ${updated} listings updated.`)
}

function urlFromImportRow(row: ImportRow) {
  if (isGoogleMapsUrl(row.googleBusinessUrl)) return row.googleBusinessUrl!.trim()
  return buildGoogleBusinessUrlFromPlace({
    place_id: row.place_id ?? row.googlePlaceId,
    location_link: row.location_link,
    link: row.link,
  })
}

async function applyImportFile(path: string) {
  const raw = JSON.parse(readFileSync(path, "utf8")) as ImportRow[] | { data?: ImportRow[] }
  const rows = Array.isArray(raw) ? raw : (raw.data ?? [])
  let updated = 0
  let skipped = 0

  for (const row of rows) {
    const placeId = normalizePlaceId(row.place_id ?? row.googlePlaceId)
    const url = urlFromImportRow(row)
    if (!placeId || !url) {
      skipped++
      continue
    }

    if (dryRun) {
      updated++
      continue
    }

    const result = await prisma.directoryListing.updateMany({
      where: {
        OR: [{ googlePlaceId: placeId }, { googlePlaceId: { endsWith: `:${placeId}` } }],
      },
      data: { googleBusinessUrl: url },
    })
    if (result.count > 0) updated += result.count
    else skipped++
  }

  console.log(`Import complete: ${updated} listing rows updated, ${skipped} skipped.`)
}

async function applyOutscraperApi() {
  if (placeIdOnly) {
    await applyPlaceIdFallback()
    return
  }

  const apiKey = getOutscraperApiKey()
  if (!apiKey) {
    console.warn("OUTSCRAPER_API_KEY is not set — using place_id fallback URLs only.")
    await applyPlaceIdFallback()
    return
  }

  const listings = await prisma.directoryListing.findMany({
    where: {
      isActive: true,
      googlePlaceId: { not: null },
      OR: [{ googleBusinessUrl: null }, { googleBusinessUrl: "" }],
    },
    select: { id: true, googlePlaceId: true, businessName: true, niche: true },
    orderBy: { updatedAt: "asc" },
    take: limit > 0 ? limit : undefined,
  })

  console.log(`Enriching GBP URLs for ${listings.length} listings via Outscraper...`)

  const batchSize = 20
  let updated = 0
  let apiCalls = 0

  for (let index = 0; index < listings.length; index += batchSize) {
    const batch = listings.slice(index, index + batchSize)
    const queries = batch
      .map((listing) => normalizePlaceId(listing.googlePlaceId))
      .filter((placeId): placeId is string => Boolean(placeId))

    if (queries.length === 0) continue

    const places = await searchPlaces(queries, 1)
    apiCalls++

    const byPlaceId = new Map<string, OutscraperPlace>()
    for (const place of places) {
      if (place.place_id) byPlaceId.set(place.place_id, place)
    }

    for (const listing of batch) {
      const placeId = normalizePlaceId(listing.googlePlaceId)
      if (!placeId) continue

      const place = byPlaceId.get(placeId)
      const url =
        (place ? buildGoogleBusinessUrlFromPlace(place) : null) ??
        buildGoogleBusinessUrlFromPlaceId(placeId)

      if (!url) continue

      if (dryRun) {
        console.log(`  [dry-run] ${listing.niche}/${listing.businessName} → ${url}`)
        updated++
        continue
      }

      await prisma.directoryListing.update({
        where: { id: listing.id },
        data: { googleBusinessUrl: url },
      })
      updated++
    }

    process.stdout.write(".")
  }

  console.log(`\nDone: ${updated} updated, ${apiCalls} Outscraper call(s).`)
}

async function main() {
  if (importPath) {
    await applyImportFile(importPath)
    return
  }
  await applyOutscraperApi()
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

#!/usr/bin/env npx tsx
// ── Directory Listing Scraper (Outscraper) ──────────────────────────
// Scrapes service provider listings from Google Maps via Outscraper API.
// Outscraper returns full business details in the search response —
// no separate detail call needed. ~2 API calls per niche instead of ~25+.
//
// Usage:
//   npx tsx src/scripts/scrape-google-places.ts                      # All niches
//   npx tsx src/scripts/scrape-google-places.ts --niche=plumbing     # Single niche
//   npx tsx src/scripts/scrape-google-places.ts --niches=plumbing,hvac # Specific list
//   npx tsx src/scripts/scrape-google-places.ts --new-only           # Newly added niches only
//   npx tsx src/scripts/scrape-google-places.ts --refresh-older-than=30  # Refresh stale
//   npx tsx src/scripts/scrape-google-places.ts --dry-run --niche=plumbing # Preview scrape

import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
dotenv.config({ path: ".env" })

function firstNonEmptyEnv(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim()
    if (value) return value
  }
  return ""
}

process.env.OUTSCRAPER_API_KEY = firstNonEmptyEnv(
  "OUTSCRAPER_API_KEY",
  "OUTSCRAPER_API_KEY_POLYCARPOHU",
  "OUTSCRAPER_NEATCIRCLEMEDIA_API_KEY",
  "OUTSCRAPER_X_API_KEY_1",
  "OUTSCRAPER_X_API_KEY_2"
)

import { PrismaClient } from "../generated/prisma"
import { PrismaPg } from "@prisma/adapter-pg"
import { additionalNicheSlugs } from "../lib/additional-niches"
import { niches } from "../lib/niches"
import {
  searchPlaces,
  getReviews,
  mapToDirectoryListing,
  distanceKm,
} from "../lib/outscraper"

// ── DB setup (standalone script, not using Next.js runtime) ───────

const connectionString =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL

if (!connectionString) {
  console.error("❌ DATABASE_URL is not set.")
  process.exit(1)
}

if (!process.env.OUTSCRAPER_API_KEY) {
  console.error("❌ OUTSCRAPER_API_KEY is not set.")
  process.exit(1)
}

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

// ── Erie coordinates ──────────────────────────────────────────────

const ERIE_LAT = 42.1292
const ERIE_LNG = -80.0851
const MAX_DISTANCE_KM = 40

// ── CLI args ──────────────────────────────────────────────────────

const args = process.argv.slice(2)
const nicheFilter = args.find((a) => a.startsWith("--niche="))?.split("=")[1]
const nicheListFilter = args
  .find((a) => a.startsWith("--niches="))
  ?.split("=")[1]
  ?.split(",")
  .map((slug) => slug.trim())
  .filter(Boolean)
const newOnly = args.includes("--new-only")
const refreshOlderThan = parseInt(
  args.find((a) => a.startsWith("--refresh-older-than="))?.split("=")[1] ?? "0",
  10
)
const resultLimit = parseInt(
  args.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? "20",
  10
)
const maxDistanceKm = parseInt(
  args.find((a) => a.startsWith("--max-distance-km="))?.split("=")[1] ?? String(MAX_DISTANCE_KM),
  10
)
const dryRun = args.includes("--dry-run")
const skipReviews = args.includes("--skip-reviews")

// ── Slug generation (mirrors directory-store.ts) ──────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
}

// ── Delay helper ──────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function nicheScopedGooglePlaceId(placeId: string, nicheSlug: string) {
  return `${placeId}:${nicheSlug}`
}

// ── Main ──────────────────────────────────────────────────────────

async function main() {
  const targetNiches = nicheFilter
    ? niches.filter((n) => n.slug === nicheFilter)
    : nicheListFilter?.length
      ? niches.filter((n) => nicheListFilter.includes(n.slug))
      : newOnly
        ? niches.filter((n) => additionalNicheSlugs.includes(n.slug))
        : niches

  if (targetNiches.length === 0) {
    console.error(`❌ Niche "${nicheFilter}" not found.`)
    if (nicheListFilter?.length) console.error(`Niche list filter: ${nicheListFilter.join(", ")}`)
    if (newOnly) console.error("New-only filter requested.")
    process.exit(1)
  }

  console.log(`\n🔍 Scraping ${targetNiches.length} niche(s) in Erie, PA via Outscraper\n`)
  console.log(`Options: limit=${resultLimit}, maxDistanceKm=${maxDistanceKm}, dryRun=${dryRun}, skipReviews=${skipReviews}`)

  let totalCreated = 0
  let totalUpdated = 0
  let totalFiltered = 0
  let totalApiCalls = 0

  for (const niche of targetNiches) {
    console.log(`\n── ${niche.icon} ${niche.label} (${niche.slug}) ──`)

    // Build search queries from niche search terms
    const queries = [
      `${niche.searchTerms[0]} in Erie, PA`,
      ...(niche.searchTerms[1] ? [`${niche.searchTerms[1]} Erie PA`] : []),
      `${niche.label} near Erie PA`,
    ]

    // ── Step 1: Search (1 batched API call) ──────────────────────
    let places = await searchPlaces(queries, resultLimit)
    totalApiCalls++

    console.log(`  Found ${places.length} unique places from ${queries.length} queries`)

    // ── Step 2: Distance filter ──────────────────────────────────
    let filtered = 0
    places = places.filter((place) => {
      if (place.latitude && place.longitude) {
        const dist = distanceKm(ERIE_LAT, ERIE_LNG, place.latitude, place.longitude)
        if (dist > maxDistanceKm) {
          filtered++
          return false
        }
      }
      return true
    })

    if (filtered > 0) {
      console.log(`  Filtered ${filtered} places beyond ${maxDistanceKm}km`)
    }

    if (niche.slug === "ev-charger-installation") {
      const beforeEvIntentFilter = places.length
      places = places.filter((place) => {
        const text = [
          place.name,
          place.category,
          place.subtypes,
          place.description,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()

        const isStationOnly =
          text.includes("charging station") &&
          !text.includes("electrician") &&
          !text.includes("contractor") &&
          !text.includes("installation") &&
          !text.includes("installer")

        return !isStationOnly
      })

      const removedStationOnly = beforeEvIntentFilter - places.length
      if (removedStationOnly > 0) {
        console.log(`  Filtered ${removedStationOnly} EV charging-station-only results`)
      }
    }

    // ── Step 3: Check freshness & upsert ─────────────────────────
    let created = 0
    let updated = 0

    for (const place of places) {
      // If refreshing, skip recently scraped listings
      if (refreshOlderThan > 0) {
        const existing = await prisma.directoryListing.findFirst({
          where: {
            niche: niche.slug,
            googlePlaceId: {
              in: [place.place_id, nicheScopedGooglePlaceId(place.place_id, niche.slug)],
            },
          },
          select: { lastScrapedAt: true },
        })
        if (existing?.lastScrapedAt) {
          const daysSince =
            (Date.now() - existing.lastScrapedAt.getTime()) / (1000 * 60 * 60 * 24)
          if (daysSince < refreshOlderThan) {
            continue // Still fresh
          }
        }
      }

      const data = mapToDirectoryListing(place, niche.slug)
      const slug = slugify(
        `${place.name}-${niche.slug}-${place.city ?? "erie"}`
      )

      if (dryRun) {
        process.stdout.write(data.photoRefs?.length ? "p" : ".")
        continue
      }

      // Check if this provider is already represented in this service directory.
      // The same real business can appear in multiple service directories; when a
      // Google place id is already owned by another niche, store a niche-scoped id.
      const googlePlaceId = nicheScopedGooglePlaceId(place.place_id, niche.slug)
      const existing = await prisma.directoryListing.findFirst({
        where: {
          niche: niche.slug,
          googlePlaceId: {
            in: [place.place_id, googlePlaceId],
          },
        },
      })

      if (existing) {
        await prisma.directoryListing.update({
          where: { id: existing.id },
          data: {
            businessName: data.businessName,
            phone: data.phone,
            email: data.email,
            website: data.website,
            addressStreet: data.addressStreet,
            addressCity: data.addressCity,
            addressState: data.addressState,
            addressZip: data.addressZip,
            addressFormatted: data.addressFormatted,
            latitude: data.latitude,
            longitude: data.longitude,
            description: data.description,
            rating: data.rating,
            reviewCount: data.reviewCount ?? 0,
            priceLevel: data.priceLevel,
            hoursJson: data.hoursJson as object | undefined,
            categories: data.categories ?? [],
            photoRefs: data.photoRefs ?? [],
            lastScrapedAt: new Date(),
            isActive: true,
          },
        })
        updated++
        process.stdout.write("↻")
      } else {
        // Handle slug collision
        let finalSlug = slug
        let attempt = 0
        while (
          await prisma.directoryListing.findUnique({
            where: { slug: finalSlug },
          })
        ) {
          attempt++
          finalSlug = `${slug}-${attempt}`
        }

        const exactPlaceIdOwner = await prisma.directoryListing.findUnique({
          where: { googlePlaceId: place.place_id },
          select: { niche: true },
        })

        await prisma.directoryListing.create({
          data: {
            slug: finalSlug,
            googlePlaceId: exactPlaceIdOwner ? googlePlaceId : place.place_id,
            businessName: data.businessName,
            niche: niche.slug,
            phone: data.phone,
            email: data.email,
            website: data.website,
            addressStreet: data.addressStreet,
            addressCity: data.addressCity,
            addressState: data.addressState,
            addressZip: data.addressZip,
            addressFormatted: data.addressFormatted,
            latitude: data.latitude,
            longitude: data.longitude,
            description: data.description,
            rating: data.rating,
            reviewCount: data.reviewCount ?? 0,
            priceLevel: data.priceLevel,
            hoursJson: data.hoursJson as object | undefined,
            categories: data.categories ?? [],
            photoRefs: data.photoRefs ?? [],
            servicesOffered: [],
            source: "outscraper",
            isActive: true,
            lastScrapedAt: new Date(),
          },
        })
        created++
        process.stdout.write("+")
      }
    }

    // ── Step 4: Fetch reviews (1 API call per niche) ─────────────
    const placeIdsForReviews = places
      .filter((p) => (p.reviews ?? 0) > 0)
      .map((p) => p.place_id)

    if (!dryRun && !skipReviews && placeIdsForReviews.length > 0) {
      console.log(`\n  Fetching reviews for ${placeIdsForReviews.length} places...`)
      try {
        const reviewsMap = await getReviews(placeIdsForReviews, 5)
        totalApiCalls++

        let reviewsUpdated = 0
        for (const [placeId, reviews] of reviewsMap) {
          if (reviews.length === 0) continue
          const cleanReviews = reviews
            .filter((r) => r.review_text)
            .slice(0, 5)
            .map((r) => ({
              author: r.author_title ?? "Anonymous",
              rating: r.review_rating ?? 0,
              text: r.review_text ?? "",
              relativeTime: "",
              publishTime: r.review_datetime_utc ?? "",
            }))

          if (cleanReviews.length > 0) {
            await prisma.directoryListing.updateMany({
              where: {
                OR: [
                  { googlePlaceId: placeId },
                  { googlePlaceId: { startsWith: `${placeId}:` } },
                ],
              },
              data: { reviewsJson: cleanReviews },
            })
            reviewsUpdated++
          }
        }
        console.log(`  Updated reviews for ${reviewsUpdated} listings`)
      } catch (err) {
        console.warn(`  ⚠️ Review fetch failed (non-fatal):`, err)
      }
    }

    console.log(
      `\n  ✅ ${niche.slug}: ${created} new, ${updated} updated, ${filtered} filtered`
    )
    totalCreated += created
    totalUpdated += updated
    totalFiltered += filtered

    // Brief pause between niches to be kind to the API
    await delay(500)
  }

  // Final summary
  console.log("\n" + "═".repeat(60))
  console.log(`📊 Scrape Complete`)
  console.log(`   Created:  ${totalCreated}`)
  console.log(`   Updated:  ${totalUpdated}`)
  console.log(`   Filtered: ${totalFiltered}`)
  console.log(`   API calls: ${totalApiCalls}`)

  const totalListings = await prisma.directoryListing.count({
    where: { isActive: true },
  })
  console.log(`   Total active listings in DB: ${totalListings}`)
  console.log("═".repeat(60) + "\n")
}

main()
  .catch((err) => {
    console.error("❌ Scraper failed:", err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

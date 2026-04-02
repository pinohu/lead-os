#!/usr/bin/env npx tsx
// ── Directory Listing Scraper (Outscraper) ──────────────────────────
// Scrapes service provider listings from Google Maps via Outscraper API.
// Outscraper returns full business details in the search response —
// no separate detail call needed. ~2 API calls per niche instead of ~25+.
//
// Usage:
//   npx tsx src/scripts/scrape-google-places.ts                      # All niches
//   npx tsx src/scripts/scrape-google-places.ts --niche=plumbing     # Single niche
//   npx tsx src/scripts/scrape-google-places.ts --refresh-older-than=30  # Refresh stale

import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
dotenv.config({ path: ".env" })

import { PrismaClient } from "../generated/prisma"
import { PrismaPg } from "@prisma/adapter-pg"
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
const prisma = new PrismaClient({ adapter }) as unknown as PrismaClient

// ── Erie coordinates ──────────────────────────────────────────────

const ERIE_LAT = 42.1292
const ERIE_LNG = -80.0851
const MAX_DISTANCE_KM = 40

// ── CLI args ──────────────────────────────────────────────────────

const args = process.argv.slice(2)
const nicheFilter = args.find((a) => a.startsWith("--niche="))?.split("=")[1]
const refreshOlderThan = parseInt(
  args.find((a) => a.startsWith("--refresh-older-than="))?.split("=")[1] ?? "0",
  10
)

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

// ── Main ──────────────────────────────────────────────────────────

async function main() {
  const targetNiches = nicheFilter
    ? niches.filter((n) => n.slug === nicheFilter)
    : niches

  if (targetNiches.length === 0) {
    console.error(`❌ Niche "${nicheFilter}" not found.`)
    process.exit(1)
  }

  console.log(`\n🔍 Scraping ${targetNiches.length} niche(s) in Erie, PA via Outscraper\n`)

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
    let places = await searchPlaces(queries, 20)
    totalApiCalls++

    console.log(`  Found ${places.length} unique places from ${queries.length} queries`)

    // ── Step 2: Distance filter ──────────────────────────────────
    let filtered = 0
    places = places.filter((place) => {
      if (place.latitude && place.longitude) {
        const dist = distanceKm(ERIE_LAT, ERIE_LNG, place.latitude, place.longitude)
        if (dist > MAX_DISTANCE_KM) {
          filtered++
          return false
        }
      }
      return true
    })

    if (filtered > 0) {
      console.log(`  Filtered ${filtered} places beyond ${MAX_DISTANCE_KM}km`)
    }

    // ── Step 3: Check freshness & upsert ─────────────────────────
    let created = 0
    let updated = 0

    for (const place of places) {
      // If refreshing, skip recently scraped listings
      if (refreshOlderThan > 0) {
        const existing = await prisma.directoryListing.findUnique({
          where: { googlePlaceId: place.place_id },
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

      // Check if listing already exists
      const existing = await prisma.directoryListing.findUnique({
        where: { googlePlaceId: place.place_id },
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

        await prisma.directoryListing.create({
          data: {
            slug: finalSlug,
            googlePlaceId: place.place_id,
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

    if (placeIdsForReviews.length > 0) {
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
              where: { googlePlaceId: placeId },
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

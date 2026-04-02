#!/usr/bin/env npx tsx
// ── Google Places Scraper ─────────────────────────────────────────
// Scrapes service provider listings from Google Places for all 44 niches.
//
// Usage:
//   npx tsx src/scripts/scrape-google-places.ts                      # All niches
//   npx tsx src/scripts/scrape-google-places.ts --niche=plumbing     # Single niche
//   npx tsx src/scripts/scrape-google-places.ts --refresh-older-than=30  # Refresh stale

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { PrismaClient } from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { niches } from "../lib/niches";
import {
  searchPlaces,
  getPlaceDetails,
  parseAddress,
  normalizePhone,
  parsePriceLevel,
  extractReviews,
  extractHours,
  distanceKm,
  delay,
} from "../lib/google-places";

// ── DB setup (standalone script, not using Next.js runtime) ───────

const connectionString =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL is not set.");
  process.exit(1);
}

if (!process.env.GOOGLE_PLACES_API_KEY) {
  console.error("❌ GOOGLE_PLACES_API_KEY is not set.");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter }) as unknown as PrismaClient;

// ── Erie coordinates ──────────────────────────────────────────────

const ERIE_LAT = 42.1292;
const ERIE_LNG = -80.0851;
const MAX_DISTANCE_KM = 40; // Filter out results beyond 40km
const SEARCH_RADIUS_M = 30000;

// ── CLI args ──────────────────────────────────────────────────────

const args = process.argv.slice(2);
const nicheFilter = args.find((a) => a.startsWith("--niche="))?.split("=")[1];
const refreshOlderThan = parseInt(
  args.find((a) => a.startsWith("--refresh-older-than="))?.split("=")[1] ?? "0",
  10
);

// ── Slug generation (mirrors directory-store.ts) ──────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

// ── Main ──────────────────────────────────────────────────────────

async function main() {
  const targetNiches = nicheFilter
    ? niches.filter((n) => n.slug === nicheFilter)
    : niches;

  if (targetNiches.length === 0) {
    console.error(`❌ Niche "${nicheFilter}" not found.`);
    process.exit(1);
  }

  console.log(`\n🔍 Scraping ${targetNiches.length} niche(s) in Erie, PA\n`);

  let totalCreated = 0;
  let totalUpdated = 0;
  let totalFiltered = 0;
  let totalApiCalls = 0;

  for (const niche of targetNiches) {
    console.log(`\n── ${niche.icon} ${niche.label} (${niche.slug}) ──`);

    // Build search queries from niche search terms
    const queries = [
      `${niche.searchTerms[0]} in Erie, PA`,
      ...(niche.searchTerms[1] ? [`${niche.searchTerms[1]} Erie PA`] : []),
      `${niche.label} near Erie PA`,
    ];

    // Collect all results, dedupe by placeId
    const placeMap = new Map<string, { id: string; displayName: { text: string } }>();

    for (const query of queries) {
      const results = await searchPlaces(query, ERIE_LAT, ERIE_LNG, SEARCH_RADIUS_M);
      totalApiCalls++;
      for (const place of results) {
        if (place.id && !placeMap.has(place.id)) {
          placeMap.set(place.id, place);
        }
      }
      await delay(200);
    }

    console.log(`  Found ${placeMap.size} unique places from ${queries.length} searches`);

    let created = 0;
    let updated = 0;
    let filtered = 0;

    for (const [placeId] of placeMap) {
      // If refreshing, skip recently scraped listings
      if (refreshOlderThan > 0) {
        const existing = await prisma.directoryListing.findUnique({
          where: { googlePlaceId: placeId },
          select: { lastScrapedAt: true },
        });
        if (existing?.lastScrapedAt) {
          const daysSince =
            (Date.now() - existing.lastScrapedAt.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSince < refreshOlderThan) {
            continue; // Skip, still fresh
          }
        }
      }

      // Fetch full details
      const details = await getPlaceDetails(placeId);
      totalApiCalls++;
      await delay(200);

      if (!details) {
        filtered++;
        continue;
      }

      // Quality filter: distance from Erie
      if (details.location) {
        const dist = distanceKm(
          ERIE_LAT,
          ERIE_LNG,
          details.location.latitude,
          details.location.longitude
        );
        if (dist > MAX_DISTANCE_KM) {
          filtered++;
          continue;
        }
      }

      // Parse structured data
      const addr = parseAddress(details.addressComponents);
      const phone = normalizePhone(details.nationalPhoneNumber);
      const reviews = extractReviews(details.reviews);
      const hours = extractHours(details.regularOpeningHours);
      const photoRefs = (details.photos ?? []).slice(0, 8).map((p) => p.name);

      const slug = slugify(
        `${details.displayName.text}-${niche.slug}-${addr.city ?? "erie"}`
      );

      // Handle slug collision
      let finalSlug = slug;
      let attempt = 0;
      const existingByPlace = await prisma.directoryListing.findUnique({
        where: { googlePlaceId: placeId },
      });

      if (existingByPlace) {
        // Update existing
        await prisma.directoryListing.update({
          where: { id: existingByPlace.id },
          data: {
            businessName: details.displayName.text,
            phone,
            website: details.websiteUri ?? null,
            addressStreet: addr.street,
            addressCity: addr.city,
            addressState: addr.state,
            addressZip: addr.zip,
            addressFormatted: details.formattedAddress ?? null,
            latitude: details.location?.latitude ?? null,
            longitude: details.location?.longitude ?? null,
            description: details.editorialSummary?.text ?? null,
            rating: details.rating ?? null,
            reviewCount: details.userRatingCount ?? 0,
            priceLevel: parsePriceLevel(details.priceLevel),
            hoursJson: hours ?? undefined,
            categories: details.types ?? [],
            photoRefs,
            reviewsJson: reviews.length > 0 ? reviews : undefined,
            lastScrapedAt: new Date(),
            isActive: true,
          },
        });
        updated++;
        process.stdout.write("↻");
      } else {
        // Check for slug collision
        while (
          await prisma.directoryListing.findUnique({
            where: { slug: finalSlug },
          })
        ) {
          attempt++;
          finalSlug = `${slug}-${attempt}`;
        }

        await prisma.directoryListing.create({
          data: {
            slug: finalSlug,
            googlePlaceId: placeId,
            businessName: details.displayName.text,
            niche: niche.slug,
            phone,
            website: details.websiteUri ?? null,
            addressStreet: addr.street,
            addressCity: addr.city,
            addressState: addr.state,
            addressZip: addr.zip,
            addressFormatted: details.formattedAddress ?? null,
            latitude: details.location?.latitude ?? null,
            longitude: details.location?.longitude ?? null,
            description: details.editorialSummary?.text ?? null,
            rating: details.rating ?? null,
            reviewCount: details.userRatingCount ?? 0,
            priceLevel: parsePriceLevel(details.priceLevel),
            hoursJson: hours ?? undefined,
            categories: details.types ?? [],
            photoRefs,
            reviewsJson: reviews.length > 0 ? reviews : undefined,
            servicesOffered: [],
            source: "google_places",
            lastScrapedAt: new Date(),
          },
        });
        created++;
        process.stdout.write("+");
      }
    }

    console.log(
      `\n  ✅ ${niche.slug}: ${created} new, ${updated} updated, ${filtered} filtered`
    );
    totalCreated += created;
    totalUpdated += updated;
    totalFiltered += filtered;
  }

  // Final summary
  console.log("\n" + "═".repeat(60));
  console.log(`📊 Scrape Complete`);
  console.log(`   Created:  ${totalCreated}`);
  console.log(`   Updated:  ${totalUpdated}`);
  console.log(`   Filtered: ${totalFiltered}`);
  console.log(`   API calls: ${totalApiCalls}`);

  const totalListings = await prisma.directoryListing.count({
    where: { isActive: true },
  });
  console.log(`   Total active listings in DB: ${totalListings}`);
  console.log("═".repeat(60) + "\n");
}

main()
  .catch((err) => {
    console.error("❌ Scraper failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

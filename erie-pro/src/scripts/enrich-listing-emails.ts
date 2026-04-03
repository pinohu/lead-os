#!/usr/bin/env npx tsx
// ── Enrich Directory Listings with Emails ───────────────────────────
// Uses Outscraper's emailsAndContacts API to find business emails
// from websites already stored on directory listings.
//
// Usage:
//   npx tsx src/scripts/enrich-listing-emails.ts                    # All listings without email
//   npx tsx src/scripts/enrich-listing-emails.ts --niche=plumbing   # Single niche
//   npx tsx src/scripts/enrich-listing-emails.ts --limit=50         # Limit batch size

import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
dotenv.config({ path: ".env" })

import { PrismaClient } from "../generated/prisma"
import { PrismaPg } from "@prisma/adapter-pg"
import Outscraper from "outscraper"

// ── DB setup ──────────────────────────────────────────────────────

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
const client = new Outscraper(process.env.OUTSCRAPER_API_KEY)

// ── CLI args ──────────────────────────────────────────────────────

const args = process.argv.slice(2)
const nicheFilter = args.find((a) => a.startsWith("--niche="))?.split("=")[1]
const batchLimit = parseInt(
  args.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? "100",
  10
)

// ── Delay helper ──────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ── Main ──────────────────────────────────────────────────────────

async function main() {
  // Find listings with websites but no email
  const listings = await prisma.directoryListing.findMany({
    where: {
      isActive: true,
      email: null,
      website: { not: null },
      ...(nicheFilter ? { niche: nicheFilter } : {}),
    },
    select: {
      id: true,
      businessName: true,
      website: true,
      niche: true,
    },
    take: batchLimit,
    orderBy: { reviewCount: "desc" }, // Prioritize popular businesses
  })

  if (listings.length === 0) {
    console.log("✅ No listings need email enrichment.")
    return
  }

  console.log(`\n📧 Enriching ${listings.length} listings with emails\n`)

  // Process in batches of 25 (Outscraper limit)
  const BATCH_SIZE = 25
  let enriched = 0
  let failed = 0

  for (let i = 0; i < listings.length; i += BATCH_SIZE) {
    const batch = listings.slice(i, i + BATCH_SIZE)
    const websites = batch.map((l) => l.website!).filter(Boolean)

    if (websites.length === 0) continue

    console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${websites.length} websites...`)

    try {
      const response = await client.emailsAndContacts(websites)

      if (Array.isArray(response)) {
        for (let j = 0; j < response.length; j++) {
          const result = response[j]
          const listing = batch[j]
          if (!listing || !result) continue

          // Extract first valid email from contacts array
          // Outscraper returns: { contacts: [{ value: "email@example.com", full_name: "...", ... }] }
          const emails: string[] = []
          if (result.contacts && Array.isArray(result.contacts)) {
            for (const contact of result.contacts) {
              if (contact?.value && typeof contact.value === "string" && contact.value.includes("@")) {
                emails.push(contact.value)
              }
            }
          }

          const email = emails.find((e) =>
            typeof e === "string" && e.includes("@") && !e.includes("example.com")
          )

          if (email) {
            await prisma.directoryListing.update({
              where: { id: listing.id },
              data: { email },
            })
            enriched++
            process.stdout.write("✉")
          } else {
            process.stdout.write("·")
          }
        }
      }
    } catch (err) {
      console.warn(`\n  ⚠️ Batch failed:`, err)
      failed++
    }

    // Pause between batches
    if (i + BATCH_SIZE < listings.length) {
      await delay(1000)
    }
  }

  console.log(`\n\n${"═".repeat(50)}`)
  console.log(`📊 Email Enrichment Complete`)
  console.log(`   Enriched: ${enriched}`)
  console.log(`   No email found: ${listings.length - enriched - failed}`)
  console.log(`   Failed: ${failed}`)

  const totalWithEmail = await prisma.directoryListing.count({
    where: { isActive: true, email: { not: null } },
  })
  console.log(`   Total listings with email: ${totalWithEmail}`)
  console.log("═".repeat(50) + "\n")
}

main()
  .catch((err) => {
    console.error("❌ Enrichment failed:", err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

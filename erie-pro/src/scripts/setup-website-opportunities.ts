#!/usr/bin/env npx tsx

import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
dotenv.config({ path: ".env" })

import { Client } from "pg"
import { scoreWebsiteOpportunity } from "../lib/website-opportunities"
import type { DirectoryListing } from "../generated/prisma"
import { normalizePostgresSslMode } from "../lib/db-url"

const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL

if (!connectionString) {
  console.error("DATABASE_URL is not set.")
  process.exit(1)
}

const databaseUrl = connectionString

type ListingRow = DirectoryListing

async function main() {
  const client = new Client({ connectionString: normalizePostgresSslMode(databaseUrl) })
  await client.connect()

  await client.query(`
    CREATE TABLE IF NOT EXISTS website_opportunities (
      id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
      listing_id text NOT NULL UNIQUE REFERENCES directory_listings(id) ON DELETE CASCADE,
      status text NOT NULL DEFAULT 'needs_manual_review',
      score integer NOT NULL DEFAULT 0,
      package_key text NOT NULL DEFAULT 'starter-presence',
      qualification_notes text[] NOT NULL DEFAULT ARRAY[]::text[],
      contact_log jsonb NOT NULL DEFAULT '[]'::jsonb,
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      preview_created_at timestamptz,
      last_contacted_at timestamptz,
      claimed_at timestamptz,
      sold_at timestamptz,
      declined_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `)

  await client.query(`
    CREATE INDEX IF NOT EXISTS website_opportunities_status_idx
      ON website_opportunities(status);
  `)

  await client.query(`
    CREATE INDEX IF NOT EXISTS website_opportunities_score_idx
      ON website_opportunities(score DESC);
  `)

  const listings = await client.query<ListingRow>(`
    SELECT *
    FROM directory_listings
    WHERE "isActive" = true
      AND (website IS NULL OR btrim(website) = '')
  `)

  let created = 0
  let updated = 0

  for (const listing of listings.rows) {
    const result = scoreWebsiteOpportunity(listing)
    const response = await client.query(
      `
        INSERT INTO website_opportunities (
          listing_id, status, score, qualification_notes, metadata, preview_created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5::jsonb, CASE WHEN $2 = 'qualified' THEN now() ELSE NULL END, now())
        ON CONFLICT (listing_id) DO UPDATE
        SET score = EXCLUDED.score,
            qualification_notes = EXCLUDED.qualification_notes,
            metadata = website_opportunities.metadata || EXCLUDED.metadata,
            updated_at = now()
        RETURNING (xmax = 0) AS inserted
      `,
      [
        listing.id,
        result.status,
        result.score,
        result.notes,
        JSON.stringify({
          initialStatus: result.status,
          niche: listing.niche,
          reviewCount: listing.reviewCount,
          rating: listing.rating,
        }),
      ]
    )

    if (response.rows[0]?.inserted) created++
    else updated++
  }

  const summary = await client.query(`
    SELECT status, count(*)::int AS count
    FROM website_opportunities
    GROUP BY status
    ORDER BY count DESC, status
  `)

  console.log(`Website opportunities seeded from ${listings.rowCount} no-website listings.`)
  console.log(`Created: ${created}`)
  console.log(`Updated: ${updated}`)
  console.table(summary.rows)

  await client.end()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

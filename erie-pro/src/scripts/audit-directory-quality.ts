/**
 * Directory quality audit.
 *
 * Compares each active directory_listing's Google Places `categories`
 * (the source-of-truth signal returned by Outscraper) against an
 * expected set of category-keywords for the niche it's stored under.
 *
 * Produces two outputs:
 *
 *   1. `docs/qa/directory-quality-audit.json` — full list of suspect
 *      listings where the Google categories do not match any expected
 *      keyword for the niche. Used for human review; entries here are
 *      NOT auto-deactivated, since keyword-coverage gaps can produce
 *      false positives (e.g. "Law firm" not matching the "lawyer"
 *      keyword).
 *
 *   2. Console-printed deactivation set: a separate, narrower "hard
 *      anti-pattern" list that catches Google categories that are
 *      categorically incompatible with the niche (e.g. "Auto body
 *      shop" in storm-damage-repair, "Car wash" in pressure-washing).
 *      These are confidence-100 mis-categorizations.
 *
 * Run with:
 *   DATABASE_URL_UNPOOLED=postgres://... \
 *     npx tsx erie-pro/src/scripts/audit-directory-quality.ts
 *
 * Pass --apply to actually flip `isActive = false` on the hard-anti-
 * pattern matches. Without --apply the script is read-only.
 */

import { writeFileSync, mkdirSync } from "fs"
import { resolve, dirname } from "path"
import { erieDocsPath } from "./paths"
import { prisma } from "@/lib/db"
import {
  NICHE_EXPECTED_CATEGORIES as EXPECTED,
  NICHE_HARD_ANTI_PATTERNS as HARD_ANTI_PATTERNS,
} from "../lib/niche-category-map"

const apply = process.argv.includes("--apply")

type Listing = {
  id: string
  niche: string
  businessName: string
  categories: string[]
}

async function main() {
  const rows = (await prisma.directoryListing.findMany({
    where: { isActive: true },
    select: { id: true, niche: true, businessName: true, categories: true },
  })) as Listing[]

  console.log(`Audited ${rows.length} active listings.`)

  // ── Soft suspects: no positive keyword match ──
  const softSuspects: Listing[] = []
  for (const row of rows) {
    const exp = EXPECTED[row.niche]
    if (!exp) continue
    const cats = Array.isArray(row.categories)
      ? row.categories.map((c) => String(c).toLowerCase())
      : []
    if (cats.length === 0) continue
    const anyMatch = cats.some((cat) => exp.some((kw) => cat.includes(kw)))
    if (!anyMatch) softSuspects.push(row)
  }
  console.log(`Soft suspects (no positive keyword match): ${softSuspects.length}`)

  // ── Hard mismatches: anti-pattern hit AND no positive keyword match ──
  // The "no positive match" requirement is important: a legitimate auto
  // repair shop will often list "Car inspection station" as one of many
  // categories alongside "Auto repair shop". Without the positive-match
  // filter, the anti-pattern check would deactivate the real shop.
  const hardMismatches: Listing[] = []
  for (const row of rows) {
    const anti = HARD_ANTI_PATTERNS[row.niche]
    const exp = EXPECTED[row.niche]
    if (!anti || !exp) continue
    const cats = Array.isArray(row.categories)
      ? row.categories.map((c) => String(c).toLowerCase())
      : []
    const anyAntiHit = cats.some((cat) => anti.some((bad) => cat.includes(bad)))
    if (!anyAntiHit) continue
    const anyPositiveMatch = cats.some((cat) => exp.some((kw) => cat.includes(kw)))
    if (anyPositiveMatch) continue // Legit listing that happens to share a category
    hardMismatches.push(row)
  }
  console.log(`Hard mismatches (anti-pattern hit AND no positive match): ${hardMismatches.length}`)

  // ── Persist audit ──
  const outPath = erieDocsPath("qa", "directory-quality-audit.json")
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(
    outPath,
    JSON.stringify(
      {
        auditedAt: new Date().toISOString(),
        totalActive: rows.length,
        softSuspectCount: softSuspects.length,
        hardMismatchCount: hardMismatches.length,
        hardMismatches,
        softSuspects,
      },
      null,
      2,
    ),
  )
  console.log(`Wrote audit to ${outPath}`)

  // ── Print hard mismatches per niche ──
  const byNiche: Record<string, Listing[]> = {}
  for (const r of hardMismatches) {
    ;(byNiche[r.niche] ||= []).push(r)
  }
  console.log("")
  console.log("Hard mismatches per niche (these will be deactivated with --apply):")
  for (const [n, items] of Object.entries(byNiche).sort(
    (a, b) => b[1].length - a[1].length,
  )) {
    console.log(`  /${n} (${items.length}):`)
    for (const s of items) {
      console.log(`    - ${s.businessName} → ${JSON.stringify(s.categories).slice(0, 120)}`)
    }
  }

  if (apply && hardMismatches.length > 0) {
    const ids = hardMismatches.map((r) => r.id)
    const result = await prisma.directoryListing.updateMany({
      where: { id: { in: ids } },
      data: { isActive: false, updatedAt: new Date() },
    })
    console.log(`\nDeactivated ${result.count} listings.`)
  } else if (hardMismatches.length > 0) {
    console.log("\nRun with --apply to deactivate these listings.")
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

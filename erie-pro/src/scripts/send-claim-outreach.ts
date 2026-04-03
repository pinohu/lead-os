#!/usr/bin/env npx tsx
// ── Proactive Listing Claim Outreach ────────────────────────────────
// Sends claim-your-listing outreach emails to businesses that have
// an email on file but haven't claimed their listing yet.
//
// Usage:
//   npx tsx src/scripts/send-claim-outreach.ts                    # All eligible
//   npx tsx src/scripts/send-claim-outreach.ts --niche=plumbing   # Single niche
//   npx tsx src/scripts/send-claim-outreach.ts --limit=20         # Limit batch
//   npx tsx src/scripts/send-claim-outreach.ts --dry-run          # Preview only

import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
dotenv.config({ path: ".env" })

import { PrismaClient } from "../generated/prisma"
import { PrismaPg } from "@prisma/adapter-pg"

// ── DB setup ──────────────────────────────────────────────────────

const connectionString =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL

if (!connectionString) {
  console.error("❌ DATABASE_URL is not set.")
  process.exit(1)
}

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter }) as unknown as PrismaClient

// ── CLI args ──────────────────────────────────────────────────────

const args = process.argv.slice(2)
const nicheFilter = args.find((a) => a.startsWith("--niche="))?.split("=")[1]
const batchLimit = parseInt(
  args.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? "50",
  10
)
const dryRun = args.includes("--dry-run")

// ── Email sender (inline — script runs outside Next.js) ──────────

const EMAILIT_API_KEY = process.env.EMAILIT_API_KEY
const DOMAIN = process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, "") ?? "erie.pro"

async function sendOutreachEmail(
  to: string,
  businessName: string,
  niche: string,
  slug: string,
  leadCount: number
): Promise<boolean> {
  if (!EMAILIT_API_KEY) {
    console.log(`  [DRY-RUN] Would email ${to} for ${businessName}`)
    return true
  }

  const claimUrl = `https://${DOMAIN}/for-business/claim?listing=${slug}`
  const listingUrl = `https://${DOMAIN}/${niche}/${slug}`

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#374151">
  <h2 style="color:#111827;margin:0 0 16px">Your Business Is Listed on ${DOMAIN}</h2>
  <p>Hi <strong>${businessName}</strong> team,</p>
  <p>Your business has a free listing on <a href="${listingUrl}" style="color:#2563eb">${DOMAIN}</a> — Erie's local service directory.${leadCount > 0 ? ` <strong>${leadCount} potential customers</strong> have already searched for ${niche} services this month.` : ""}</p>
  <h3 style="color:#111827;font-size:16px;margin:24px 0 12px">Claim Your Listing (Free) to:</h3>
  <ul style="padding-left:20px;margin:0 0 24px">
    <li style="margin:8px 0">Receive lead details (name, phone, email) directly</li>
    <li style="margin:8px 0">Add photos, services, and business hours</li>
    <li style="margin:8px 0">Get a <strong>Verified Provider</strong> trust badge</li>
    <li style="margin:8px 0">Priority placement in search results</li>
  </ul>
  <a href="${claimUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600">Claim Your Free Listing</a>
  <p style="margin:24px 0 0;font-size:13px;color:#9ca3af">Your listing was created from publicly available Google business data. If you'd like it removed, reply to this email. Physical address: Erie, PA 16501.</p>
</body>
</html>`

  try {
    const res = await fetch("https://api.emailit.com/v1/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${EMAILIT_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${DOMAIN} <noreply@${DOMAIN}>`,
        to,
        subject: `${businessName} — your free listing on ${DOMAIN} is live`,
        html,
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

// ── Delay helper ──────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ── Main ──────────────────────────────────────────────────────────

async function main() {
  // Find unclaimed listings that have email and haven't been contacted
  const listings = await prisma.directoryListing.findMany({
    where: {
      isActive: true,
      email: { not: null },
      claimedByProviderId: null,
      ...(nicheFilter ? { niche: nicheFilter } : {}),
    },
    select: {
      id: true,
      businessName: true,
      email: true,
      niche: true,
      slug: true,
      reviewCount: true,
    },
    take: batchLimit,
    orderBy: { reviewCount: "desc" }, // Start with most reviewed
  })

  if (listings.length === 0) {
    console.log("✅ No eligible listings for outreach.")
    return
  }

  console.log(
    `\n📨 ${dryRun ? "[DRY RUN] " : ""}Sending claim outreach to ${listings.length} businesses\n`
  )

  let sent = 0
  let failed = 0

  for (const listing of listings) {
    if (!listing.email) continue

    const success = dryRun
      ? (console.log(`  📧 ${listing.businessName} (${listing.niche}) → ${listing.email}`), true)
      : await sendOutreachEmail(
          listing.email,
          listing.businessName,
          listing.niche,
          listing.slug,
          listing.reviewCount
        )

    if (success) {
      sent++
      if (!dryRun) process.stdout.write("✓")
    } else {
      failed++
      if (!dryRun) process.stdout.write("✗")
    }

    // Rate limit: 2 emails per second
    if (!dryRun) await delay(500)
  }

  console.log(`\n\n${"═".repeat(50)}`)
  console.log(`📊 Outreach ${dryRun ? "(Dry Run) " : ""}Complete`)
  console.log(`   Sent: ${sent}`)
  console.log(`   Failed: ${failed}`)
  console.log("═".repeat(50) + "\n")
}

main()
  .catch((err) => {
    console.error("❌ Outreach failed:", err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

/**
 * Stripe Product & Price Setup Script
 * ────────────────────────────────────
 * Creates Stripe Products (one per niche) and Prices (3 tiers per niche).
 *
 * Usage:
 *   npx tsx src/scripts/stripe-setup.ts
 *
 * Requires:
 *   STRIPE_SECRET_KEY environment variable (use test-mode key for dev)
 *
 * This script is idempotent — it checks for existing products by metadata
 * before creating new ones. Safe to run multiple times.
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import Stripe from "stripe";
import { niches } from "../lib/niches";

// ── Configuration ────────────────────────────────────────────────────

const TIER_MULTIPLIERS = {
  standard: 1.0,
  premium: 1.5,
  elite: 2.5,
} as const;

type Tier = keyof typeof TIER_MULTIPLIERS;
const TIERS: Tier[] = ["standard", "premium", "elite"];

// Lead purchase prices (one-time)
const LEAD_PRICES = {
  cold: 15,
  warm: 35,
  hot: 75,
  burning: 150,
} as const;

type LeadTemperature = keyof typeof LEAD_PRICES;

// ── Stripe Client ────────────────────────────────────────────────────

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  console.error(
    "❌ STRIPE_SECRET_KEY is required. Set it in your .env file or environment."
  );
  console.error(
    "   Use a test-mode key (sk_test_...) for development."
  );
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2025-03-31.basil" as Stripe.LatestApiVersion,
});

// ── Types ────────────────────────────────────────────────────────────

interface PriceMapping {
  niche: string;
  nicheLabel: string;
  productId: string;
  prices: Record<Tier, { priceId: string; amount: number }>;
}

interface LeadProductMapping {
  temperature: LeadTemperature;
  productId: string;
  priceId: string;
  amount: number;
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Erie Pro — Stripe Product & Price Setup");
  console.log(`   ${niches.length} niches × ${TIERS.length} tiers = ${niches.length * TIERS.length} subscription prices`);
  console.log(`   + ${Object.keys(LEAD_PRICES).length} lead purchase prices`);
  console.log("");

  // Check if we're in test mode
  const isTestMode = STRIPE_SECRET_KEY!.startsWith("sk_test_");
  console.log(`   Mode: ${isTestMode ? "🧪 TEST" : "🔴 LIVE"}`);
  if (!isTestMode) {
    console.log("   ⚠️  You are using a LIVE Stripe key. Products will be created in your live account.");
    console.log("   Press Ctrl+C within 5 seconds to abort...");
    await sleep(5000);
  }
  console.log("");

  // ── Create Territory Subscription Products ───────────────────────

  const priceMappings: PriceMapping[] = [];
  let created = 0;
  let skipped = 0;

  for (const niche of niches) {
    process.stdout.write(`  📦 ${niche.label} (${niche.slug})...`);

    // Check if product already exists (by metadata)
    const existing = await stripe.products.search({
      query: `metadata["erie_niche"]:"${niche.slug}"`,
    });

    let product: Stripe.Product;

    if (existing.data.length > 0) {
      product = existing.data[0];
      process.stdout.write(` exists (${product.id})\n`);
      skipped++;
    } else {
      product = await stripe.products.create({
        name: `Erie Pro — ${niche.label} Territory`,
        description: `Exclusive ${niche.label.toLowerCase()} territory in Erie, PA. ${niche.description}`,
        metadata: {
          erie_niche: niche.slug,
          erie_product_type: "territory_subscription",
          avg_project_value: niche.avgProjectValue,
        },
      });
      process.stdout.write(` created (${product.id})\n`);
      created++;
    }

    // Create prices for each tier
    const tierPrices: Record<Tier, { priceId: string; amount: number }> = {} as Record<Tier, { priceId: string; amount: number }>;

    for (const tier of TIERS) {
      const amount = Math.round(niche.monthlyFee * TIER_MULTIPLIERS[tier]);

      // Check for existing price
      const existingPrices = await stripe.prices.list({
        product: product.id,
        active: true,
        limit: 100,
      });

      const matchingPrice = existingPrices.data.find(
        (p) =>
          p.metadata?.erie_tier === tier &&
          p.unit_amount === amount * 100 &&
          p.recurring?.interval === "month"
      );

      if (matchingPrice) {
        tierPrices[tier] = { priceId: matchingPrice.id, amount };
        console.log(`    ├── ${tier}: $${amount}/mo (exists: ${matchingPrice.id})`);
      } else {
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: amount * 100, // cents
          currency: "usd",
          recurring: { interval: "month" },
          metadata: {
            erie_tier: tier,
            erie_niche: niche.slug,
            erie_multiplier: String(TIER_MULTIPLIERS[tier]),
          },
        });
        tierPrices[tier] = { priceId: price.id, amount };
        console.log(`    ├── ${tier}: $${amount}/mo → ${price.id}`);
      }
    }

    priceMappings.push({
      niche: niche.slug,
      nicheLabel: niche.label,
      productId: product.id,
      prices: tierPrices,
    });
  }

  // ── Create Lead Purchase Products ──────────────────────────────

  console.log("");
  console.log("  📬 Lead Purchase Products:");

  const leadMappings: LeadProductMapping[] = [];

  for (const [temp, amount] of Object.entries(LEAD_PRICES) as [LeadTemperature, number][]) {
    process.stdout.write(`    ${temp} ($${amount})...`);

    const existing = await stripe.products.search({
      query: `metadata["erie_lead_temperature"]:"${temp}"`,
    });

    let product: Stripe.Product;

    if (existing.data.length > 0) {
      product = existing.data[0];
      process.stdout.write(` exists (${product.id})\n`);
    } else {
      product = await stripe.products.create({
        name: `Erie Pro — ${temp.charAt(0).toUpperCase() + temp.slice(1)} Lead`,
        description: `Single ${temp} lead purchase from Erie Pro marketplace`,
        metadata: {
          erie_lead_temperature: temp,
          erie_product_type: "lead_purchase",
        },
      });
      process.stdout.write(` created (${product.id})\n`);
    }

    // Check for existing price
    const existingPrices = await stripe.prices.list({
      product: product.id,
      active: true,
      limit: 10,
    });

    const matchingPrice = existingPrices.data.find(
      (p) => p.unit_amount === amount * 100 && !p.recurring
    );

    let priceId: string;
    if (matchingPrice) {
      priceId = matchingPrice.id;
      console.log(`      price: $${amount} (exists: ${priceId})`);
    } else {
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: amount * 100,
        currency: "usd",
        metadata: {
          erie_lead_temperature: temp,
        },
      });
      priceId = price.id;
      console.log(`      price: $${amount} → ${priceId}`);
    }

    leadMappings.push({
      temperature: temp,
      productId: product.id,
      priceId,
      amount,
    });
  }

  // ── Output Summary ────────────────────────────────────────────

  console.log("");
  console.log("═══════════════════════════════════════════");
  console.log("✅ Setup Complete!");
  console.log(`   Products created: ${created}`);
  console.log(`   Products skipped (already exist): ${skipped}`);
  console.log(`   Total subscription prices: ${priceMappings.length * TIERS.length}`);
  console.log(`   Total lead prices: ${leadMappings.length}`);
  console.log("═══════════════════════════════════════════");
  console.log("");

  // Output the price mapping as a TypeScript constant for stripe-integration.ts
  console.log("📋 Price ID Mapping (copy to stripe-integration.ts if needed):");
  console.log("");
  console.log("const STRIPE_PRICE_IDS: Record<string, Record<string, string>> = {");
  for (const m of priceMappings) {
    console.log(`  "${m.niche}": {`);
    for (const tier of TIERS) {
      console.log(`    ${tier}: "${m.prices[tier].priceId}", // $${m.prices[tier].amount}/mo`);
    }
    console.log(`  },`);
  }
  console.log("};");
  console.log("");
  console.log("const STRIPE_LEAD_PRICE_IDS: Record<string, string> = {");
  for (const l of leadMappings) {
    console.log(`  ${l.temperature}: "${l.priceId}", // $${l.amount}`);
  }
  console.log("};");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});

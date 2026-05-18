/**
 * Script to create Stripe products for Transaction Coordination services
 * 
 * Usage:
 * 1. Set STRIPE_SECRET_KEY environment variable
 * 2. Run: deno run --allow-env --allow-net scripts/create-stripe-products.ts
 * 
 * This will create 3 products in Stripe and output the price IDs to update in tcPlans.ts
 */

import Stripe from "https://esm.sh/stripe@18.5.0";

const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

if (!stripeKey) {
  console.error("❌ ERROR: STRIPE_SECRET_KEY environment variable is not set");
  console.error("   Set it with: export STRIPE_SECRET_KEY=sk_test_...");
  Deno.exit(1);
}

const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

interface ProductConfig {
  name: string;
  description: string;
  amount: number; // in cents
}

const products: ProductConfig[] = [
  {
    name: "Transaction Coordination - Basic",
    description: "Essential coordination support for straightforward transactions. Perfect for simple real estate closings or standard contract executions.",
    amount: 29900, // $299.00
  },
  {
    name: "Transaction Coordination - Standard",
    description: "Comprehensive coordination for moderate complexity transactions. Includes document review, negotiation support, and multi-party coordination.",
    amount: 59900, // $599.00
  },
  {
    name: "Transaction Coordination - Premium",
    description: "White-glove coordination for complex, high-stakes transactions. Dedicated coordinator, expedited processing, and comprehensive support.",
    amount: 129900, // $1,299.00
  },
];

async function createProducts() {
  console.log("🚀 Creating Stripe products for Transaction Coordination...\n");

  const results: Array<{ name: string; priceId: string; productId: string }> = [];

  for (const product of products) {
    try {
      console.log(`📦 Creating: ${product.name}...`);

      // Create product
      const stripeProduct = await stripe.products.create({
        name: product.name,
        description: product.description,
      });

      // Create price for the product
      const stripePrice = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: product.amount,
        currency: "usd",
      });

      results.push({
        name: product.name,
        priceId: stripePrice.id,
        productId: stripeProduct.id,
      });

      console.log(`   ✅ Created: ${product.name}`);
      console.log(`   Product ID: ${stripeProduct.id}`);
      console.log(`   Price ID: ${stripePrice.id}\n`);
    } catch (error) {
      console.error(`   ❌ Error creating ${product.name}:`, error);
      if (error instanceof Error) {
        console.error(`   Message: ${error.message}`);
      }
    }
  }

  // Output results in a format ready to paste into tcPlans.ts
  console.log("\n" + "=".repeat(80));
  console.log("📋 COPY THESE PRICE IDs TO src/constants/tcPlans.ts:\n");
  console.log("=".repeat(80) + "\n");

  const planKeys = ["basic", "standard", "premium"];
  results.forEach((result, index) => {
    const planKey = planKeys[index];
    console.log(`${planKey}: {`);
    console.log(`  priceId: "${result.priceId}", // ${result.name}`);
    console.log(`  // ... rest of config`);
    console.log(`},`);
    console.log("");
  });

  console.log("=".repeat(80));
  console.log("\n✅ Done! Copy the price IDs above and update src/constants/tcPlans.ts");
  console.log("\n⚠️  Note: If you're in test mode, these are test price IDs.");
  console.log("   You'll need to create separate products in live mode when ready.\n");
}

// Check if we're in test mode or live mode
async function checkMode() {
  try {
    const account = await stripe.accounts.retrieve();
    console.log(`🔍 Stripe Mode: ${account.livemode ? "LIVE" : "TEST"}\n`);
  } catch {
    // If account retrieval fails, try to infer from key
    const isLive = stripeKey.startsWith("sk_live_");
    console.log(`🔍 Stripe Mode: ${isLive ? "LIVE" : "TEST"}\n`);
  }
}

// Run the script
checkMode()
  .then(() => createProducts())
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    Deno.exit(1);
  });


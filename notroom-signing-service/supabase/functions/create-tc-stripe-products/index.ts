/**
 * Edge Function to create Stripe products for Transaction Coordination
 * 
 * This function creates 3 products in Stripe and returns the price IDs.
 * 
 * Usage:
 * 1. Ensure STRIPE_SECRET_KEY is set in Supabase Edge Function secrets
 * 2. Invoke this function once (can be done via Supabase Dashboard or CLI)
 * 3. Copy the returned price IDs and update src/constants/tcPlans.ts
 * 
 * Note: This is a one-time setup function. After products are created,
 * you can delete or disable this function.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { validateApiKeyEnv } from "../_shared/envValidation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProductConfig {
  name: string;
  description: string;
  amount: number; // in cents
  planKey: string;
}

const products: ProductConfig[] = [
  {
    planKey: "basic",
    name: "Transaction Coordination - Basic",
    description: "Essential coordination support for straightforward transactions. Perfect for simple real estate closings or standard contract executions.",
    amount: 29900, // $299.00
  },
  {
    planKey: "standard",
    name: "Transaction Coordination - Standard",
    description: "Comprehensive coordination for moderate complexity transactions. Includes document review, negotiation support, and multi-party coordination.",
    amount: 59900, // $599.00
  },
  {
    planKey: "premium",
    name: "Transaction Coordination - Premium",
    description: "White-glove coordination for complex, high-stakes transactions. Dedicated coordinator, expedited processing, and comprehensive support.",
    amount: 129900, // $1,299.00
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate environment
    const env = validateApiKeyEnv('stripe');
    const stripeKey = env.STRIPE_SECRET_KEY!;

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if we're in test or live mode
    const isLive = stripeKey.startsWith("sk_live_");
    const mode = isLive ? "LIVE" : "TEST";

    console.log(`[CREATE-TC-PRODUCTS] Creating products in ${mode} mode...`);

    const results: Array<{
      planKey: string;
      name: string;
      productId: string;
      priceId: string;
      amount: number;
    }> = [];

    // Create each product
    for (const product of products) {
      try {
        console.log(`[CREATE-TC-PRODUCTS] Creating: ${product.name}...`);

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
          planKey: product.planKey,
          name: product.name,
          productId: stripeProduct.id,
          priceId: stripePrice.id,
          amount: product.amount,
        });

        console.log(`[CREATE-TC-PRODUCTS] ✅ Created: ${product.name}`);
        console.log(`[CREATE-TC-PRODUCTS] Product ID: ${stripeProduct.id}`);
        console.log(`[CREATE-TC-PRODUCTS] Price ID: ${stripePrice.id}`);
      } catch (error) {
        console.error(`[CREATE-TC-PRODUCTS] ❌ Error creating ${product.name}:`, error);
        throw error;
      }
    }

    // Format response with code-ready output
    const codeOutput = results.map((result) => {
      return `  ${result.planKey}: {\n    priceId: "${result.priceId}", // ${result.name} ($${(result.amount / 100).toFixed(2)})\n    // ... rest of config\n  },`;
    }).join('\n\n');

    return new Response(
      JSON.stringify({
        success: true,
        mode,
        message: `Successfully created ${results.length} products in ${mode} mode`,
        products: results,
        codeOutput: `// Copy this to src/constants/tcPlans.ts:\n\nexport const TC_PLANS = {\n${codeOutput}\n} as const;`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[CREATE-TC-PRODUCTS] ERROR:", errorMessage);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        message: "Failed to create Stripe products. Check logs for details.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});


import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Get request body
    const { priceId, bookingId, customerEmail, customerName, customAmount } = await req.json();
    logStep("Request data received", { priceId, bookingId, customerEmail, hasCustomAmount: !!customAmount });

    if (!priceId || !customerEmail) {
      throw new Error("Missing required parameters: priceId and customerEmail are required");
    }

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    logStep("Stripe initialized");

    // Check if customer exists
    const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
    let customerId: string | undefined;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      logStep("No existing customer, will create at checkout");
    }

    // Build line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    
    if (customAmount) {
      // For services with dynamic pricing (mobile notary with mileage)
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Mobile Notary Service",
            description: "Includes travel and mileage fees",
          },
          unit_amount: customAmount, // Amount in cents
        },
        quantity: 1,
      });
      logStep("Using custom amount", { customAmount });
    } else {
      // For fixed-price services
      lineItems.push({
        price: priceId,
        quantity: 1,
      });
      logStep("Using price ID", { priceId });
    }

    // Create checkout session
    const origin = req.headers.get("origin") || "https://notroom.com";
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      line_items: lineItems,
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payment-canceled?booking_id=${bookingId || ''}`,
      ...(customerId ? { customer: customerId } : { customer_email: customerEmail }),
      metadata: {
        booking_id: bookingId || '',
        customer_name: customerName || '',
      },
      payment_intent_data: {
        metadata: {
          booking_id: bookingId || '',
        },
      },
    };

    const session = await stripe.checkout.sessions.create(sessionParams);
    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    // Update booking with payment session ID if bookingId provided
    if (bookingId) {
      try {
        const supabaseClient = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
          { auth: { persistSession: false } }
        );

        const { error: updateError } = await supabaseClient
          .from("bookings")
          .update({ 
            status: "payment_pending",
          })
          .eq("id", bookingId);

        if (updateError) {
          logStep("Warning: Failed to update booking status", { error: updateError.message });
        } else {
          logStep("Booking status updated to payment_pending");
        }
      } catch (error) {
        logStep("Warning: Error updating booking", { error: error instanceof Error ? error.message : String(error) });
      }
    }

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

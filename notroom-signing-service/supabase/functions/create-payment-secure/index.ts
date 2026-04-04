import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { validateApiKeyEnv } from "../_shared/envValidation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, cf-connecting-ip, x-forwarded-for",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PAYMENT-SECURE] ${step}${detailsStr}`);
};

// Extract real IP address from request
const getClientIP = (req: Request): string => {
  // Try CF-Connecting-IP first (Cloudflare)
  const cfIP = req.headers.get("cf-connecting-ip");
  if (cfIP) return cfIP;

  // Try X-Forwarded-For
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(',')[0].trim();

  // Fallback
  return "unknown";
};

// Verify Cloudflare Turnstile token
const verifyTurnstile = async (token: string, ip: string): Promise<boolean> => {
  const secretKey = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!secretKey) {
    logStep("Turnstile secret key not configured");
    return false;
  }

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
        remoteip: ip,
      }),
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    logStep("Turnstile verification error", { error: error instanceof Error ? error.message : String(error) });
    return false;
  }
};

// Check and update rate limits
const checkRateLimit = async (
  supabaseClient: any,
  ip: string,
  email: string
): Promise<{ allowed: boolean; reason?: string }> => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // Check if IP is blocked
  const { data: existingLimit } = await supabaseClient
    .from("booking_rate_limits")
    .select("*")
    .eq("ip_address", ip)
    .single();

  if (existingLimit) {
    // Check if currently blocked
    if (existingLimit.blocked_until && new Date(existingLimit.blocked_until) > now) {
      return { 
        allowed: false, 
        reason: `Too many attempts. Please try again after ${new Date(existingLimit.blocked_until).toLocaleTimeString()}` 
      };
    }

    // Check attempts in last hour
    if (new Date(existingLimit.last_attempt_at) > oneHourAgo) {
      if (existingLimit.attempts >= 10) {
        // Block for 1 hour
        const blockedUntil = new Date(now.getTime() + 60 * 60 * 1000);
        await supabaseClient
          .from("booking_rate_limits")
          .update({
            attempts: existingLimit.attempts + 1,
            last_attempt_at: now.toISOString(),
            blocked_until: blockedUntil.toISOString(),
          })
          .eq("ip_address", ip);

        return { 
          allowed: false, 
          reason: "Too many booking attempts. Please try again in 1 hour." 
        };
      }

      // Increment attempts
      await supabaseClient
        .from("booking_rate_limits")
        .update({
          attempts: existingLimit.attempts + 1,
          last_attempt_at: now.toISOString(),
          email,
        })
        .eq("ip_address", ip);
    } else {
      // Reset counter if last attempt was over an hour ago
      await supabaseClient
        .from("booking_rate_limits")
        .update({
          attempts: 1,
          last_attempt_at: now.toISOString(),
          email,
          blocked_until: null,
        })
        .eq("ip_address", ip);
    }
  } else {
    // Create new rate limit record
    await supabaseClient
      .from("booking_rate_limits")
      .insert({
        ip_address: ip,
        email,
        attempts: 1,
        last_attempt_at: now.toISOString(),
      });
  }

  return { allowed: true };
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Validate environment
    const env = validateApiKeyEnv('stripe');

    const clientIP = getClientIP(req);
    logStep("Client IP extracted", { ip: clientIP });

    // Get request body
    const { priceId, bookingId, customerEmail, customerName, customAmount, turnstileToken } = await req.json();
    logStep("Request data received", { priceId, bookingId, customerEmail, hasCustomAmount: !!customAmount });

    if (!priceId || !customerEmail || !turnstileToken) {
      throw new Error("Missing required parameters");
    }

    // Security Check 1: Verify Turnstile token
    const turnstileValid = await verifyTurnstile(turnstileToken, clientIP);
    if (!turnstileValid) {
      logStep("Turnstile verification failed");
      throw new Error("Security verification failed. Please refresh and try again.");
    }
    logStep("Turnstile verification passed");

    // Initialize Supabase
    const supabaseClient = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    // Security Check 2: Rate limiting
    const rateLimitCheck = await checkRateLimit(supabaseClient, clientIP, customerEmail);
    if (!rateLimitCheck.allowed) {
      logStep("Rate limit exceeded", { ip: clientIP, email: customerEmail });
      throw new Error(rateLimitCheck.reason || "Too many requests");
    }
    logStep("Rate limit check passed");

    // Initialize Stripe
    const stripeKey = env.STRIPE_SECRET_KEY!;
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    logStep("Stripe initialized");

    // Check if customer exists
    const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
    let customerId: string | undefined;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    }

    // Build line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    
    if (customAmount) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Mobile Notary Service",
            description: "Includes travel and mileage fees",
          },
          unit_amount: customAmount,
        },
        quantity: 1,
      });
      logStep("Using custom amount", { customAmount });
    } else {
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
        client_ip: clientIP,
      },
      payment_intent_data: {
        metadata: {
          booking_id: bookingId || '',
        },
      },
    };

    const session = await stripe.checkout.sessions.create(sessionParams);
    logStep("Checkout session created", { sessionId: session.id });

    // Update booking with payment session ID if provided
    if (bookingId) {
      const { error: updateError } = await supabaseClient
        .from("bookings")
        .update({ status: "payment_pending" })
        .eq("id", bookingId);

      if (updateError) {
        logStep("Warning: Failed to update booking status", { error: updateError.message });
      }
    }

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    // Handle configuration errors specifically
    if (errorMessage.includes('Missing required environment variables')) {
      return new Response(
        JSON.stringify({ 
          error: 'Configuration error',
          message: errorMessage 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

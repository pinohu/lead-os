import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-CODE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { email, code } = await req.json();
    
    if (!email || !code) {
      throw new Error("Email and code are required");
    }

    logStep("Verifying code", { email });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    
    // SECURITY: Check for brute force attempts - count recent failed attempts
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: recentAttempts, error: attemptsError } = await supabaseClient
      .from("verification_codes")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .eq("used", false)
      .gte("created_at", tenMinutesAgo);
    
    // If more than 5 verification attempts in 10 minutes, rate limit
    if (recentAttempts && recentAttempts.length > 5) {
      logStep("Rate limit exceeded", { email, attempts: recentAttempts.length });
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: "Too many verification attempts. Please wait 10 minutes before trying again." 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 429,
        }
      );
    }

    // Find valid code
    const { data: verificationData, error: fetchError } = await supabaseClient
      .from("verification_codes")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .eq("code", code.trim())
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      logStep("Database error", { error: fetchError });
      throw new Error("Failed to verify code");
    }

    if (!verificationData) {
      logStep("Invalid or expired code");
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: "Invalid or expired verification code" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Mark code as used
    const { error: updateError } = await supabaseClient
      .from("verification_codes")
      .update({ used: true, verified_at: new Date().toISOString() })
      .eq("id", verificationData.id);

    if (updateError) {
      logStep("Failed to mark code as used", { error: updateError });
    }

    logStep("Code verified successfully");

    return new Response(
      JSON.stringify({ valid: true, message: "Email verified successfully" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ valid: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

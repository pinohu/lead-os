import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[REFERRAL] ${step}${detailsStr}`);
};

const SMSIT_BASE_URL = "https://aicpanel.smsit.ai/api/v2";

// Send referral invitation
async function sendReferralInvitation(
  apiKey: string,
  phone: string,
  name: string,
  referralCode: string
): Promise<boolean> {
  const firstName = name.split(' ')[0];
  const referralLink = `https://notroom.lovable.app/?ref=${referralCode}&utm_source=referral&utm_campaign=customer_referral`;
  
  const message = `Hi ${firstName}! 🎁 Love our service? Refer a friend and you BOTH get $25 off! Your unique link: ${referralLink} Track your referrals anytime. Thanks for spreading the word! - Ron, Notroom`;

  try {
    const response = await fetch(`${SMSIT_BASE_URL}/campaign`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: phone,
        message: message,
        campaign_name: 'referral_invitation',
      }),
    });

    if (!response.ok) {
      logStep("Referral invitation failed", { phone });
      return false;
    }

    logStep("Referral invitation sent", { phone, referralCode });
    return true;
  } catch (error) {
    logStep("Referral invitation error", { error: String(error) });
    return false;
  }
}

// Send reward notification to referrer
async function sendReferrerReward(
  apiKey: string,
  phone: string,
  name: string,
  referredName: string
): Promise<boolean> {
  const firstName = name.split(' ')[0];
  
  const message = `🎉 Great news ${firstName}! ${referredName} just booked using your referral link! You've both earned $25 OFF your next service. Code: REF25. Keep sharing! - Ron, Notroom`;

  try {
    const response = await fetch(`${SMSIT_BASE_URL}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: phone,
        message: message,
        campaign_name: 'referral_reward_referrer',
      }),
    });

    if (!response.ok) {
      logStep("Referrer reward notification failed", { phone });
      return false;
    }

    logStep("Referrer reward notification sent", { phone });
    return true;
  } catch (error) {
    logStep("Referrer reward error", { error: String(error) });
    return false;
  }
}

// Send reward notification to referee
async function sendRefereeReward(
  apiKey: string,
  phone: string,
  name: string,
  referrerName: string
): Promise<boolean> {
  const firstName = name.split(' ')[0];
  
  const message = `Welcome ${firstName}! 🎁 ${referrerName} referred you, so you get $25 OFF your booking! Code: REF25. Applied automatically. Thanks for choosing Notroom! - Ron`;

  try {
    const response = await fetch(`${SMSIT_BASE_URL}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: phone,
        message: message,
        campaign_name: 'referral_reward_referee',
      }),
    });

    if (!response.ok) {
      logStep("Referee reward notification failed", { phone });
      return false;
    }

    logStep("Referee reward notification sent", { phone });
    return true;
  } catch (error) {
    logStep("Referee reward error", { error: String(error) });
    return false;
  }
}

// Generate unique referral code
function generateReferralCode(name: string, email: string): string {
  const namePart = name.replace(/\s+/g, '').substring(0, 4).toUpperCase();
  const emailHash = email.split('@')[0].substring(0, 2).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${namePart}${emailHash}${random}`;
}

// Create trigger link in SMS-iT
async function createTriggerLink(
  apiKey: string,
  referralCode: string,
  contactId: string
): Promise<boolean> {
  try {
    const response = await fetch(`${SMSIT_BASE_URL}/trigger-links`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contact_id: contactId,
        link_name: `referral_${referralCode}`,
        destination_url: `https://notroom.lovable.app/?ref=${referralCode}`,
        track_clicks: true,
      }),
    });

    if (!response.ok) {
      logStep("Trigger link creation failed", { referralCode });
      return false;
    }

    logStep("Trigger link created", { referralCode });
    return true;
  } catch (error) {
    logStep("Trigger link error", { error: String(error) });
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Referral function started");

    const { action, bookingId, referralCode } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const smsitApiKey = Deno.env.get("SMSIT_API_KEY");

    if (!supabaseUrl || !supabaseKey || !smsitApiKey) {
      throw new Error("Configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    if (action === 'send_invitation') {
      // Send referral invitation to completed customers (48h after service)
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      const { data: eligibleBookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('status', 'completed')
        .gte('created_at', twoDaysAgo.toISOString())
        .lt('created_at', new Date(Date.now() - 47 * 60 * 60 * 1000).toISOString());

      let invitationsSent = 0;

      if (eligibleBookings && eligibleBookings.length > 0) {
        for (const booking of eligibleBookings) {
          // Generate unique referral code
          const refCode = generateReferralCode(booking.name, booking.email);
          
          // Store referral code in database
          const { error: insertError } = await supabase
            .from('bookings')
            .update({
              message: `${booking.message || ''} [Referral Code: ${refCode}]`
            })
            .eq('id', booking.id);

          if (!insertError) {
            await sendReferralInvitation(
              smsitApiKey,
              booking.phone,
              booking.name,
              refCode
            );
            invitationsSent++;
          }
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          invitations_sent: invitationsSent
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    if (action === 'process_referral' && bookingId && referralCode) {
      // New booking with referral code - reward both parties
      logStep("Processing referral", { bookingId, referralCode });

      // Find the referee (new booking)
      const { data: refereeBooking } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (!refereeBooking) {
        throw new Error("Referee booking not found");
      }

      // Find the referrer (original customer with this referral code)
      const { data: referrerBookings } = await supabase
        .from('bookings')
        .select('*')
        .ilike('message', `%${referralCode}%`)
        .limit(1);

      if (referrerBookings && referrerBookings.length > 0) {
        const referrerBooking = referrerBookings[0];

        // Send reward notifications
        await sendReferrerReward(
          smsitApiKey,
          referrerBooking.phone,
          referrerBooking.name,
          refereeBooking.name
        );

        await sendRefereeReward(
          smsitApiKey,
          refereeBooking.phone,
          refereeBooking.name,
          referrerBooking.name
        );

        // Log referral in database
        await supabase
          .from('bookings')
          .update({
            message: `${refereeBooking.message || ''} [Referred by: ${referrerBooking.name} - Code: ${referralCode}]`
          })
          .eq('id', bookingId);

        logStep("Referral rewards sent", {
          referrer: referrerBooking.name,
          referee: refereeBooking.name
        });
      }

      return new Response(
        JSON.stringify({ success: true, message: "Referral processed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    throw new Error("Invalid action");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

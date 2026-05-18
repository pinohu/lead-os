import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SMSIT-AUTO-FOLLOWUP] ${step}${detailsStr}`);
};

const SMSIT_BASE_URL = "https://aicpanel.smsit.ai/api/v2";

// Send follow-up campaign to a phone number
async function sendFollowUpCampaign(apiKey: string, phone: string, name: string, service: string, bookingId: string, stage: string): Promise<boolean> {
  const firstName = name.split(' ')[0];
  const triggerLink = `https://notroom.lovable.app/?booking=${bookingId}&utm_source=sms&utm_campaign=followup_${stage}`;
  
  let message = '';
  
  if (stage === '24h_no_click') {
    message = `Hi ${firstName}! Still need notary services for ${service}? 💼 Book today and save $10! ${triggerLink}`;
  } else if (stage === '48h_no_response') {
    message = `${firstName}, we noticed you were interested in ${service}. Let's make it happen! Call us at (814) 555-0100 or book: ${triggerLink}`;
  } else if (stage === '72h_nurture') {
    message = `Hi ${firstName}! We're here when you're ready. Join our newsletter for PA notary tips & exclusive offers: ${triggerLink}`;
  }

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
        campaign_name: `auto_followup_${stage}`,
      }),
    });

    if (!response.ok) {
      logStep("Campaign send failed", { stage, phone });
      return false;
    }

    logStep("Follow-up campaign sent", { stage, phone });
    return true;
  } catch (error) {
    logStep("Campaign error", { error: String(error) });
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Auto follow-up function started");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const smsitApiKey = Deno.env.get("SMSIT_API_KEY");

    if (!supabaseUrl || !supabaseKey || !smsitApiKey) {
      throw new Error("Configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);

    // Stage 1: 24-hour follow-up (no click/no booking)
    const { data: stage1Bookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('status', 'pending')
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .lt('created_at', fortyEightHoursAgo.toISOString());

    if (stage1Bookings && stage1Bookings.length > 0) {
      logStep(`Processing ${stage1Bookings.length} bookings for 24h follow-up`);
      
      for (const booking of stage1Bookings) {
        await sendFollowUpCampaign(
          smsitApiKey,
          booking.phone,
          booking.name,
          booking.service,
          booking.id,
          '24h_no_click'
        );
      }
    }

    // Stage 2: 48-hour follow-up (still no response)
    const { data: stage2Bookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('status', 'pending')
      .gte('created_at', fortyEightHoursAgo.toISOString())
      .lt('created_at', seventyTwoHoursAgo.toISOString());

    if (stage2Bookings && stage2Bookings.length > 0) {
      logStep(`Processing ${stage2Bookings.length} bookings for 48h follow-up`);
      
      for (const booking of stage2Bookings) {
        await sendFollowUpCampaign(
          smsitApiKey,
          booking.phone,
          booking.name,
          booking.service,
          booking.id,
          '48h_no_response'
        );
      }
    }

    // Stage 3: 72-hour follow-up (PHASE 8: Voice call for no SMS response)
    const { data: stage3Bookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('status', 'pending')
      .lt('created_at', seventyTwoHoursAgo.toISOString());

    if (stage3Bookings && stage3Bookings.length > 0) {
      logStep(`Processing ${stage3Bookings.length} bookings for 72h voice follow-up`);
      
      for (const booking of stage3Bookings) {
        // PHASE 8: Trigger voice call instead of just SMS
        const voiceCallUrl = `${supabaseUrl}/functions/v1/smsit-voice-call`;
        
        try {
          const voiceResponse = await fetch(voiceCallUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify({
              bookingId: booking.id,
              phone: booking.phone,
              name: booking.name,
              service: booking.service,
              callType: 'followup',
              preferredDate: booking.preferred_date
            })
          });
          
          if (voiceResponse.ok) {
            logStep('Voice call triggered successfully', { bookingId: booking.id });
          } else {
            logStep('Voice call failed, falling back to SMS', { bookingId: booking.id });
            // Fallback to SMS if voice fails
            await sendFollowUpCampaign(
              smsitApiKey,
              booking.phone,
              booking.name,
              booking.service,
              booking.id,
              '72h_nurture'
            );
          }
        } catch (voiceError) {
          logStep('Voice call error, using SMS fallback', { error: String(voiceError) });
          // Fallback to SMS
          await sendFollowUpCampaign(
            smsitApiKey,
            booking.phone,
            booking.name,
            booking.service,
            booking.id,
            '72h_nurture'
          );
        }
        
        // Update status to indicate moved to nurture/voice attempted
        await supabase
          .from('bookings')
          .update({ message: (booking.message || '') + ' [Voice call attempted - moved to nurture]' })
          .eq('id', booking.id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: {
          stage1: stage1Bookings?.length || 0,
          stage2: stage2Bookings?.length || 0,
          stage3: stage3Bookings?.length || 0,
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
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

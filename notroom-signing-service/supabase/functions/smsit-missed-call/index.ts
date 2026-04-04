import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyJWT } from "../_shared/webhookSecurity.ts";
import { validateUUID, validatePhone } from "../_shared/validation.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SMSIT_API_KEY = Deno.env.get('SMSIT_API_KEY');
const SMSIT_BASE_URL = 'https://api.smsit.ai/v1';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify JWT for internal function
  const jwtCheck = verifyJWT(req);
  if (!jwtCheck.valid) {
    return new Response(
      JSON.stringify({ error: jwtCheck.error }),
      { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { leadId, callerNumber } = await req.json();
    
    // Validate inputs
    const uuidValidation = validateUUID(leadId);
    if (!uuidValidation.valid) {
      return new Response(
        JSON.stringify({ error: uuidValidation.error }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (callerNumber) {
      const phoneValidation = validatePhone(callerNumber);
      if (!phoneValidation.valid) {
        return new Response(
          JSON.stringify({ error: phoneValidation.error }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    console.log('Processing missed call for lead:', leadId);

    // Get lead/booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', leadId)
      .single();

    if (bookingError || !booking) {
      throw new Error('Booking not found');
    }

    // Check SMS opt-in
    if (!booking.sms_opt_in) {
      console.log('SMS opt-in not set for booking:', leadId);
      // Still proceed with first contact
    }

    const bookingLink = `${Deno.env.get('PUBLIC_WEB_URL')}/book?ref=${booking.id}`;
    
    const message = `Hi ${booking.name || 'there'}, sorry we missed your call to Notroom! 📞

Book your notary appointment here: ${bookingLink}

Or call us back at: 814-790-4223

Reply STOP to unsubscribe.`;

    // Send via SMS-iT
    const smsResponse = await fetch(`${SMSIT_BASE_URL}/sms/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SMSIT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: booking.phone,
        message: message,
        campaign: 'missed_call_recovery',
      }),
    });

    if (!smsResponse.ok) {
      const error = await smsResponse.text();
      console.error('SMS-iT error:', error);
      throw new Error(`SMS-iT API error: ${error}`);
    }

    const result = await smsResponse.json();
    console.log('SMS sent successfully:', result);

    // Log the event
    await supabase
      .from('call_events')
      .insert({
        booking_id: leadId,
        event_type: 'sms_sent',
        tool: 'smsit',
        metadata: {
          message_id: result.message_id,
          template: 'MISSED_CALL',
          to: booking.phone,
        },
      });

    // Schedule WhatsApp fallback in 30 minutes if no response
    // This would typically be handled by a scheduled job/cron
    console.log('Missed call SMS flow completed for:', leadId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: result.message_id,
        leadId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Missed call automation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

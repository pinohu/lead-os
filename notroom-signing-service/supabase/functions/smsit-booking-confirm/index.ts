import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyJWT } from "../_shared/webhookSecurity.ts";
import { validateUUID } from "../_shared/validation.ts";

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
    const { bookingId } = await req.json();
    
    // Validate UUID
    const uuidValidation = validateUUID(bookingId);
    if (!uuidValidation.valid) {
      return new Response(
        JSON.stringify({ error: uuidValidation.error }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Sending booking confirmation for:', bookingId);

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error('Booking not found');
    }

    const serviceMap: Record<string, string> = {
      'NOTARY_NOW': 'Mobile Notary',
      'APOSTILLE': 'Apostille Service',
      'FORMATION': 'Business Formation',
      'mobile-notary': 'Mobile Notary',
      'apostille': 'Apostille Service',
      'business-formation': 'Business Formation',
    };

    const serviceName = serviceMap[booking.service] || booking.service;
    const datetime = booking.preferred_date 
      ? `${booking.preferred_date} at ${booking.preferred_time || 'TBD'}`
      : 'ASAP';

    const checklist = booking.service.includes('NOTARY') || booking.service.includes('notary')
      ? '1) Government-issued ID, 2) Unsigned documents, 3) Witness if required'
      : booking.service.includes('APOSTILLE') || booking.service.includes('apostille')
      ? '1) Original document(s), 2) Copy for our records'
      : '1) Business information, 2) Owner details';

    const message = `🎉 You're booked for ${serviceName}!

📅 Time: ${datetime}
📍 Location: ${booking.location_address || 'Mobile service to your location'}

✅ What to bring:
${checklist}

Reply YES to confirm or call 814-790-4223 for changes.

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
        campaign: 'booking_confirmation',
      }),
    });

    if (!smsResponse.ok) {
      const error = await smsResponse.text();
      console.error('SMS-iT error:', error);
      throw new Error(`SMS-iT API error: ${error}`);
    }

    const result = await smsResponse.json();
    console.log('Confirmation SMS sent:', result);

    // Log the event
    await supabase
      .from('call_events')
      .insert({
        booking_id: bookingId,
        event_type: 'booking_confirmed',
        tool: 'smsit',
        metadata: {
          message_id: result.message_id,
          template: 'CONFIRM_BOOKING',
          to: booking.phone,
        },
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: result.message_id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Booking confirmation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

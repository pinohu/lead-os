import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyWebhookSignature } from "../_shared/webhookSecurity.ts";
import { validatePhone, validateEmail, validateName } from "../_shared/validation.ts";
import { validateWebhookEnv } from "../_shared/envValidation.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-insighto-signature',
};

interface InsightoWebhook {
  event: string;
  conversation_id: string;
  caller_number?: string;
  transcript?: string;
  intent?: string;
  confidence?: number;
  extracted_data?: {
    name?: string;
    email?: string;
    service?: string;
    location?: string;
    urgency?: string;
    preferred_time?: string;
    document_type?: string;
  };
  recording_url?: string;
  timestamp: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate environment
    const env = validateWebhookEnv('insighto');
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    // Verify webhook signature
    const signature = req.headers.get('x-insighto-signature') || '';
    const webhookSecret = env.INSIGHTO_WEBHOOK_SECRET || '';
    const rawBody = await req.text();
    
    const isValid = await verifyWebhookSignature(rawBody, signature, webhookSecret);
    if (!isValid && webhookSecret) {
      console.error('Invalid webhook signature from Insighto');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const payload: InsightoWebhook = JSON.parse(rawBody);
    console.log('Insighto webhook received:', payload.event);

    const eventType = payload.event.replace('.', '_');
    let leadId: string | null = null;

    // If this is a booking request from the AI agent
    if (payload.intent === 'NOTARY_NOW' || payload.intent === 'APOSTILLE' || payload.intent === 'FORMATION') {
      const data = payload.extracted_data || {};
      
      // Validate inputs
      const name = data.name || 'AI Caller';
      const phone = payload.caller_number || 'unknown';
      const email = data.email || `ai-${payload.conversation_id}@pending.notroom.com`;

      if (name !== 'AI Caller') {
        const nameValidation = validateName(name);
        if (!nameValidation.valid) {
          throw new Error(`Invalid name: ${nameValidation.error}`);
        }
      }

      if (phone !== 'unknown') {
        const phoneValidation = validatePhone(phone);
        if (!phoneValidation.valid) {
          throw new Error(`Invalid phone: ${phoneValidation.error}`);
        }
      }

      if (!email.includes('@pending.notroom.com')) {
        const emailValidation = validateEmail(email);
        if (!emailValidation.valid) {
          throw new Error(`Invalid email: ${emailValidation.error}`);
        }
      }

      // Sanitize location address
      const locationAddress = data.location?.substring(0, 300) || null;
      
      // Create or update booking
      const bookingData = {
        name: name.substring(0, 100),
        phone,
        email,
        service: (data.service || payload.intent).substring(0, 100),
        document_type: data.document_type?.substring(0, 100),
        location_address: locationAddress,
        urgency: data.urgency || 'flexible',
        preferred_time: data.preferred_time?.substring(0, 50),
        status: 'pending',
        ai_booked: true,
        ai_confidence: payload.confidence,
        agent_provider: 'insighto',
        call_transcript: payload.transcript?.substring(0, 5000),
        call_recording_url: payload.recording_url?.substring(0, 500),
      };

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select('id')
        .single();

      if (bookingError) {
        console.error('Error creating booking:', bookingError);
        throw bookingError;
      }

      leadId = booking.id;
      console.log('Created AI booking:', leadId);

      // Trigger confirmation flow
      await fetch(`${env.SUPABASE_URL}/functions/v1/smsit-booking-confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookingId: leadId }),
      }).catch(err => console.error('Failed to send confirmation:', err));

      // Send WhatsApp checklist if opted in
      if (bookingData.phone !== 'unknown') {
        await fetch(`${env.SUPABASE_URL}/functions/v1/wbiztool-send-checklist`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            bookingId: leadId,
            phone: bookingData.phone,
            service: bookingData.service,
          }),
        }).catch(err => console.error('Failed to send WhatsApp checklist:', err));
      }
    }

    // Log the event
    const { error: eventError } = await supabase
      .from('call_events')
      .insert({
        booking_id: leadId,
        event_type: eventType,
        tool: 'insighto',
        caller_number: payload.caller_number,
        transcript: payload.transcript,
        recording_url: payload.recording_url,
        metadata: {
          conversation_id: payload.conversation_id,
          intent: payload.intent,
          confidence: payload.confidence,
          extracted_data: payload.extracted_data,
        },
      });

    if (eventError) {
      console.error('Error logging event:', eventError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        leadId,
        message: leadId ? 'Booking created successfully' : 'Event logged'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Insighto webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
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
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";
import { verifyWebhookSignature } from "../_shared/webhookSecurity.ts";
import { validatePhone } from "../_shared/validation.ts";
import { validateWebhookEnv } from "../_shared/envValidation.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-callscaler-signature',
};

interface CallScalerEvent {
  event_type: 'call.started' | 'call.answered' | 'call.missed' | 'call.completed';
  call_id: string;
  tracking_number: string;
  caller_number: string;
  duration?: number;
  recording_url?: string;
  timestamp: string;
  metadata?: {
    source?: string;
    campaign?: string;
    channel?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate environment
    const env = validateWebhookEnv('callscaler');
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    // Verify webhook signature
    const signature = req.headers.get('x-callscaler-signature') || '';
    const webhookSecret = env.CALLSCALER_WEBHOOK_SECRET || '';
    const rawBody = await req.text();
    
    const isValid = await verifyWebhookSignature(rawBody, signature, webhookSecret);
    if (!isValid && webhookSecret) {
      console.error('Invalid webhook signature from CallScaler');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const payload: CallScalerEvent = JSON.parse(rawBody);
    
    // Validate phone number
    if (payload.caller_number) {
      const phoneValidation = validatePhone(payload.caller_number);
      if (!phoneValidation.valid) {
        throw new Error(`Invalid caller number: ${phoneValidation.error}`);
      }
    }

    console.log('CallScaler webhook received:', payload.event_type);

    // Store call event
    const { data: callEvent, error: eventError } = await supabase
      .from('call_events')
      .insert({
        event_type: payload.event_type.replace('call.', ''),
        tool: 'callscaler',
        tracking_number: payload.tracking_number,
        caller_number: payload.caller_number,
        duration: payload.duration,
        recording_url: payload.recording_url,
        metadata: payload.metadata || {},
      })
      .select()
      .single();

    if (eventError) {
      console.error('Error storing call event:', eventError);
    }

    // Handle specific event types
    switch (payload.event_type) {
      case 'call.started':
        await handleCallStarted(supabase, payload);
        break;
      case 'call.answered':
        await handleCallAnswered(supabase, payload);
        break;
      case 'call.missed':
        await handleCallMissed(supabase, payload, env);
        break;
      case 'call.completed':
        await handleCallCompleted(supabase, payload);
        break;
    }

    return new Response(
      JSON.stringify({ success: true, event_id: callEvent?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('CallScaler webhook error:', error);
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

async function handleCallStarted(supabase: any, payload: CallScalerEvent) {
  // Check if booking already exists for this caller
  const { data: existingBooking } = await supabase
    .from('bookings')
    .select('id')
    .eq('phone', payload.caller_number)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingBooking) {
    // Update existing booking with call tracking data
    await supabase
      .from('bookings')
      .update({
        tracking_number: payload.tracking_number,
        marketing_source: payload.metadata?.source || payload.metadata?.channel,
      })
      .eq('id', existingBooking.id);
  }

  console.log('Call started:', payload.call_id);
}

async function handleCallAnswered(supabase: any, payload: CallScalerEvent) {
  console.log('Call answered:', payload.call_id);
  
  // Update call event with answered status
  await supabase
    .from('call_events')
    .update({ metadata: { ...payload.metadata, answered: true } })
    .eq('tool', 'callscaler')
    .eq('tracking_number', payload.tracking_number);
}

async function handleCallMissed(supabase: any, payload: CallScalerEvent, env: { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string }) {
  console.log('Call missed:', payload.call_id, '- triggering SMS recovery');

  // Find or create lead/booking for this missed call
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, phone, name, email')
    .eq('phone', payload.caller_number)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let bookingId = booking?.id;

  // Create a new lead if no booking exists
  if (!booking) {
    console.log('Creating new lead for missed call from:', payload.caller_number);
    const { data: newBooking, error } = await supabase
      .from('bookings')
      .insert({
        name: 'Missed Call',
        phone: payload.caller_number,
        email: `missed-${payload.caller_number.replace(/[^0-9]/g, '')}@pending.notroom.com`,
        service: 'Unknown',
        status: 'pending',
        tracking_number: payload.tracking_number,
        marketing_source: payload.metadata?.source || 'CallScaler',
      })
      .select('id')
      .single();

    if (!error && newBooking) {
      bookingId = newBooking.id;
    }
  }

  if (bookingId) {
    // Trigger new SMS-iT missed call flow
    try {
      const response = await fetch(`${env.SUPABASE_URL}/functions/v1/smsit-missed-call`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          leadId: bookingId,
          callerNumber: payload.caller_number,
        }),
      });

      if (response.ok) {
        console.log('Triggered SMS missed call recovery for:', bookingId);
      } else {
        console.error('Failed to trigger SMS recovery:', await response.text());
      }
    } catch (error) {
      console.error('Failed to trigger SMS recovery:', error);
    }
  }
}

async function handleCallCompleted(supabase: any, payload: CallScalerEvent) {
  console.log('Call completed:', payload.call_id, 'Duration:', payload.duration);

  // Update booking with call duration and recording
  const { data: booking } = await supabase
    .from('bookings')
    .select('id')
    .eq('phone', payload.caller_number)
    .eq('tracking_number', payload.tracking_number)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (booking) {
    await supabase
      .from('bookings')
      .update({
        call_duration: payload.duration,
        call_recording_url: payload.recording_url,
      })
      .eq('id', booking.id);

    // Link call event to booking
    await supabase
      .from('call_events')
      .update({ booking_id: booking.id })
      .eq('tracking_number', payload.tracking_number)
      .eq('caller_number', payload.caller_number)
      .is('booking_id', null);
  }
}

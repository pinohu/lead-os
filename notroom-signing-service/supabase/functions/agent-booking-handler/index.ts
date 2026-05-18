import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AgentBookingRequest {
  phone: string;
  name: string;
  email?: string;
  service: string;
  intent: string;
  urgency?: 'low' | 'medium' | 'high';
  location?: string;
  preferredDate?: string;
  preferredTime?: string;
  aiConfidence: number;
  callTranscript?: string;
  provider: 'insighto' | 'thoughtly';
  metadata?: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const booking: AgentBookingRequest = await req.json();

    console.log('📞 Agent booking received:', {
      provider: booking.provider,
      intent: booking.intent,
      confidence: booking.aiConfidence,
      phone: booking.phone
    });

    // Validate confidence threshold
    const confidenceThreshold = 0.6;
    if (booking.aiConfidence < confidenceThreshold) {
      console.warn('⚠️ Low confidence booking:', booking.aiConfidence);
      // Still create booking but flag for human review
    }

    // Map intent to service
    const serviceMap: Record<string, string> = {
      'NOTARY_NOW': 'mobile_notary',
      'APOSTILLE': 'apostille',
      'BUSINESS_FORMATION': 'business_retainer',
      'VEHICLE_TITLE': 'vehicle_title_transfer',
      'OTHER': 'general_notary'
    };

    const mappedService = serviceMap[booking.intent] || booking.service;

    // Create booking record
    const { data: newBooking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        name: booking.name,
        phone: booking.phone,
        email: booking.email || '',
        service: mappedService,
        location_address: booking.location || '',
        urgency: booking.urgency || 'medium',
        ai_booked: true,
        ai_confidence: booking.aiConfidence,
        call_transcript: booking.callTranscript,
        agent_provider: booking.provider,
        status: 'pending',
        preferred_date: booking.preferredDate || new Date().toISOString().split('T')[0],
        preferred_time: booking.preferredTime || '09:00',
        sms_opt_in: true // AI calls imply consent
      })
      .select()
      .single();

    if (bookingError) {
      console.error('❌ Booking creation failed:', bookingError);
      throw bookingError;
    }

    console.log('✅ Booking created:', newBooking.id);

    // Log event
    await supabase.from('call_events').insert({
      booking_id: newBooking.id,
      event_type: 'ai_booked',
      tool: booking.provider,
      metadata: {
        intent: booking.intent,
        confidence: booking.aiConfidence,
        ...booking.metadata
      }
    });

    // Trigger master automation
    try {
      await supabase.functions.invoke('smsit-master-automation', {
        body: {
          eventType: 'new_booking',
          bookingId: newBooking.id,
          source: 'voice_agent',
          urgency: booking.urgency || 'medium'
        }
      });
      console.log('🎯 Master automation triggered');
    } catch (autoError) {
      console.error('⚠️ Automation trigger failed (non-critical):', autoError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        bookingId: newBooking.id,
        message: 'Booking created successfully',
        requiresHumanReview: booking.aiConfidence < confidenceThreshold
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('💥 Agent booking handler error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

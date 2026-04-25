import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SMSIT_BASE_URL = "https://aicpanel.smsit.ai/api/v2";

/**
 * Phase 8: Voice Call Integration
 * Sends automated voice calls to customers who don't respond to SMS
 * 
 * Use cases:
 * - Day 3 follow-up (no SMS response)
 * - Urgent bookings requiring immediate contact
 * - High-value leads (score 90+)
 * - Appointment reminders for customers who ignore texts
 */

interface VoiceCallRequest {
  bookingId: string;
  phone: string;
  name: string;
  service: string;
  callType: 'followup' | 'urgent' | 'reminder' | 'custom';
  customMessage?: string;
  preferredDate?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const smsitApiKey = Deno.env.get('SMSIT_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const callRequest: VoiceCallRequest = await req.json();
    console.log('Voice call request received:', callRequest);

    // Generate voice message based on call type
    const voiceMessage = generateVoiceMessage(callRequest);
    
    console.log('Generated voice message:', voiceMessage);

    // Send voice call via SMS-iT Voice API
    const voiceResponse = await fetch(`${SMSIT_BASE_URL}/voice`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${smsitApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: callRequest.phone,
        message: voiceMessage,
        voice_type: 'male', // or 'female' based on preference
        speed: 1.0, // Normal speed
        retry_on_busy: true,
        retry_count: 2,
        callback_url: `${supabaseUrl}/functions/v1/smsit-webhook` // Track call status
      })
    });

    if (!voiceResponse.ok) {
      const errorText = await voiceResponse.text();
      console.error('Voice call failed:', errorText);
      throw new Error(`Voice call failed: ${errorText}`);
    }

    const voiceData = await voiceResponse.json();
    console.log('Voice call initiated:', voiceData);

    // Log voice call in booking notes
    if (callRequest.bookingId) {
      const { data: booking } = await supabase
        .from('bookings')
        .select('message')
        .eq('id', callRequest.bookingId)
        .single();

      const callLog = `\n[Voice Call ${new Date().toLocaleString()}] Type: ${callRequest.callType}, Status: Initiated, Call ID: ${voiceData.call_id || 'pending'}`;
      
      await supabase
        .from('bookings')
        .update({
          message: (booking?.message || '') + callLog,
          updated_at: new Date().toISOString()
        })
        .eq('id', callRequest.bookingId);
    }

    // Create follow-up task for manual call if voice fails
    if (callRequest.callType === 'urgent' || callRequest.callType === 'followup') {
      await fetch(`${SMSIT_BASE_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${smsitApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: `Follow up on voice call - ${callRequest.name}`,
          description: `Automated voice call sent for ${callRequest.service}. If customer doesn't respond in 2 hours, call manually: ${callRequest.phone}`,
          priority: callRequest.callType === 'urgent' ? 'high' : 'medium',
          due_date: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
          status: 'pending'
        })
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        callId: voiceData.call_id || voiceData.id,
        message: 'Voice call initiated successfully',
        voiceMessage: voiceMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Error in smsit-voice-call function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
};

/**
 * Generate voice message script based on call type
 */
function generateVoiceMessage(request: VoiceCallRequest): string {
  const firstName = request.name.split(' ')[0];

  switch (request.callType) {
    case 'followup':
      return `Hi ${firstName}, this is Ron from Notroom. I sent you a quote for ${request.service} but haven't heard back. I wanted to personally reach out to see if you have any questions. Press 1 to book now, or press 2 to speak with me directly. If now is not a good time, simply hang up and I'll follow up via text. Thanks!`;

    case 'urgent':
      return `Hi ${firstName}, this is Ron from Notroom calling about your urgent request for ${request.service}. ${request.preferredDate ? `You mentioned needing this service by ${request.preferredDate}.` : ''} I wanted to confirm I received your request and we can absolutely help you. Press 1 to confirm your booking, or press 2 to discuss timing. Thank you!`;

    case 'reminder':
      return `Hi ${firstName}, this is a reminder from Notroom about your upcoming ${request.service} appointment ${request.preferredDate ? `scheduled for ${request.preferredDate}` : 'coming up soon'}. Please press 1 to confirm you'll be there, or press 2 if you need to reschedule. See you soon!`;

    case 'custom':
      return request.customMessage || `Hi ${firstName}, this is Ron from Notroom calling about your ${request.service} request. Please call me back at your earliest convenience. Thank you!`;

    default:
      return `Hi ${firstName}, this is Ron from Notroom. I'm calling about your ${request.service} inquiry. Please give me a call back when you get a chance. Thanks!`;
  }
}

serve(handler);

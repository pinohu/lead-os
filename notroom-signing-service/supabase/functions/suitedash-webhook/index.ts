import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { validateWebhookEnv } from "../_shared/envValidation.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SuitedashWebhookPayload {
  event: string;
  data: {
    id: string;
    contact_id?: string;
    project_id?: string;
    status?: string;
    milestone?: string;
    invoice_id?: string;
    delay_reason?: string;
    notes?: string;
    custom_fields?: {
      booking_id?: string;
    };
  };
}

// Verify webhook signature to prevent unauthorized access
const verifyWebhookSignature = async (req: Request, body: string, webhookSecret: string): Promise<boolean> => {
  const signature = req.headers.get('x-suitedash-signature') || req.headers.get('x-webhook-signature');
  
  // SECURITY: Reject if secret is not configured
  if (!webhookSecret) {
    console.error('🚨 CRITICAL: SUITEDASH_WEBHOOK_SECRET not configured - rejecting webhook');
    return false;
  }
  
  if (!signature) {
    console.error('Missing webhook signature header');
    return false;
  }
  
  // Create expected signature using HMAC-SHA256
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(webhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return signature === expectedSignature;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate environment
    const env = validateWebhookEnv('suitedash');
    
    // Get raw body for signature verification
    const bodyText = await req.text();
    
    // Verify webhook signature
    const isValidSignature = await verifyWebhookSignature(req, bodyText, env.SUITEDASH_WEBHOOK_SECRET || '');
    if (!isValidSignature) {
      console.error('Invalid webhook signature - possible unauthorized access attempt');
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - invalid signature' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    const payload: SuitedashWebhookPayload = JSON.parse(bodyText);
    console.log('Received Suitedash webhook:', payload);

    // Map Suitedash events to booking status updates
    const statusMapping: Record<string, string> = {
      'contact.created': 'pending',
      'contact.updated': 'pending',
      'project.created': 'confirmed',
      'project.started': 'confirmed',
      'project.completed': 'completed',
      'project.cancelled': 'cancelled',
      'project.milestone_reached': 'confirmed', // Keep as confirmed, send update SMS
      'project.delayed': 'confirmed', // Keep as confirmed but flag
      'project.invoice_sent': 'confirmed', // Status unchanged, trigger payment reminder
    };

    const newStatus = statusMapping[payload.event];
    
    if (!newStatus) {
      console.log('Event type not mapped to status update:', payload.event);
      return new Response(
        JSON.stringify({ success: true, message: 'Event received but not processed' }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Find booking by Suitedash contact ID or booking ID from custom fields
    let booking;
    
    if (payload.data.contact_id) {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('suitedash_contact_id', payload.data.contact_id)
        .single();
      
      if (error) {
        console.error('Error finding booking by contact ID:', error);
      } else {
        booking = data;
      }
    }

    // Fallback to custom field booking_id if provided
    if (!booking && payload.data.custom_fields?.booking_id) {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', payload.data.custom_fields.booking_id)
        .single();
      
      if (error) {
        console.error('Error finding booking by ID:', error);
      } else {
        booking = data;
      }
    }

    if (!booking) {
      console.error('Booking not found for webhook payload');
      return new Response(
        JSON.stringify({ success: false, error: 'Booking not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Update booking status
    const updateData: any = { status: newStatus };
    
    // Store project ID if this is a project-related event
    if (payload.event.startsWith('project.') && payload.data.project_id) {
      updateData.suitedash_project_id = payload.data.project_id;
    }

    const { error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', booking.id);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      throw updateError;
    }

    console.log(`Successfully updated booking ${booking.id} to status: ${newStatus}`);

    // ========================================
    // PHASE 7: Enhanced Event Handling
    // ========================================
    
    const SMSIT_BASE_URL = "https://aicpanel.smsit.ai/api/v2";
    const smsitApiKey = Deno.env.get('SMSIT_API_KEY');
    
    // Send customer SMS notifications based on event type
    if (smsitApiKey) {
      try {
        let smsMessage = '';
        
        switch (payload.event) {
          case 'project.started':
            smsMessage = `Great news ${booking.name.split(' ')[0]}! We've started your ${booking.service}. ${payload.data.notes ? 'Note: ' + payload.data.notes : 'We\'ll keep you updated on progress.'}`;
            break;
            
          case 'project.milestone_reached':
            smsMessage = `Hi ${booking.name.split(' ')[0]}! 🎉 Milestone reached on your ${booking.service}. ${payload.data.milestone || 'Making great progress!'} - Ron, Notroom`;
            break;
            
          case 'project.delayed':
            smsMessage = `Hi ${booking.name.split(' ')[0]}, quick update on your ${booking.service}: ${payload.data.delay_reason || 'Slight delay, but we\'re on it!'}. I\'ll call you shortly to discuss. - Ron`;
            break;
            
          case 'project.invoice_sent':
            smsMessage = `Hi ${booking.name.split(' ')[0]}! Your invoice for ${booking.service} is ready. Pay securely here: [Payment Link]. Thanks! - Ron, Notroom`;
            break;
            
          case 'project.completed':
            // Don't send here - handled by smsit-post-service
            break;
        }
        
        if (smsMessage) {
          await fetch(`${SMSIT_BASE_URL}/messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${smsitApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              to: booking.phone,
              message: smsMessage,
              campaign_name: `suitedash_${payload.event}`
            })
          });
          
          console.log(`Sent ${payload.event} notification SMS to ${booking.phone}`);
        }
        
        // Create urgent task for manager if project delayed
        if (payload.event === 'project.delayed') {
          await fetch(`${SMSIT_BASE_URL}/tasks`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${smsitApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              title: `URGENT: Project Delayed - ${booking.name}`,
              description: `Project delayed for ${booking.service}. Reason: ${payload.data.delay_reason || 'Unknown'}. Call customer immediately: ${booking.phone}`,
              priority: 'high',
              due_date: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // Due in 1 hour
              status: 'pending'
            })
          });
          
          console.log('Created urgent task for project delay');
        }
        
      } catch (smsError) {
        console.error('Error sending SMS notification:', smsError);
        // Don't fail the webhook if SMS fails
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        bookingId: booking.id,
        oldStatus: booking.status,
        newStatus: newStatus,
        message: 'Booking status updated successfully' 
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error: unknown) {
    console.error('Error in suitedash-webhook function:', error);
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
      JSON.stringify({ 
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.toString() : String(error)
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);

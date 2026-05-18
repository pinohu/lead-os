import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateWebhookEnv } from "../_shared/envValidation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SMSIT-WEBHOOK] ${step}${detailsStr}`);
};

// Verify webhook signature to prevent unauthorized access
const verifyWebhookSignature = async (req: Request, body: string, webhookSecret: string): Promise<boolean> => {
  const signature = req.headers.get('x-smsit-signature') || req.headers.get('x-webhook-signature');
  
  // SECURITY: Reject if secret is not configured
  if (!webhookSecret) {
    console.error('🚨 CRITICAL: SMSIT_WEBHOOK_SECRET not configured - rejecting webhook');
    return false;
  }
  
  if (!signature) {
    logStep('Missing webhook signature header');
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate environment
    const env = validateWebhookEnv('smsit');
    
    // Get raw body for signature verification
    const bodyText = await req.text();
    
    // Verify webhook signature
    const isValidSignature = await verifyWebhookSignature(req, bodyText, env.SMSIT_WEBHOOK_SECRET || '');
    if (!isValidSignature) {
      logStep('Invalid webhook signature - possible unauthorized access attempt');
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep("Webhook received and verified");

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    const webhookData = JSON.parse(bodyText);

    logStep("Webhook data", { type: webhookData.event_type });

    // PHASE 11: Comprehensive webhook handling
    switch (webhookData.event_type) {
      // === MESSAGE EVENTS ===
      case "message.replied":
        await handleMessageReply(supabase, webhookData);
        break;

      case "message.delivered":
        await handleMessageDelivered(supabase, webhookData);
        break;

      case "message.failed":
        await handleMessageFailed(supabase, webhookData);
        break;

      case "message.opened":
        await handleMessageOpened(supabase, webhookData);
        break;

      // === ENGAGEMENT EVENTS ===
      case "link.clicked":
        await handleLinkClick(supabase, webhookData);
        break;

      case "link.converted":
        await handleLinkConverted(supabase, webhookData);
        break;

      // === CONTACT EVENTS ===
      case "contact.updated":
        await handleContactUpdate(supabase, webhookData);
        break;

      case "contact.tagged":
        await handleContactTagged(supabase, webhookData);
        break;

      case "contact.unsubscribed":
        await handleContactUnsubscribed(supabase, webhookData);
        break;

      // === CAMPAIGN EVENTS ===
      case "campaign.delivered":
        await handleCampaignDelivery(supabase, webhookData);
        break;

      case "campaign.completed":
        await handleCampaignCompleted(supabase, webhookData);
        break;

      case "campaign.failed":
        await handleCampaignFailed(supabase, webhookData);
        break;

      // === APPOINTMENT EVENTS ===
      case "appointment.confirmed":
        await handleAppointmentConfirmed(supabase, webhookData);
        break;

      case "appointment.cancelled":
        await handleAppointmentCancelled(supabase, webhookData);
        break;

      case "appointment.reminder_sent":
        await handleAppointmentReminderSent(supabase, webhookData);
        break;

      // === TASK EVENTS ===
      case "task.completed":
        await handleTaskCompletion(supabase, webhookData);
        break;

      case "task.created":
        await handleTaskCreated(supabase, webhookData);
        break;

      case "task.overdue":
        await handleTaskOverdue(supabase, webhookData);
        break;

      // === OPPORTUNITY EVENTS ===
      case "opportunity.stage_changed":
        await handleOpportunityStageChanged(supabase, webhookData);
        break;

      case "opportunity.won":
        await handleOpportunityWon(supabase, webhookData);
        break;

      case "opportunity.lost":
        await handleOpportunityLost(supabase, webhookData);
        break;

      // === RATING/FEEDBACK EVENTS ===
      case "rating.received":
        await handleRatingReceived(supabase, webhookData);
        break;

      default:
        logStep("Unhandled webhook event", { type: webhookData.event_type });
    }

    return new Response(
      JSON.stringify({ success: true, message: "Webhook processed" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

async function handleMessageReply(supabase: any, data: any) {
  logStep("Processing message reply", { contactId: data.contact_id });

  // Find booking by custom field
  const bookingId = data.contact?.custom_fields?.booking_id;
  
  if (bookingId) {
    const { error } = await supabase
      .from('bookings')
      .update({ 
        message: `${data.message} (Replied via SMS)`,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (error) {
      logStep("Failed to update booking with reply", { error });
    } else {
      logStep("Booking updated with SMS reply");
    }
  }
}

async function handleLinkClick(supabase: any, data: any) {
  logStep("Processing link click", { 
    contactId: data.contact_id,
    link: data.link_url 
  });

  const bookingId = data.contact?.custom_fields?.booking_id;
  
  if (bookingId) {
    // Update booking to show interest
    const { error } = await supabase
      .from('bookings')
      .update({ 
        status: 'confirmed', // Move to interested/high-intent status
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .eq('status', 'pending');

    if (error) {
      logStep("Failed to update booking status", { error });
    } else {
      logStep("Booking marked as high-intent after link click");
    }
  }
}

async function handleContactUpdate(supabase: any, data: any) {
  logStep("Processing contact update", { contactId: data.contact_id });

  const bookingId = data.contact?.custom_fields?.booking_id;
  
  if (bookingId && data.tags) {
    // Sync important tag changes back to booking
    if (data.tags.includes('status_vip')) {
      await supabase
        .from('bookings')
        .update({ 
          message: '[VIP Customer] ' + (data.message || ''),
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);
      
      logStep("Booking marked as VIP");
    }
  }
}

async function handleCampaignDelivery(supabase: any, data: any) {
  logStep("Campaign delivery recorded", {
    campaign: data.campaign_name,
    status: data.delivery_status
  });
}

async function handleTaskCompletion(supabase: any, data: any) {
  logStep("Task completed", { taskId: data.task_id });
}

async function handleRatingReceived(supabase: any, data: any) {
  logStep("Rating received from SMS reply", { 
    contactId: data.contact_id,
    message: data.message 
  });

  // Extract rating from message (1-5)
  const rating = parseInt(data.message.trim());
  
  if (rating >= 1 && rating <= 5) {
    const bookingId = data.contact?.custom_fields?.booking_id;
    const contactId = data.contact_id;

    if (bookingId && contactId) {
      // Trigger post-service processing
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

      if (supabaseUrl && supabaseKey) {
        try {
          await fetch(`${supabaseUrl}/functions/v1/smsit-post-service`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify({
              bookingId: bookingId,
              contactId: contactId,
              rating: rating,
              action: 'process_rating'
            })
          });

          logStep("Rating processing triggered", { rating, bookingId });
        } catch (error) {
          logStep("Failed to trigger rating processing", { error: String(error) });
        }
      }
    }
  }
}

// === PHASE 11: NEW WEBHOOK HANDLERS ===

async function handleMessageDelivered(supabase: any, data: any) {
  logStep("Message delivered", { contactId: data.contact_id, messageId: data.message_id });
  
  const bookingId = data.contact?.custom_fields?.booking_id;
  if (bookingId) {
    await supabase
      .from('bookings')
      .update({ 
        message: `[SMS Delivered ${new Date().toLocaleString()}]`,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);
  }
}

async function handleMessageFailed(supabase: any, data: any) {
  logStep("Message failed", { 
    contactId: data.contact_id, 
    reason: data.failure_reason 
  });
  
  const bookingId = data.contact?.custom_fields?.booking_id;
  if (bookingId) {
    await supabase
      .from('bookings')
      .update({ 
        message: `[SMS FAILED: ${data.failure_reason}] - UPDATE PHONE NUMBER`,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);
    
    logStep("Booking flagged for phone update");
  }
}

async function handleMessageOpened(supabase: any, data: any) {
  logStep("Message opened", { contactId: data.contact_id });
  
  const bookingId = data.contact?.custom_fields?.booking_id;
  if (bookingId) {
    await supabase
      .from('bookings')
      .update({ 
        message: `[SMS Opened ${new Date().toLocaleString()}] - High engagement`,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);
  }
}

async function handleLinkConverted(supabase: any, data: any) {
  logStep("Link converted (booking made)", { 
    contactId: data.contact_id,
    link: data.link_url 
  });
  
  const bookingId = data.contact?.custom_fields?.booking_id;
  if (bookingId) {
    await supabase
      .from('bookings')
      .update({ 
        status: 'confirmed',
        message: `[CONVERTED via link click ${new Date().toLocaleString()}]`,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);
    
    logStep("Booking confirmed via conversion");
  }
}

async function handleContactTagged(supabase: any, data: any) {
  logStep("Contact tagged", { 
    contactId: data.contact_id,
    tag: data.tag_name 
  });
  
  const bookingId = data.contact?.custom_fields?.booking_id;
  if (bookingId && data.tag_name) {
    await supabase
      .from('bookings')
      .update({ 
        message: `[Tagged: ${data.tag_name}]`,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);
  }
}

async function handleContactUnsubscribed(supabase: any, data: any) {
  logStep("Contact unsubscribed", { contactId: data.contact_id });
  
  const bookingId = data.contact?.custom_fields?.booking_id;
  if (bookingId) {
    await supabase
      .from('bookings')
      .update({ 
        sms_opt_in: false,
        message: `[UNSUBSCRIBED ${new Date().toLocaleString()}] - No more SMS`,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);
    
    logStep("Contact unsubscribed - SMS disabled");
  }
}

async function handleCampaignCompleted(supabase: any, data: any) {
  logStep("Campaign completed", {
    campaign: data.campaign_name,
    totalSent: data.total_sent,
    delivered: data.delivered_count
  });
}

async function handleCampaignFailed(supabase: any, data: any) {
  logStep("Campaign failed", {
    campaign: data.campaign_name,
    reason: data.failure_reason
  });
}

async function handleAppointmentConfirmed(supabase: any, data: any) {
  logStep("Appointment confirmed via SMS", { 
    contactId: data.contact_id,
    appointmentId: data.appointment_id 
  });
  
  const bookingId = data.contact?.custom_fields?.booking_id;
  if (bookingId) {
    await supabase
      .from('bookings')
      .update({ 
        status: 'confirmed',
        message: `[APPOINTMENT CONFIRMED ${new Date().toLocaleString()}]`,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);
    
    logStep("Booking status updated to confirmed");
  }
}

async function handleAppointmentCancelled(supabase: any, data: any) {
  logStep("Appointment cancelled", { 
    contactId: data.contact_id,
    appointmentId: data.appointment_id,
    reason: data.cancellation_reason
  });
  
  const bookingId = data.contact?.custom_fields?.booking_id;
  if (bookingId) {
    await supabase
      .from('bookings')
      .update({ 
        status: 'cancelled',
        message: `[CANCELLED ${new Date().toLocaleString()}] Reason: ${data.cancellation_reason || 'Not provided'}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);
    
    logStep("Booking cancelled");
  }
}

async function handleAppointmentReminderSent(supabase: any, data: any) {
  logStep("Appointment reminder sent", { 
    contactId: data.contact_id,
    appointmentId: data.appointment_id 
  });
}

async function handleTaskCreated(supabase: any, data: any) {
  logStep("Task created", { 
    taskId: data.task_id,
    title: data.task_title 
  });
}

async function handleTaskOverdue(supabase: any, data: any) {
  logStep("Task overdue - needs attention", { 
    taskId: data.task_id,
    title: data.task_title 
  });
}

async function handleOpportunityStageChanged(supabase: any, data: any) {
  logStep("Opportunity stage changed", { 
    opportunityId: data.opportunity_id,
    oldStage: data.old_stage,
    newStage: data.new_stage
  });
  
  const bookingId = data.opportunity?.custom_fields?.booking_id;
  if (bookingId) {
    await supabase
      .from('bookings')
      .update({ 
        message: `[Pipeline: ${data.old_stage} → ${data.new_stage}]`,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);
  }
}

async function handleOpportunityWon(supabase: any, data: any) {
  logStep("Opportunity WON! 🎉", { 
    opportunityId: data.opportunity_id,
    value: data.value
  });
  
  const bookingId = data.opportunity?.custom_fields?.booking_id;
  if (bookingId) {
    await supabase
      .from('bookings')
      .update({ 
        status: 'completed',
        message: `[WON 🎉] Value: $${data.value || 'N/A'}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);
  }
}

async function handleOpportunityLost(supabase: any, data: any) {
  logStep("Opportunity lost", { 
    opportunityId: data.opportunity_id,
    reason: data.lost_reason
  });
  
  const bookingId = data.opportunity?.custom_fields?.booking_id;
  if (bookingId) {
    await supabase
      .from('bookings')
      .update({ 
        status: 'cancelled',
        message: `[LOST] Reason: ${data.lost_reason || 'Not provided'}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);
  }
}

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Phase 12: Master Automation Orchestrator - "Set & Forget"
 * Unified automation flow combining all phases (1-11)
 * 
 * Flow:
 * 1. Lead Capture → Sync to SMS-iT + SuiteDash
 * 2. Lead Scoring → AI prioritization (Phase 10)
 * 3. Qualification → Automated follow-up sequences (Phase 3-4)
 * 4. Nurture → Multi-channel campaigns (Phase 8-9)
 * 5. Booking → Calendar sync + reminders (Phase 5)
 * 6. Service Delivery → Confirmation + updates
 * 7. Post-Service → Rating + review request (Phase 6)
 * 8. Retention → Win-back campaigns (Phase 9)
 * 9. Referral → Incentive offers (Phase 6)
 * 
 * Human intervention only needed for:
 * - Answering phone calls
 * - Performing actual notary services
 * - Handling complex edge cases
 */

interface AutomationEvent {
  eventType: 'new_booking' | 'booking_updated' | 'service_completed' | 'scheduled_check';
  bookingId?: string;
  data?: any;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const event: AutomationEvent = await req.json();
    console.log('Master automation triggered:', event.eventType);

    let result;
    
    switch (event.eventType) {
      case 'new_booking':
        result = await handleNewBooking(supabase, supabaseUrl, supabaseServiceKey, event.bookingId!);
        break;
        
      case 'booking_updated':
        result = await handleBookingUpdate(supabase, supabaseUrl, supabaseServiceKey, event.bookingId!);
        break;
        
      case 'service_completed':
        result = await handleServiceCompleted(supabase, supabaseUrl, supabaseServiceKey, event.bookingId!);
        break;
        
      case 'scheduled_check':
        result = await runScheduledChecks(supabase, supabaseUrl, supabaseServiceKey);
        break;
        
      default:
        throw new Error(`Unknown event type: ${event.eventType}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        eventType: event.eventType,
        result
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Error in master-automation:', error);
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
 * NEW BOOKING FLOW
 * Triggered: When booking form is submitted
 */
async function handleNewBooking(
  supabase: any, 
  supabaseUrl: string, 
  supabaseServiceKey: string,
  bookingId: string
) {
  console.log('=== NEW BOOKING AUTOMATION ===');
  console.log('Booking ID:', bookingId);

  const actions = [];

  // STEP 1: Sync to SMS-iT (Phase 2)
  try {
    const syncResult = await fetch(`${supabaseUrl}/functions/v1/smsit-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ bookingId })
    });
    actions.push({ step: 'smsit-sync', success: syncResult.ok });
    console.log('✅ SMS-iT sync:', syncResult.ok ? 'Success' : 'Failed');
  } catch (e) {
    actions.push({ step: 'smsit-sync', success: false, error: String(e) });
  }

  // STEP 2: Sync to SuiteDash (Phase 7)
  try {
    const suitedashResult = await fetch(`${supabaseUrl}/functions/v1/sync-booking-to-suitedash`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ bookingId })
    });
    actions.push({ step: 'suitedash-sync', success: suitedashResult.ok });
    console.log('✅ SuiteDash sync:', suitedashResult.ok ? 'Success' : 'Failed');
  } catch (e) {
    actions.push({ step: 'suitedash-sync', success: false, error: String(e) });
  }

  // STEP 3: AI Lead Scoring (Phase 10)
  try {
    const scoringResult = await fetch(`${supabaseUrl}/functions/v1/smsit-lead-scoring`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ bookingId })
    });
    const scoringData = await scoringResult.json();
    actions.push({ 
      step: 'lead-scoring', 
      success: scoringResult.ok,
      score: scoringData.leadScore?.score
    });
    console.log('✅ Lead scoring:', scoringData.leadScore?.score || 'N/A');

    // If critical score (90+), Ron is already notified by lead-scoring function
  } catch (e) {
    actions.push({ step: 'lead-scoring', success: false, error: String(e) });
  }

  // STEP 4: Send initial confirmation SMS
  try {
    const confirmResult = await fetch(`${supabaseUrl}/functions/v1/send-booking-confirmation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ bookingId })
    });
    actions.push({ step: 'confirmation-sms', success: confirmResult.ok });
    console.log('✅ Confirmation SMS:', confirmResult.ok ? 'Sent' : 'Failed');
  } catch (e) {
    actions.push({ step: 'confirmation-sms', success: false, error: String(e) });
  }

  // STEP 5: Auto-followup sequence starts automatically (Phase 3-4)
  // No action needed - cron job handles this

  console.log('=== NEW BOOKING AUTOMATION COMPLETE ===');
  
  return {
    bookingId,
    actionsCompleted: actions.length,
    actions
  };
}

/**
 * BOOKING UPDATE FLOW
 * Triggered: When booking status changes
 */
async function handleBookingUpdate(
  supabase: any,
  supabaseUrl: string,
  supabaseServiceKey: string,
  bookingId: string
) {
  console.log('=== BOOKING UPDATE AUTOMATION ===');
  
  const { data: booking } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (!booking) {
    throw new Error('Booking not found');
  }

  const actions = [];

  // If status changed to 'confirmed', send appointment reminder
  if (booking.status === 'confirmed') {
    try {
      const reminderResult = await fetch(`${supabaseUrl}/functions/v1/smsit-appointment-reminders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        }
      });
      actions.push({ step: 'appointment-reminder', success: reminderResult.ok });
      console.log('✅ Appointment reminder scheduled');
    } catch (e) {
      actions.push({ step: 'appointment-reminder', success: false, error: String(e) });
    }
  }

  // If status changed to 'cancelled', trigger win-back
  if (booking.status === 'cancelled') {
    console.log('🔄 Booking cancelled - adding to win-back segment');
    // Win-back handled by smart-segment (Phase 9)
  }

  return {
    bookingId,
    status: booking.status,
    actions
  };
}

/**
 * SERVICE COMPLETED FLOW
 * Triggered: When notary service is completed
 */
async function handleServiceCompleted(
  supabase: any,
  supabaseUrl: string,
  supabaseServiceKey: string,
  bookingId: string
) {
  console.log('=== SERVICE COMPLETED AUTOMATION ===');

  const actions = [];

  // STEP 1: Request rating (Phase 6)
  try {
    const ratingResult = await fetch(`${supabaseUrl}/functions/v1/smsit-post-service`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ 
        bookingId,
        action: 'request_rating'
      })
    });
    actions.push({ step: 'rating-request', success: ratingResult.ok });
    console.log('✅ Rating request sent');
  } catch (e) {
    actions.push({ step: 'rating-request', success: false, error: String(e) });
  }

  // STEP 2: Update status to completed
  try {
    await supabase
      .from('bookings')
      .update({ 
        status: 'completed',
        message: `[Service Completed ${new Date().toLocaleString()}]`,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);
    actions.push({ step: 'status-update', success: true });
    console.log('✅ Status updated to completed');
  } catch (e) {
    actions.push({ step: 'status-update', success: false, error: String(e) });
  }

  // STEP 3: Schedule retention check (90 days)
  // Handled by retention function (Phase 6)

  // STEP 4: Referral incentive (if 5-star rating received)
  // Handled by referral function (Phase 6)

  return {
    bookingId,
    actions
  };
}

/**
 * SCHEDULED CHECKS
 * Triggered: Cron job (every 6 hours)
 * Runs all automated maintenance tasks
 */
async function runScheduledChecks(
  supabase: any,
  supabaseUrl: string,
  supabaseServiceKey: string
) {
  console.log('=== SCHEDULED AUTOMATION CHECKS ===');

  const checks = [];

  // CHECK 1: Auto-followup (Phase 3-4)
  try {
    const followupResult = await fetch(`${supabaseUrl}/functions/v1/smsit-auto-followup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      }
    });
    const followupData = await followupResult.json();
    checks.push({ 
      check: 'auto-followup', 
      success: followupResult.ok,
      processed: followupData.processed
    });
    console.log('✅ Auto-followup check complete');
  } catch (e) {
    checks.push({ check: 'auto-followup', success: false, error: String(e) });
  }

  // CHECK 2: Appointment reminders (Phase 5)
  try {
    const reminderResult = await fetch(`${supabaseUrl}/functions/v1/smsit-appointment-reminders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      }
    });
    checks.push({ check: 'appointment-reminders', success: reminderResult.ok });
    console.log('✅ Appointment reminders check complete');
  } catch (e) {
    checks.push({ check: 'appointment-reminders', success: false, error: String(e) });
  }

  // CHECK 3: Retention campaigns (Phase 6)
  try {
    const retentionResult = await fetch(`${supabaseUrl}/functions/v1/smsit-retention`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      }
    });
    checks.push({ check: 'retention-campaigns', success: retentionResult.ok });
    console.log('✅ Retention check complete');
  } catch (e) {
    checks.push({ check: 'retention-campaigns', success: false, error: String(e) });
  }

  // CHECK 4: Smart segmentation (Phase 9)
  // Runs weekly via separate cron, not in this check

  // CHECK 5: Two-way sync (Phase 7)
  try {
    const syncResult = await fetch(`${supabaseUrl}/functions/v1/suitedash-contact-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      }
    });
    checks.push({ check: 'suitedash-sync', success: syncResult.ok });
    console.log('✅ SuiteDash sync check complete');
  } catch (e) {
    checks.push({ check: 'suitedash-sync', success: false, error: String(e) });
  }

  console.log('=== SCHEDULED CHECKS COMPLETE ===');
  
  return {
    checksRun: checks.length,
    timestamp: new Date().toISOString(),
    checks
  };
}

serve(handler);

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Phase 10: Predictive Intelligence & Lead Scoring
 * AI-powered lead quality scoring (0-100) to prioritize follow-up
 * 
 * Scoring factors:
 * - Engagement signals (SMS opt-in, urgency, detail level)
 * - Geographic proximity (local vs. distant)
 * - Customer history (repeat vs. new)
 * - Service value (high-value services get priority)
 * - Risk signals (spam indicators, low engagement)
 * 
 * Score actions:
 * - 90-100: IMMEDIATE call from Ron + priority handling
 * - 70-89: Standard automation (current flow)
 * - 50-69: Extended nurture (7-day campaign)
 * - 0-49: Light touch (email only, no SMS)
 */

interface LeadScoringRequest {
  bookingId: string;
}

interface LeadScore {
  score: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  factors: Record<string, number>;
  recommendations: string[];
  churnRisk: number;
}

const PENNSYLVANIA_AREA_CODES = ['814', '724', '878', '272'];
const HIGH_VALUE_SERVICES = [
  'business_retainer',
  'apostille',
  'registered_office',
  'loan_signing'
];
const SPAM_INDICATORS = ['tempmail', 'throwaway', 'guerrillamail', 'mailinator'];

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { bookingId } = await req.json() as LeadScoringRequest;
    console.log('Lead scoring request:', bookingId);

    // Fetch booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error('Booking not found');
    }

    console.log('Analyzing booking:', {
      service: booking.service,
      urgency: booking.urgency,
      email: booking.email.substring(0, 10) + '...'
    });

    // Calculate lead score
    const leadScore = await calculateLeadScore(supabase, booking);
    
    console.log('Lead score calculated:', {
      score: leadScore.score,
      priority: leadScore.priority,
      churnRisk: leadScore.churnRisk
    });

    // Update booking with score
    await supabase
      .from('bookings')
      .update({
        message: `${booking.message || ''}\n\n[LEAD SCORE: ${leadScore.score}/100 | Priority: ${leadScore.priority.toUpperCase()} | Churn Risk: ${leadScore.churnRisk}%]\nFactors: ${Object.entries(leadScore.factors).map(([k, v]) => `${k}:${v > 0 ? '+' : ''}${v}`).join(', ')}\nRecommendations: ${leadScore.recommendations.join('; ')}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    // Take immediate actions based on score
    if (leadScore.score >= 90) {
      // CRITICAL: Immediate notification to Ron
      await supabase.functions.invoke('send-sms-notification', {
        body: {
          phone: '+18145550100', // Ron's number
          message: `🚨 HOT LEAD ALERT!\n${booking.name} - ${booking.service}\nScore: ${leadScore.score}/100\nUrgency: ${booking.urgency}\nCall NOW: ${booking.phone}`
        }
      });
      console.log('Critical lead notification sent to Ron');
    } else if (leadScore.churnRisk >= 70) {
      // High churn risk: Early intervention
      await supabase.functions.invoke('smsit-voice-call', {
        body: {
          bookingId: booking.id,
          phone: booking.phone,
          name: booking.name,
          service: booking.service,
          callType: 'urgent',
          preferredDate: booking.preferred_date
        }
      });
      console.log('Churn intervention: voice call triggered');
    }

    return new Response(
      JSON.stringify({
        success: true,
        bookingId,
        leadScore
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Error in lead-scoring function:', error);
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
 * Calculate comprehensive lead score
 */
async function calculateLeadScore(supabase: any, booking: any): Promise<LeadScore> {
  let score = 50; // baseline
  const factors: Record<string, number> = {};
  const recommendations: string[] = [];

  // === ENGAGEMENT SIGNALS ===
  
  // SMS opt-in (strong signal)
  if (booking.sms_opt_in) {
    factors['sms_opt_in'] = 15;
    score += 15;
  } else {
    factors['no_sms'] = -10;
    score -= 10;
    recommendations.push('SMS opt-in missing - limited follow-up');
  }

  // Urgency level
  if (booking.urgency === 'asap' || booking.urgency === 'same_day') {
    factors['high_urgency'] = 20;
    score += 20;
    recommendations.push('High urgency - prioritize immediate contact');
  } else if (booking.urgency === 'flexible') {
    factors['low_urgency'] = -5;
    score -= 5;
  }

  // Message detail (longer = more serious)
  const messageLength = booking.message?.length || 0;
  if (messageLength > 100) {
    factors['detailed_inquiry'] = 10;
    score += 10;
  } else if (messageLength < 20) {
    factors['vague_inquiry'] = -10;
    score -= 10;
    recommendations.push('Vague inquiry - qualify intent early');
  }

  // === GEOGRAPHIC SIGNALS ===
  
  // Local area code (PA)
  const phoneAreaCode = booking.phone.substring(2, 5); // +1814 -> 814
  if (PENNSYLVANIA_AREA_CODES.includes(phoneAreaCode)) {
    factors['local_customer'] = 10;
    score += 10;
  } else {
    factors['distant_customer'] = -5;
    score -= 5;
  }

  // Location address provided
  if (booking.location_address && booking.location_address.length > 10) {
    factors['location_provided'] = 5;
    score += 5;
  }

  // === HISTORICAL SIGNALS ===
  
  // Check for repeat customer
  const { data: pastBookings } = await supabase
    .from('bookings')
    .select('id, status, created_at')
    .or(`email.eq.${booking.email},phone.eq.${booking.phone}`)
    .neq('id', booking.id);

  if (pastBookings && pastBookings.length > 0) {
    factors['repeat_customer'] = 25;
    score += 25;
    
    if (pastBookings.length >= 3) {
      factors['vip_customer'] = 15;
      score += 15;
      recommendations.push('VIP customer - white glove service');
    }

    // Check conversion rate
    const completedBookings = pastBookings.filter((b: any) => b.status === 'completed').length;
    const conversionRate = completedBookings / pastBookings.length;
    
    if (conversionRate >= 0.8) {
      factors['high_converter'] = 10;
      score += 10;
    } else if (conversionRate < 0.3) {
      factors['low_converter'] = -15;
      score -= 15;
      recommendations.push('Low historical conversion - qualify carefully');
    }
  } else {
    factors['new_customer'] = 0;
    recommendations.push('New customer - standard onboarding');
  }

  // === SERVICE VALUE SIGNALS ===
  
  if (HIGH_VALUE_SERVICES.includes(booking.service)) {
    factors['high_value_service'] = 20;
    score += 20;
    recommendations.push('High-value service - prioritize');
  }

  // Business email domain (not gmail/yahoo)
  const emailDomain = booking.email.split('@')[1]?.toLowerCase();
  const personalEmailDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
  
  if (emailDomain && !personalEmailDomains.includes(emailDomain)) {
    factors['business_email'] = 15;
    score += 15;
    recommendations.push('Business email - potential B2B opportunity');
  } else if (personalEmailDomains.includes(emailDomain || '')) {
    factors['personal_email'] = -5;
    score -= 5;
  }

  // === RISK SIGNALS ===
  
  // Spam email indicators
  if (SPAM_INDICATORS.some(indicator => booking.email.toLowerCase().includes(indicator))) {
    factors['spam_risk'] = -30;
    score -= 30;
    recommendations.push('SPAM RISK - verify identity before service');
  }

  // Missing critical information
  let missingFields = 0;
  if (!booking.preferred_date) missingFields++;
  if (!booking.preferred_time) missingFields++;
  if (!booking.location_address && booking.service === 'mobile_notary') missingFields++;
  
  if (missingFields > 0) {
    factors['incomplete_info'] = -5 * missingFields;
    score -= 5 * missingFields;
    recommendations.push(`Missing ${missingFields} field(s) - follow up to complete`);
  }

  // === CHURN PREDICTION ===
  
  let churnRisk = 30; // baseline
  
  // Far future date (>14 days) = higher churn
  if (booking.preferred_date) {
    const daysUntil = Math.floor((new Date(booking.preferred_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntil > 14) {
      churnRisk += 25;
      recommendations.push('Far future booking - risk of cancellation');
    } else if (daysUntil <= 3) {
      churnRisk -= 20;
    }
  }

  // Vague inquiry
  if (messageLength < 20) {
    churnRisk += 20;
  }

  // No SMS opt-in
  if (!booking.sms_opt_in) {
    churnRisk += 15;
  }

  // === FINAL SCORE ===
  
  score = Math.min(100, Math.max(0, score));
  churnRisk = Math.min(100, Math.max(0, churnRisk));

  // Determine priority
  let priority: 'critical' | 'high' | 'medium' | 'low';
  if (score >= 90) {
    priority = 'critical';
  } else if (score >= 70) {
    priority = 'high';
  } else if (score >= 50) {
    priority = 'medium';
  } else {
    priority = 'low';
  }

  return {
    score,
    priority,
    factors,
    recommendations,
    churnRisk
  };
}

serve(handler);

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[RETENTION] ${step}${detailsStr}`);
};

const SMSIT_BASE_URL = "https://aicpanel.smsit.ai/api/v2";

// VIP monthly campaign
async function sendVIPCampaign(apiKey: string, phone: string, name: string, lastService: string): Promise<boolean> {
  const firstName = name.split(' ')[0];
  const crossSellService = getCrossSellService(lastService);
  
  const message = `Hi ${firstName}! 👑 VIP exclusive: Did you know we also offer ${crossSellService}? Perfect for your needs! Book now and get priority scheduling. Reply YES or call (814) 555-0100 - Ron, Notroom`;

  try {
    const response = await fetch(`${SMSIT_BASE_URL}/campaign`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: phone,
        message: message,
        campaign_name: 'vip_monthly_crosssell',
      }),
    });

    if (!response.ok) {
      logStep("VIP campaign failed", { phone });
      return false;
    }

    logStep("VIP campaign sent", { phone, crossSellService });
    return true;
  } catch (error) {
    logStep("VIP campaign error", { error: String(error) });
    return false;
  }
}

// Reactivation campaign for inactive customers
async function sendReactivationCampaign(apiKey: string, phone: string, name: string, lastService: string, monthsInactive: number): Promise<boolean> {
  const firstName = name.split(' ')[0];
  
  const message = `Hi ${firstName}! 🎉 We miss you! It's been ${monthsInactive} months since your ${lastService}. Get 20% OFF your next service! Book by Friday. Code: WELCOME20 - Ron, Notroom https://notroom.lovable.app`;

  try {
    const response = await fetch(`${SMSIT_BASE_URL}/campaign`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: phone,
        message: message,
        campaign_name: 'reactivation_6month',
      }),
    });

    if (!response.ok) {
      logStep("Reactivation campaign failed", { phone });
      return false;
    }

    logStep("Reactivation campaign sent", { phone });
    return true;
  } catch (error) {
    logStep("Reactivation campaign error", { error: String(error) });
    return false;
  }
}

// Business retainer offer (for frequent users)
async function sendRetainerOffer(apiKey: string, phone: string, name: string, bookingCount: number): Promise<boolean> {
  const firstName = name.split(' ')[0];
  const monthlySavings = Math.round(bookingCount * 75 * 0.25); // 25% savings estimate
  
  const message = `Hi ${firstName}! 💼 You've used our services ${bookingCount} times. Save $${monthlySavings}+/month with our Business Retainer plan! Unlimited mobile notary + priority service. Let's chat: (814) 555-0100 - Ron, Notroom`;

  try {
    const response = await fetch(`${SMSIT_BASE_URL}/campaign`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: phone,
        message: message,
        campaign_name: 'business_retainer_offer',
      }),
    });

    if (!response.ok) {
      logStep("Retainer offer failed", { phone });
      return false;
    }

    logStep("Retainer offer sent", { phone, bookingCount });
    return true;
  } catch (error) {
    logStep("Retainer offer error", { error: String(error) });
    return false;
  }
}

// Cross-sell based on previous service
async function sendCrossSellCampaign(apiKey: string, phone: string, name: string, lastService: string): Promise<boolean> {
  const firstName = name.split(' ')[0];
  const crossSellService = getCrossSellService(lastService);
  const triggerLink = `https://notroom.lovable.app/?service=${encodeURIComponent(crossSellService)}&utm_source=sms&utm_campaign=crosssell`;
  
  const message = `Hi ${firstName}! Since you used our ${lastService}, you might need ${crossSellService}. We can help! 📋 Book now: ${triggerLink} - Ron, Notroom`;

  try {
    const response = await fetch(`${SMSIT_BASE_URL}/campaign`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: phone,
        message: message,
        campaign_name: 'cross_sell_30day',
      }),
    });

    if (!response.ok) {
      logStep("Cross-sell campaign failed", { phone });
      return false;
    }

    logStep("Cross-sell campaign sent", { phone, crossSellService });
    return true;
  } catch (error) {
    logStep("Cross-sell campaign error", { error: String(error) });
    return false;
  }
}

// Get complementary service for cross-sell
function getCrossSellService(lastService: string): string {
  const crossSellMap: Record<string, string> = {
    'mobile notary': 'Apostille Services',
    'loan signing': 'Document Preparation',
    'apostille': 'Document Retrieval',
    'remote online notary': 'Mobile Notary',
    'document preparation': 'Mobile Notary',
    'i-9 verification': 'Fingerprinting',
    'fingerprinting': 'I-9 Verification',
    'witness service': 'Mobile Notary',
    'passport photos': 'Apostille Services',
  };

  return crossSellMap[lastService.toLowerCase()] || 'our full range of notary services';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Retention function started");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const smsitApiKey = Deno.env.get("SMSIT_API_KEY");

    if (!supabaseUrl || !supabaseKey || !smsitApiKey) {
      throw new Error("Configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const now = new Date();

    let vipSent = 0, reactivationSent = 0, retainerSent = 0, crossSellSent = 0;

    // Campaign 1: VIP Monthly Cross-Sell (customers with promoter tag from last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const { data: vipCustomers } = await supabase
      .from('bookings')
      .select('*')
      .eq('status', 'completed')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (vipCustomers && vipCustomers.length > 0) {
      const vipEmails = new Set<string>();
      for (const booking of vipCustomers) {
        if (!vipEmails.has(booking.email)) {
          vipEmails.add(booking.email);
          await sendVIPCampaign(smsitApiKey, booking.phone, booking.name, booking.service);
          vipSent++;
        }
      }
    }

    // Campaign 2: 6-Month Reactivation (customers who haven't booked in 6+ months)
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    const { data: inactiveCustomers } = await supabase
      .from('bookings')
      .select('email, name, phone, service, created_at')
      .lt('created_at', sixMonthsAgo.toISOString())
      .order('created_at', { ascending: false });

    if (inactiveCustomers && inactiveCustomers.length > 0) {
      const processedEmails = new Set<string>();
      for (const customer of inactiveCustomers) {
        if (!processedEmails.has(customer.email)) {
          processedEmails.add(customer.email);
          
          // Check if they've booked since
          const { data: recentBookings } = await supabase
            .from('bookings')
            .select('id')
            .eq('email', customer.email)
            .gte('created_at', sixMonthsAgo.toISOString())
            .limit(1);

          if (!recentBookings || recentBookings.length === 0) {
            const monthsInactive = Math.floor(
              (now.getTime() - new Date(customer.created_at).getTime()) / (30 * 24 * 60 * 60 * 1000)
            );
            await sendReactivationCampaign(
              smsitApiKey,
              customer.phone,
              customer.name,
              customer.service,
              monthsInactive
            );
            reactivationSent++;
          }
        }
      }
    }

    // Campaign 3: Business Retainer Offers (customers with 3+ bookings in last 6 months)
    const { data: frequentCustomers } = await supabase
      .from('bookings')
      .select('email, name, phone')
      .gte('created_at', sixMonthsAgo.toISOString());

    if (frequentCustomers && frequentCustomers.length > 0) {
      const bookingCounts = new Map<string, { count: number; name: string; phone: string }>();
      
      for (const booking of frequentCustomers) {
        const existing = bookingCounts.get(booking.email);
        if (existing) {
          existing.count++;
        } else {
          bookingCounts.set(booking.email, {
            count: 1,
            name: booking.name,
            phone: booking.phone
          });
        }
      }

      for (const [email, data] of bookingCounts.entries()) {
        if (data.count >= 3) {
          await sendRetainerOffer(smsitApiKey, data.phone, data.name, data.count);
          retainerSent++;
        }
      }
    }

    // Campaign 4: 30-Day Cross-Sell (completed bookings from 30-35 days ago)
    const thirtyFiveDaysAgo = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000);
    const { data: crossSellCustomers } = await supabase
      .from('bookings')
      .select('*')
      .eq('status', 'completed')
      .gte('created_at', thirtyFiveDaysAgo.toISOString())
      .lt('created_at', thirtyDaysAgo.toISOString());

    if (crossSellCustomers && crossSellCustomers.length > 0) {
      const processedEmails = new Set<string>();
      for (const booking of crossSellCustomers) {
        if (!processedEmails.has(booking.email)) {
          processedEmails.add(booking.email);
          await sendCrossSellCampaign(
            smsitApiKey,
            booking.phone,
            booking.name,
            booking.service
          );
          crossSellSent++;
        }
      }
    }

    logStep("Retention campaigns complete", {
      vipSent,
      reactivationSent,
      retainerSent,
      crossSellSent
    });

    return new Response(
      JSON.stringify({
        success: true,
        campaigns_sent: {
          vip_monthly: vipSent,
          reactivation_6month: reactivationSent,
          retainer_offers: retainerSent,
          cross_sell_30day: crossSellSent,
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

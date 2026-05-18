import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SMSIT_BASE_URL = "https://aicpanel.smsit.ai/api/v2";

/**
 * Phase 9: Campaign Automation & Segmentation
 * Manages seasonal campaigns and automated marketing flows
 * 
 * Campaigns:
 * - Tax Season (Jan-Apr): Apostille rush
 * - Real Estate Peak (May-Sep): Title transfers
 * - School Year (Aug-Sep): I-9 verification
 * - Business Renewals (Nov-Dec): License renewals
 * - Holiday Season (Nov-Dec): Last-minute notary
 */

interface Campaign {
  name: string;
  segment: string;
  active: boolean;
  months: number[];
  message: string;
  frequency: 'weekly' | 'bi-weekly' | 'monthly';
  lastSent?: Date;
}

const SEASONAL_CAMPAIGNS: Campaign[] = [
  {
    name: "Tax Season - Apostille Rush",
    segment: "apostille,document_retrieval",
    active: true,
    months: [1, 2, 3, 4], // Jan-Apr
    message: "📋 Tax season document chaos? We can apostille your IRS docs in 48h. Book today: {link}",
    frequency: 'bi-weekly'
  },
  {
    name: "Real Estate Peak - Title Transfers",
    segment: "vehicle_title_transfer,mobile_notary",
    active: true,
    months: [5, 6, 7, 8, 9], // May-Sep
    message: "🏡 Buying/selling property? We handle all notary needs same-day. Fast & reliable: {link}",
    frequency: 'monthly'
  },
  {
    name: "School Year - I-9 Verification",
    segment: "i9_verification,business_retainer",
    active: true,
    months: [8, 9], // Aug-Sep
    message: "📚 New hires this fall? Bulk I-9 verification available. Same-day service: {link}",
    frequency: 'weekly'
  },
  {
    name: "Business License Renewals",
    segment: "business_retainer,registered_office",
    active: true,
    months: [11, 12], // Nov-Dec
    message: "📝 License renewal deadline approaching? Don't wait until the last minute. Book: {link}",
    frequency: 'weekly'
  },
  {
    name: "Holiday Season - Last Minute Notary",
    segment: "loan_signing,mobile_notary",
    active: true,
    months: [11, 12], // Nov-Dec
    message: "🎄 Need notary before year-end? We're available through the holidays. Schedule: {link}",
    frequency: 'bi-weekly'
  }
];

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const smsitApiKey = Deno.env.get('SMSIT_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { campaignType, manualSegment, customMessage } = await req.json();
    
    const currentMonth = new Date().getMonth() + 1;
    console.log('Campaign manager running:', { currentMonth, campaignType });

    // Determine which campaigns to run
    let campaignsToRun: Campaign[] = [];
    
    if (campaignType === 'manual') {
      // Manual campaign with custom segment
      campaignsToRun = [{
        name: 'Manual Campaign',
        segment: manualSegment,
        active: true,
        months: [currentMonth],
        message: customMessage,
        frequency: 'monthly'
      }];
    } else {
      // Automatic seasonal campaigns
      campaignsToRun = SEASONAL_CAMPAIGNS.filter(
        c => c.active && c.months.includes(currentMonth)
      );
    }

    console.log(`Running ${campaignsToRun.length} campaigns for month ${currentMonth}`);

    const results = [];

    for (const campaign of campaignsToRun) {
      console.log('Processing campaign:', campaign.name);
      
      // Get contacts matching segment
      const segmentTags = campaign.segment.split(',');
      
      // Query bookings that match service types in segment
      const { data: contacts, error: queryError } = await supabase
        .from('bookings')
        .select('phone, name, email, service, sms_opt_in, created_at')
        .eq('sms_opt_in', true)
        .in('service', segmentTags);

      if (queryError) {
        console.error('Error querying contacts:', queryError);
        continue;
      }

      // Filter unique contacts (by phone)
      const uniqueContacts = Array.from(
        new Map(contacts?.map(c => [c.phone, c])).values()
      );

      console.log(`Found ${uniqueContacts.length} contacts for ${campaign.name}`);

      // Send campaign to each contact
      let sent = 0;
      let failed = 0;

      for (const contact of uniqueContacts) {
        const firstName = contact.name.split(' ')[0];
        const bookingLink = `https://notroom.lovable.app/?service=${encodeURIComponent(contact.service)}&utm_source=sms&utm_campaign=${campaign.name.toLowerCase().replace(/\s+/g, '_')}`;
        
        const personalizedMessage = campaign.message
          .replace('{name}', firstName)
          .replace('{link}', bookingLink);

        try {
          const smsResponse = await fetch(`${SMSIT_BASE_URL}/messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${smsitApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              to: contact.phone,
              message: personalizedMessage,
              campaign_name: campaign.name,
              track_links: true
            })
          });

          if (smsResponse.ok) {
            sent++;
            console.log(`Sent to ${contact.phone}`);
          } else {
            failed++;
            console.error(`Failed to send to ${contact.phone}`);
          }

          // Rate limiting: 100ms between sends
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (sendError) {
          failed++;
          console.error('Send error:', sendError);
        }
      }

      results.push({
        campaign: campaign.name,
        segment: campaign.segment,
        contacts: uniqueContacts.length,
        sent,
        failed
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        month: currentMonth,
        campaignsRun: campaignsToRun.length,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Error in campaign-manager function:', error);
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

serve(handler);

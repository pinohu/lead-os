import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { validateApiKeyEnv } from "../_shared/envValidation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SMSIT-SYNC] ${step}${detailsStr}`);
};

const SMSIT_BASE_URL = "https://aicpanel.smsit.ai/api/v2";

interface BookingData {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  location_address?: string;
  preferred_date?: string;
  preferred_time?: string;
  message?: string;
  urgency?: string;
}

interface SMSiTContact {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address?: string;
  tags?: string[];
  custom_fields?: Record<string, any>;
}

// Create or update contact in SMS-iT
async function syncContact(apiKey: string, booking: BookingData): Promise<string | null> {
  const nameParts = booking.name.split(' ');
  const firstName = nameParts[0] || booking.name;
  const lastName = nameParts.slice(1).join(' ') || '';

  const contactData: SMSiTContact = {
    first_name: firstName,
    last_name: lastName,
    email: booking.email,
    phone: booking.phone,
    address: booking.location_address,
    tags: [
      `service_${booking.service.toLowerCase().replace(/\s+/g, '_')}`,
      `urgency_${booking.urgency || 'flexible'}`,
      'lead_source_website',
      'status_new'
    ],
    custom_fields: {
      booking_id: booking.id,
      preferred_date: booking.preferred_date,
      preferred_time: booking.preferred_time,
      service_requested: booking.service,
    }
  };

  try {
    const response = await fetch(`${SMSIT_BASE_URL}/contacts`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(contactData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logStep("Contact sync failed", { status: response.status, error: errorText });
      return null;
    }

    const result = await response.json();
    logStep("Contact created/updated", { contactId: result.id });
    return result.id;
  } catch (error) {
    logStep("Contact sync error", { error: String(error) });
    return null;
  }
}

// Add contact to groups
async function addToGroups(apiKey: string, contactId: string, booking: BookingData): Promise<boolean> {
  const groups = [
    `service_${booking.service.toLowerCase().replace(/\s+/g, '_')}`,
    'all_leads'
  ];

  // Add location-based group if available
  if (booking.location_address) {
    const locationMatch = booking.location_address.match(/,\s*([A-Z]{2})\s*\d/);
    if (locationMatch) {
      groups.push(`location_${locationMatch[1].toLowerCase()}`);
    }
  }

  try {
    for (const groupName of groups) {
      const response = await fetch(`${SMSIT_BASE_URL}/group`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contact_id: contactId,
          group_name: groupName,
        }),
      });

      if (!response.ok) {
        logStep("Group assignment failed", { group: groupName });
      }
    }
    logStep("Contact added to groups", { groups });
    return true;
  } catch (error) {
    logStep("Group assignment error", { error: String(error) });
    return false;
  }
}

// Create opportunity
async function createOpportunity(apiKey: string, contactId: string, booking: BookingData): Promise<boolean> {
  const opportunityData = {
    contact_id: contactId,
    title: `${booking.service} - ${booking.name}`,
    value: estimateServiceValue(booking.service),
    stage: "quote_requested",
    probability: 60,
    expected_close_date: booking.preferred_date,
    description: booking.message,
  };

  try {
    const response = await fetch(`${SMSIT_BASE_URL}/opportunities`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(opportunityData),
    });

    if (!response.ok) {
      logStep("Opportunity creation failed");
      return false;
    }

    logStep("Opportunity created");
    return true;
  } catch (error) {
    logStep("Opportunity creation error", { error: String(error) });
    return false;
  }
}

// Update pipeline stage
async function updatePipeline(apiKey: string, contactId: string, stage: string): Promise<boolean> {
  try {
    const response = await fetch(`${SMSIT_BASE_URL}/pipelines`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contact_id: contactId,
        stage: stage,
        updated_at: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      logStep("Pipeline update failed", { stage });
      return false;
    }

    logStep("Pipeline updated", { stage });
    return true;
  } catch (error) {
    logStep("Pipeline update error", { error: String(error) });
    return false;
  }
}

// Send welcome message with quote
async function sendWelcomeMessage(apiKey: string, booking: BookingData): Promise<boolean> {
  const estimatedPrice = estimateServiceValue(booking.service);
  const triggerLink = `https://notroom.lovable.app/?booking=${booking.id}&utm_source=sms&utm_campaign=instant_quote`;
  
  const message = `Hi ${booking.name.split(' ')[0]}! Thanks for your interest in ${booking.service}. Estimated quote: $${estimatedPrice}. Book now to secure your spot: ${triggerLink}`;

  try {
    const response = await fetch(`${SMSIT_BASE_URL}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: booking.phone,
        message: message,
        campaign_name: "instant_quote",
      }),
    });

    if (!response.ok) {
      logStep("Welcome message failed");
      return false;
    }

    logStep("Welcome message sent");
    return true;
  } catch (error) {
    logStep("Welcome message error", { error: String(error) });
    return false;
  }
}

// Create follow-up task
async function createFollowUpTask(apiKey: string, contactId: string, booking: BookingData): Promise<boolean> {
  const taskData = {
    contact_id: contactId,
    title: `Follow up with ${booking.name} - ${booking.service}`,
    description: `No booking after quote. Call to discuss: ${booking.phone}`,
    due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
    priority: booking.urgency === 'urgent' ? 'high' : 'medium',
    status: 'pending',
  };

  try {
    const response = await fetch(`${SMSIT_BASE_URL}/tasks`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(taskData),
    });

    if (!response.ok) {
      logStep("Task creation failed");
      return false;
    }

    logStep("Follow-up task created");
    return true;
  } catch (error) {
    logStep("Task creation error", { error: String(error) });
    return false;
  }
}

// Estimate service value
function estimateServiceValue(service: string): number {
  const priceMap: Record<string, number> = {
    'mobile notary': 75,
    'loan signing': 150,
    'apostille': 100,
    'remote online notary': 25,
    'witness service': 50,
    'i-9 verification': 35,
    'document preparation': 60,
    'fingerprinting': 45,
    'passport photos': 20,
    'translation certification': 50,
  };

  const serviceLower = service.toLowerCase();
  return priceMap[serviceLower] || 75; // Default to $75
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Validate environment
    const env = validateApiKeyEnv('smsit');

    const { booking, action = 'full_sync' } = await req.json();

    if (!booking) {
      throw new Error("Booking data is required");
    }

    const apiKey = env.SMSIT_API_KEY!;

    logStep("Starting SMS-iT sync", { bookingId: booking.id, action });

    // Phase 1: Contact Creation & Enrichment
    const contactId = await syncContact(apiKey, booking);
    if (!contactId) {
      throw new Error("Failed to create/update contact");
    }

    // Run parallel background tasks (fire and forget)
    if (action === 'full_sync') {
      Promise.all([
        addToGroups(apiKey, contactId, booking),
        createOpportunity(apiKey, contactId, booking),
        updatePipeline(apiKey, contactId, 'quote_requested'),
        sendWelcomeMessage(apiKey, booking),
        createFollowUpTask(apiKey, contactId, booking),
      ]).catch(err => {
        logStep("Background tasks error", { error: String(err) });
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        contactId: contactId,
        message: "SMS-iT sync completed successfully"
      }),
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

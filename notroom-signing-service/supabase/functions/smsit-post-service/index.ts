import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[POST-SERVICE] ${step}${detailsStr}`);
};

const SMSIT_BASE_URL = "https://aicpanel.smsit.ai/api/v2";

// Send rating request
async function sendRatingRequest(apiKey: string, phone: string, name: string, service: string, bookingId: string): Promise<boolean> {
  const firstName = name.split(' ')[0];
  const message = `Hi ${firstName}! 🌟 How was your ${service} experience? Reply with a rating:\n1 = Poor\n2 = Fair\n3 = Good\n4 = Great\n5 = Excellent\nYour feedback helps us improve! - Ron, Notroom`;

  try {
    const response = await fetch(`${SMSIT_BASE_URL}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: phone,
        message: message,
        campaign_name: 'post_service_rating',
      }),
    });

    if (!response.ok) {
      logStep("Rating request failed", { phone });
      return false;
    }

    logStep("Rating request sent", { bookingId });
    return true;
  } catch (error) {
    logStep("Rating request error", { error: String(error) });
    return false;
  }
}

// Send Google review request (for high ratings)
async function sendReviewRequest(apiKey: string, phone: string, name: string): Promise<boolean> {
  const firstName = name.split(' ')[0];
  const reviewLink = "https://g.page/r/YOUR_GOOGLE_PLACE_ID/review"; // Replace with actual Google review link
  const message = `Thanks ${firstName}! 🙏 We're thrilled you had a great experience! Would you mind sharing a Google review? It helps others find us: ${reviewLink} - Ron, Notroom`;

  try {
    const response = await fetch(`${SMSIT_BASE_URL}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: phone,
        message: message,
        campaign_name: 'google_review_request',
      }),
    });

    if (!response.ok) {
      logStep("Review request failed");
      return false;
    }

    logStep("Review request sent");
    return true;
  } catch (error) {
    logStep("Review request error", { error: String(error) });
    return false;
  }
}

// Send recovery message (for low ratings)
async function sendRecoveryMessage(apiKey: string, phone: string, name: string): Promise<boolean> {
  const firstName = name.split(' ')[0];
  const message = `Hi ${firstName}, we're sorry we didn't meet your expectations. 😔 Your satisfaction is our priority. Ron would like to speak with you personally. Please call (814) 555-0100 or reply to this message. - Notroom`;

  try {
    const response = await fetch(`${SMSIT_BASE_URL}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: phone,
        message: message,
        campaign_name: 'customer_recovery',
      }),
    });

    if (!response.ok) {
      logStep("Recovery message failed");
      return false;
    }

    logStep("Recovery message sent");
    return true;
  } catch (error) {
    logStep("Recovery message error", { error: String(error) });
    return false;
  }
}

// Create urgent task for manager
async function createUrgentTask(apiKey: string, contactId: string, name: string, rating: number, phone: string): Promise<boolean> {
  try {
    const response = await fetch(`${SMSIT_BASE_URL}/tasks`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contact_id: contactId,
        title: `🚨 URGENT: Unhappy Customer - ${name}`,
        description: `Customer rated service ${rating}/5. Call immediately: ${phone}`,
        priority: 'high',
        status: 'pending',
        due_date: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      }),
    });

    if (!response.ok) {
      logStep("Task creation failed");
      return false;
    }

    logStep("Urgent task created");
    return true;
  } catch (error) {
    logStep("Task creation error", { error: String(error) });
    return false;
  }
}

// Update contact tags based on rating
async function updateContactTags(apiKey: string, contactId: string, rating: number): Promise<boolean> {
  const tag = rating >= 4 ? 'promoter' : rating === 3 ? 'passive' : 'detractor';
  
  try {
    const response = await fetch(`${SMSIT_BASE_URL}/tags`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contact_id: contactId,
        tag: tag,
      }),
    });

    if (!response.ok) {
      logStep("Tag update failed", { tag });
      return false;
    }

    logStep("Contact tagged", { tag });
    return true;
  } catch (error) {
    logStep("Tag update error", { error: String(error) });
    return false;
  }
}

// Add to VIP group if promoter
async function addToVIPGroup(apiKey: string, contactId: string): Promise<boolean> {
  try {
    const response = await fetch(`${SMSIT_BASE_URL}/group`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contact_id: contactId,
        group_name: 'vip_customers',
      }),
    });

    if (!response.ok) {
      logStep("VIP group add failed");
      return false;
    }

    logStep("Added to VIP group");
    return true;
  } catch (error) {
    logStep("VIP group error", { error: String(error) });
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Post-service function started");

    const { bookingId, action, rating, contactId } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const smsitApiKey = Deno.env.get("SMSIT_API_KEY");

    if (!supabaseUrl || !supabaseKey || !smsitApiKey) {
      throw new Error("Configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    if (action === 'send_rating_request') {
      // Fetch booking details
      const { data: booking, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (error || !booking) {
        throw new Error("Booking not found");
      }

      await sendRatingRequest(
        smsitApiKey,
        booking.phone,
        booking.name,
        booking.service,
        bookingId
      );

      return new Response(
        JSON.stringify({ success: true, message: "Rating request sent" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    if (action === 'process_rating' && rating && contactId) {
      // Process the rating received
      logStep("Processing rating", { rating, contactId });

      // Update contact tags
      await updateContactTags(smsitApiKey, contactId, rating);

      if (rating >= 4) {
        // High rating: Request Google review + add to VIP
        logStep("High rating detected - sending review request");
        
        const { data: booking } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', bookingId)
          .single();

        if (booking) {
          await sendReviewRequest(smsitApiKey, booking.phone, booking.name);
          if (rating === 5) {
            await addToVIPGroup(smsitApiKey, contactId);
          }
        }
      } else if (rating <= 3) {
        // Low rating: Send recovery message + create urgent task
        logStep("Low rating detected - initiating recovery");
        
        const { data: booking } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', bookingId)
          .single();

        if (booking) {
          await sendRecoveryMessage(smsitApiKey, booking.phone, booking.name);
          await createUrgentTask(smsitApiKey, contactId, booking.name, rating, booking.phone);
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: "Rating processed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    throw new Error("Invalid action");
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

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SMS-NOTIFICATION] ${step}${detailsStr}`);
};

// Send SMS via SMS-iT CRM
async function sendViaSMSiT(to: string, message: string): Promise<boolean> {
  const apiKey = Deno.env.get("SMSIT_API_KEY");

  if (!apiKey) {
    logStep("SMS-iT API key not configured");
    return false;
  }

  try {
    const response = await fetch(
      "https://api.sms-it.ai/v1/sms/send",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: to,
          message: message,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      logStep("SMS-iT failed", { status: response.status, error: errorText });
      return false;
    }

    logStep("SMS sent via SMS-iT CRM");
    return true;
  } catch (error) {
    logStep("SMS-iT error", { error: String(error) });
    return false;
  }
}

// Send SMS via Twilio (fallback)
async function sendViaTwilio(to: string, message: string): Promise<boolean> {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

  if (!accountSid || !authToken || !fromNumber) {
    logStep("Twilio credentials not configured");
    return false;
  }

  try {
    const auth = btoa(`${accountSid}:${authToken}`);
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${auth}`,
        },
        body: new URLSearchParams({
          To: to,
          From: fromNumber,
          Body: message,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      logStep("Twilio failed", { error: errorText });
      return false;
    }

    logStep("SMS sent via Twilio");
    return true;
  } catch (error) {
    logStep("Twilio error", { error: String(error) });
    return false;
  }
}

// Send WhatsApp message via WbizTool
async function sendViaWhatsApp(to: string, message: string): Promise<boolean> {
  const apiKey = Deno.env.get("WBIZTOOL_API_KEY");
  const phoneNumberId = Deno.env.get("WBIZTOOL_PHONE_NUMBER_ID");

  if (!apiKey || !phoneNumberId) {
    logStep("WbizTool credentials not configured");
    return false;
  }

  try {
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to.replace(/\D/g, ''),
      type: "text",
      text: {
        preview_url: true,
        body: message,
      },
    };

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      logStep("WhatsApp failed", { status: response.status, error: errorText });
      return false;
    }

    logStep("Message sent via WhatsApp");
    return true;
  } catch (error) {
    logStep("WhatsApp error", { error: String(error) });
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { phone, message, bookingId, preferWhatsApp = false } = await req.json();

    if (!phone || !message) {
      throw new Error("Phone number and message are required");
    }

    // Normalize phone number (add +1 for US numbers if not present)
    const normalizedPhone = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`;

    logStep("Sending notification", { phone: normalizedPhone, bookingId, preferWhatsApp });

    let success = false;

    // Try WhatsApp first if preferred, otherwise SMS-iT
    if (preferWhatsApp) {
      success = await sendViaWhatsApp(normalizedPhone, message);
      
      if (!success) {
        logStep("WhatsApp failed, trying SMS fallback");
        success = await sendViaSMSiT(normalizedPhone, message);
      }
    } else {
      // Try SMS-iT CRM first, then fallback to Twilio
      success = await sendViaSMSiT(normalizedPhone, message);
      
      if (!success) {
        logStep("SMS-iT failed, trying Twilio fallback");
        success = await sendViaTwilio(normalizedPhone, message);
      }
    }

    if (!success) {
      throw new Error("Failed to send notification via all providers");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Notification sent successfully"
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
        status: 400,
      }
    );
  }
});

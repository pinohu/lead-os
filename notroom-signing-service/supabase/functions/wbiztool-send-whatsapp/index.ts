import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[WHATSAPP] ${step}${detailsStr}`);
};

// Send WhatsApp message via WbizTool
async function sendWhatsAppMessage(
  to: string,
  message: string,
  mediaUrl?: string
): Promise<boolean> {
  const apiKey = Deno.env.get("WBIZTOOL_API_KEY");
  const phoneNumberId = Deno.env.get("WBIZTOOL_PHONE_NUMBER_ID");

  if (!apiKey || !phoneNumberId) {
    logStep("WbizTool credentials not configured");
    return false;
  }

  try {
    const payload: any = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to.replace(/\D/g, ''), // Remove non-digits
      type: mediaUrl ? "image" : "text",
    };

    if (mediaUrl) {
      payload.image = {
        link: mediaUrl,
        caption: message,
      };
    } else {
      payload.text = {
        preview_url: true,
        body: message,
      };
    }

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
      logStep("WbizTool API failed", { status: response.status, error: errorText });
      return false;
    }

    const result = await response.json();
    logStep("WhatsApp message sent", { messageId: result.messages?.[0]?.id });
    return true;
  } catch (error) {
    logStep("WhatsApp sending error", { error: String(error) });
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { phone, message, mediaUrl, bookingId } = await req.json();

    if (!phone || !message) {
      throw new Error("Phone number and message are required");
    }

    // Normalize phone number (ensure it has country code)
    const normalizedPhone = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`;

    logStep("Sending WhatsApp", { phone: normalizedPhone, bookingId, hasMedia: !!mediaUrl });

    const success = await sendWhatsAppMessage(normalizedPhone, message, mediaUrl);

    if (!success) {
      throw new Error("Failed to send WhatsApp message");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "WhatsApp message sent successfully"
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

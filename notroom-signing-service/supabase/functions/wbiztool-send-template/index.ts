import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[WHATSAPP-TEMPLATE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { phone, templateName, templateParams, languageCode = "en" } = await req.json();

    if (!phone || !templateName) {
      throw new Error("Phone number and template name are required");
    }

    const apiKey = Deno.env.get("WBIZTOOL_API_KEY");
    const phoneNumberId = Deno.env.get("WBIZTOOL_PHONE_NUMBER_ID");

    if (!apiKey || !phoneNumberId) {
      throw new Error("WbizTool credentials not configured");
    }

    // Normalize phone number
    const normalizedPhone = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`;

    logStep("Sending template", { phone: normalizedPhone, template: templateName });

    const payload = {
      messaging_product: "whatsapp",
      to: normalizedPhone.replace(/\D/g, ''),
      type: "template",
      template: {
        name: templateName,
        language: {
          code: languageCode,
        },
        components: templateParams ? [
          {
            type: "body",
            parameters: templateParams.map((param: string) => ({
              type: "text",
              text: param,
            })),
          },
        ] : [],
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
      logStep("Template send failed", { status: response.status, error: errorText });
      throw new Error(`Failed to send template: ${errorText}`);
    }

    const result = await response.json();
    logStep("Template sent successfully", { messageId: result.messages?.[0]?.id });

    return new Response(
      JSON.stringify({
        success: true,
        messageId: result.messages?.[0]?.id,
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

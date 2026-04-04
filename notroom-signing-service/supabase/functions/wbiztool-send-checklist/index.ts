import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyJWT } from "../_shared/webhookSecurity.ts";
import { validateUUID, validatePhone } from "../_shared/validation.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const WBIZTOOL_API_KEY = Deno.env.get('WBIZTOOL_API_KEY');
const WBIZTOOL_PHONE_NUMBER_ID = Deno.env.get('WBIZTOOL_PHONE_NUMBER_ID');
const WBIZTOOL_BASE_URL = 'https://api.wbiztool.com/v1';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify JWT for internal function
  const jwtCheck = verifyJWT(req);
  if (!jwtCheck.valid) {
    return new Response(
      JSON.stringify({ error: jwtCheck.error }),
      { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { bookingId, phone, service } = await req.json();
    
    // Validate inputs
    if (bookingId) {
      const uuidValidation = validateUUID(bookingId);
      if (!uuidValidation.valid) {
        return new Response(
          JSON.stringify({ error: uuidValidation.error }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.valid) {
      return new Response(
        JSON.stringify({ error: phoneValidation.error }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Sending WhatsApp checklist for booking:', bookingId);

    // Get booking details
    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    const firstName = booking?.name?.split(' ')[0] || 'there';

    // Checklist based on service type
    const checklists: Record<string, string> = {
      'NOTARY_NOW': `Hi ${firstName}! 👋

✅ For your notary appointment, please bring:

1️⃣ Government-issued photo ID (driver's license, passport, or state ID)
2️⃣ All documents requiring notarization (UNSIGNED)
3️⃣ A witness if required by the document type
4️⃣ Any additional information requested by the document issuer

📸 You can upload photos of your documents here for pre-verification if needed.

🔔 We'll send a reminder 24 hours and 2 hours before your appointment.

Questions? Reply here or call 814-790-4223!`,

      'APOSTILLE': `Hi ${firstName}! 👋

✅ For your apostille service, please provide:

1️⃣ Original document(s) requiring apostille
2️⃣ Copy of the document for our records
3️⃣ Notarized affidavit if applicable
4️⃣ Destination country information

⚡ Processing times:
• Standard: 5-7 business days
• Rush: 2-3 business days
• Express: 24-48 hours

📊 We'll send status updates throughout the process.

Questions? Reply here anytime!`,

      'FORMATION': `Hi ${firstName}! 👋

✅ For your business formation, we need:

1️⃣ Proposed business name (we'll check availability)
2️⃣ Registered agent address
3️⃣ Principal office address
4️⃣ Owner/member information

📋 Next steps:
1. We'll prepare your formation documents
2. File with the state
3. Obtain your EIN (optional)
4. Set up registered agent service (optional)

🎯 Timeline: 5-7 business days for standard filing

Questions? Let's discuss here or call 814-790-4223!`,
    };

    const serviceKey = service.toUpperCase().includes('NOTARY') ? 'NOTARY_NOW'
      : service.toUpperCase().includes('APOSTILLE') ? 'APOSTILLE'
      : 'FORMATION';

    const message = checklists[serviceKey] || checklists['NOTARY_NOW'];

    // Format phone number for WhatsApp (remove + and non-digits)
    const formattedPhone = phone.replace(/\D/g, '');

    // Send via WbizTool
    const waResponse = await fetch(`${WBIZTOOL_BASE_URL}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WBIZTOOL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedPhone,
        type: 'text',
        text: {
          preview_url: false,
          body: message,
        },
      }),
    });

    if (!waResponse.ok) {
      const error = await waResponse.text();
      console.error('WbizTool error:', error);
      throw new Error(`WbizTool API error: ${error}`);
    }

    const result = await waResponse.json();
    console.log('WhatsApp checklist sent:', result);

    // Log the event
    if (bookingId) {
      await supabase
        .from('call_events')
        .insert({
          booking_id: bookingId,
          event_type: 'whatsapp_sent',
          tool: 'wbiztool',
          metadata: {
            message_id: result.messages?.[0]?.id,
            template: 'DOC_CHECKLIST',
            to: formattedPhone,
            service: serviceKey,
          },
        });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: result.messages?.[0]?.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('WhatsApp checklist error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

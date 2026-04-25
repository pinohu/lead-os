import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SUITEDASH-SYNC] ${step}${detailsStr}`);
};

interface SuiteDashContact {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  custom_fields?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const suitedashApiKey = Deno.env.get("SUITEDASH_API_KEY");
    if (!suitedashApiKey) throw new Error("SUITEDASH_API_KEY is not set");
    logStep("SuiteDash API key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Fetch user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) throw new Error(`Profile fetch error: ${profileError.message}`);
    logStep("Profile fetched", { profileId: profile.id });

    // Fetch CROP application if exists
    const { data: cropApp, error: cropError } = await supabaseClient
      .from('crop_applications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cropError && cropError.code !== 'PGRST116') {
      logStep("CROP application fetch warning", { error: cropError });
    }

    // Prepare SuiteDash contact data
    const nameParts = (profile.display_name || user.email || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const contactData: SuiteDashContact = {
      first_name: firstName,
      last_name: lastName,
      email: user.email || '',
      phone: profile.phone || '',
      company: profile.company_name || '',
      custom_fields: {
        crop_status: cropApp?.status || 'none',
        crop_plan: cropApp?.selected_plan || 'none',
        user_id: user.id,
      }
    };

    if (cropApp) {
      contactData.address = cropApp.current_address || '';
      contactData.custom_fields!.entity_name = cropApp.entity_name;
      contactData.custom_fields!.entity_type = cropApp.entity_type;
    }

    logStep("Prepared contact data", { email: contactData.email });

    // Check if contact exists in SuiteDash
    const checkResponse = await fetch(
      `https://api.suitedash.com/v1/contacts?email=${encodeURIComponent(contactData.email)}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${suitedashApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!checkResponse.ok) {
      throw new Error(`SuiteDash check failed: ${checkResponse.statusText}`);
    }

    const checkData = await checkResponse.json();
    logStep("Checked existing contacts", { count: checkData.data?.length || 0 });

    let suitedashContactId: string | undefined;
    let method: string;
    let endpoint: string;

    if (checkData.data && checkData.data.length > 0) {
      // Update existing contact
      suitedashContactId = checkData.data[0].id;
      method = "PUT";
      endpoint = `https://api.suitedash.com/v1/contacts/${suitedashContactId}`;
      logStep("Updating existing contact", { suitedashContactId });
    } else {
      // Create new contact
      method = "POST";
      endpoint = "https://api.suitedash.com/v1/contacts";
      logStep("Creating new contact");
    }

    const syncResponse = await fetch(endpoint, {
      method,
      headers: {
        "Authorization": `Bearer ${suitedashApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(contactData),
    });

    if (!syncResponse.ok) {
      const errorText = await syncResponse.text();
      throw new Error(`SuiteDash sync failed: ${syncResponse.statusText} - ${errorText}`);
    }

    const syncData = await syncResponse.json();
    if (syncData.data?.id) {
      suitedashContactId = syncData.data.id;
    }
    logStep("Contact synced successfully", { suitedashContactId });

    // Update crop_application with SuiteDash contact ID if exists
    if (cropApp && suitedashContactId) {
      const { error: updateError } = await supabaseClient
        .from('crop_applications')
        .update({ 
          suitedash_contact_id: suitedashContactId,
          suitedash_synced_at: new Date().toISOString()
        })
        .eq('id', cropApp.id);

      if (updateError) {
        logStep("Warning: Failed to update CROP application with SuiteDash ID", { error: updateError });
      } else {
        logStep("Updated CROP application with SuiteDash contact ID");
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      suitedash_contact_id: suitedashContactId,
      action: method === 'POST' ? 'created' : 'updated'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

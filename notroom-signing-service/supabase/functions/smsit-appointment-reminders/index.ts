import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[APPOINTMENT-REMINDERS] ${step}${detailsStr}`);
};

const SMSIT_BASE_URL = "https://aicpanel.smsit.ai/api/v2";

// Send reminder SMS via SMS-iT
async function sendReminder(
  apiKey: string,
  phone: string,
  name: string,
  service: string,
  date: string,
  time: string,
  location: string,
  reminderType: '48h' | '24h' | '2h'
): Promise<boolean> {
  const firstName = name.split(' ')[0];
  let message = '';

  if (reminderType === '48h') {
    message = `Hi ${firstName}! 👋 Looking forward to serving you in 2 days for ${service} on ${date} at ${time}. Location: ${location}. See you soon! - Ron, Notroom`;
  } else if (reminderType === '24h') {
    message = `Reminder: Your ${service} appointment is tomorrow (${date}) at ${time}. Ron will arrive at: ${location}. Questions? Call (814) 555-0100 - Notroom`;
  } else if (reminderType === '2h') {
    message = `🚗 On the way! Your ${service} appointment is in 2 hours (${time}). Running late? Text us at (814) 555-0100 - Ron, Notroom`;
  }

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
        campaign_name: `appointment_reminder_${reminderType}`,
      }),
    });

    if (!response.ok) {
      logStep(`${reminderType} reminder failed`, { phone });
      return false;
    }

    logStep(`${reminderType} reminder sent`, { phone, name });
    return true;
  } catch (error) {
    logStep(`${reminderType} reminder error`, { error: String(error) });
    return false;
  }
}

// Parse time string to Date object
function parseAppointmentDateTime(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hourMin, period] = timeStr.split(' ');
  let [hours, minutes] = hourMin.split(':').map(Number);
  
  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }
  
  return new Date(year, month - 1, day, hours, minutes || 0);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Appointment reminders function started");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const smsitApiKey = Deno.env.get("SMSIT_API_KEY");

    if (!supabaseUrl || !supabaseKey || !smsitApiKey) {
      throw new Error("Configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const now = new Date();

    // Calculate time windows
    const fortyEightHoursFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    // Fetch confirmed bookings with future appointments
    const { data: upcomingBookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('status', 'confirmed')
      .not('preferred_date', 'is', null)
      .not('preferred_time', 'is', null)
      .gte('preferred_date', now.toISOString().split('T')[0]);

    if (!upcomingBookings || upcomingBookings.length === 0) {
      logStep("No upcoming appointments found");
      return new Response(
        JSON.stringify({ success: true, message: "No reminders to send" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    let sent48h = 0, sent24h = 0, sent2h = 0;

    for (const booking of upcomingBookings) {
      try {
        const appointmentTime = parseAppointmentDateTime(
          booking.preferred_date,
          booking.preferred_time
        );

        const timeDiff = appointmentTime.getTime() - now.getTime();
        const hoursUntil = timeDiff / (1000 * 60 * 60);

        // Send 48-hour reminder (window: 47.5 - 48.5 hours)
        if (hoursUntil >= 47.5 && hoursUntil <= 48.5) {
          const success = await sendReminder(
            smsitApiKey,
            booking.phone,
            booking.name,
            booking.service,
            booking.preferred_date,
            booking.preferred_time,
            booking.location_address || 'Your specified location',
            '48h'
          );
          if (success) sent48h++;
        }

        // Send 24-hour reminder (window: 23.5 - 24.5 hours)
        if (hoursUntil >= 23.5 && hoursUntil <= 24.5) {
          const success = await sendReminder(
            smsitApiKey,
            booking.phone,
            booking.name,
            booking.service,
            booking.preferred_date,
            booking.preferred_time,
            booking.location_address || 'Your specified location',
            '24h'
          );
          if (success) sent24h++;
        }

        // Send 2-hour reminder (window: 1.75 - 2.25 hours)
        if (hoursUntil >= 1.75 && hoursUntil <= 2.25) {
          const success = await sendReminder(
            smsitApiKey,
            booking.phone,
            booking.name,
            booking.service,
            booking.preferred_date,
            booking.preferred_time,
            booking.location_address || 'Your specified location',
            '2h'
          );
          if (success) sent2h++;
        }
      } catch (parseError) {
        logStep("Error processing booking", { bookingId: booking.id, error: String(parseError) });
      }
    }

    logStep("Reminder cycle complete", { sent48h, sent24h, sent2h });

    return new Response(
      JSON.stringify({
        success: true,
        reminders_sent: {
          "48h": sent48h,
          "24h": sent24h,
          "2h": sent2h
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

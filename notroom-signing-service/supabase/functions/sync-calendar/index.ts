import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CALENDAR-SYNC] ${step}${detailsStr}`);
};

// Sync with Lunacal
async function syncWithLunacal(booking: any): Promise<boolean> {
  const lunacalApiKey = Deno.env.get("LUNACAL_API_KEY");
  const lunacalCalendarId = Deno.env.get("LUNACAL_CALENDAR_ID");

  if (!lunacalApiKey || !lunacalCalendarId) {
    logStep("Lunacal credentials not configured");
    return false;
  }

  try {
    const response = await fetch("https://api.lunacal.com/v1/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lunacalApiKey}`,
      },
      body: JSON.stringify({
        calendar_id: lunacalCalendarId,
        title: `${booking.service.toUpperCase()} - ${booking.name}`,
        description: `Booking ID: ${booking.id}\nService: ${booking.service}\nEmail: ${booking.email}\nPhone: ${booking.phone}${booking.location_address ? `\nLocation: ${booking.location_address}` : ''}`,
        start_time: booking.preferred_date && booking.preferred_time 
          ? `${booking.preferred_date}T${convertTimeToISO(booking.preferred_time)}`
          : null,
        duration: 60, // 1 hour default
        buffer_before: 15,
        buffer_after: 15,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logStep("Lunacal sync failed", { error: errorText });
      return false;
    }

    logStep("Synced with Lunacal");
    return true;
  } catch (error) {
    logStep("Lunacal error", { error: String(error) });
    return false;
  }
}

// Sync with Google Calendar
async function syncWithGoogleCalendar(booking: any): Promise<boolean> {
  const googleApiKey = Deno.env.get("GOOGLE_CALENDAR_API_KEY");
  const googleCalendarId = Deno.env.get("GOOGLE_CALENDAR_ID");

  if (!googleApiKey || !googleCalendarId) {
    logStep("Google Calendar credentials not configured");
    return false;
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${googleCalendarId}/events`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${googleApiKey}`,
        },
        body: JSON.stringify({
          summary: `${booking.service.toUpperCase()} - ${booking.name}`,
          description: `Booking ID: ${booking.id}\nEmail: ${booking.email}\nPhone: ${booking.phone}${booking.location_address ? `\nLocation: ${booking.location_address}` : ''}`,
          start: {
            dateTime: booking.preferred_date && booking.preferred_time
              ? `${booking.preferred_date}T${convertTimeToISO(booking.preferred_time)}`
              : new Date().toISOString(),
            timeZone: "America/New_York",
          },
          end: {
            dateTime: booking.preferred_date && booking.preferred_time
              ? addHourToDateTime(`${booking.preferred_date}T${convertTimeToISO(booking.preferred_time)}`)
              : new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            timeZone: "America/New_York",
          },
          location: booking.location_address || "",
          attendees: [{ email: booking.email }],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      logStep("Google Calendar sync failed", { error: errorText });
      return false;
    }

    logStep("Synced with Google Calendar");
    return true;
  } catch (error) {
    logStep("Google Calendar error", { error: String(error) });
    return false;
  }
}

// Helper: Convert time string to ISO format
function convertTimeToISO(timeStr: string): string {
  // Convert "2:30 PM" to "14:30:00"
  const [time, period] = timeStr.split(' ');
  const [hours, minutes] = time.split(':');
  let hour = parseInt(hours);
  
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  
  return `${hour.toString().padStart(2, '0')}:${minutes}:00`;
}

// Helper: Add 1 hour to datetime
function addHourToDateTime(dateTime: string): string {
  const date = new Date(dateTime);
  date.setHours(date.getHours() + 1);
  return date.toISOString();
}

// Fetch available time slots from calendars
async function getAvailableSlots(date: string): Promise<string[]> {
  // This would query both calendars and return available slots
  // Implementation depends on calendar API capabilities
  logStep("Fetching available slots", { date });
  
  // For now, return a placeholder
  // In production, this would check both calendars for availability
  return [];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { bookingId, action = "sync" } = await req.json();

    if (!bookingId) {
      throw new Error("Booking ID is required");
    }

    // Get booking details from database
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: booking, error } = await supabaseClient
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (error || !booking) {
      throw new Error("Booking not found");
    }

    logStep("Booking retrieved", { bookingId });

    if (action === "sync") {
      // Sync with both calendar systems
      const lunacalSuccess = await syncWithLunacal(booking);
      const googleSuccess = await syncWithGoogleCalendar(booking);

      return new Response(
        JSON.stringify({
          success: true,
          lunacal: lunacalSuccess,
          google: googleSuccess,
          message: "Calendar sync completed"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else if (action === "get_slots") {
      const { date } = await req.json();
      const slots = await getAvailableSlots(date);
      
      return new Response(
        JSON.stringify({
          success: true,
          slots,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
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
        status: 400,
      }
    );
  }
});

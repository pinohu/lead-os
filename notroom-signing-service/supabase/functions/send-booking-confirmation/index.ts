import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// HTML escaping function to prevent injection attacks
const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BookingConfirmationRequest {
  name: string;
  email: string;
  service: string;
  preferredDate?: string;
  preferredTime?: string;
  bookingId: string;
}

const getServiceLabel = (service: string): string => {
  const labels: Record<string, string> = {
    ron: "Remote Online Notary (RON)",
    mobile: "Mobile Notary",
    apostille: "Apostille Service",
    loan: "Loan Signing Agent",
  };
  return labels[service] || service;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Create Supabase client with user's auth token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { name, email, service, preferredDate, preferredTime, bookingId }: BookingConfirmationRequest = await req.json();

    // Verify the booking exists and belongs to the requester
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('email', email)
      .single();

    if (bookingError || !booking) {
      console.error("Booking verification failed:", bookingError);
      return new Response(JSON.stringify({ error: 'Invalid booking or unauthorized access' }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Sending booking confirmation to:", email);

    const serviceLabel = getServiceLabel(service);
    
    const emailResponse = await resend.emails.send({
      from: "Notroom <onboarding@resend.dev>",
      to: [email],
      subject: `Booking Confirmation - ${serviceLabel}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">Booking Confirmed!</h1>
            </div>
            
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 18px; margin-bottom: 20px;">Hi ${escapeHtml(name)},</p>
              
              <p style="margin-bottom: 20px;">Thank you for booking with Notroom! We've received your request and will process it shortly.</p>
              
              <div style="background: white; border-left: 4px solid #1e40af; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <h2 style="margin-top: 0; color: #1e40af; font-size: 20px;">Booking Details</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #64748b;">Booking ID:</td>
                    <td style="padding: 8px 0;">${escapeHtml(bookingId)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #64748b;">Service:</td>
                    <td style="padding: 8px 0;">${escapeHtml(serviceLabel)}</td>
                  </tr>
                  ${preferredDate ? `
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #64748b;">Preferred Date:</td>
                    <td style="padding: 8px 0;">${escapeHtml(preferredDate)}</td>
                  </tr>
                  ` : ''}
                  ${preferredTime ? `
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #64748b;">Preferred Time:</td>
                    <td style="padding: 8px 0;">${escapeHtml(preferredTime)}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>

              <h3 style="color: #1e40af; margin-top: 30px;">What Happens Next?</h3>
              <ol style="padding-left: 20px;">
                <li style="margin-bottom: 10px;">Our team will review your booking request</li>
                <li style="margin-bottom: 10px;">We'll confirm availability and reach out within 24 hours</li>
                <li style="margin-bottom: 10px;">You'll receive a confirmation with final details</li>
              </ol>

              ${service === 'ron' ? `
              <div style="background: #dbeafe; border: 1px solid #3b82f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold; color: #1e40af;">💡 Preparing for Your Online Notarization</p>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                  <li>Have a valid government-issued photo ID ready</li>
                  <li>Ensure you have a stable internet connection</li>
                  <li>Test your camera and microphone</li>
                  <li>Have your documents ready in PDF format</li>
                </ul>
              </div>
              ` : ''}

              ${service === 'mobile' ? `
              <div style="background: #dbeafe; border: 1px solid #3b82f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold; color: #1e40af;">💡 Preparing for Mobile Service</p>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                  <li>Have a valid government-issued photo ID ready</li>
                  <li>Ensure all signers will be present</li>
                  <li>Have your documents printed and ready</li>
                  <li>Confirm the location address is accessible</li>
                </ul>
              </div>
              ` : ''}

              <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e2e8f0;">
                <p style="margin-bottom: 10px;">Questions? We're here to help!</p>
                <p style="margin: 5px 0;">📞 <a href="tel:814-480-0989" style="color: #1e40af; text-decoration: none;">814-480-0989</a></p>
                <p style="margin: 5px 0;">📧 <a href="mailto:support@notroom.com" style="color: #1e40af; text-decoration: none;">support@notroom.com</a></p>
              </div>

              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e2e8f0;">
                <p style="color: #64748b; font-size: 14px; margin: 0;">
                  Thank you for choosing Notroom<br>
                  Licensed & Bonded Pennsylvania Notary Public
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-booking-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-VERIFICATION] ${step}${detailsStr}`);
};

// Generate 6-digit verification code
const generateCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Email provider types
type EmailProvider = "resend" | "sendgrid" | "brevo";

// Send email via Resend
async function sendViaResend(email: string, code: string): Promise<boolean> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    logStep("Resend API key not configured");
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Notroom <noreply@notroom.com>",
        to: [email],
        subject: "Your Notroom Verification Code",
        html: getEmailHtml(code),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logStep("Resend failed", { error: errorText });
      return false;
    }

    logStep("Email sent via Resend");
    return true;
  } catch (error) {
    logStep("Resend error", { error: String(error) });
    return false;
  }
}

// Send email via SendGrid
async function sendViaSendGrid(email: string, code: string): Promise<boolean> {
  const sendgridApiKey = Deno.env.get("SENDGRID_API_KEY");
  if (!sendgridApiKey) {
    logStep("SendGrid API key not configured");
    return false;
  }

  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sendgridApiKey}`,
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }] }],
        from: { email: "noreply@notroom.com", name: "Notroom" },
        subject: "Your Notroom Verification Code",
        content: [{ type: "text/html", value: getEmailHtml(code) }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logStep("SendGrid failed", { error: errorText });
      return false;
    }

    logStep("Email sent via SendGrid");
    return true;
  } catch (error) {
    logStep("SendGrid error", { error: String(error) });
    return false;
  }
}

// Send email via Brevo
async function sendViaBrevo(email: string, code: string): Promise<boolean> {
  const brevoApiKey = Deno.env.get("BREVO_API_KEY");
  if (!brevoApiKey) {
    logStep("Brevo API key not configured");
    return false;
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": brevoApiKey,
      },
      body: JSON.stringify({
        sender: { email: "noreply@notroom.com", name: "Notroom" },
        to: [{ email }],
        subject: "Your Notroom Verification Code",
        htmlContent: getEmailHtml(code),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logStep("Brevo failed", { error: errorText });
      return false;
    }

    logStep("Email sent via Brevo");
    return true;
  } catch (error) {
    logStep("Brevo error", { error: String(error) });
    return false;
  }
}

// Get email HTML template
function getEmailHtml(code: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Verify Your Email</h2>
      <p>Your verification code is:</p>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
        ${code}
      </div>
      <p style="color: #6b7280;">This code will expire in 10 minutes.</p>
      <p style="color: #6b7280; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="color: #9ca3af; font-size: 12px;">
        Notroom - Professional Notary Services<br>
        Erie, PA | (814) 480-0989<br>
        support@notroom.com
      </p>
    </div>
  `;
}

// Rotate through providers with fallback
async function sendEmailWithRotation(email: string, code: string): Promise<void> {
  const providers: EmailProvider[] = ["sendgrid", "brevo", "resend"];
  
  // Try each provider in order
  for (const provider of providers) {
    logStep(`Attempting to send via ${provider}`);
    
    let success = false;
    switch (provider) {
      case "resend":
        success = await sendViaResend(email, code);
        break;
      case "sendgrid":
        success = await sendViaSendGrid(email, code);
        break;
      case "brevo":
        success = await sendViaBrevo(email, code);
        break;
    }
    
    if (success) {
      return; // Successfully sent, exit
    }
  }
  
  throw new Error("All email providers failed");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { email, purpose = "booking" } = await req.json();
    
    if (!email) {
      throw new Error("Email is required");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format");
    }

    logStep("Email validated", { email });

    // Generate verification code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    logStep("Code generated", { expiresAt });

    // Store code in database
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Create verification_codes table if needed (handled by migration)
    const { error: insertError } = await supabaseClient
      .from("verification_codes")
      .insert({
        email: email.toLowerCase().trim(),
        code,
        purpose,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      logStep("Error storing code", { error: insertError });
      throw new Error(`Failed to store verification code: ${insertError.message}`);
    }

    logStep("Code stored in database");

    // Send email via rotating providers with fallback
    try {
      await sendEmailWithRotation(email.toLowerCase().trim(), code);
      logStep("Verification email sent successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logStep("All email providers failed", { error: errorMessage });
      throw new Error(`Failed to send verification email: ${errorMessage}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Verification code sent to your email" 
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

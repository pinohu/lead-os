// ── Email Service ─────────────────────────────────────────────────────
// Sends transactional emails via Emailit (when EMAILIT_API_KEY is set).
// Falls back to console logging in dev/dry-run mode.

import { cityConfig } from "@/lib/city-config";
import { logger } from "@/lib/logger";

/** Escape HTML special characters to prevent XSS in email templates */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

const FROM_ADDRESS = `${cityConfig.name} Pro <noreply@${cityConfig.domain}>`;

/**
 * Send an email. Returns true on success.
 * In dev or without EMAILIT_API_KEY, logs to console instead.
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const apiKey = process.env.EMAILIT_API_KEY;

  if (!apiKey) {
    logger.info("email", `[DRY RUN] Would send to ${options.to}: ${options.subject}`);
    if (process.env.NODE_ENV === "development") {
      logger.debug("email", "HTML preview:", options.html.slice(0, 200));
    }
    return true;
  }

  try {
    const res = await fetch("https://api.emailit.com/v2/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: options.to,
        subject: options.subject,
        html: options.html,
        reply_to: options.replyTo,
        headers: {
          "List-Unsubscribe": `<mailto:unsubscribe@${cityConfig.domain}?subject=unsubscribe>`,
        },
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      logger.error("email", "Emailit API error:", { status: res.status, error });
      return false;
    }

    return true;
  } catch (err) {
    logger.error("email", "Failed to send email:", err);
    return false;
  }
}

// ── Email Templates ──────────────────────────────────────────────────

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px">
    <div style="background:#fff;border-radius:8px;border:1px solid #e5e7eb;padding:32px">
      ${content}
    </div>
    <div style="text-align:center;margin-top:24px;font-size:12px;color:#9ca3af">
      <p style="margin:0">${cityConfig.name} Pro &middot; <a href="https://${cityConfig.domain}" style="color:#9ca3af">${cityConfig.domain}</a></p>
      <p style="margin:4px 0 0">Erie, PA 16501</p>
      <p style="margin:8px 0 0"><a href="mailto:hello@${cityConfig.domain}" style="color:#9ca3af">hello@${cityConfig.domain}</a> &middot; <a href="https://${cityConfig.domain}/privacy" style="color:#9ca3af">Privacy Policy</a></p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendConsumerConfirmation(
  consumerEmail: string,
  consumerName: string,
  niche: string,
  routedToProvider: string | null
): Promise<boolean> {
  const statusMessage = routedToProvider
    ? `Your request has been sent to <strong>${escapeHtml(routedToProvider)}</strong>, a verified ${escapeHtml(niche)} provider in ${cityConfig.name}. They will contact you shortly.`
    : `We&apos;re matching your request with a ${escapeHtml(niche)} provider in ${cityConfig.name}. You&apos;ll be contacted once a match is found.`;

  return sendEmail({
    to: consumerEmail,
    subject: `Your ${escapeHtml(niche)} service request — ${cityConfig.name} Pro`,
    html: baseTemplate(`
      <h2 style="margin:0 0 16px;color:#111827;font-size:20px">We Received Your Request</h2>
      <p style="color:#374151;margin:0 0 16px">Hi${consumerName ? ` ${escapeHtml(consumerName)}` : ""},</p>
      <p style="color:#374151;margin:0 0 16px">${statusMessage}</p>
      <h3 style="color:#111827;font-size:16px;margin:24px 0 12px">What to Expect</h3>
      <ul style="color:#374151;padding-left:20px;margin:0 0 24px">
        <li style="margin:8px 0">A provider will reach out within 24 hours (often much sooner)</li>
        <li style="margin:8px 0">They may contact you by phone, text, or email</li>
        <li style="margin:8px 0">You are under no obligation — get a quote and decide</li>
      </ul>
      <p style="color:#6b7280;font-size:13px;margin:0">You consented to be contacted when you submitted this request. If you no longer wish to be contacted, reply to this email with &quot;cancel&quot; and we will remove your request.</p>
    `),
    replyTo: `hello@${cityConfig.domain}`,
  });
}

export async function sendNewLeadNotification(
  providerEmail: string,
  providerName: string,
  leadName: string,
  leadEmail: string,
  leadPhone: string | null,
  niche: string,
  message: string | null
): Promise<boolean> {
  return sendEmail({
    to: providerEmail,
    subject: `New ${escapeHtml(niche)} lead for ${escapeHtml(providerName)}`,
    html: baseTemplate(`
      <h2 style="margin:0 0 16px;color:#111827;font-size:20px">New Lead Received</h2>
      <p style="color:#374151;margin:0 0 16px">A new lead has been routed to your territory:</p>
      <table style="width:100%;border-collapse:collapse;margin:0 0 24px">
        <tr><td style="padding:8px 0;color:#6b7280;width:100px">Name:</td><td style="padding:8px 0;color:#111827;font-weight:600">${escapeHtml(leadName)}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280">Email:</td><td style="padding:8px 0;color:#111827"><a href="mailto:${escapeHtml(leadEmail)}" style="color:#2563eb">${escapeHtml(leadEmail)}</a></td></tr>
        ${leadPhone ? `<tr><td style="padding:8px 0;color:#6b7280">Phone:</td><td style="padding:8px 0;color:#111827"><a href="tel:${escapeHtml(leadPhone)}" style="color:#2563eb">${escapeHtml(leadPhone)}</a></td></tr>` : ""}
        ${message ? `<tr><td style="padding:8px 0;color:#6b7280;vertical-align:top">Message:</td><td style="padding:8px 0;color:#111827">${escapeHtml(message)}</td></tr>` : ""}
      </table>
      <a href="https://${cityConfig.domain}/dashboard/leads" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600">View in Dashboard</a>
      <p style="margin:16px 0 0;font-size:13px;color:#9ca3af">Respond within 5 minutes for the best conversion rates.</p>
    `),
  });
}

export async function sendAdminLeadAlert(
  adminEmail: string,
  details: {
    leadName: string;
    leadEmail: string;
    leadPhone: string | null;
    niche: string;
    message: string | null;
    routedTo: string | null;
    routeType: string;
    leadId: string;
  }
): Promise<boolean> {
  const statusBadge = details.routedTo
    ? `<span style="display:inline-block;background:#dcfce7;color:#166534;padding:4px 12px;border-radius:4px;font-size:13px;font-weight:600">Routed to ${escapeHtml(details.routedTo)}</span>`
    : `<span style="display:inline-block;background:#fef2f2;color:#991b1b;padding:4px 12px;border-radius:4px;font-size:13px;font-weight:600">UNMATCHED &mdash; no ${escapeHtml(details.niche)} provider</span>`;

  return sendEmail({
    to: adminEmail,
    subject: `[Lead] ${escapeHtml(details.niche)} — ${details.routedTo ? escapeHtml(details.routedTo) : "UNMATCHED"}`,
    html: baseTemplate(`
      <h2 style="margin:0 0 16px;color:#111827;font-size:20px">New Lead Received</h2>
      <div style="margin:0 0 20px">${statusBadge}</div>
      <table style="width:100%;border-collapse:collapse;margin:0 0 24px">
        <tr><td style="padding:8px 0;color:#6b7280;width:100px">Lead ID:</td><td style="padding:8px 0;color:#111827;font-family:monospace;font-size:12px">${escapeHtml(details.leadId)}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280">Niche:</td><td style="padding:8px 0;color:#111827;font-weight:600">${escapeHtml(details.niche)}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280">Route:</td><td style="padding:8px 0;color:#111827">${escapeHtml(details.routeType)}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280">Name:</td><td style="padding:8px 0;color:#111827">${escapeHtml(details.leadName)}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280">Email:</td><td style="padding:8px 0;color:#111827"><a href="mailto:${escapeHtml(details.leadEmail)}" style="color:#2563eb">${escapeHtml(details.leadEmail)}</a></td></tr>
        ${details.leadPhone ? `<tr><td style="padding:8px 0;color:#6b7280">Phone:</td><td style="padding:8px 0;color:#111827"><a href="tel:${escapeHtml(details.leadPhone)}" style="color:#2563eb">${escapeHtml(details.leadPhone)}</a></td></tr>` : ""}
        ${details.message ? `<tr><td style="padding:8px 0;color:#6b7280;vertical-align:top">Message:</td><td style="padding:8px 0;color:#111827">${escapeHtml(details.message)}</td></tr>` : ""}
      </table>
      <a href="https://${cityConfig.domain}/admin" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600">View in Admin Dashboard</a>
    `),
  });
}

export async function sendWelcomeEmail(
  providerEmail: string,
  providerName: string,
  niche: string,
  bankedLeadsDelivered: number
): Promise<boolean> {
  return sendEmail({
    to: providerEmail,
    subject: `Welcome to ${cityConfig.name} Pro — Your ${escapeHtml(niche)} territory is live!`,
    html: baseTemplate(`
      <h2 style="margin:0 0 16px;color:#111827;font-size:20px">Welcome, ${escapeHtml(providerName)}!</h2>
      <p style="color:#374151;margin:0 0 16px">Your exclusive <strong>${escapeHtml(niche)}</strong> territory in ${cityConfig.name} is now active.</p>
      ${bankedLeadsDelivered > 0 ? `<p style="color:#374151;margin:0 0 16px"><strong>${bankedLeadsDelivered} banked leads</strong> have already been delivered to your dashboard.</p>` : ""}
      <h3 style="color:#111827;font-size:16px;margin:24px 0 12px">What Happens Next</h3>
      <ol style="color:#374151;padding-left:20px;margin:0 0 24px">
        <li style="margin:8px 0">New leads are routed directly to you via email + dashboard</li>
        <li style="margin:8px 0">Respond within 5 minutes for best results</li>
        <li style="margin:8px 0">Track your leads and performance in the dashboard</li>
        <li style="margin:8px 0">Dispute bad leads for account credit</li>
      </ol>
      <a href="https://${cityConfig.domain}/dashboard" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600">Go to Dashboard</a>
    `),
  });
}

export async function sendSlaWarningEmail(
  providerEmail: string,
  providerName: string,
  leadName: string,
  minutesElapsed: number
): Promise<boolean> {
  return sendEmail({
    to: providerEmail,
    subject: `Urgent: Lead waiting ${minutesElapsed}+ minutes`,
    html: baseTemplate(`
      <h2 style="margin:0 0 16px;color:#dc2626;font-size:20px">SLA Warning</h2>
      <p style="color:#374151;margin:0 0 16px">Your lead <strong>${escapeHtml(leadName)}</strong> has been waiting <strong>${minutesElapsed} minutes</strong> without a response.</p>
      <p style="color:#374151;margin:0 0 24px">Leads that aren't responded to within 15 minutes may be routed to a backup provider.</p>
      <a href="https://${cityConfig.domain}/dashboard/leads" style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600">Respond Now</a>
    `),
  });
}

export async function sendAdminContactAlert(
  adminEmail: string,
  details: {
    name: string | null;
    email: string;
    phone: string | null;
    message: string | null;
    niche: string | null;
    messageId: string;
  }
): Promise<boolean> {
  return sendEmail({
    to: adminEmail,
    subject: `[Contact] New message from ${details.name ? escapeHtml(details.name) : details.email}`,
    html: baseTemplate(`
      <h2 style="margin:0 0 16px;color:#111827;font-size:20px">New Contact Message</h2>
      <table style="width:100%;border-collapse:collapse;margin:0 0 24px">
        <tr><td style="padding:8px 0;color:#6b7280;width:100px">From:</td><td style="padding:8px 0;color:#111827;font-weight:600">${details.name ? escapeHtml(details.name) : "Anonymous"}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280">Email:</td><td style="padding:8px 0;color:#111827"><a href="mailto:${escapeHtml(details.email)}" style="color:#2563eb">${escapeHtml(details.email)}</a></td></tr>
        ${details.phone ? `<tr><td style="padding:8px 0;color:#6b7280">Phone:</td><td style="padding:8px 0;color:#111827"><a href="tel:${escapeHtml(details.phone)}" style="color:#2563eb">${escapeHtml(details.phone)}</a></td></tr>` : ""}
        ${details.niche ? `<tr><td style="padding:8px 0;color:#6b7280">Niche:</td><td style="padding:8px 0;color:#111827">${escapeHtml(details.niche)}</td></tr>` : ""}
        ${details.message ? `<tr><td style="padding:8px 0;color:#6b7280;vertical-align:top">Message:</td><td style="padding:8px 0;color:#111827">${escapeHtml(details.message)}</td></tr>` : ""}
      </table>
      <a href="https://${cityConfig.domain}/admin/messages" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600">View in Admin</a>
    `),
    replyTo: details.email,
  });
}

export async function sendListingOutreach(
  businessEmail: string,
  details: {
    businessName: string;
    niche: string;
    leadCount: number;
    listingId: string;
    claimUrl: string;
  }
): Promise<boolean> {
  return sendEmail({
    to: businessEmail,
    subject: `Someone on ${cityConfig.domain} requested a quote from ${escapeHtml(details.businessName)}`,
    html: baseTemplate(`
      <h2 style="margin:0 0 16px;color:#111827;font-size:20px">You Have a New Lead</h2>
      <p style="color:#374151;margin:0 0 16px">A potential customer found your <strong>${escapeHtml(details.niche)}</strong> listing on <a href="https://${cityConfig.domain}" style="color:#2563eb">${cityConfig.domain}</a> and requested a quote from <strong>${escapeHtml(details.businessName)}</strong>.</p>
      ${details.leadCount > 1 ? `<p style="color:#374151;margin:0 0 16px"><strong>${details.leadCount} leads</strong> have been submitted for your business this month.</p>` : ""}
      <h3 style="color:#111827;font-size:16px;margin:24px 0 12px">Claim Your Free Listing</h3>
      <p style="color:#374151;margin:0 0 16px">You're missing leads right now. Claim your listing to:</p>
      <ul style="color:#374151;padding-left:20px;margin:0 0 24px">
        <li style="margin:8px 0">Receive lead details (name, phone, email) directly</li>
        <li style="margin:8px 0">Manage your business information and photos</li>
        <li style="margin:8px 0">Appear as a <strong>Verified Provider</strong> with a trust badge</li>
        <li style="margin:8px 0">Get priority placement in search results</li>
      </ul>
      <a href="${escapeHtml(details.claimUrl)}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600">Claim Your Listing</a>
      <p style="margin:16px 0 0;font-size:13px;color:#9ca3af">If you did not expect this email, you can safely ignore it. Your listing was created from publicly available Google business data.</p>
    `),
  });
}

export async function sendEmailVerification(
  email: string,
  token: string
): Promise<boolean> {
  const verifyUrl = `https://${cityConfig.domain}/api/verify-email?token=${encodeURIComponent(token)}`;

  return sendEmail({
    to: email,
    subject: `Verify your email for ${cityConfig.name} Pro`,
    html: baseTemplate(`
      <h2 style="margin:0 0 16px;color:#111827;font-size:20px">Verify Your Email</h2>
      <p style="color:#374151;margin:0 0 24px">Click the button below to verify your email address and activate your provider account.</p>
      <a href="${verifyUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600">Verify Email</a>
      <p style="margin:16px 0 0;font-size:13px;color:#9ca3af">This link expires in 24 hours. If you didn't request this, you can ignore this email.</p>
    `),
  });
}

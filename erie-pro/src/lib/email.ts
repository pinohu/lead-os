// ── Email Service ─────────────────────────────────────────────────────
// Sends transactional emails via Emailit (when EMAILIT_API_KEY is set).
// Falls back to console logging in dev/dry-run mode.

import { cityConfig } from "@/lib/city-config";
import { logger } from "@/lib/logger";
import { generateUnsubscribeToken } from "@/lib/unsubscribe-token";

/** Escape HTML special characters to prevent XSS in email templates */
export function escapeHtml(text: string): string {
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
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || `https://${cityConfig.domain}`;
const PHYSICAL_ADDRESS = `123 State St, Erie, PA 16501`;

/** Build the CAN-SPAM compliant unsubscribe URL for a recipient */
function getUnsubscribeUrl(recipientEmail: string): string {
  // Include an HMAC-style token so unauthenticated GETs can't unsubscribe
  // arbitrary emails. The token is stable per-email so links remain valid
  // across sends, and generation is centralized in unsubscribe-token.ts so
  // the receiving endpoint can't drift from the sender.
  const token = generateUnsubscribeToken(recipientEmail);
  return `${SITE_URL}/api/unsubscribe?email=${encodeURIComponent(recipientEmail)}&token=${token}`;
}

/**
 * Strip CR/LF/NUL from values that end up in email headers
 * (To, Subject, Reply-To). The Emailit HTTP API takes these as JSON
 * fields and then hands them to its SMTP backend; if that backend
 * doesn't sanitize, embedded \r\n in any of these fields would let an
 * attacker inject additional headers (Bcc: exfiltrate, or a MIME
 * boundary to rewrite the body). Several call sites derive these from
 * user-controlled input — provider businessName (in subjects), contact-
 * form email (in replyTo), admin-configured envs — and escapeHtml does
 * nothing against header injection, so strip at the send boundary.
 */
export function stripHeaderBreaks(value: string): string {
  return value.replace(/[\r\n\u0000]+/g, " ").trim();
}

/**
 * Send an email. Returns true on success.
 * In dev or without EMAILIT_API_KEY, logs to console instead.
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const apiKey = process.env.EMAILIT_API_KEY;
  const safeTo = stripHeaderBreaks(options.to);
  const safeSubject = stripHeaderBreaks(options.subject);
  const safeReplyTo = options.replyTo ? stripHeaderBreaks(options.replyTo) : undefined;
  const unsubscribeUrl = getUnsubscribeUrl(safeTo);

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("EMAILIT_API_KEY is not configured. Cannot send emails in production.");
    }
    logger.info("email", `[DRY RUN] Would send to ${safeTo}: ${safeSubject}`);
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
        to: safeTo,
        subject: safeSubject,
        html: options.html,
        reply_to: safeReplyTo,
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
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

function baseTemplate(content: string, recipientEmail?: string): string {
  const unsubLink = recipientEmail ? getUnsubscribeUrl(recipientEmail) : `${SITE_URL}/api/unsubscribe`;
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
      <p style="margin:4px 0 0">${PHYSICAL_ADDRESS}</p>
      <p style="margin:8px 0 0"><a href="mailto:hello@${cityConfig.domain}" style="color:#9ca3af">hello@${cityConfig.domain}</a> &middot; <a href="https://${cityConfig.domain}/privacy" style="color:#9ca3af">Privacy Policy</a></p>
      <p style="margin:8px 0 0"><a href="${unsubLink}" style="color:#9ca3af">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendConsumerConfirmation(
  consumerEmail: string,
  consumerName: string,
  niche: string,
  routedToProvider: string | null,
  statusToken?: string
): Promise<boolean> {
  const statusMessage = routedToProvider
    ? `Your request has been sent to <strong>${escapeHtml(routedToProvider)}</strong>, a verified ${escapeHtml(niche)} provider in ${cityConfig.name}. They will contact you shortly.`
    : `We&apos;re matching your request with a ${escapeHtml(niche)} provider in ${cityConfig.name}. You&apos;ll be contacted once a match is found.`;

  const statusLink = statusToken
    ? `<p style="color:#374151;margin:16px 0"><a href="${SITE_URL}/lead-status?token=${encodeURIComponent(statusToken)}" style="color:#2563eb;text-decoration:underline">Check your request status</a></p>`
    : "";

  return sendEmail({
    to: consumerEmail,
    subject: `Your ${escapeHtml(niche)} service request — ${cityConfig.name} Pro`,
    html: baseTemplate(`
      <h2 style="margin:0 0 16px;color:#111827;font-size:20px">We Received Your Request</h2>
      <p style="color:#374151;margin:0 0 16px">Hi${consumerName ? ` ${escapeHtml(consumerName)}` : ""},</p>
      <p style="color:#374151;margin:0 0 16px">${statusMessage}</p>
      ${statusLink}
      <h3 style="color:#111827;font-size:16px;margin:24px 0 12px">What to Expect</h3>
      <ul style="color:#374151;padding-left:20px;margin:0 0 24px">
        <li style="margin:8px 0">A provider will reach out within 24 hours (often much sooner)</li>
        <li style="margin:8px 0">They may contact you by phone, text, or email</li>
        <li style="margin:8px 0">You are under no obligation — get a quote and decide</li>
      </ul>
      <p style="color:#6b7280;font-size:13px;margin:0">You consented to be contacted when you submitted this request. If you no longer wish to be contacted, reply to this email with &quot;cancel&quot; and we will remove your request.</p>
    `, consumerEmail),
    replyTo: `hello@${cityConfig.domain}`,
  });
}

export async function sendLeadStatusSummary(
  consumerEmail: string,
  leads: { niche: string; statusToken: string; createdAt: Date }[]
): Promise<boolean> {
  // Build one row per lead with a tokenised deep-link to its status page.
  // Only leads actually owned by this email address are included (caller
  // filters by `email`), so the recipient only sees their own requests.
  const rows = leads
    .map((lead) => {
      const url = `${SITE_URL}/lead-status?token=${encodeURIComponent(lead.statusToken)}`;
      const dateStr = lead.createdAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      return `<li style="margin:8px 0;color:#374151"><a href="${url}" style="color:#2563eb;text-decoration:underline">${escapeHtml(lead.niche)}</a> &middot; submitted ${dateStr}</li>`;
    })
    .join("");

  return sendEmail({
    to: consumerEmail,
    subject: `Your service request status — ${cityConfig.name} Pro`,
    html: baseTemplate(`
      <h2 style="margin:0 0 16px;color:#111827;font-size:20px">Your Service Requests</h2>
      <p style="color:#374151;margin:0 0 16px">Here are the secure status links for each of your recent requests. Click any link to view details for that request.</p>
      <ul style="padding-left:20px;margin:0 0 24px">${rows}</ul>
      <p style="color:#6b7280;font-size:13px;margin:0">If you did not request this status summary, you can safely ignore this email. These links are tied to your email address and only reveal your own requests.</p>
    `, consumerEmail),
    replyTo: `hello@${cityConfig.domain}`,
  });
}

// ── Pay-per-Lead Purchase Delivery ──────────────────────────────────
// Sent to a buyer after they pay for a banked lead on Stripe. Delivers
// the lead's contact details so they can follow up immediately.
//
// Important: this function is the *only* path that exposes lead PII to
// a pay-per-lead buyer. The Stripe webhook calls it only after an
// atomic updateMany has flipped the lead's routeType from `unmatched`
// to `overflow`, which guarantees we never email the same lead's
// details to two concurrent buyers (see /api/webhooks/stripe).
export async function sendLeadPurchaseDelivery(
  buyerEmail: string,
  leadName: string,
  leadEmail: string,
  leadPhone: string | null,
  niche: string,
  message: string | null
): Promise<boolean> {
  return sendEmail({
    to: buyerEmail,
    subject: `Your ${escapeHtml(niche)} lead — ${cityConfig.name} Pro`,
    html: baseTemplate(`
      <h2 style="margin:0 0 16px;color:#111827;font-size:20px">Your Lead Is Ready</h2>
      <p style="color:#374151;margin:0 0 16px">Thanks for your purchase. Here are the lead's contact details — reach out quickly for the best conversion rates:</p>
      <table style="width:100%;border-collapse:collapse;margin:0 0 24px">
        <tr><td style="padding:8px 0;color:#6b7280;width:100px">Name:</td><td style="padding:8px 0;color:#111827;font-weight:600">${escapeHtml(leadName)}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280">Email:</td><td style="padding:8px 0;color:#111827"><a href="mailto:${escapeHtml(leadEmail)}" style="color:#2563eb">${escapeHtml(leadEmail)}</a></td></tr>
        ${leadPhone ? `<tr><td style="padding:8px 0;color:#6b7280">Phone:</td><td style="padding:8px 0;color:#111827"><a href="tel:${escapeHtml(leadPhone)}" style="color:#2563eb">${escapeHtml(leadPhone)}</a></td></tr>` : ""}
        ${message ? `<tr><td style="padding:8px 0;color:#6b7280;vertical-align:top">Message:</td><td style="padding:8px 0;color:#111827">${escapeHtml(message)}</td></tr>` : ""}
      </table>
      <p style="color:#374151;margin:0 0 16px">This lead is yours exclusively — it will not be sold to another provider.</p>
      <p style="color:#6b7280;font-size:13px;margin:0">Want recurring leads? <a href="https://${cityConfig.domain}/for-business" style="color:#2563eb">Claim the ${escapeHtml(niche)} territory</a> for ongoing exclusivity.</p>
    `, buyerEmail),
    replyTo: `hello@${cityConfig.domain}`,
  });
}

// Sent to a buyer whose lead_purchase completed payment but lost the
// race to another buyer on the same banked lead (two concurrent
// checkouts against the same pre-paid leadId). The webhook detects the
// race via updateMany.count === 0 and tells the loser they'll be
// refunded. Ops gets a matching admin alert so they can actually
// process the refund in Stripe.
export async function sendLeadPurchaseRefundNotice(
  buyerEmail: string,
  niche: string,
  stripeSessionId: string
): Promise<boolean> {
  const adminMailto = `mailto:hello@${cityConfig.domain}?subject=${encodeURIComponent(
    `Refund request for ${stripeSessionId}`
  )}`;
  return sendEmail({
    to: buyerEmail,
    subject: `Refund on its way — ${escapeHtml(niche)} lead already sold`,
    html: baseTemplate(`
      <h2 style="margin:0 0 16px;color:#111827;font-size:20px">That Lead Was Just Sold</h2>
      <p style="color:#374151;margin:0 0 16px">Thanks for your purchase. Unfortunately, another buyer completed checkout on this ${escapeHtml(niche)} lead a few moments before your payment cleared, so we can't deliver it to you.</p>
      <p style="color:#374151;margin:0 0 16px"><strong>You will not be charged.</strong> Our team will issue a full refund to your original payment method within 1&ndash;2 business days.</p>
      <p style="color:#374151;margin:0 0 16px">If you don't see the refund within 3 business days, please <a href="${adminMailto}" style="color:#2563eb">email us</a> with this reference: <code style="font-family:monospace;font-size:12px">${escapeHtml(stripeSessionId)}</code>.</p>
      <p style="color:#6b7280;font-size:13px;margin:0">Want to avoid this? <a href="https://${cityConfig.domain}/for-business" style="color:#2563eb">Claim the territory</a> to receive every ${escapeHtml(niche)} lead in your area first.</p>
    `, buyerEmail),
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
    `, providerEmail),
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
    `, adminEmail),
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
    `, providerEmail),
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
    `, providerEmail),
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
    `, adminEmail),
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
    `, businessEmail),
  });
}

export async function sendDisputeResolutionEmail(
  providerEmail: string,
  providerName: string,
  details: {
    status: "approved" | "denied";
    leadName: string;
    niche: string;
    creditAmount: number | null;
    reason: string | null;
  }
): Promise<boolean> {
  const isApproved = details.status === "approved";
  const statusLabel = isApproved ? "Approved" : "Denied";
  const statusColor = isApproved ? "#16a34a" : "#dc2626";
  const statusBg = isApproved ? "#dcfce7" : "#fef2f2";

  const creditLine = isApproved && details.creditAmount
    ? `<p style="color:#374151;margin:0 0 16px">A credit of <strong>$${details.creditAmount.toFixed(2)}</strong> has been applied to your account.</p>`
    : "";

  const outcomeLine = isApproved
    ? "Your dispute has been reviewed and approved. The lead has been credited back to your account."
    : "Your dispute has been reviewed. After careful evaluation, the dispute was not approved. The lead charge remains on your account.";

  return sendEmail({
    to: providerEmail,
    subject: `Dispute ${statusLabel} — ${escapeHtml(details.niche)} lead`,
    html: baseTemplate(`
      <h2 style="margin:0 0 16px;color:#111827;font-size:20px">Dispute ${statusLabel}</h2>
      <div style="margin:0 0 20px">
        <span style="display:inline-block;background:${statusBg};color:${statusColor};padding:4px 12px;border-radius:4px;font-size:13px;font-weight:600">${statusLabel}</span>
      </div>
      <p style="color:#374151;margin:0 0 16px">Hi ${escapeHtml(providerName)},</p>
      <p style="color:#374151;margin:0 0 16px">${outcomeLine}</p>
      ${creditLine}
      <table style="width:100%;border-collapse:collapse;margin:0 0 24px">
        <tr><td style="padding:8px 0;color:#6b7280;width:100px">Lead:</td><td style="padding:8px 0;color:#111827;font-weight:600">${escapeHtml(details.leadName)}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280">Niche:</td><td style="padding:8px 0;color:#111827">${escapeHtml(details.niche)}</td></tr>
        ${details.reason ? `<tr><td style="padding:8px 0;color:#6b7280;vertical-align:top">Reason:</td><td style="padding:8px 0;color:#111827">${escapeHtml(details.reason)}</td></tr>` : ""}
      </table>
      <a href="https://${cityConfig.domain}/dashboard/leads" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600">View Dashboard</a>
      <p style="margin:16px 0 0;font-size:13px;color:#9ca3af">If you have questions, reply to this email or contact us at hello@${cityConfig.domain}.</p>
    `, providerEmail),
    replyTo: `hello@${cityConfig.domain}`,
  });
}

/**
 * Send a 6-digit ownership verification code to a business email.
 * This goes to the LISTING's email (not the claimant's) to prove ownership.
 */
export async function sendClaimVerificationCode(
  businessEmail: string,
  businessName: string,
  code: string,
  claimantName: string
): Promise<boolean> {
  return sendEmail({
    to: businessEmail,
    subject: `Verification code for ${escapeHtml(businessName)} on ${cityConfig.domain}`,
    html: baseTemplate(`
      <h2 style="margin:0 0 16px;color:#111827;font-size:20px">Business Ownership Verification</h2>
      <p style="color:#374151;margin:0 0 8px">Someone is claiming <strong>${escapeHtml(businessName)}</strong> on <a href="https://${cityConfig.domain}" style="color:#2563eb">${cityConfig.domain}</a>.</p>
      <p style="color:#374151;margin:0 0 24px">If you authorized this claim, enter this code in your dashboard:</p>
      <div style="text-align:center;margin:0 0 24px">
        <span style="display:inline-block;background:#f3f4f6;border:2px solid #d1d5db;border-radius:8px;padding:16px 32px;font-size:32px;font-weight:700;letter-spacing:8px;color:#111827">${escapeHtml(code)}</span>
      </div>
      <p style="font-size:13px;color:#6b7280;margin:0 0 8px">This code expires in 15 minutes.</p>
      <p style="font-size:13px;color:#6b7280;margin:0">Claimant: ${escapeHtml(claimantName)}</p>
      <p style="margin:16px 0 0;font-size:13px;color:#9ca3af">If you did not request this, no action is needed. Your listing remains unchanged.</p>
    `, businessEmail),
  });
}

/**
 * Notify admin when a claim requires manual verification.
 */
export async function sendAdminVerificationAlert(
  providerName: string,
  providerEmail: string,
  niche: string,
  reason: string
): Promise<boolean> {
  return sendEmail({
    to: `hello@${cityConfig.domain}`,
    subject: `[Admin] Claim verification needed: ${providerName}`,
    html: baseTemplate(`
      <h2 style="margin:0 0 16px;color:#111827;font-size:20px">Manual Verification Required</h2>
      <p style="color:#374151;margin:0 0 8px"><strong>${escapeHtml(providerName)}</strong> (${escapeHtml(providerEmail)}) claimed a ${escapeHtml(niche)} territory.</p>
      <p style="color:#374151;margin:0 0 24px">Reason: ${escapeHtml(reason)}</p>
      <a href="https://${cityConfig.domain}/admin/claims" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600">Review Claims</a>
    `),
  });
}

/**
 * Notify an assigned provider that a paid Concierge requester is waiting
 * for them. Sent from /admin/concierge when ops assigns them a job.
 */
export async function sendConciergeAssignmentToPro(
  providerEmail: string,
  providerName: string,
  details: {
    requesterEmail: string;
    niche: string;
    city: string;
    opsNotes: string | null;
  }
): Promise<boolean> {
  const notesBlock = details.opsNotes
    ? `<tr><td style="padding:8px 0;color:#6b7280;vertical-align:top">Ops notes:</td><td style="padding:8px 0;color:#111827">${escapeHtml(details.opsNotes)}</td></tr>`
    : "";

  return sendEmail({
    to: providerEmail,
    subject: `Concierge job assigned — ${escapeHtml(details.niche)} in ${escapeHtml(details.city)}`,
    html: baseTemplate(`
      <h2 style="margin:0 0 16px;color:#111827;font-size:20px">You've Been Assigned a Concierge Job</h2>
      <p style="color:#374151;margin:0 0 16px">Hi ${escapeHtml(providerName)},</p>
      <p style="color:#374151;margin:0 0 16px">A paying Concierge customer has been routed to you by the ${cityConfig.name} Pro ops team. Please reach out within <strong>2 hours</strong> for best results.</p>
      <table style="width:100%;border-collapse:collapse;margin:0 0 24px">
        <tr><td style="padding:8px 0;color:#6b7280;width:120px">Requester:</td><td style="padding:8px 0;color:#111827;font-weight:600"><a href="mailto:${escapeHtml(details.requesterEmail)}" style="color:#2563eb">${escapeHtml(details.requesterEmail)}</a></td></tr>
        <tr><td style="padding:8px 0;color:#6b7280">Niche:</td><td style="padding:8px 0;color:#111827">${escapeHtml(details.niche)}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280">City:</td><td style="padding:8px 0;color:#111827">${escapeHtml(details.city)}</td></tr>
        ${notesBlock}
      </table>
      <a href="mailto:${escapeHtml(details.requesterEmail)}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600">Email Requester</a>
      <p style="margin:16px 0 0;font-size:13px;color:#9ca3af">Concierge customers have paid a premium for a hand-picked referral. Fast, professional follow-up protects the ${cityConfig.name} Pro brand.</p>
    `, providerEmail),
    replyTo: `hello@${cityConfig.domain}`,
  });
}

/**
 * Let the Concierge requester know which local pro they've been
 * matched with, so they aren't surprised when the pro calls.
 */
export async function sendConciergeHandoffToRequester(
  requesterEmail: string,
  details: {
    providerName: string;
    providerPhone: string | null;
    niche: string;
  }
): Promise<boolean> {
  const phoneLine = details.providerPhone
    ? `<p style="color:#374151;margin:0 0 16px">Their direct number is <a href="tel:${escapeHtml(details.providerPhone)}" style="color:#2563eb">${escapeHtml(details.providerPhone)}</a> — feel free to call them if you'd prefer to move faster.</p>`
    : "";

  return sendEmail({
    to: requesterEmail,
    subject: `We matched you with ${escapeHtml(details.providerName)} — ${cityConfig.name} Pro`,
    html: baseTemplate(`
      <h2 style="margin:0 0 16px;color:#111827;font-size:20px">Your Concierge Match</h2>
      <p style="color:#374151;margin:0 0 16px">Good news — your ${escapeHtml(details.niche)} Concierge request has been hand-matched to <strong>${escapeHtml(details.providerName)}</strong>, a verified ${cityConfig.name} pro.</p>
      <p style="color:#374151;margin:0 0 16px">They'll reach out within the next few hours. You don't need to do anything — just wait for their call or email.</p>
      ${phoneLine}
      <p style="color:#6b7280;font-size:13px;margin:16px 0 0">If the match doesn't work out, reply to this email and we'll route you to another pro. Your Concierge fee covers the full match.</p>
    `, requesterEmail),
    replyTo: `hello@${cityConfig.domain}`,
  });
}

/**
 * Remind an Annual member that their $199/yr membership is approaching
 * renewal. Sent at T-30 and T-7 from the cron. The member's
 * subscription is on Stripe so we can't auto-charge them again from
 * here — this is a heads-up + a save-saver call to action.
 */
export async function sendAnnualRenewalReminder(
  requesterEmail: string,
  details: {
    daysLeft: number;
    expiresOn: Date;
  }
): Promise<boolean> {
  const expiryLabel = details.expiresOn.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const urgencyTone = details.daysLeft <= 7 ? "#dc2626" : "#2563eb";
  const headline =
    details.daysLeft <= 7
      ? `Your ${cityConfig.name} Pro Annual membership expires in ${details.daysLeft} days`
      : `${details.daysLeft} days until your ${cityConfig.name} Pro Annual renewal`;

  return sendEmail({
    to: requesterEmail,
    subject: headline,
    html: baseTemplate(`
      <h2 style="margin:0 0 16px;color:${urgencyTone};font-size:20px">${escapeHtml(headline)}</h2>
      <p style="color:#374151;margin:0 0 16px">Hi there,</p>
      <p style="color:#374151;margin:0 0 16px">Your <strong>${cityConfig.name} Pro Annual</strong> membership ($199/yr) is set to lapse on <strong>${escapeHtml(expiryLabel)}</strong>. After that date, you'll lose access to unlimited Concierge matches and same-day priority.</p>
      <h3 style="color:#111827;font-size:16px;margin:24px 0 12px">What you'll lose</h3>
      <ul style="color:#374151;padding-left:20px;margin:0 0 24px">
        <li style="margin:8px 0">Unlimited Concierge service requests (no per-job fee)</li>
        <li style="margin:8px 0">Same-day priority routing on emergency jobs</li>
        <li style="margin:8px 0">Direct phone access to the ${cityConfig.name} Pro ops team</li>
      </ul>
      <a href="https://${cityConfig.domain}/pros" style="display:inline-block;background:${urgencyTone};color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600">Renew My Membership</a>
      <p style="margin:24px 0 0;font-size:13px;color:#9ca3af">Questions? Reply to this email and the ops team will sort it out same-day.</p>
    `, requesterEmail),
    replyTo: `hello@${cityConfig.domain}`,
  });
}

/**
 * Notify an Annual member that their membership has lapsed. Sent
 * once by the cron the day after the term ends.
 */
export async function sendAnnualMembershipExpired(
  requesterEmail: string,
  expiredOn: Date,
): Promise<boolean> {
  const expiryLabel = expiredOn.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return sendEmail({
    to: requesterEmail,
    subject: `Your ${cityConfig.name} Pro Annual membership has expired`,
    html: baseTemplate(`
      <h2 style="margin:0 0 16px;color:#111827;font-size:20px">Membership Expired</h2>
      <p style="color:#374151;margin:0 0 16px">Hi there,</p>
      <p style="color:#374151;margin:0 0 16px">Your <strong>${cityConfig.name} Pro Annual</strong> membership lapsed on <strong>${escapeHtml(expiryLabel)}</strong>. Concierge requests will now be billed per-job at $29 instead of being included.</p>
      <p style="color:#374151;margin:0 0 24px">You can re-up your Annual membership any time \u2014 we'll restore your benefits immediately.</p>
      <a href="https://${cityConfig.domain}/pros" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600">Re-Up Annual Membership</a>
      <p style="margin:24px 0 0;font-size:13px;color:#9ca3af">If you'd rather stay on per-job Concierge, no action is needed. Reply if you have questions.</p>
    `, requesterEmail),
    replyTo: `hello@${cityConfig.domain}`,
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
    `, email),
  });
}

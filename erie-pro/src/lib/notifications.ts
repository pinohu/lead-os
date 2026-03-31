// ── Notification System ─────────────────────────────────────────────
// Lead notification delivery to providers via email and SMS.
// Dry-run mode when no API keys are set.

export interface Notification {
  id: string;
  type: "new_lead" | "sla_warning" | "lead_expired" | "review_received";
  providerId: string;
  channel: "email" | "sms" | "both";
  message: string;
  sentAt: string;
  deliveryStatus: "pending" | "sent" | "delivered" | "failed";
}

// ── Configuration ───────────────────────────────────────────────────

const EMAILIT_API_KEY = process.env.EMAILIT_API_KEY ?? "";
const SINOSEND_API_KEY = process.env.SINOSEND_API_KEY ?? "";
const FROM_EMAIL = process.env.NOTIFICATION_FROM_EMAIL ?? "leads@erie.pro";
const FROM_NAME = process.env.NOTIFICATION_FROM_NAME ?? "Erie.pro Leads";

const isDryRun = !EMAILIT_API_KEY && !SINOSEND_API_KEY;

// ── In-Memory Log ───────────────────────────────────────────────────

const notificationLog: Notification[] = [];

function generateNotificationId(): string {
  return `notif-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
}

// ── Email Templates ─────────────────────────────────────────────────

function buildNewLeadEmail(
  providerName: string,
  leadData: Record<string, unknown>
): { subject: string; body: string } {
  const niche = (leadData.niche as string) ?? "service";
  const name = (leadData.name as string) ?? "A potential customer";
  const phone = (leadData.phone as string) ?? "";
  const message = (leadData.message as string) ?? "";

  return {
    subject: `New ${niche} lead from Erie.pro`,
    body: [
      `Hi ${providerName},`,
      "",
      `You have a new ${niche} lead from Erie.pro!`,
      "",
      `Name: ${name}`,
      phone ? `Phone: ${phone}` : "",
      message ? `Message: ${message}` : "",
      "",
      "Please respond as soon as possible to maximize your conversion rate.",
      "Leads that are contacted within 5 minutes convert 9x more often.",
      "",
      "— Erie.pro Lead System",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

function buildSlaWarningEmail(
  providerName: string,
  leadId: string,
  secondsRemaining: number
): { subject: string; body: string } {
  const minutes = Math.round(secondsRemaining / 60);
  return {
    subject: `SLA Warning: ${minutes} minutes remaining to respond`,
    body: [
      `Hi ${providerName},`,
      "",
      `You have ${minutes} minutes remaining to respond to lead ${leadId}.`,
      "",
      "If you don't respond in time, the lead may be routed to a backup provider.",
      "",
      "Please respond immediately to keep your territory priority.",
      "",
      "— Erie.pro Lead System",
    ].join("\n"),
  };
}

// ── Delivery Functions ──────────────────────────────────────────────

async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<boolean> {
  if (isDryRun) {
    console.log(`[Notifications DRY-RUN] Email to: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body: ${body.substring(0, 120)}...`);
    return true;
  }

  if (EMAILIT_API_KEY) {
    try {
      const res = await fetch("https://api.emailit.com/v1/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${EMAILIT_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to,
          subject,
          text: body,
        }),
      });
      return res.ok;
    } catch (err) {
      console.error("[Notifications] Email send failed:", err);
      return false;
    }
  }

  return false;
}

async function sendSms(
  phone: string,
  message: string
): Promise<boolean> {
  if (isDryRun) {
    console.log(`[Notifications DRY-RUN] SMS to: ${phone}`);
    console.log(`  Message: ${message.substring(0, 100)}...`);
    return true;
  }

  if (SINOSEND_API_KEY) {
    try {
      const res = await fetch("https://api.sinosend.com/v1/sms", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SINOSEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: phone,
          message,
        }),
      });
      return res.ok;
    } catch (err) {
      console.error("[Notifications] SMS send failed:", err);
      return false;
    }
  }

  return false;
}

// ── Public API ──────────────────────────────────────────────────────

/**
 * Notify a provider about a new lead.
 */
export async function notifyProvider(
  providerId: string,
  leadData: Record<string, unknown>
): Promise<Notification> {
  const providerEmail = (leadData.providerEmail as string) ?? "";
  const providerPhone = (leadData.providerPhone as string) ?? "";
  const providerName = (leadData.providerName as string) ?? "Provider";

  const { subject, body } = buildNewLeadEmail(providerName, leadData);

  let channel: Notification["channel"] = "email";
  let status: Notification["deliveryStatus"] = "pending";

  // Send email
  const emailSent = providerEmail ? await sendEmail(providerEmail, subject, body) : false;

  // Send SMS
  const smsMessage = `New ${(leadData.niche as string) ?? "service"} lead from Erie.pro! Check your email for details. Respond quickly for best results.`;
  const smsSent = providerPhone ? await sendSms(providerPhone, smsMessage) : false;

  if (emailSent && smsSent) {
    channel = "both";
    status = "sent";
  } else if (emailSent) {
    channel = "email";
    status = "sent";
  } else if (smsSent) {
    channel = "sms";
    status = "sent";
  } else {
    status = isDryRun ? "sent" : "failed";
  }

  const notification: Notification = {
    id: generateNotificationId(),
    type: "new_lead",
    providerId,
    channel,
    message: body,
    sentAt: new Date().toISOString(),
    deliveryStatus: status,
  };

  notificationLog.push(notification);
  return notification;
}

/**
 * Send an SLA warning to a provider.
 */
export async function sendSlaWarning(
  providerId: string,
  leadId: string,
  secondsRemaining: number
): Promise<Notification> {
  const { subject, body } = buildSlaWarningEmail("Provider", leadId, secondsRemaining);

  // In production, fetch provider contact from store
  const emailSent = await sendEmail("", subject, body);

  const notification: Notification = {
    id: generateNotificationId(),
    type: "sla_warning",
    providerId,
    channel: "email",
    message: body,
    sentAt: new Date().toISOString(),
    deliveryStatus: emailSent || isDryRun ? "sent" : "failed",
  };

  notificationLog.push(notification);
  return notification;
}

/**
 * Get all notifications for a provider.
 */
export function getProviderNotifications(providerId: string): Notification[] {
  return notificationLog.filter((n) => n.providerId === providerId);
}

/**
 * Get all notifications (admin).
 */
export function getAllNotifications(): Notification[] {
  return [...notificationLog];
}

/**
 * Check if notification system is in dry-run mode.
 */
export function isNotificationDryRun(): boolean {
  return isDryRun;
}

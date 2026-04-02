// ── Notification System ─────────────────────────────────────────────
// Lead notification delivery to providers via email and SMS.
// Persistent via Prisma/Postgres. Dry-run mode when no API keys are set.

import { prisma } from "@/lib/db";
import { cityConfig } from "@/lib/city-config";
import { logger } from "@/lib/logger";
import type {
  Notification as PrismaNotification,
  NotificationType,
  NotificationChannel,
  DeliveryStatus,
} from "@/generated/prisma";

// ── Public Interface ───────────────────────────────────────────────

export interface Notification {
  id: string;
  type: "new_lead" | "sla_warning" | "lead_expired" | "review_received";
  providerId: string;
  channel: "email" | "sms" | "both";
  message: string;
  sentAt: string;
  deliveryStatus: "pending" | "sent" | "delivered" | "failed";
}

// ── Configuration ──────────────────────────────────────────────────

const EMAILIT_API_KEY = process.env.EMAILIT_API_KEY ?? "";
const SINOSEND_API_KEY = process.env.SINOSEND_API_KEY ?? "";
const FROM_EMAIL = process.env.NOTIFICATION_FROM_EMAIL ?? `leads@${cityConfig.domain}`;
const FROM_NAME = process.env.NOTIFICATION_FROM_NAME ?? `${cityConfig.domain} Leads`;

const isDryRun = !EMAILIT_API_KEY && !SINOSEND_API_KEY;

// ── Mapper ─────────────────────────────────────────────────────────

function toNotification(n: PrismaNotification): Notification {
  return {
    id: n.id,
    type: n.type.replace(/_/g, "_") as Notification["type"],
    providerId: n.providerId,
    channel: n.channel as Notification["channel"],
    message: n.message,
    sentAt: n.sentAt.toISOString(),
    deliveryStatus: n.deliveryStatus as Notification["deliveryStatus"],
  };
}

// ── Email Templates ────────────────────────────────────────────────

function buildNewLeadEmail(
  providerName: string,
  leadData: Record<string, unknown>
): { subject: string; body: string } {
  const niche = (leadData.niche as string) ?? "service";
  const firstName = (leadData.firstName as string) ?? "";
  const lastName = (leadData.lastName as string) ?? "";
  const name = [firstName, lastName].filter(Boolean).join(" ") || "A potential customer";
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

// ── Delivery Functions ─────────────────────────────────────────────

async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<boolean> {
  if (isDryRun) {
    if (process.env.NODE_ENV === "development") {
      logger.info("notifications", `DRY-RUN Email to: ${to.substring(0, 3)}***`);
      logger.info("notifications", `  Subject: ${subject}`);
    }
    return true;
  }

  // Emailit integration (primary)
  if (EMAILIT_API_KEY) {
    try {
      const res = await fetch("https://api.emailit.com/v2/emails", {
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
    } catch {
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
    if (process.env.NODE_ENV === "development") {
      logger.info("notifications", `DRY-RUN SMS to: ***${phone.slice(-4)}`);
    }
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
        body: JSON.stringify({ to: phone, message }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  return false;
}

// ── Public API ─────────────────────────────────────────────────────

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

  let channel: NotificationChannel = "email";
  let status: DeliveryStatus = "pending";

  const emailSent = providerEmail ? await sendEmail(providerEmail, subject, body) : false;
  const smsMessage = `New ${(leadData.niche as string) ?? "service"} lead from Erie.pro! Check your email for details.`;
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

  const notification = await prisma.notification.create({
    data: {
      type: "new_lead" as NotificationType,
      providerId,
      channel,
      message: body,
      deliveryStatus: status,
    },
  });

  return toNotification(notification);
}

/**
 * Send an SLA warning to a provider.
 */
export async function sendSlaWarning(
  providerId: string,
  leadId: string,
  secondsRemaining: number
): Promise<Notification> {
  // Fetch provider contact info from DB
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    select: { email: true, businessName: true },
  });

  const { subject, body } = buildSlaWarningEmail(
    provider?.businessName ?? "Provider",
    leadId,
    secondsRemaining
  );

  const emailSent = provider?.email
    ? await sendEmail(provider.email, subject, body)
    : false;

  const notification = await prisma.notification.create({
    data: {
      type: "sla_warning" as NotificationType,
      providerId,
      channel: "email",
      message: body,
      deliveryStatus: emailSent || isDryRun ? "sent" : "failed",
    },
  });

  return toNotification(notification);
}

/**
 * Get all notifications for a provider.
 */
export async function getProviderNotifications(
  providerId: string
): Promise<Notification[]> {
  const notifications = await prisma.notification.findMany({
    where: { providerId },
    orderBy: { sentAt: "desc" },
  });
  return notifications.map(toNotification);
}

/**
 * Get all notifications (admin).
 */
export async function getAllNotifications(): Promise<Notification[]> {
  const notifications = await prisma.notification.findMany({
    orderBy: { sentAt: "desc" },
    take: 500,
  });
  return notifications.map(toNotification);
}

/**
 * Check if notification system is in dry-run mode.
 */
export function isNotificationDryRun(): boolean {
  return isDryRun;
}

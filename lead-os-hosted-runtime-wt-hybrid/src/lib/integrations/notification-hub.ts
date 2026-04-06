import { createHmac } from "crypto";
import { sendEmail } from "../email-sender.ts";
import { getTemplate } from "../email-templates.ts";
import { resolveTenantConfig } from "../tenant.ts";

export type NotificationChannel =
  | "email"
  | "sms"
  | "push"
  | "slack"
  | "discord"
  | "telegram"
  | "webhook"
  | "in-app";

export interface Notification {
  tenantId: string;
  recipientId: string;
  recipientEmail?: string;
  recipientPhone?: string;
  channel: NotificationChannel;
  template: string;
  data: Record<string, unknown>;
  priority?: "low" | "medium" | "high" | "urgent";
}

export interface NotificationResult {
  id: string;
  channel: NotificationChannel;
  status: "sent" | "queued" | "failed" | "dry-run";
  timestamp: string;
}

interface TemplateDefinition {
  channels: NotificationChannel[];
  subject: string;
  body: string;
}

// ---------------------------------------------------------------------------
// Built-in Lead OS templates
// ---------------------------------------------------------------------------

export const LEAD_OS_TEMPLATES: Record<string, TemplateDefinition> = {
  "new-lead": {
    channels: ["email", "slack", "in-app"],
    subject: "New lead: {{name}}",
    body: "A new lead has been captured: {{name}} ({{email}}) from {{source}}. Score: {{score}}.",
  },
  "hot-lead-alert": {
    channels: ["email", "slack", "sms", "in-app"],
    subject: "Hot lead alert: {{name}} scored {{score}}",
    body: "{{name}} has scored {{score}} and is ready for immediate outreach. Company: {{company}}. Niche: {{niche}}.",
  },
  "escalation-alert": {
    channels: ["email", "slack", "sms"],
    subject: "Lead escalated: {{name}}",
    body: "Lead {{name}} has been escalated to human review. Reason: {{reason}}. Action required within {{sla}} hours.",
  },
  "conversion": {
    channels: ["email", "slack", "webhook", "in-app"],
    subject: "Conversion: {{name}} converted",
    body: "{{name}} has converted! Revenue: {{revenue}}. Funnel: {{funnel}}. Time to convert: {{duration}}.",
  },
  "daily-digest": {
    channels: ["email", "slack"],
    subject: "Daily digest for {{date}}",
    body: "Daily summary: {{new_leads}} new leads, {{conversions}} conversions, {{revenue}} revenue. Top niche: {{top_niche}}.",
  },
  "feedback-cycle-complete": {
    channels: ["email", "in-app"],
    subject: "Feedback cycle complete: {{cycle}}",
    body: "The {{cycle}} feedback cycle has completed. Adjustments made: {{adjustments}}. Next cycle: {{next_run}}.",
  },
  "deployment-complete": {
    channels: ["slack", "email", "in-app"],
    subject: "Deployment complete: {{environment}}",
    body: "Deployment to {{environment}} completed successfully. Version: {{version}}. Duration: {{duration}}s.",
  },
  "plan-limit-warning": {
    channels: ["email", "in-app"],
    subject: "Plan limit warning: {{resource}} at {{percent}}%",
    body: "You have used {{percent}}% of your {{resource}} limit. Current: {{current}}/{{limit}}. Upgrade to avoid disruption.",
  },
};

// ---------------------------------------------------------------------------
// Custom template registry
// ---------------------------------------------------------------------------

const customTemplates = new Map<string, TemplateDefinition>();

export function registerTemplate(
  name: string,
  channels: NotificationChannel[],
  subject: string,
  body: string,
): void {
  customTemplates.set(name, { channels, subject, body });
}

export function getTemplates(): { name: string; channels: NotificationChannel[] }[] {
  const built = Object.entries(LEAD_OS_TEMPLATES).map(([name, def]) => ({
    name,
    channels: def.channels,
  }));
  const custom = [...customTemplates.entries()].map(([name, def]) => ({
    name,
    channels: def.channels,
  }));
  return [...built, ...custom];
}

// ---------------------------------------------------------------------------
// In-memory notification history
// ---------------------------------------------------------------------------

const notificationHistory = new Map<string, NotificationResult[]>();

function recordResult(tenantId: string, result: NotificationResult): void {
  const history = notificationHistory.get(tenantId) ?? [];
  history.unshift(result);
  if (history.length > 500) history.splice(500);
  notificationHistory.set(tenantId, history);
}

function generateNotificationId(): string {
  return `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function resolveTemplate(name: string): TemplateDefinition | undefined {
  return customTemplates.get(name) ?? LEAD_OS_TEMPLATES[name];
}

function renderTemplate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(data[key] ?? `{{${key}}}`));
}

// ---------------------------------------------------------------------------
// Novu adapter
// ---------------------------------------------------------------------------

function isNovuConfigured(): boolean {
  return Boolean(process.env.NOVU_API_KEY);
}

async function sendViaNovu(notification: Notification): Promise<NotificationResult> {
  const id = generateNotificationId();
  const timestamp = new Date().toISOString();

  try {
    const res = await fetch("https://api.novu.co/v1/events/trigger", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `ApiKey ${process.env.NOVU_API_KEY}`,
      },
      body: JSON.stringify({
        name: notification.template,
        to: {
          subscriberId: notification.recipientId,
          email: notification.recipientEmail,
          phone: notification.recipientPhone,
        },
        payload: notification.data,
      }),
    });

    if (!res.ok) {
      throw new Error(`Novu API returned ${res.status}`);
    }

    return { id, channel: notification.channel, status: "sent", timestamp };
  } catch (err) {
    console.error("[notification-hub] Novu send failed:", err);
    return { id, channel: notification.channel, status: "failed", timestamp };
  }
}

// ---------------------------------------------------------------------------
// Direct dispatch fallbacks
// ---------------------------------------------------------------------------

function buildNotificationUnsubscribeUrl(siteUrl: string, email: string, tenantId: string): string {
  const secret = process.env.LEAD_OS_AUTH_SECRET;
  if (!secret) throw new Error("LEAD_OS_AUTH_SECRET is required");
  const token = createHmac("sha256", secret)
    .update(`${email.toLowerCase().trim()}::${tenantId}`)
    .digest("hex")
    .slice(0, 24);
  return `${siteUrl}/api/unsubscribe?email=${encodeURIComponent(email)}&tenant=${encodeURIComponent(tenantId)}&token=${token}`;
}

async function dispatchEmail(notification: Notification, tmpl: TemplateDefinition): Promise<NotificationResult> {
  const id = generateNotificationId();
  const timestamp = new Date().toISOString();

  if (!notification.recipientEmail) {
    return { id, channel: "email", status: "failed", timestamp };
  }

  const tenant = await resolveTenantConfig(notification.tenantId);
  const subject = renderTemplate(tmpl.subject, notification.data);
  const html = `<p>${renderTemplate(tmpl.body, notification.data).replace(/\n/g, "<br>")}</p>`;

  const emailTemplate = getTemplate("transactional-plain");

  const result = await sendEmail({
    to: notification.recipientEmail,
    template: emailTemplate ?? {
      id: notification.template,
      name: subject,
      subject,
      category: "notification" as const,
      htmlTemplate: html,
      textTemplate: renderTemplate(tmpl.body, notification.data),
      variables: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    context: {
      brandName: tenant.brandName,
      siteUrl: tenant.siteUrl,
      supportEmail: tenant.supportEmail,
      unsubscribeUrl: buildNotificationUnsubscribeUrl(tenant.siteUrl, notification.recipientEmail, notification.tenantId),
      currentYear: new Date().getFullYear().toString(),
      recipientEmail: notification.recipientEmail,
      previewText: subject,
      ...notification.data,
    } as import("../email-templates.ts").EmailContext,
    tenantId: notification.tenantId,
    leadKey: notification.recipientId,
  });

  return {
    id,
    channel: "email",
    status: result.ok ? "sent" : "failed",
    timestamp,
  };
}

async function dispatchWebhook(url: string, notification: Notification, tmpl: TemplateDefinition): Promise<NotificationResult> {
  const id = generateNotificationId();
  const timestamp = new Date().toISOString();

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        template: notification.template,
        subject: renderTemplate(tmpl.subject, notification.data),
        body: renderTemplate(tmpl.body, notification.data),
        tenantId: notification.tenantId,
        recipientId: notification.recipientId,
        data: notification.data,
        timestamp,
      }),
    });
    return { id, channel: notification.channel, status: res.ok ? "sent" : "failed", timestamp };
  } catch {
    return { id, channel: notification.channel, status: "failed", timestamp };
  }
}

async function dispatchSlack(notification: Notification, tmpl: TemplateDefinition): Promise<NotificationResult> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL ?? (notification.data.webhookUrl as string | undefined);
  if (!webhookUrl) return { id: generateNotificationId(), channel: "slack", status: "failed", timestamp: new Date().toISOString() };

  const text = `*${renderTemplate(tmpl.subject, notification.data)}*\n${renderTemplate(tmpl.body, notification.data)}`;
  return dispatchWebhook(webhookUrl, { ...notification, channel: "slack" }, { ...tmpl, body: text });
}

async function dispatchDiscord(notification: Notification, tmpl: TemplateDefinition): Promise<NotificationResult> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL ?? (notification.data.webhookUrl as string | undefined);
  if (!webhookUrl) return { id: generateNotificationId(), channel: "discord", status: "failed", timestamp: new Date().toISOString() };

  const id = generateNotificationId();
  const timestamp = new Date().toISOString();
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `**${renderTemplate(tmpl.subject, notification.data)}**\n${renderTemplate(tmpl.body, notification.data)}`,
      }),
    });
    return { id, channel: "discord", status: res.ok ? "sent" : "failed", timestamp };
  } catch {
    return { id, channel: "discord", status: "failed", timestamp };
  }
}

async function dispatchTelegram(notification: Notification, tmpl: TemplateDefinition): Promise<NotificationResult> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN ?? (notification.data.botToken as string | undefined);
  const chatId = process.env.TELEGRAM_CHAT_ID ?? (notification.data.chatId as string | undefined);

  const id = generateNotificationId();
  const timestamp = new Date().toISOString();

  if (!botToken || !chatId) return { id, channel: "telegram", status: "failed", timestamp };

  try {
    const text = `<b>${renderTemplate(tmpl.subject, notification.data)}</b>\n${renderTemplate(tmpl.body, notification.data)}`;
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    return { id, channel: "telegram", status: res.ok ? "sent" : "failed", timestamp };
  } catch {
    return { id, channel: "telegram", status: "failed", timestamp };
  }
}

function dispatchInApp(notification: Notification): NotificationResult {
  // In-app notifications are stored and surfaced via the history API.
  return {
    id: generateNotificationId(),
    channel: "in-app",
    status: "queued",
    timestamp: new Date().toISOString(),
  };
}

function dryRunResult(notification: Notification): NotificationResult {
  return {
    id: generateNotificationId(),
    channel: notification.channel,
    status: "dry-run",
    timestamp: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Core dispatch
// ---------------------------------------------------------------------------

async function dispatchDirect(notification: Notification, tmpl: TemplateDefinition): Promise<NotificationResult> {
  switch (notification.channel) {
    case "email":
      return dispatchEmail(notification, tmpl);
    case "slack":
      return dispatchSlack(notification, tmpl);
    case "discord":
      return dispatchDiscord(notification, tmpl);
    case "telegram":
      return dispatchTelegram(notification, tmpl);
    case "webhook": {
      const url = notification.data.webhookUrl as string | undefined;
      if (!url) return { id: generateNotificationId(), channel: "webhook", status: "failed", timestamp: new Date().toISOString() };
      return dispatchWebhook(url, notification, tmpl);
    }
    case "sms":
    case "push":
      // SMS/push require provider configuration; return dry-run when unconfigured.
      return dryRunResult(notification);
    case "in-app":
      return dispatchInApp(notification);
    default:
      return { id: generateNotificationId(), channel: notification.channel, status: "failed", timestamp: new Date().toISOString() };
  }
}

export async function sendNotification(notification: Notification): Promise<NotificationResult> {
  const tmpl = resolveTemplate(notification.template);

  if (!tmpl) {
    const result: NotificationResult = {
      id: generateNotificationId(),
      channel: notification.channel,
      status: "failed",
      timestamp: new Date().toISOString(),
    };
    recordResult(notification.tenantId, result);
    return result;
  }

  let result: NotificationResult;

  if (isNovuConfigured()) {
    result = await sendViaNovu(notification);
  } else {
    result = await dispatchDirect(notification, tmpl);
  }

  recordResult(notification.tenantId, result);
  return result;
}

export async function sendBulk(notifications: Notification[]): Promise<NotificationResult[]> {
  return Promise.all(notifications.map(sendNotification));
}

export async function getNotificationHistory(
  tenantId: string,
  limit = 50,
): Promise<NotificationResult[]> {
  const history = notificationHistory.get(tenantId) ?? [];
  return history.slice(0, limit);
}

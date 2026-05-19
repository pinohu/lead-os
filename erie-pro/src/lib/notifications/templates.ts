// src/lib/notifications/templates.ts
// Renders notification_templates rows with variable substitution.

import { prisma } from "@/lib/db"
import { cityConfig } from "@/lib/city-config"

export const TEMPLATE_SLUGS = {
  consumerConfirmation: "consumer_service_request_confirmation",
  providerNewRequest: "provider_new_service_request",
  adminFailure: "admin_notification_failure",
} as const

export type TemplateSlug = (typeof TEMPLATE_SLUGS)[keyof typeof TEMPLATE_SLUGS]

export interface TemplateVariables {
  requestId: string
  consumerName: string
  consumerEmail: string
  consumerPhone?: string | null
  niche: string
  message?: string | null
  statusUrl: string
  providerName?: string | null
  routedToName?: string | null
  failureReason?: string | null
  eventId?: string | null
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function applyVariables(template: string, vars: TemplateVariables): string {
  const niceNiche = escapeHtml(vars.niche.replace(/-/g, " "))
  const map: Record<string, string> = {
    "{{requestId}}": escapeHtml(vars.requestId),
    "{{consumerName}}": escapeHtml(vars.consumerName || "there"),
    "{{consumerEmail}}": escapeHtml(vars.consumerEmail),
    "{{consumerPhone}}": escapeHtml(vars.consumerPhone ?? ""),
    "{{niche}}": niceNiche,
    "{{message}}": escapeHtml(vars.message ?? ""),
    "{{statusUrl}}": vars.statusUrl,
    "{{providerName}}": escapeHtml(vars.providerName ?? vars.routedToName ?? ""),
    "{{routedToName}}": escapeHtml(vars.routedToName ?? ""),
    "{{failureReason}}": escapeHtml(vars.failureReason ?? "Unknown error"),
    "{{eventId}}": escapeHtml(vars.eventId ?? ""),
    "{{siteName}}": escapeHtml(cityConfig.name),
    "{{domain}}": escapeHtml(cityConfig.domain),
  }
  let out = template
  for (const [key, value] of Object.entries(map)) {
    out = out.split(key).join(value)
  }
  return out
}

export async function renderTemplate(
  slug: TemplateSlug,
  vars: TemplateVariables
): Promise<{ subject: string; html: string; text?: string } | null> {
  const row = await prisma.notificationTemplate.findUnique({ where: { slug } })
  if (!row || !row.isActive) return null
  return {
    subject: applyVariables(row.subject, vars),
    html: applyVariables(row.htmlBody, vars),
    text: row.textBody ? applyVariables(row.textBody, vars) : undefined,
  }
}

export const DEFAULT_TEMPLATES: Array<{
  slug: TemplateSlug
  subject: string
  description: string
  htmlBody: string
  textBody: string
}> = [
  {
    slug: TEMPLATE_SLUGS.consumerConfirmation,
    description: "Consumer confirmation after service request submit",
    subject: "We received your {{niche}} request — {{requestId}}",
    textBody:
      "Hi {{consumerName}}, we received your {{niche}} service request ({{requestId}}). Track status: {{statusUrl}}",
    htmlBody: `<h2 style="margin:0 0 16px;color:#111827;font-size:20px">Request received</h2>
<p style="color:#374151">Hi {{consumerName}},</p>
<p style="color:#374151">Your <strong>{{niche}}</strong> service request <strong>{{requestId}}</strong> is in our system.</p>
{{providerName}}
<p style="color:#374151"><a href="{{statusUrl}}" style="color:#2563eb">Track your request status</a></p>`,
  },
  {
    slug: TEMPLATE_SLUGS.providerNewRequest,
    description: "Provider alert for a new routed service request",
    subject: "New {{niche}} lead — {{requestId}}",
    textBody: "New service request {{requestId}} from {{consumerName}} ({{consumerEmail}}).",
    htmlBody: `<h2 style="margin:0 0 16px;color:#111827;font-size:20px">New service request</h2>
<p style="color:#374151">Request <strong>{{requestId}}</strong> from {{consumerName}} ({{consumerEmail}}).</p>
<p style="color:#374151">{{message}}</p>`,
  },
  {
    slug: TEMPLATE_SLUGS.adminFailure,
    description: "Admin alert when notification delivery exhausts retries",
    subject: "[Admin] Notification failed — {{requestId}}",
    textBody: "Notification {{eventId}} failed for {{requestId}}: {{failureReason}}",
    htmlBody: `<h2 style="color:#dc2626">Notification delivery failed</h2>
<p>Request: <strong>{{requestId}}</strong></p>
<p>Event: {{eventId}}</p>
<p>Reason: {{failureReason}}</p>`,
  },
]

export async function ensureNotificationTemplatesSeeded(): Promise<void> {
  for (const tpl of DEFAULT_TEMPLATES) {
    await prisma.notificationTemplate.upsert({
      where: { slug: tpl.slug },
      create: {
        slug: tpl.slug,
        subject: tpl.subject,
        htmlBody: tpl.htmlBody,
        textBody: tpl.textBody,
        description: tpl.description,
      },
      update: {},
    })
  }
}

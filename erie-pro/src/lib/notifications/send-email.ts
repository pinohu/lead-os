// src/lib/notifications/send-email.ts
// Adapter-pattern email delivery. Prefers Emailit when configured (existing integration).

import { sendEmail as sendEmailit } from "@/lib/email"
import { logger } from "@/lib/logger"

export interface EmailPayload {
  to: string
  subject: string
  html: string
  text?: string
  replyTo?: string
}

export interface EmailSendResult {
  ok: boolean
  provider: string
  messageId?: string
  error?: string
}

export type EmailProviderName =
  | "console"
  | "emailit"
  | "resend"
  | "sendgrid"
  | "postmark"
  | "mailgun"
  | "smtp"

function resolveProvider(): EmailProviderName {
  const configured = (process.env.EMAIL_PROVIDER ?? "").toLowerCase()
  if (configured === "console") return "console"
  if (configured === "resend") return "resend"
  if (configured === "sendgrid") return "sendgrid"
  if (configured === "postmark") return "postmark"
  if (configured === "mailgun") return "mailgun"
  if (configured === "smtp") return "smtp"
  if (process.env.EMAILIT_API_KEY) return "emailit"
  if (process.env.NODE_ENV !== "production") return "console"
  return "console"
}

function fromAddress(): string {
  const name = process.env.EMAIL_FROM_NAME ?? "Erie Pro"
  const email = process.env.EMAIL_FROM_ADDRESS ?? process.env.EMAIL_FROM ?? "noreply@erie.pro"
  return `${name} <${email}>`
}

async function sendViaResend(payload: EmailPayload): Promise<EmailSendResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { ok: false, provider: "resend", error: "RESEND_API_KEY not set" }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: fromAddress(),
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      reply_to: payload.replyTo,
    }),
  })
  if (!res.ok) {
    const error = await res.text()
    return { ok: false, provider: "resend", error }
  }
  const data = (await res.json()) as { id?: string }
  return { ok: true, provider: "resend", messageId: data.id }
}

async function sendViaSendgrid(payload: EmailPayload): Promise<EmailSendResult> {
  const apiKey = process.env.SENDGRID_API_KEY
  if (!apiKey) return { ok: false, provider: "sendgrid", error: "SENDGRID_API_KEY not set" }
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: payload.to }] }],
      from: { email: process.env.EMAIL_FROM_ADDRESS ?? "noreply@erie.pro", name: process.env.EMAIL_FROM_NAME ?? "Erie Pro" },
      subject: payload.subject,
      content: [
        { type: "text/html", value: payload.html },
        ...(payload.text ? [{ type: "text/plain", value: payload.text }] : []),
      ],
      reply_to: payload.replyTo ? { email: payload.replyTo } : undefined,
    }),
  })
  if (!res.ok) {
    const error = await res.text()
    return { ok: false, provider: "sendgrid", error }
  }
  return { ok: true, provider: "sendgrid", messageId: res.headers.get("x-message-id") ?? undefined }
}

async function sendViaPostmark(payload: EmailPayload): Promise<EmailSendResult> {
  const token = process.env.POSTMARK_SERVER_TOKEN
  if (!token) return { ok: false, provider: "postmark", error: "POSTMARK_SERVER_TOKEN not set" }
  const res = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: { "X-Postmark-Server-Token": token, "Content-Type": "application/json" },
    body: JSON.stringify({
      From: fromAddress(),
      To: payload.to,
      Subject: payload.subject,
      HtmlBody: payload.html,
      TextBody: payload.text,
      ReplyTo: payload.replyTo,
    }),
  })
  if (!res.ok) {
    const error = await res.text()
    return { ok: false, provider: "postmark", error }
  }
  const data = (await res.json()) as { MessageID?: string }
  return { ok: true, provider: "postmark", messageId: data.MessageID }
}

async function sendViaMailgun(payload: EmailPayload): Promise<EmailSendResult> {
  const apiKey = process.env.MAILGUN_API_KEY
  const domain = process.env.MAILGUN_DOMAIN
  if (!apiKey || !domain) return { ok: false, provider: "mailgun", error: "MAILGUN_API_KEY or MAILGUN_DOMAIN not set" }
  const body = new URLSearchParams({
    from: fromAddress(),
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
  })
  if (payload.text) body.set("text", payload.text)
  if (payload.replyTo) body.set("h:Reply-To", payload.replyTo)
  const res = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}` },
    body,
  })
  if (!res.ok) {
    const error = await res.text()
    return { ok: false, provider: "mailgun", error }
  }
  const data = (await res.json()) as { id?: string }
  return { ok: true, provider: "mailgun", messageId: data.id }
}

async function sendViaConsole(payload: EmailPayload): Promise<EmailSendResult> {
  logger.info("notifications", `[console] To: ${payload.to} | ${payload.subject}`)
  if (process.env.NODE_ENV === "development") {
    logger.debug("notifications", payload.html.slice(0, 300))
  }
  return { ok: true, provider: "console", messageId: `console-${Date.now()}` }
}

export function getActiveEmailProvider(): EmailProviderName {
  return resolveProvider()
}

export function isEmailConfigured(): boolean {
  const provider = resolveProvider()
  if (provider === "console") return process.env.NODE_ENV !== "production"
  if (provider === "emailit") return Boolean(process.env.EMAILIT_API_KEY)
  if (provider === "resend") return Boolean(process.env.RESEND_API_KEY)
  if (provider === "sendgrid") return Boolean(process.env.SENDGRID_API_KEY)
  if (provider === "postmark") return Boolean(process.env.POSTMARK_SERVER_TOKEN)
  if (provider === "mailgun") return Boolean(process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN)
  return false
}

export async function sendNotificationEmail(payload: EmailPayload): Promise<EmailSendResult> {
  const provider = resolveProvider()

  if (provider === "console") {
    return sendViaConsole(payload)
  }

  if (provider === "emailit") {
    const ok = await sendEmailit({
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      replyTo: payload.replyTo,
    })
    return ok
      ? { ok: true, provider: "emailit" }
      : { ok: false, provider: "emailit", error: "Emailit send failed" }
  }

  if (provider === "resend") return sendViaResend(payload)
  if (provider === "sendgrid") return sendViaSendgrid(payload)
  if (provider === "postmark") return sendViaPostmark(payload)
  if (provider === "mailgun") return sendViaMailgun(payload)

  if (process.env.NODE_ENV === "production") {
    logger.warn("notifications", "EMAIL_PROVIDER not configured in production — marking send as failed")
    return { ok: false, provider: "none", error: "EMAIL_PROVIDER not configured" }
  }

  return sendViaConsole(payload)
}

// erie-pro/src/lib/privacy-self-service.ts
import { createHash } from "crypto"
import { prisma } from "@/lib/db"
import { cityConfig } from "@/lib/city-config"

const MAX_EMAIL_LENGTH = 254

function getSigningSecret(): string {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error("AUTH_SECRET is required for privacy self-service tokens")
  return secret
}

export function generatePrivacyToken(email: string): string {
  const normalized = email.trim().toLowerCase()
  return createHash("sha256")
    .update(`${normalized}::${cityConfig.slug}::privacy::${getSigningSecret()}`)
    .digest("hex")
    .slice(0, 32)
}

export function validatePrivacyToken(email: string, token: string): boolean {
  const expected = generatePrivacyToken(email)
  if (expected.length !== token.length) return false
  let mismatch = 0
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ token.charCodeAt(i)
  }
  return mismatch === 0
}

export function normalizePrivacyEmail(email: string): string {
  const normalized = email.trim().toLowerCase()
  if (!normalized || normalized.length > MAX_EMAIL_LENGTH) {
    throw new Error("Invalid email")
  }
  return normalized
}

export async function exportConsumerData(email: string) {
  const normalized = normalizePrivacyEmail(email)
  const [leads, events, messages] = await Promise.all([
    prisma.lead.findMany({
      where: { email: normalized, city: cityConfig.slug },
      select: {
        id: true,
        niche: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        message: true,
        tcpaConsent: true,
        tcpaConsentAt: true,
        createdAt: true,
      },
    }),
    prisma.leadEvent.findMany({
      where: {
        city: cityConfig.slug,
        OR: [{ consumerEmail: normalized }, { callerPhone: { not: null } }],
      },
      take: 200,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        eventType: true,
        consumerEmail: true,
        consumerPhone: true,
        consentToContact: true,
        createdAt: true,
      },
    }),
    prisma.contactMessage.findMany({
      where: { email: normalized },
      take: 50,
      orderBy: { createdAt: "desc" },
      select: { id: true, niche: true, message: true, createdAt: true, status: true },
    }),
  ])

  const filteredEvents = events.filter(
    (e) => e.consumerEmail?.toLowerCase() === normalized
  )

  return {
    city: cityConfig.slug,
    email: normalized,
    exportedAt: new Date().toISOString(),
    leads,
    leadEvents: filteredEvents,
    contactMessages: messages,
  }
}

export async function requestConsumerDeletion(email: string) {
  const normalized = normalizePrivacyEmail(email)
  const existing = await prisma.contactMessage.findFirst({
    where: { email: normalized, niche: "_ccpa_deletion", status: "unread" },
  })
  if (existing) {
    return { requestId: existing.id, status: "pending" as const, duplicate: true }
  }

  const row = await prisma.contactMessage.create({
    data: {
      name: "Privacy deletion request",
      email: normalized,
      phone: null,
      message: `GDPR/CCPA deletion requested via self-service at ${new Date().toISOString()}`,
      niche: "_ccpa_deletion",
      status: "unread",
    },
  })

  return { requestId: row.id, status: "pending" as const, duplicate: false }
}

export function buildPrivacySelfServiceUrl(
  siteUrl: string,
  email: string,
  action: "export" | "delete" = "export"
): string {
  const token = generatePrivacyToken(email)
  const params = new URLSearchParams({
    email: email.trim().toLowerCase(),
    token,
    action,
  })
  return `${siteUrl.replace(/\/$/, "")}/manage-data?${params.toString()}`
}

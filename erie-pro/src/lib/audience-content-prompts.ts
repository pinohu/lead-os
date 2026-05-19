// erie-pro/src/lib/audience-content-prompts.ts
// Audience lock strings for AI / CMS content generation.

import type { Audience } from "@/lib/audience-context"

export interface AudienceContentPromptLock {
  audience: Audience
  systemLock: string
  tone: string
  primaryCtaExamples: readonly string[]
  forbiddenPhrases: readonly string[]
}

const LOCKS: Record<Audience, AudienceContentPromptLock> = {
  consumer: {
    audience: "consumer",
    systemLock:
      "AUDIENCE LOCK: consumer. Write for homeowners and local customers only. Primary job: help them find, trust, and contact a vetted provider. Do not sell provider subscriptions, territory claims, or dashboard features.",
    tone: "Clear, reassuring, local, action-oriented toward contact or quote request.",
    primaryCtaExamples: [
      "Get matched free",
      "Request a quote",
      "Call now",
      "Browse {service} in Erie County",
    ],
    forbiddenPhrases: [
      "claim this territory",
      "exclusive provider slot",
      "provider dashboard",
      "subscribe as a pro",
      "no bidding for providers",
    ],
  },
  provider: {
    audience: "provider",
    systemLock:
      "AUDIENCE LOCK: provider. Write for local business owners evaluating Erie.pro. Primary job: claim listing, understand tiers, subscribe, manage microsite and billing. Do not pitch homeowner matching or consumer emergency flows.",
    tone: "Direct, ROI-focused, compliance-aware, no hype guarantees.",
    primaryCtaExamples: [
      "Claim your listing",
      "View provider plans",
      "Open dashboard",
      "Start verification",
    ],
    forbiddenPhrases: [
      "get matched free",
      "free for homeowners",
      "find a pro near you",
      "request help as a customer",
    ],
  },
  admin: {
    audience: "admin",
    systemLock:
      "AUDIENCE LOCK: admin. Write for internal operators only. Primary job: run directory quality, revenue, territories, and fulfillment. No consumer or provider marketing copy.",
    tone: "Operational, concise, auditable.",
    primaryCtaExamples: ["Review queue", "Approve verification", "Export report"],
    forbiddenPhrases: [
      "get matched",
      "claim your business",
      "become a pro",
      "request a quote",
    ],
  },
}

export function getAudienceContentPromptLock(audience: Audience): AudienceContentPromptLock {
  return LOCKS[audience]
}

export function buildAudienceLockedPrompt(audience: Audience, task: string): string {
  const lock = getAudienceContentPromptLock(audience)
  return [
    lock.systemLock,
    `Tone: ${lock.tone}`,
    `Task: ${task}`,
    `Allowed CTA examples: ${lock.primaryCtaExamples.join(" | ")}`,
    `Never use: ${lock.forbiddenPhrases.join("; ")}`,
  ].join("\n")
}

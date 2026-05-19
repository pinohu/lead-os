// erie-pro/src/lib/provider-offer-compliance.ts
// Marketing and UI copy guardrails — no guaranteed outcomes.

export const PROVIDER_OFFER_DISCLAIMERS = {
  general:
    "Erie.Pro does not guarantee revenue, search rankings, lead volume, ROI, or AI citation placement. Outcomes depend on market conditions, your responsiveness, licensing, and data accuracy.",
  leads:
    "Lead routing shares inquiries when criteria match; volume and quality vary. Unmatched requests may be banked or routed elsewhere per platform rules.",
  microsite:
    "Microsites publish only after data-quality and verification checks. Public pages show verified or sourced facts; internal scores stay private.",
  reviews:
    "Reviews and ratings are shown only when sourced from verified third-party data or provider-submitted material we can attribute. We do not fabricate social proof.",
  founding:
    "Founding pricing reflects platform maturity phase and capacity; rates may change when a phase closes. Locked rates apply only to active subscriptions started during an open phase.",
} as const

const BANNED_CLAIM_PATTERNS = [
  /\bguarantee(?:d|s)?\b/i,
  /\b#\s*1\b.*\b(?:rank|google)\b/i,
  /\bguaranteed\s+(?:leads|revenue|roi|ranking)\b/i,
  /\b(?:will|shall)\s+(?:get|receive|earn)\s+\d+\s+leads\b/i,
  /\b(?:ai|chatgpt)\s+citation(?:s)?\s+guarantee\b/i,
]

export function containsBannedClaim(text: string): boolean {
  return BANNED_CLAIM_PATTERNS.some((pattern) => pattern.test(text))
}

export function assertSafeMarketingCopy(text: string, context: string): void {
  if (containsBannedClaim(text)) {
    throw new Error(`Marketing copy failed compliance check (${context})`)
  }
}

export const LEAD_ROUTING_DISCLAIMER = PROVIDER_OFFER_DISCLAIMERS.leads

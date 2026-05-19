// erie-pro/src/lib/chatbot/provider-plan-resolver.ts

export const PROVIDER_PLAN_SLUGS = [
  "starter",
  "professional",
  "premium",
  "elite",
] as const

export type ProviderPlanSlug = (typeof PROVIDER_PLAN_SLUGS)[number]

export function detectProviderPlanSlug(text: string): ProviderPlanSlug | null {
  const lower = text.toLowerCase()
  if (/\belite\b/.test(lower)) return "elite"
  if (/\bpremium\b/.test(lower)) return "premium"
  if (/\bprofessional\b/.test(lower) || /\bprof\b/.test(lower)) return "professional"
  if (/\bstarter\b/.test(lower)) return "starter"
  return null
}

export function resolvePlanSlugFromGoals(goals: string): ProviderPlanSlug {
  const explicit = detectProviderPlanSlug(goals)
  if (explicit) return explicit

  const lower = goals.toLowerCase()
  if (lower.includes("elite") || lower.includes("exclusive")) return "elite"
  if (lower.includes("premium") || lower.includes("full") || lower.includes("maximum"))
    return "premium"
  if (
    lower.includes("growth") ||
    lower.includes("lead") ||
    lower.includes("scale") ||
    lower.includes("more business")
  )
    return "professional"
  return "starter"
}

export function isProviderPlanCheckoutIntent(text: string): boolean {
  if (detectProviderPlanSlug(text)) return true
  const lower = text.toLowerCase()
  return /\bcheckout\b|\bbuy\b|\bsign\s*up\b|\benroll\b|\bprice\b|\bcost\b|\bplans?\b/.test(
    lower,
  )
}

export function isCasualGreeting(text: string): boolean {
  return /^(hi|hello|hey|howdy|good\s+(morning|afternoon|evening)|yo)[\s!.?]*$/i.test(
    text.trim(),
  )
}

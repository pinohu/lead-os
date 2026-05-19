// erie-pro/src/lib/provider-offer-plans.ts
// Plan catalog with maturity-based founding phases — no outcome guarantees in value stack.

import { PROVIDER_OFFER_DISCLAIMERS } from "@/lib/provider-offer-compliance"

export type FoundingMaturityPhase =
  | "maturity_1"
  | "maturity_2"
  | "maturity_3"
  | "maturity_4"

export interface PlanMaintenanceLimits {
  contentUpdatesPerMonth: number
  seoTuneUpsPerQuarter: number
  reportRegenerationsPerMonth: number
  supportResponseHoursSla: number
}

export interface PlanValueStackItem {
  label: string
  replacementValueCents?: number
  strategicValueNote: string
}

export interface ProviderOfferPlanDefinition {
  slug: string
  displayName: string
  setupFeeCents: number
  monthlyFeeCents: number
  monthlyFeeMinCents?: number
  foundingPhase: FoundingMaturityPhase
  maintenanceLimits: PlanMaintenanceLimits
  valueStack: PlanValueStackItem[]
  thriveCartSetupId?: string
  thriveCartMonthlyId?: string
}

const BASE_DISCLAIMERS = {
  ...PROVIDER_OFFER_DISCLAIMERS,
  planSpecific:
    "Listed replacement values illustrate comparable service pricing, not promised results or refunds.",
}

export const FOUNDING_PHASE_LABELS: Record<FoundingMaturityPhase, string> = {
  maturity_1: "Founding Phase I — limited seats, pilot market",
  maturity_2: "Founding Phase II — expanded categories",
  maturity_3: "Founding Phase III — standard commercial rates",
  maturity_4: "Maturity — list pricing",
}

export const PROVIDER_OFFER_PLANS: ProviderOfferPlanDefinition[] = [
  {
    slug: "starter",
    displayName: "Starter Local Authority",
    setupFeeCents: 150_000,
    monthlyFeeCents: 19_900,
    foundingPhase: "maturity_1",
    maintenanceLimits: {
      contentUpdatesPerMonth: 1,
      seoTuneUpsPerQuarter: 0,
      reportRegenerationsPerMonth: 1,
      supportResponseHoursSla: 72,
    },
    valueStack: [
      {
        label: "Local Authority Microsite template",
        replacementValueCents: 350_000,
        strategicValueNote: "Structured presence for Erie County service businesses; visibility outcomes vary by market.",
      },
      {
        label: "Profile JSON + markdown exports",
        replacementValueCents: 50_000,
        strategicValueNote: "Machine-readable profile for integrations you control.",
      },
      {
        label: "Onboarding checklist",
        strategicValueNote: "Guided setup; completion depends on your data and verification.",
      },
    ],
  },
  {
    slug: "professional",
    displayName: "Professional Local Authority",
    setupFeeCents: 350_000,
    monthlyFeeCents: 49_900,
    foundingPhase: "maturity_2",
    maintenanceLimits: {
      contentUpdatesPerMonth: 2,
      seoTuneUpsPerQuarter: 1,
      reportRegenerationsPerMonth: 2,
      supportResponseHoursSla: 48,
    },
    valueStack: [
      {
        label: "Everything in Starter",
        strategicValueNote: "Includes microsite, exports, and onboarding.",
      },
      {
        label: "Quarterly visibility review (internal)",
        replacementValueCents: 150_000,
        strategicValueNote: "Operational recommendations only; no promised rank or lead outcomes.",
      },
    ],
  },
  {
    slug: "premium",
    displayName: "Premium Local Authority",
    setupFeeCents: 750_000,
    monthlyFeeCents: 125_000,
    foundingPhase: "maturity_3",
    maintenanceLimits: {
      contentUpdatesPerMonth: 4,
      seoTuneUpsPerQuarter: 2,
      reportRegenerationsPerMonth: 4,
      supportResponseHoursSla: 24,
    },
    valueStack: [
      {
        label: "Everything in Professional",
        strategicValueNote: "Higher maintenance cadence; subject to plan limits.",
      },
      {
        label: "Priority provisioning queue",
        strategicValueNote: "Faster build when minimum data is present; still subject to verification.",
      },
    ],
  },
  {
    slug: "elite",
    displayName: "Elite Local Authority",
    setupFeeCents: 1_500_000,
    monthlyFeeCents: 250_000,
    monthlyFeeMinCents: 250_000,
    foundingPhase: "maturity_4",
    maintenanceLimits: {
      contentUpdatesPerMonth: 8,
      seoTuneUpsPerQuarter: 4,
      reportRegenerationsPerMonth: 8,
      supportResponseHoursSla: 12,
    },
    valueStack: [
      {
        label: "Everything in Premium",
        strategicValueNote: "Highest maintenance allocation on platform.",
      },
      {
        label: "Custom exclusivity review",
        strategicValueNote: "Territory rules documented in claim object; exclusivity subject to verification and niche capacity.",
      },
    ],
  },
]

export function getProviderOfferPlan(slug: string) {
  return PROVIDER_OFFER_PLANS.find((plan) => plan.slug === slug)
}

export function planDisclaimersJson() {
  return BASE_DISCLAIMERS
}

export function resolveFoundingPriceCents(
  plan: ProviderOfferPlanDefinition,
  phase: FoundingMaturityPhase,
): { setupFeeCents: number; monthlyFeeCents: number } {
  const phaseDiscount: Record<FoundingMaturityPhase, number> = {
    maturity_1: 0.15,
    maturity_2: 0.1,
    maturity_3: 0.05,
    maturity_4: 0,
  }
  const discount = phaseDiscount[phase] ?? 0
  return {
    setupFeeCents: Math.round(plan.setupFeeCents * (1 - discount)),
    monthlyFeeCents: Math.round(plan.monthlyFeeCents * (1 - discount)),
  }
}

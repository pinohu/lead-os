// erie-pro/src/lib/audience-context.ts
// Persona separation: one page, one primary audience, one primary job.

export type Audience = "consumer" | "provider" | "admin"

/** How prominently provider acquisition CTAs may appear on a page. */
export type AllowProviderCTA = "none" | "footer-utility" | "secondary" | "primary"

export interface PageAudienceConfig {
  audience: Audience
  /** Single sentence describing what the visitor should accomplish here. */
  primary_goal: string
  /** Messaging patterns that must not appear in hero or primary columns. */
  forbidden_messages: readonly string[]
  allowProviderCTA: AllowProviderCTA
}

const CONSUMER_FORBIDDEN: readonly string[] = [
  "claim this territory",
  "claim this category",
  "become a pro",
  "provider growth",
  "exclusive provider",
  "no bidding wars for providers",
  "subscribe to",
  "pricing tiers for providers",
]

const PROVIDER_FORBIDDEN: readonly string[] = [
  "get matched free",
  "request help",
  "find a pro",
  "homeowner",
  "free for homeowners",
]

const ADMIN_FORBIDDEN: readonly string[] = [
  "get matched",
  "claim your listing",
  "become a pro",
]

export const PAGE_AUDIENCE_DEFAULTS: Record<Audience, PageAudienceConfig> = {
  consumer: {
    audience: "consumer",
    primary_goal: "Find, trust, and contact a local provider",
    forbidden_messages: CONSUMER_FORBIDDEN,
    allowProviderCTA: "footer-utility",
  },
  provider: {
    audience: "provider",
    primary_goal: "Claim, subscribe, and manage microsite and billing",
    forbidden_messages: PROVIDER_FORBIDDEN,
    allowProviderCTA: "primary",
  },
  admin: {
    audience: "admin",
    primary_goal: "Operate directory, revenue, and fulfillment systems",
    forbidden_messages: ADMIN_FORBIDDEN,
    allowProviderCTA: "none",
  },
}

export function getPageAudienceConfig(audience: Audience): PageAudienceConfig {
  return PAGE_AUDIENCE_DEFAULTS[audience]
}

export function assertConsumerPage(config: PageAudienceConfig): void {
  if (config.audience !== "consumer") {
    throw new Error(
      `Expected consumer page audience, got "${config.audience}" (goal: ${config.primary_goal})`,
    )
  }
}

export type ClaimProfileLinkPlacement = "hidden" | "footer-utility" | "inline-secondary"

export function getClaimProfileLinkPlacement(
  config: PageAudienceConfig,
  options?: { isUnclaimedListing?: boolean },
): ClaimProfileLinkPlacement {
  if (!options?.isUnclaimedListing) return "hidden"
  if (config.audience !== "consumer") return "hidden"

  switch (config.allowProviderCTA) {
    case "none":
      return "hidden"
    case "footer-utility":
      return "footer-utility"
    case "secondary":
      return "inline-secondary"
    case "primary":
      return "inline-secondary"
    default: {
      const _exhaustive: never = config.allowProviderCTA
      return _exhaustive
    }
  }
}

export function shouldShowProviderSalesBlock(audience: Audience): boolean {
  return audience === "provider"
}

export function shouldShowConsumerPrimaryCta(audience: Audience): boolean {
  return audience === "consumer"
}

export function containsForbiddenMessage(
  text: string,
  config: PageAudienceConfig,
): string | null {
  const normalized = text.toLowerCase()
  for (const phrase of config.forbidden_messages) {
    if (normalized.includes(phrase.toLowerCase())) {
      return phrase
    }
  }
  return null
}

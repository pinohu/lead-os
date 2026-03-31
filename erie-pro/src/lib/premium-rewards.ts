// ── Premium Provider Tier System ────────────────────────────────────
// Defines provider tiers, benefits, and pricing multipliers.

export type ProviderTier = "standard" | "premium" | "elite";

export interface TierBenefits {
  tier: ProviderTier;
  monthlyMultiplier: number;
  benefits: string[];
  featured: boolean;
  nationalDirectoryListing: boolean;
  brandedContent: boolean;
  reviewAutomation: boolean;
  monthlyReport: boolean;
  gbpOptimization: boolean;
  socialMediaMentions: number;
  competitorIntelligence: boolean;
  customLandingPage: boolean;
  priorityPlacement: boolean;
  badgeType: "none" | "featured" | "top-rated" | "elite-certified";
}

export const TIER_BENEFITS: Record<ProviderTier, TierBenefits> = {
  standard: {
    tier: "standard",
    monthlyMultiplier: 1.0,
    benefits: [
      "Exclusive leads in your niche",
      "Branded landing page",
      "AI-powered lead scoring",
      "7-stage nurture sequence",
      "Monthly performance snapshot",
    ],
    featured: false,
    nationalDirectoryListing: false,
    brandedContent: false,
    reviewAutomation: false,
    monthlyReport: true,
    gbpOptimization: false,
    socialMediaMentions: 0,
    competitorIntelligence: false,
    customLandingPage: true,
    priorityPlacement: false,
    badgeType: "none",
  },
  premium: {
    tier: "premium",
    monthlyMultiplier: 1.5,
    benefits: [
      "Everything in Standard",
      "Featured badge on all local pages",
      "Listed on national niche directory",
      "Automated review collection after each job",
      "Detailed monthly PDF performance report",
      "2 social media mentions per month",
      "Priority placement in search results",
    ],
    featured: true,
    nationalDirectoryListing: true,
    brandedContent: false,
    reviewAutomation: true,
    monthlyReport: true,
    gbpOptimization: true,
    socialMediaMentions: 2,
    competitorIntelligence: false,
    customLandingPage: true,
    priorityPlacement: true,
    badgeType: "featured",
  },
  elite: {
    tier: "elite",
    monthlyMultiplier: 2.5,
    benefits: [
      "Everything in Premium",
      "Elite Certified badge on all pages",
      "Branded content (blog posts mention your business)",
      "Monthly competitor intelligence report",
      "Google Business Profile optimization",
      "4 social media mentions per month",
      "Dedicated account manager",
      "Custom marketing materials",
      "First access to new cities",
    ],
    featured: true,
    nationalDirectoryListing: true,
    brandedContent: true,
    reviewAutomation: true,
    monthlyReport: true,
    gbpOptimization: true,
    socialMediaMentions: 4,
    competitorIntelligence: true,
    customLandingPage: true,
    priorityPlacement: true,
    badgeType: "elite-certified",
  },
};

export function calculateMonthlyFee(
  baseNicheFee: number,
  tier: ProviderTier
): number {
  return Math.round(baseNicheFee * TIER_BENEFITS[tier].monthlyMultiplier);
}

export function getTierBenefits(tier: ProviderTier): TierBenefits {
  return TIER_BENEFITS[tier];
}

export function getBadgeLabel(tier: ProviderTier): string | null {
  switch (tier) {
    case "elite":
      return "Elite Certified";
    case "premium":
      return "Featured Provider";
    default:
      return null;
  }
}

export const TIER_ORDER: ProviderTier[] = ["standard", "premium", "elite"];

export function getTierColor(tier: ProviderTier): string {
  switch (tier) {
    case "elite":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-300 dark:border-purple-700";
    case "premium":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-300 dark:border-amber-700";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 border-gray-300 dark:border-gray-700";
  }
}

export function getTierRingColor(tier: ProviderTier): string {
  switch (tier) {
    case "elite":
      return "ring-purple-500/50";
    case "premium":
      return "ring-amber-500/50";
    default:
      return "";
  }
}

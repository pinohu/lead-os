// ── Automatic Perk Management System ────────────────────────────────
// Activates/deactivates ALL premium benefits based on subscription status.
// Persistent via Prisma/Postgres. All functions are async.

import { prisma } from "@/lib/db";
import { TIER_BENEFITS, type ProviderTier } from "./premium-rewards";

// ── Types ─────────────────────────────────────────────────────────

export interface PerkSet {
  featuredBadge: boolean;
  nationalListing: boolean;
  reviewAutomation: boolean;
  brandedContent: boolean;
  gbpOptimization: boolean;
  socialMentions: boolean;
  competitorIntel: boolean;
  priorityPlacement: boolean;
}

export interface PerkStatus {
  niche: string;
  city: string;
  providerId: string | null;
  providerName: string | null;
  subscriptionActive: boolean;
  tier: ProviderTier | null;
  perks: PerkSet;
  activatedAt: string | null;
  deactivatedAt: string | null;
}

export interface SubscriptionChangeEvent {
  type: "subscription.activated" | "subscription.cancelled" | "subscription.updated" | "subscription.expired";
  niche: string;
  city: string;
  providerId: string;
  providerName: string;
  status: "active" | "past_due" | "cancelled" | "expired";
  tier?: ProviderTier;
}

// ── Perk Derivation ───────────────────────────────────────────────

function derivePerks(tier: ProviderTier): PerkSet {
  const benefits = TIER_BENEFITS[tier];
  return {
    featuredBadge: benefits.featured,
    nationalListing: benefits.nationalDirectoryListing,
    reviewAutomation: benefits.reviewAutomation,
    brandedContent: benefits.brandedContent,
    gbpOptimization: benefits.gbpOptimization,
    socialMentions: benefits.socialMediaMentions > 0,
    competitorIntel: benefits.competitorIntelligence,
    priorityPlacement: benefits.priorityPlacement,
  };
}

const EMPTY_PERKS: PerkSet = {
  featuredBadge: false,
  nationalListing: false,
  reviewAutomation: false,
  brandedContent: false,
  gbpOptimization: false,
  socialMentions: false,
  competitorIntel: false,
  priorityPlacement: false,
};

function mapMonthlyFeeToTier(monthlyFee: number): ProviderTier {
  if (monthlyFee >= 800) return "elite";
  if (monthlyFee >= 500) return "premium";
  return "standard";
}

// ── Core Functions ────────────────────────────────────────────────

export async function getPerkStatus(niche: string, city: string): Promise<PerkStatus> {
  const territory = await prisma.territory.findUnique({
    where: { niche_city: { niche: niche.toLowerCase(), city: city.toLowerCase() } },
    include: { provider: true },
  });

  if (!territory || territory.deactivatedAt) {
    return {
      niche,
      city,
      providerId: null,
      providerName: null,
      subscriptionActive: false,
      tier: null,
      perks: { ...EMPTY_PERKS },
      activatedAt: null,
      deactivatedAt: territory?.deactivatedAt?.toISOString() ?? null,
    };
  }

  const tier = mapMonthlyFeeToTier(territory.provider.monthlyFee);

  return {
    niche,
    city,
    providerId: territory.providerId,
    providerName: territory.provider.businessName,
    subscriptionActive: true,
    tier,
    perks: derivePerks(tier),
    activatedAt: territory.activatedAt.toISOString(),
    deactivatedAt: null,
  };
}

export async function activatePerks(
  niche: string,
  city: string,
  providerId: string,
  providerName: string,
  tier: ProviderTier
): Promise<PerkStatus> {
  await prisma.territory.upsert({
    where: { niche_city: { niche: niche.toLowerCase(), city: city.toLowerCase() } },
    update: {
      providerId,
      tier: "primary", // territory tier in DB is ProviderTier enum (primary/backup/overflow)
      deactivatedAt: null,
      isPaused: false,
      pausedAt: null,
    },
    create: {
      niche: niche.toLowerCase(),
      city: city.toLowerCase(),
      providerId,
      tier: "primary",
    },
  });

  return getPerkStatus(niche, city);
}

export async function deactivatePerks(niche: string, city: string): Promise<PerkStatus> {
  await prisma.territory.updateMany({
    where: {
      niche: niche.toLowerCase(),
      city: city.toLowerCase(),
      deactivatedAt: null,
    },
    data: { deactivatedAt: new Date() },
  });

  return getPerkStatus(niche, city);
}

export async function transferTerritory(
  niche: string,
  city: string,
  newProviderId: string,
  newProviderName: string,
  newTier: ProviderTier
): Promise<PerkStatus> {
  await deactivatePerks(niche, city);
  return activatePerks(niche, city, newProviderId, newProviderName, newTier);
}

// ── Quick Query Helpers ───────────────────────────────────────────

export async function isProviderFeatured(niche: string, city: string): Promise<boolean> {
  const status = await getPerkStatus(niche, city);
  return status.perks.featuredBadge;
}

export async function getFeaturedProviderName(niche: string, city: string): Promise<string | null> {
  const status = await getPerkStatus(niche, city);
  if (!status.subscriptionActive) return null;
  return status.providerName;
}

export async function getFeaturedProviderId(niche: string, city: string): Promise<string | null> {
  const status = await getPerkStatus(niche, city);
  if (!status.subscriptionActive) return null;
  return status.providerId;
}

export async function hasPerk(
  niche: string,
  city: string,
  perk: keyof PerkSet
): Promise<boolean> {
  const status = await getPerkStatus(niche, city);
  return status.perks[perk];
}

export async function getActiveTerritoryCount(): Promise<number> {
  return prisma.territory.count({ where: { deactivatedAt: null } });
}

export async function getAllActivePerks(): Promise<PerkStatus[]> {
  const territories = await prisma.territory.findMany({
    where: { deactivatedAt: null },
    include: { provider: true },
  });

  return territories.map((t) => {
    const tier = mapMonthlyFeeToTier(t.provider.monthlyFee);
    return {
      niche: t.niche,
      city: t.city,
      providerId: t.providerId,
      providerName: t.provider.businessName,
      subscriptionActive: true,
      tier,
      perks: derivePerks(tier),
      activatedAt: t.activatedAt.toISOString(),
      deactivatedAt: null,
    };
  });
}

// ── Webhook Handler ───────────────────────────────────────────────

export async function handleSubscriptionChange(
  event: SubscriptionChangeEvent
): Promise<PerkStatus> {
  switch (event.type) {
    case "subscription.activated":
      return activatePerks(
        event.niche,
        event.city,
        event.providerId,
        event.providerName,
        event.tier ?? "standard"
      );

    case "subscription.updated":
      if (event.tier) {
        return activatePerks(
          event.niche,
          event.city,
          event.providerId,
          event.providerName,
          event.tier
        );
      }
      return getPerkStatus(event.niche, event.city);

    case "subscription.cancelled":
    case "subscription.expired":
      return deactivatePerks(event.niche, event.city);

    default:
      return getPerkStatus(event.niche, event.city);
  }
}

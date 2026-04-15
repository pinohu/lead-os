// ── Automatic Perk Management System ────────────────────────────────
// Activates/deactivates ALL premium benefits based on subscription status.
// Persistent via Prisma/Postgres. All functions are async.

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
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
  // Territory claim is exclusive — (niche, city) has @@unique in the schema.
  // The naive `upsert` was NOT safe under concurrent Stripe checkouts: the
  // /api/claim pre-check can let two different providers both pass when
  // neither has completed checkout yet, and then BOTH of their Stripe
  // webhooks race to "activate". With an upsert, the second webhook's
  // UPDATE branch silently stomps the first provider's `providerId`,
  // leaving the first payer with an active subscription and no territory.
  //
  // Fix: attempt to claim atomically, refusing to overwrite a DIFFERENT
  // provider that already holds the territory.
  //   1. `updateMany` filtered on (ours OR deactivated) — this re-claims
  //      our own row or a previously released one without racing. Zero
  //      rows updated means either no row exists OR a different active
  //      provider holds it.
  //   2. Fall back to `create`. If no row existed, this wins the unique
  //      constraint. If the other branch is that a different provider
  //      holds the territory, the unique constraint throws P2002 and we
  //      log loudly so a human can refund the losing provider.
  const nicheLc = niche.toLowerCase();
  const cityLc = city.toLowerCase();

  const claimed = await prisma.territory.updateMany({
    where: {
      niche: nicheLc,
      city: cityLc,
      OR: [
        { providerId }, // re-claiming our own territory (idempotent webhook)
        { deactivatedAt: { not: null } }, // abandoned — safe to take over
      ],
    },
    data: {
      providerId,
      tier: "primary", // territory tier in DB is ProviderTier enum (primary/backup/overflow)
      deactivatedAt: null,
      isPaused: false,
      pausedAt: null,
    },
  });

  if (claimed.count === 0) {
    try {
      await prisma.territory.create({
        data: {
          niche: nicheLc,
          city: cityLc,
          providerId,
          tier: "primary",
        },
      });
    } catch (err: unknown) {
      // Prisma unique constraint violation — a DIFFERENT active provider
      // raced in and claimed this territory first. Do NOT overwrite them.
      const code = (err as { code?: string } | null)?.code;
      if (code === "P2002") {
        const winner = await prisma.territory.findUnique({
          where: { niche_city: { niche: nicheLc, city: cityLc } },
          include: { provider: true },
        });
        logger.error(
          "perk-manager",
          "Territory claim conflict — refusing to overwrite active owner. " +
            "Issue a refund for the losing provider.",
          {
            niche: nicheLc,
            city: cityLc,
            losingProviderId: providerId,
            losingProviderName: providerName,
            requestedTier: tier,
            winningProviderId: winner?.providerId ?? null,
            winningProviderName: winner?.provider?.businessName ?? null,
          }
        );
        // Fall through to return the current (winner's) perk status so the
        // caller sees the true DB state, not a fiction where they "own" it.
      } else {
        throw err;
      }
    }
  }

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

// erie-pro/src/lib/provider-offer-provisioning.ts
// Post-payment provisioning — payment ≠ trust; publish gated separately.

import type { Prisma } from "@/generated/prisma"
import { prisma } from "@/lib/db"
import { logger } from "@/lib/logger"
import { evaluateMicrositePublish } from "@/lib/microsite-publish-gate"
import { getProviderOfferPlan } from "@/lib/provider-offer-plans"
import type { ProviderEligibilityTier, ProviderLifecycleStatus } from "@/generated/prisma"

export interface ThriveCartProviderCheckoutInput {
  email: string
  planSlug: string
  thriveCartOrderId?: string | null
  thriveCartSubscriptionId?: string | null
  thriveCartProductId?: string | null
  amountCents?: number
  businessName?: string | null
  phone?: string | null
  niche?: string | null
  providerId?: string | null
  rawPayload?: unknown
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "provider"
}

async function syncPlanCatalog(planSlug: string) {
  const def = getProviderOfferPlan(planSlug)
  if (!def) return null
  return prisma.providerPlan.upsert({
    where: { slug: def.slug },
    create: {
      slug: def.slug,
      displayName: def.displayName,
      setupFeeCents: def.setupFeeCents,
      monthlyFeeCents: def.monthlyFeeCents,
      monthlyFeeMinCents: def.monthlyFeeMinCents ?? null,
      foundingPhase: def.foundingPhase,
      maintenanceLimits: def.maintenanceLimits as unknown as Prisma.InputJsonValue,
      valueStack: def.valueStack as unknown as Prisma.InputJsonValue,
      disclaimers: { general: true },
      thriveCartSetupId: def.thriveCartSetupId ?? null,
      thriveCartMonthlyId: def.thriveCartMonthlyId ?? null,
    },
    update: {
      displayName: def.displayName,
      setupFeeCents: def.setupFeeCents,
      monthlyFeeCents: def.monthlyFeeCents,
      foundingPhase: def.foundingPhase,
      maintenanceLimits: def.maintenanceLimits as unknown as Prisma.InputJsonValue,
      valueStack: def.valueStack as unknown as Prisma.InputJsonValue,
    },
  })
}

export async function processProviderOfferCheckout(input: ThriveCartProviderCheckoutInput) {
  const plan = await syncPlanCatalog(input.planSlug)
  if (!plan) {
    return { matched: false as const, reason: "unknown_plan" }
  }

  const email = input.email.toLowerCase().trim()
  let provider =
    input.providerId
      ? await prisma.provider.findUnique({ where: { id: input.providerId } })
      : await prisma.provider.findFirst({ where: { email } })

  if (!provider) {
    const niche = input.niche?.trim() || "general-contractor"
    provider = await prisma.provider.create({
      data: {
        slug: `${slugify(input.businessName ?? email.split("@")[0])}-${Date.now().toString(36)}`,
        businessName: input.businessName?.trim() || email.split("@")[0],
        niche,
        phone: input.phone?.trim() || "0000000000",
        email,
        lifecycleStatus: "paid_pending_onboarding",
        eligibilityTier: "paid_unverified",
        subscriptionStatus: "active",
        monthlyFee: plan.monthlyFeeCents / 100,
      },
    })
  } else {
    provider = await prisma.provider.update({
      where: { id: provider.id },
      data: {
        lifecycleStatus: "paid_pending_onboarding",
        eligibilityTier: "paid_unverified",
        subscriptionStatus: "active",
      },
    })
  }

  const subscription = await prisma.providerSubscription.upsert({
    where: { providerId: provider.id },
    create: {
      providerId: provider.id,
      planId: plan.id,
      lifecycleStatus: "paid_pending_onboarding",
      eligibilityTier: "paid_unverified",
      thriveCartOrderId: input.thriveCartOrderId ?? null,
      thriveCartSubscriptionId: input.thriveCartSubscriptionId ?? null,
      setupPaidAt: new Date(),
      metadata: { rawPayload: input.rawPayload ?? {} } as Prisma.InputJsonValue,
    },
    update: {
      planId: plan.id,
      lifecycleStatus: "paid_pending_onboarding",
      thriveCartOrderId: input.thriveCartOrderId ?? undefined,
      thriveCartSubscriptionId: input.thriveCartSubscriptionId ?? undefined,
      setupPaidAt: new Date(),
    },
  })

  if (input.thriveCartProductId) {
    await prisma.providerOrderItem.create({
      data: {
        providerId: provider.id,
        subscriptionId: subscription.id,
        thriveCartOrderId: input.thriveCartOrderId ?? null,
        thriveCartProductId: input.thriveCartProductId,
        lineItemType: "setup",
        amountCents: input.amountCents ?? plan.setupFeeCents,
      },
    })
  }

  const job = await prisma.provisioningJob.create({
    data: {
      providerId: provider.id,
      subscriptionId: subscription.id,
      jobType: "microsite_initial",
      status: "pending",
      input: {
        planSlug: input.planSlug,
        minimumDataPresent: Boolean(input.businessName && input.phone && input.niche),
      },
    },
  })

  await runProvisioningJob(job.id)

  return {
    matched: true as const,
    providerId: provider.id,
    subscriptionId: subscription.id,
    provisioningJobId: job.id,
  }
}

export async function runProvisioningJob(jobId: string) {
  const job = await prisma.provisioningJob.findUnique({
    where: { id: jobId },
    include: {
      provider: true,
      subscription: { include: { plan: true } },
    },
  })
  if (!job) return { ok: false, error: "job_not_found" }

  await prisma.provisioningJob.update({
    where: { id: jobId },
    data: { status: "running", startedAt: new Date(), attempts: { increment: 1 } },
  })

  try {
    const provider = job.provider
    const categorySlug = provider.niche
    const citySlug = provider.city || "erie"
    const micrositeSlug = provider.slug

    const autoPublishEnabled = process.env.FEATURE_MICROSITE_AUTO_PUBLISH === "1"
    const publishDecision = evaluateMicrositePublish({
      businessName: provider.businessName,
      phone: provider.phone,
      niche: provider.niche,
      description: provider.description,
      addressCity: provider.addressCity,
      addressState: provider.addressState,
      verificationStatus: provider.verificationStatus,
      license: provider.license,
      hasPublicReviews: provider.reviewCount > 0,
    })

    const publicProfile = {
      businessName: provider.businessName,
      phone: provider.phone,
      niche: provider.niche,
      description: provider.description,
      serviceAreas: provider.serviceAreas,
      disclaimer: "Information sourced from provider and directory data. Not independently verified unless marked.",
    }

    const privateIntel = {
      dataQualityScore: publishDecision.dataQualityScore,
      blockers: publishDecision.blockers,
      eligibilityTier: provider.eligibilityTier,
      internalNotes: "Private — not for public microsite",
    }

    const canPublish =
      autoPublishEnabled && publishDecision.canAutoPublish
    if (!autoPublishEnabled && publishDecision.canAutoPublish) {
      publishDecision.blockers.push("feature_flag_auto_publish_disabled")
    }

    const microsite = await prisma.microsite.upsert({
      where: {
        categorySlug_citySlug_stateCode_slug: {
          categorySlug,
          citySlug,
          stateCode: provider.addressState || "PA",
          slug: micrositeSlug,
        },
      },
      create: {
        providerId: provider.id,
        slug: micrositeSlug,
        categorySlug,
        citySlug,
        stateCode: provider.addressState || "PA",
        status: canPublish ? "live" : "draft",
        publishMode: canPublish ? publishDecision.publishMode : "review_required",
        dataQualityScore: publishDecision.dataQualityScore,
        publicProfile,
        privateIntel,
        profileJsonPath: `/${categorySlug}/${citySlug}-${provider.addressState || "pa"}/${micrositeSlug}/profile.json`,
        profileMdPath: `/${categorySlug}/${citySlug}-${provider.addressState || "pa"}/${micrositeSlug}/profile.md`,
        publishedAt: canPublish ? new Date() : null,
      },
      update: {
        dataQualityScore: publishDecision.dataQualityScore,
        publishMode: canPublish ? publishDecision.publishMode : "review_required",
        publicProfile,
        privateIntel,
        status: canPublish ? "live" : "draft",
        publishedAt: canPublish ? new Date() : undefined,
      },
    })

    const nextLifecycle: ProviderLifecycleStatus = canPublish
      ? "live"
      : "provisioning"
    const nextEligibility: ProviderEligibilityTier = canPublish
      ? "eligible_live"
      : provider.verificationStatus === "verified" ||
          provider.verificationStatus === "auto_verified" ||
          provider.verificationStatus === "admin_approved"
        ? "eligible_draft"
        : "data_pending"

    await prisma.provider.update({
      where: { id: provider.id },
      data: {
        lifecycleStatus: nextLifecycle,
        eligibilityTier: nextEligibility,
      },
    })

    if (job.subscriptionId) {
      await prisma.providerSubscription.update({
        where: { id: job.subscriptionId },
        data: { lifecycleStatus: nextLifecycle, eligibilityTier: nextEligibility },
      })
    }

    const limits = job.subscription?.plan?.maintenanceLimits as { contentUpdatesPerMonth?: number } | null
    const maintenanceTasks = [
      { title: "Complete onboarding profile", sortOrder: 0 },
      { title: "Verify business ownership", sortOrder: 1 },
    ]
    if (!canPublish) {
      maintenanceTasks.push({ title: "Resolve publish blockers", sortOrder: 2 })
    }
    if (limits?.contentUpdatesPerMonth) {
      maintenanceTasks.push({
        title: `Monthly content updates (max ${limits.contentUpdatesPerMonth})`,
        sortOrder: 3,
      })
    }

    for (const task of maintenanceTasks) {
      await prisma.providerTask.create({
        data: {
          providerId: provider.id,
          title: task.title,
          sortOrder: task.sortOrder,
          metadata: { source: "provisioning" } as Prisma.InputJsonValue,
        },
      })
    }

    await prisma.provisioningJob.update({
      where: { id: jobId },
      data: {
        status: "completed",
        completedAt: new Date(),
        output: { micrositeId: microsite.id, publishDecision } as unknown as Prisma.InputJsonValue,
      },
    })

    await prisma.providerEvent.create({
      data: {
        providerId: provider.id,
        eventType: "provisioning.completed",
        metadata: {
          micrositeId: microsite.id,
          publishMode: publishDecision.publishMode,
        } as Prisma.InputJsonValue,
      },
    })

    return { ok: true, micrositeId: microsite.id, publishDecision }
  } catch (error) {
    const message = error instanceof Error ? error.message : "provisioning_failed"
    logger.error("provider-offer-provisioning", "Job failed", error)
    await prisma.provisioningJob.update({
      where: { id: jobId },
      data: { status: "failed", lastError: message },
    })
    await prisma.provider.update({
      where: { id: job.providerId },
      data: { lifecycleStatus: "failed" },
    })
    return { ok: false, error: message }
  }
}

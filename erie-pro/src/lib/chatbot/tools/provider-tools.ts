// erie-pro/src/lib/chatbot/tools/provider-tools.ts

import { prisma } from "@/lib/db"
import { getDirectoryListingBySlug } from "@/lib/directory-store"
import { getProviderOfferPlan } from "@/lib/provider-offer-plans"
import { syncProviderOfferCatalog } from "@/lib/provider-offer-catalog-sync"
import { resolvePlanSlugFromGoals } from "@/lib/chatbot/provider-plan-resolver"
import type { ChatToolContext, ToolResult } from "@/lib/chatbot/tools/types"

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined
}

export async function executeProviderTool(
  toolName: string,
  input: Record<string, unknown>,
  ctx: ChatToolContext,
): Promise<ToolResult> {
  switch (toolName) {
    case "findProviderProfile": {
      const slug = str(input.slug)
      const query = str(input.query)
      if (slug) {
        const listing = await getDirectoryListingBySlug(slug)
        if (!listing) return { ok: false, error: "Listing not found" }
        return {
          ok: true,
          data: {
            slug: listing.slug,
            name: listing.businessName,
            niche: listing.niche,
            claimed: Boolean(listing.claimedByProviderId),
            rating: listing.rating,
          },
        }
      }
      if (query) {
        const rows = await prisma.directoryListing.findMany({
          where: {
            isActive: true,
            businessName: { contains: query, mode: "insensitive" },
          },
          take: 5,
          select: {
            slug: true,
            businessName: true,
            niche: true,
            claimedByProviderId: true,
          },
        })
        return { ok: true, data: { matches: rows } }
      }
      return { ok: false, error: "Provide slug or query" }
    }
    case "createProviderInterest": {
      const email = str(input.email)
      if (!email) return { ok: false, error: "email required" }
      const row = await prisma.providerInterest.create({
        data: {
          email,
          businessName: str(input.businessName) ?? null,
          niche: str(input.niche) ?? null,
          sourcePage: "chatbot",
        },
      })
      return { ok: true, data: { id: row.id, email: row.email } }
    }
    case "recommendProviderPlan": {
      const goals = str(input.goals) ?? ""
      const planSlug = resolvePlanSlugFromGoals(goals)
      const def = getProviderOfferPlan(planSlug)
      return {
        ok: true,
        data: {
          planSlug,
          label: def?.displayName ?? planSlug,
          disclaimer: "Plan recommendation only — checkout and fulfillment are separate steps.",
        },
      }
    }
    case "getThriveCartCheckoutUrl": {
      const planSlug = str(input.planSlug) ?? "starter"
      await syncProviderOfferCatalog().catch(() => null)
      const def = getProviderOfferPlan(planSlug)
      if (!def) return { ok: false, error: "Unknown plan" }
      const dbPlan = await prisma.providerPlan.findUnique({ where: { slug: planSlug } })
      const productId = dbPlan?.thriveCartSetupId ?? def.thriveCartSetupId
      const account = process.env.THRIVECART_ACCOUNT_SLUG ?? "relgard"
      const passthrough = new URLSearchParams({
        plan_slug: planSlug,
        source_page_type: "chatbot",
        ...(ctx.providerId ? { provider_id: ctx.providerId } : {}),
        ...(str(input.providerId) ? { provider_id: str(input.providerId)! } : {}),
      })
      const checkoutUrl = productId
        ? `https://${account}.thrivecart.com/?${passthrough}`
        : null
      return {
        ok: true,
        data: {
          planSlug,
          checkoutUrl,
          thriveCartProductId: productId ?? null,
          disclaimer:
            "Checkout completes in ThriveCart. Payment does not guarantee microsite publication or lead volume.",
        },
      }
    }
    case "getProviderDashboardSummary": {
      if (!ctx.providerId) {
        return { ok: false, error: "Sign in to your provider dashboard to view account data" }
      }
      const [leads, subscription] = await Promise.all([
        prisma.providerLead.count({ where: { providerId: ctx.providerId } }),
        prisma.providerSubscription.findUnique({
          where: { providerId: ctx.providerId },
          include: { plan: { select: { slug: true, displayName: true } } },
        }),
      ])
      return {
        ok: true,
        data: {
          leadCount: leads,
          lifecycleStatus: subscription?.lifecycleStatus ?? "none",
          planSlug: subscription?.plan.slug ?? null,
          planName: subscription?.plan.displayName ?? null,
        },
      }
    }
    case "getMicrositeStatus": {
      if (!ctx.providerId) return { ok: false, error: "Sign in required" }
      const [provider, microsite] = await Promise.all([
        prisma.provider.findUnique({
          where: { id: ctx.providerId },
          select: { slug: true, lifecycleStatus: true, claimedListingId: true },
        }),
        prisma.microsite.findFirst({
          where: { providerId: ctx.providerId },
          orderBy: { updatedAt: "desc" },
          select: { status: true, publishMode: true, publishedAt: true, slug: true },
        }),
      ])
      if (!provider) return { ok: false, error: "Provider not found" }
      return { ok: true, data: { provider, microsite } }
    }
    case "getSubscriptionStatus": {
      if (!ctx.providerId) return { ok: false, error: "Sign in required" }
      const sub = await prisma.providerSubscription.findUnique({
        where: { providerId: ctx.providerId },
        include: { plan: { select: { slug: true, displayName: true } } },
      })
      return {
        ok: true,
        data: sub
          ? {
              lifecycleStatus: sub.lifecycleStatus,
              eligibilityTier: sub.eligibilityTier,
              planSlug: sub.plan.slug,
              planName: sub.plan.displayName,
            }
          : { lifecycleStatus: "none" },
      }
    }
    case "getLeadSummary": {
      if (!ctx.providerId) return { ok: false, error: "Sign in required" }
      const limit = Math.min(Number.parseInt(str(input.limit) ?? "5", 10) || 5, 20)
      const leads = await prisma.providerLead.findMany({
        where: { providerId: ctx.providerId },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: { id: true, status: true, createdAt: true, source: true },
      })
      return { ok: true, data: { leads } }
    }
    case "createProviderSupportTicket": {
      if (!ctx.providerId) return { ok: false, error: "Sign in required" }
      const subject = str(input.subject)
      const body = str(input.body)
      if (!subject || !body) return { ok: false, error: "subject and body required" }
      const task = await prisma.providerTask.create({
        data: {
          providerId: ctx.providerId,
          title: subject,
          description: body,
          status: "open",
          metadata: { source: "chatbot" },
        },
      })
      return { ok: true, data: { taskId: task.id } }
    }
    default:
      return { ok: false, error: `Unknown provider tool: ${toolName}` }
  }
}

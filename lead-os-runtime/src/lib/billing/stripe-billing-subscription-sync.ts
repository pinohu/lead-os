// src/lib/billing/stripe-billing-subscription-sync.ts
// Maps Stripe subscription state → billing_subscriptions (migration 007).

import type Stripe from "stripe";
import { getPool, queryPostgres } from "@/lib/db";
import { PLAN_CATALOG, getPlanById } from "@/lib/plan-catalog";
import { pricingLog } from "@/lib/pricing/logger";

export type BillingSubscriptionRowStatus = "active" | "canceled" | "past_due" | "trialing";

export function mapStripeStatusToBillingSubscriptionStatus(
  status: Stripe.Subscription.Status,
): BillingSubscriptionRowStatus {
  if (status === "active") return "active";
  if (status === "trialing") return "trialing";
  if (status === "past_due" || status === "unpaid" || status === "paused") return "past_due";
  if (status === "canceled") return "canceled";
  if (status === "incomplete" || status === "incomplete_expired") return "trialing";
  return "past_due";
}

export function catalogPlanIdToBillingPlanKey(planId: string): string {
  const def = getPlanById(planId);
  if (!def) return "growth";
  if (def.id.includes("enterprise")) return "enterprise";
  if (def.id.includes("developer")) return "developer";
  return "growth";
}

export function resolvePlanKeyFromStripeSubscription(sub: Stripe.Subscription): string {
  const metaPlan = sub.metadata?.planId ?? sub.metadata?.plan_key;
  if (metaPlan !== undefined && metaPlan !== null && String(metaPlan).length > 0) {
    const def = getPlanById(String(metaPlan));
    if (def) {
      if (def.id.includes("enterprise")) return "enterprise";
      if (def.id.includes("developer")) return "developer";
      return "growth";
    }
    if (metaPlan === "enterprise" || metaPlan === "growth" || metaPlan === "developer") return metaPlan;
  }

  const firstPrice = sub.items?.data?.[0]?.price?.id;
  if (firstPrice) {
    for (const plan of PLAN_CATALOG) {
      if (plan.stripePriceId === firstPrice) {
        if (plan.id.includes("enterprise")) return "enterprise";
        if (plan.id.includes("developer")) return "developer";
        return "growth";
      }
    }
  }

  return "growth";
}

export interface SyncBillingSubscriptionFromStripeInput {
  tenantId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  planKey: string;
  status: BillingSubscriptionRowStatus;
  currentPeriodEndIso: string | null;
}

export async function upsertBillingSubscriptionFromStripe(
  input: SyncBillingSubscriptionFromStripeInput,
): Promise<void> {
  const pool = getPool();
  if (!pool) {
    pricingLog("info", "billing_subscriptions_sync_skipped_no_db", { tenantId: input.tenantId });
    return;
  }

  const periodEnd = input.currentPeriodEndIso ?? new Date().toISOString();

  await queryPostgres(
    `INSERT INTO billing_subscriptions
      (tenant_id, plan_key, status, current_period_end, updated_at, stripe_customer_id, stripe_subscription_id)
     VALUES ($1, $2, $3, $4::timestamptz, NOW(), $5, $6)
     ON CONFLICT (tenant_id) DO UPDATE SET
       plan_key = EXCLUDED.plan_key,
       status = EXCLUDED.status,
       current_period_end = EXCLUDED.current_period_end,
       updated_at = NOW(),
       stripe_customer_id = EXCLUDED.stripe_customer_id,
       stripe_subscription_id = EXCLUDED.stripe_subscription_id`,
    [
      input.tenantId,
      input.planKey,
      input.status,
      periodEnd,
      input.stripeCustomerId,
      input.stripeSubscriptionId,
    ],
  );

  pricingLog("info", "billing_subscriptions_synced", {
    tenantId: input.tenantId,
    planKey: input.planKey,
    status: input.status,
    stripeSubscriptionId: input.stripeSubscriptionId,
  });
}

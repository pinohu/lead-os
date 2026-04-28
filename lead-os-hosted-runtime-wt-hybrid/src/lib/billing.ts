import Stripe from "stripe";
import { getPlanById, type PlanDefinition } from "./plan-catalog.ts";

/** Stripe v22+ — avoid `Stripe.Checkout.SessionCreateParams` (not exported on `Checkout` in ESM builds). */
type StripeCheckoutSessionCreateParams = NonNullable<Parameters<Stripe["checkout"]["sessions"]["create"]>[0]>;
type StripeCheckoutLineItem = NonNullable<StripeCheckoutSessionCreateParams["line_items"]>[number];
import {
  getSubscription,
  upsertSubscription,
  type SubscriptionRecord,
} from "./billing-store.ts";
import { pricingLog } from "./pricing/logger.ts";
import { releaseStripeWebhookEventClaim, tryClaimStripeWebhookEvent } from "./billing/stripe-webhook-idempotency.ts";
import {
  catalogPlanIdToBillingPlanKey,
  mapStripeStatusToBillingSubscriptionStatus,
  resolvePlanKeyFromStripeSubscription,
  upsertBillingSubscriptionFromStripe,
} from "./billing/stripe-billing-subscription-sync.ts";

function getStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-04-22.dahlia" });
}

function extractPeriodFromSubscription(sub: Stripe.Subscription): { start: string; end: string } {
  const firstItem = sub.items?.data?.[0];
  if (firstItem) {
    return {
      start: new Date(firstItem.current_period_start * 1000).toISOString(),
      end: new Date(firstItem.current_period_end * 1000).toISOString(),
    };
  }
  const now = new Date().toISOString();
  return { start: now, end: now };
}

function getWebhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET ?? null;
}

export interface CheckoutSessionResult {
  url: string | null;
  sessionId: string;
  dryRun: boolean;
}

export async function createCheckoutSession(
  tenantId: string,
  planId: string,
  successUrl?: string,
  cancelUrl?: string,
): Promise<CheckoutSessionResult> {
  const plan = getPlanById(planId);
  if (!plan) throw new Error(`Unknown plan: ${planId}`);

  const stripe = getStripeClient();
  if (!stripe) {
    return {
      url: successUrl ?? "/billing/success",
      sessionId: `dry_cs_${Date.now()}`,
      dryRun: true,
    };
  }

  const lineItems: StripeCheckoutLineItem[] = [];

  if (plan.setupFee > 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: { name: `${plan.name} — Setup Fee` },
        unit_amount: plan.setupFee,
      },
      quantity: 1,
    });
  }

  lineItems.push({
    price: plan.stripePriceId,
    quantity: 1,
  });

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: lineItems,
    success_url: successUrl ?? `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl ?? `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/billing/cancel`,
    metadata: { tenantId, planId },
    subscription_data: {
      metadata: { tenantId, planId },
    },
  });

  return {
    url: session.url,
    sessionId: session.id,
    dryRun: false,
  };
}

export interface PortalSessionResult {
  url: string;
  dryRun: boolean;
}

export async function createBillingPortalSession(
  tenantId: string,
  returnUrl?: string,
): Promise<PortalSessionResult> {
  const subscription = await getSubscription(tenantId);

  const stripe = getStripeClient();
  if (!stripe || !subscription) {
    return {
      url: returnUrl ?? "/dashboard",
      dryRun: true,
    };
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: returnUrl ?? `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/dashboard`,
  });

  return {
    url: session.url,
    dryRun: false,
  };
}

export interface WebhookHandleResult {
  eventType: string;
  handled: boolean;
  tenantId?: string;
  duplicate?: boolean;
}

function subscriptionStatusMap(): Record<string, SubscriptionRecord["status"]> {
  return {
    active: "active",
    past_due: "past_due",
    canceled: "cancelled",
    trialing: "trialing",
    incomplete: "trialing",
    incomplete_expired: "cancelled",
    unpaid: "past_due",
    paused: "past_due",
  };
}

async function syncBillingEntitlementsRow(params: {
  tenantId: string;
  sub: Stripe.Subscription;
  catalogPlanId?: string;
}): Promise<void> {
  const { tenantId, sub, catalogPlanId } = params;
  const planKey = catalogPlanId
    ? catalogPlanIdToBillingPlanKey(catalogPlanId)
    : resolvePlanKeyFromStripeSubscription(sub);
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? "";
  const period = extractPeriodFromSubscription(sub);
  await upsertBillingSubscriptionFromStripe({
    tenantId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: sub.id,
    planKey,
    status: mapStripeStatusToBillingSubscriptionStatus(sub.status),
    currentPeriodEndIso: period.end,
  });
}

async function dispatchStripeWebhookEvent(
  event: Stripe.Event,
  stripe: Stripe,
  now: string,
): Promise<WebhookHandleResult> {
  const sm = subscriptionStatusMap();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const tenantId = session.metadata?.tenantId;
      const planId = session.metadata?.planId;
      if (!tenantId || !planId) break;

      const subscriptionId = typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id ?? "";

      let periodStart = now;
      let periodEnd = now;

      if (subscriptionId) {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const period = extractPeriodFromSubscription(sub);
        periodStart = period.start;
        periodEnd = period.end;
        await syncBillingEntitlementsRow({ tenantId, sub, catalogPlanId: planId });
      } else {
        await upsertBillingSubscriptionFromStripe({
          tenantId,
          stripeCustomerId: typeof session.customer === "string"
            ? session.customer
            : session.customer?.id ?? "",
          stripeSubscriptionId: "",
          planKey: catalogPlanIdToBillingPlanKey(planId),
          status: "active",
          currentPeriodEndIso: periodEnd,
        });
      }

      await upsertSubscription({
        tenantId,
        planId,
        stripeCustomerId: typeof session.customer === "string" ? session.customer : session.customer?.id ?? "",
        stripeSubscriptionId: subscriptionId,
        status: "active",
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        createdAt: now,
        updatedAt: now,
      });

      pricingLog("info", "stripe_webhook_checkout_completed", { tenantId, planId, subscriptionId });
      return { eventType: event.type, handled: true, tenantId };
    }

    case "customer.subscription.created": {
      const sub = event.data.object as Stripe.Subscription;
      const tenantId = sub.metadata?.tenantId;
      if (!tenantId) break;

      const planIdFromMeta = sub.metadata?.planId ?? "managed-growth";
      const period = extractPeriodFromSubscription(sub);
      const stripeCustomerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? "";

      await upsertSubscription({
        tenantId,
        planId: planIdFromMeta,
        stripeCustomerId,
        stripeSubscriptionId: sub.id,
        status: sm[sub.status] ?? "trialing",
        currentPeriodStart: period.start,
        currentPeriodEnd: period.end,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        createdAt: now,
        updatedAt: now,
      });

      await syncBillingEntitlementsRow({ tenantId, sub, catalogPlanId: planIdFromMeta });
      pricingLog("info", "stripe_webhook_subscription_created", { tenantId, subscriptionId: sub.id });
      return { eventType: event.type, handled: true, tenantId };
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const tenantId = sub.metadata?.tenantId;
      if (!tenantId) break;

      const existing = await getSubscription(tenantId);
      const period = extractPeriodFromSubscription(sub);
      const planIdFromMeta = sub.metadata?.planId;

      if (!existing) {
        const planId = planIdFromMeta ?? "managed-growth";
        const stripeCustomerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? "";
        await upsertSubscription({
          tenantId,
          planId,
          stripeCustomerId,
          stripeSubscriptionId: sub.id,
          status: sm[sub.status] ?? "active",
          currentPeriodStart: period.start,
          currentPeriodEnd: period.end,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          createdAt: now,
          updatedAt: now,
        });
        await syncBillingEntitlementsRow({ tenantId, sub, catalogPlanId: planId });
        pricingLog("info", "stripe_webhook_subscription_updated_backfill", { tenantId, subscriptionId: sub.id });
        return { eventType: event.type, handled: true, tenantId };
      }

      await upsertSubscription({
        ...existing,
        status: sm[sub.status] ?? existing.status,
        currentPeriodStart: period.start,
        currentPeriodEnd: period.end,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        updatedAt: now,
      });

      await syncBillingEntitlementsRow({ tenantId, sub, catalogPlanId: planIdFromMeta });
      pricingLog("info", "stripe_webhook_subscription_updated", { tenantId, subscriptionId: sub.id });
      return { eventType: event.type, handled: true, tenantId };
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const tenantId = sub.metadata?.tenantId;
      if (!tenantId) break;

      const existing = await getSubscription(tenantId);
      if (!existing) break;

      await upsertSubscription({
        ...existing,
        status: "cancelled",
        cancelAtPeriodEnd: false,
        updatedAt: now,
      });

      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? "";
      const period = extractPeriodFromSubscription(sub);
      await upsertBillingSubscriptionFromStripe({
        tenantId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: sub.id,
        planKey: resolvePlanKeyFromStripeSubscription(sub),
        status: "canceled",
        currentPeriodEndIso: period.end,
      });

      pricingLog("info", "stripe_webhook_subscription_deleted", { tenantId, subscriptionId: sub.id });
      return { eventType: event.type, handled: true, tenantId };
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subDetails = invoice.parent?.subscription_details;
      const subscriptionRef = subDetails?.subscription;
      const subscriptionId = typeof subscriptionRef === "string"
        ? subscriptionRef
        : subscriptionRef?.id;

      if (!subscriptionId) break;

      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      const tenantId = sub.metadata?.tenantId;
      if (!tenantId) break;

      const existing = await getSubscription(tenantId);
      if (!existing) break;

      await upsertSubscription({
        ...existing,
        status: "past_due",
        updatedAt: now,
      });

      await syncBillingEntitlementsRow({ tenantId, sub });
      pricingLog("warn", "stripe_webhook_invoice_payment_failed", { tenantId, subscriptionId });
      return { eventType: event.type, handled: true, tenantId };
    }
  }

  return { eventType: event.type, handled: false };
}

export async function handleStripeWebhook(
  payload: string,
  signature: string,
): Promise<WebhookHandleResult> {
  const stripe = getStripeClient();
  const webhookSecret = getWebhookSecret();

  if (!stripe || !webhookSecret) {
    return { eventType: "unknown", handled: false };
  }

  const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  const now = new Date().toISOString();

  const claimed = await tryClaimStripeWebhookEvent(event.id);
  if (!claimed) {
    pricingLog("info", "stripe_webhook_duplicate_event", { eventId: event.id, type: event.type });
    return { eventType: event.type, handled: true, duplicate: true };
  }

  try {
    const result = await dispatchStripeWebhookEvent(event, stripe, now);
    if (!result.handled) {
      await releaseStripeWebhookEventClaim(event.id);
    }
    return result;
  } catch (err) {
    await releaseStripeWebhookEventClaim(event.id);
    pricingLog("warn", "stripe_webhook_processing_failed", {
      eventId: event.id,
      message: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

export interface SubscriptionStatus {
  subscription: SubscriptionRecord | null;
  plan: PlanDefinition | null;
  isActive: boolean;
  dryRun: boolean;
}

export async function getSubscriptionStatus(tenantId: string): Promise<SubscriptionStatus> {
  const subscription = await getSubscription(tenantId);

  if (!subscription) {
    return { subscription: null, plan: null, isActive: false, dryRun: !getStripeClient() };
  }

  const plan = getPlanById(subscription.planId) ?? null;
  const isActive = subscription.status === "active" || subscription.status === "trialing";

  return { subscription, plan, isActive, dryRun: !getStripeClient() };
}

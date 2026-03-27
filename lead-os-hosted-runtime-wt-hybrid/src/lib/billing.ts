import Stripe from "stripe";
import { getPlanById, type PlanDefinition } from "./plan-catalog.ts";
import {
  getSubscription,
  upsertSubscription,
  type SubscriptionRecord,
} from "./billing-store.ts";

function getStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
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

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

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

      return { eventType: event.type, handled: true, tenantId };
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const tenantId = sub.metadata?.tenantId;
      if (!tenantId) break;

      const existing = await getSubscription(tenantId);
      if (!existing) break;

      const statusMap: Record<string, SubscriptionRecord["status"]> = {
        active: "active",
        past_due: "past_due",
        canceled: "cancelled",
        trialing: "trialing",
      };

      const period = extractPeriodFromSubscription(sub);
      await upsertSubscription({
        ...existing,
        status: statusMap[sub.status] ?? existing.status,
        currentPeriodStart: period.start,
        currentPeriodEnd: period.end,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        updatedAt: now,
      });

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

      return { eventType: event.type, handled: true, tenantId };
    }
  }

  return { eventType: event.type, handled: false };
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

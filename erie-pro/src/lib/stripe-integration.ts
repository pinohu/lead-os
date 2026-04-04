// ── Stripe Integration — Territory Claim Payment System ─────────────
// Uses the real Stripe SDK when STRIPE_SECRET_KEY is set.
// Falls back to dry-run mode for development without Stripe keys.

import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { cityConfig } from "@/lib/city-config";
import { logger } from "@/lib/logger";

// ── Public Interfaces ──────────────────────────────────────────────

export interface TerritoryCheckout {
  niche: string;
  city: string;
  providerName: string;
  providerEmail: string;
  monthlyFee: number;
  checkoutUrl: string;
  sessionId: string;
}

export interface StripeWebhookResult {
  handled: boolean;
  eventType: string;
  message: string;
}

// ── Configuration ──────────────────────────────────────────────────
// Lazy accessors: config is read at first function call, not at module
// load time. This allows `next build` to compile without env vars.

let _stripe: Stripe | null | undefined;
let _isDryRun: boolean | undefined;

function getStripeConfig() {
  if (_isDryRun !== undefined) return;

  const key = process.env.STRIPE_SECRET_KEY ?? "";
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction && !key) {
    throw new Error(
      "[stripe-integration] STRIPE_SECRET_KEY is required in production. " +
      "Set the STRIPE_SECRET_KEY environment variable to your Stripe secret key."
    );
  }

  _isDryRun = isProduction ? false : !key;
  _stripe = _isDryRun ? null : new Stripe(key);
}

function getStripe(): Stripe | null {
  getStripeConfig();
  return _stripe ?? null;
}

function isDryRun(): boolean {
  getStripeConfig();
  return _isDryRun!;
}

function getAppDomain(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? `https://${cityConfig.domain}`;
}

function getWebhookSecret(): string {
  return process.env.STRIPE_WEBHOOK_SECRET ?? "";
}

// ── Niche pricing ──────────────────────────────────────────────────

const NICHE_PRICING: Record<string, number> = {
  // ── Tier 1: Premium ($1,200-$1,500/mo) ───────────────────────────
  legal: 1500,          // avg case $3.5K-$50K+, CLV $5K-$20K
  solar: 1500,          // avg project $20K-$35K, one deal = 14-23x ROI
  "real-estate": 1300,  // avg commission $8K-$12K, CLV $15K-$25K
  foundation: 1300,     // avg project $5.5K-$12K, competitors $1.5K-$3.5K/mo
  dental: 1200,         // CLV $8K-$12K per patient over 10 years
  "windows-doors": 1200, // avg project $6K-$12K, Modernize $35-$85/shared lead
  restoration: 1200,    // emergency niche, avg job $3.5K-$7.5K

  // ── Tier 2: Standard-High ($700-$1,000/mo) ──────────────────────
  roofing: 1000,        // avg project $8.5K-$14K — was $400, severely underpriced
  flooring: 1000,       // avg project $3.5K-$6K
  accounting: 900,      // CLV $7.5K-$15K, 65-80% gross margins
  "pool-spa": 900,      // new pool builds $35K-$65K
  demolition: 900,      // avg project $3K-$10K, contractor repeat work
  "home-security": 800, // CLV $3K-$6K from monitoring contracts
  veterinary: 800,      // CLV $5K-$10K per pet, 35-50% close rate
  hvac: 750,            // maintenance contracts + $5.5K-$8.5K installs
  plumbing: 750,        // high repeat CLV $2.8K-$4.5K
  electrical: 700,      // slightly lower project values than plumbing/HVAC
  chiropractic: 700,    // CLV $3K-$7K, ongoing care relationship
  concrete: 700,        // avg project $3K-$6K, one driveway = 4-8 months

  // ── Tier 3: Standard ($400-$650/mo) ──────────────────────────────
  fencing: 600,         // avg project $3.5K-$5.5K
  painting: 550,        // avg project $3K-$4.5K exterior
  insulation: 500,      // avg project $2K-$4.5K
  "tree-service": 500,  // avg job $750-$3K, 20-30% close rate
  septic: 500,          // mix of $400 pumping and $4K-$8K repairs
  towing: 500,          // high volume (40-55% close), low ticket
  "snow-removal": 500,  // critical in Erie (120+ in/yr)
  glass: 500,           // emergency window repairs drive urgency
  irrigation: 450,      // seasonal with winterization repeats
  "garage-door": 450,   // emergency service = 25-40% close rate
  photography: 400,     // wedding season boosts value
  landscaping: 400,     // recurring maintenance contracts
  "auto-repair": 400,   // 30-45% close rate, strong repeat
  chimney: 400,         // annual service creates recurring revenue
  locksmith: 400,       // highest close rates (35-50%), 60-75% margins
  drywall: 400,         // remodel-driven demand
  gutters: 400,         // moderate volume and margins
  "pressure-washing": 375, // low per-job value ($250-$800)

  // ── Tier 4: Entry ($275-$350/mo) ─────────────────────────────────
  "pest-control": 350,  // recurring contracts save CLV $1.8K-$3.6K
  handyman: 350,        // repeat home maintenance, volume-based
  "appliance-repair": 350, // urgent need = 30-45% close rate
  moving: 350,          // low repeat frequency limits CLV
  "carpet-cleaning": 325, // low per-job value ($200-$350)
  cleaning: 300,        // entry price drives adoption, recurring revenue
  "pet-grooming": 300,  // very low per-visit ($50-$90), CLV from repeats
};

export function getMonthlyFee(niche: string): number {
  return NICHE_PRICING[niche] ?? 400;
}

// ── Core Functions ─────────────────────────────────────────────────

/**
 * Create a Stripe checkout session for territory claim.
 * In dry-run mode, creates a mock session and returns a success URL directly.
 * With a real STRIPE_SECRET_KEY, creates a real Stripe Checkout session.
 */
export async function createTerritoryCheckoutSession(
  niche: string,
  city: string,
  providerEmail: string,
  providerName: string
): Promise<TerritoryCheckout> {
  const monthlyFee = getMonthlyFee(niche);

  if (!isDryRun() && getStripe()) {
    // Production: Real Stripe Checkout
    const session = await getStripe()!.checkout.sessions.create({
      mode: "subscription",
      customer_email: providerEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: Math.round(monthlyFee * 100), // cents
            recurring: { interval: "month" },
            product_data: {
              name: `Erie Pro — ${niche} Territory (${city})`,
              description: `Exclusive ${niche} lead generation territory in ${city}`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${getAppDomain()}/for-business/claim/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getAppDomain()}/for-business/claim?cancelled=true`,
      metadata: { niche, city, providerName },
    });

    // Store checkout session in DB
    await prisma.checkoutSession.create({
      data: {
        sessionType: "territory_claim",
        stripeSessionId: session.id,
        niche,
        city,
        providerEmail: providerEmail.toLowerCase(),
        providerName,
        monthlyFee,
        status: "pending",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      },
    });

    return {
      niche,
      city,
      providerName,
      providerEmail,
      monthlyFee,
      checkoutUrl: session.url ?? `${getAppDomain()}/for-business/claim/success?session_id=${session.id}`,
      sessionId: session.id,
    };
  }

  // Dry-run mode: mock session
  const sessionId = `cs_mock_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`;

  await prisma.checkoutSession.create({
    data: {
      sessionType: "territory_claim",
      stripeSessionId: sessionId,
      niche,
      city,
      providerEmail: providerEmail.toLowerCase(),
      providerName,
      monthlyFee,
      status: "pending",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  if (process.env.NODE_ENV === "development") {
    logger.info("stripe", `DRY-RUN Checkout session created: ${sessionId}`);
  }

  return {
    niche,
    city,
    providerName,
    providerEmail,
    monthlyFee,
    checkoutUrl: `${getAppDomain()}/for-business/claim/success?session_id=${sessionId}&niche=${niche}&city=${city}`,
    sessionId,
  };
}

// ── Pay-Per-Lead Pricing ───────────────────────────────────────────

export type LeadTemperature = "cold" | "warm" | "hot" | "burning";

export const LEAD_PRICES: Record<LeadTemperature, number> = {
  cold: 25,
  warm: 50,
  hot: 100,
  burning: 200,
};

export interface LeadPurchaseCheckout {
  leadId: string;
  niche: string;
  temperature: LeadTemperature;
  price: number;
  buyerEmail: string;
  checkoutUrl: string;
  sessionId: string;
}

/**
 * Create a one-time Stripe checkout for a single pay-per-lead purchase.
 */
export async function createLeadPurchaseCheckout(
  leadId: string,
  niche: string,
  temperature: LeadTemperature,
  buyerEmail: string
): Promise<LeadPurchaseCheckout> {
  const price = LEAD_PRICES[temperature];

  if (!isDryRun() && getStripe()) {
    const session = await getStripe()!.checkout.sessions.create({
      mode: "payment",
      customer_email: buyerEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: Math.round(price * 100),
            product_data: {
              name: `Erie Pro — ${temperature} ${niche} Lead`,
              description: `One-time purchase of a ${temperature} lead in ${niche}`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${getAppDomain()}/for-business/leads/success?session_id={CHECKOUT_SESSION_ID}&lead_id=${leadId}&niche=${niche}`,
      cancel_url: `${getAppDomain()}/for-business/leads?cancelled=true`,
      metadata: { leadId, niche, temperature },
    });

    await prisma.checkoutSession.create({
      data: {
        sessionType: "lead_purchase",
        stripeSessionId: session.id,
        niche,
        providerEmail: buyerEmail.toLowerCase(),
        leadId,
        temperature: temperature as LeadTemperature,
        price,
        status: "pending",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return {
      leadId,
      niche,
      temperature,
      price,
      buyerEmail,
      checkoutUrl: session.url ?? `${getAppDomain()}/for-business/leads/success?session_id=${session.id}`,
      sessionId: session.id,
    };
  }

  // Dry-run mode
  const sessionId = `cs_mock_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`;

  await prisma.checkoutSession.create({
    data: {
      sessionType: "lead_purchase",
      stripeSessionId: sessionId,
      niche,
      providerEmail: buyerEmail.toLowerCase(),
      leadId,
      temperature: temperature as LeadTemperature,
      price,
      status: "pending",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  if (process.env.NODE_ENV === "development") {
    logger.info("stripe", `DRY-RUN Lead purchase session: ${sessionId}`);
  }

  return {
    leadId,
    niche,
    temperature,
    price,
    buyerEmail,
    checkoutUrl: `${getAppDomain()}/for-business/leads/success?session_id=${sessionId}&lead_id=${leadId}&niche=${niche}`,
    sessionId,
  };
}

/**
 * Handle Stripe webhook events.
 */
export async function handleStripeWebhook(
  event: Stripe.Event
): Promise<StripeWebhookResult> {
  const eventType = event.type;

  switch (eventType) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      // Mark checkout session as completed in DB
      if (session.id) {
        await prisma.checkoutSession.updateMany({
          where: { stripeSessionId: session.id },
          data: { status: "completed", completedAt: new Date() },
        });
      }

      return {
        handled: true,
        eventType,
        message: "Checkout session completed, provider activation pending",
      };
    }

    case "invoice.payment_succeeded": {
      return {
        handled: true,
        eventType,
        message: "Payment succeeded, subscription renewed",
      };
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      // Mark provider as past_due
      if (customerId) {
        await prisma.provider.updateMany({
          where: { stripeCustomerId: customerId },
          data: { subscriptionStatus: "past_due" },
        });
      }

      return {
        handled: true,
        eventType,
        message: "Payment failed, provider marked past_due",
      };
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      // Deactivate provider and release territory
      if (customerId) {
        const provider = await prisma.provider.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (provider) {
          await prisma.provider.update({
            where: { id: provider.id },
            data: {
              subscriptionStatus: "cancelled",
              churnedAt: new Date(),
            },
          });

          // Deactivate territory
          await prisma.territory.updateMany({
            where: { providerId: provider.id, deactivatedAt: null },
            data: { deactivatedAt: new Date() },
          });

          // Re-bank unresponded leads so they can be delivered to the next provider
          await prisma.lead.updateMany({
            where: {
              routedToId: provider.id,
              routeType: "primary",
              outcomes: { none: {} },
            },
            data: {
              routedToId: null,
              routeType: "unmatched",
            },
          });
        }
      }

      return {
        handled: true,
        eventType,
        message: "Subscription cancelled, territory released, unresponded leads re-banked",
      };
    }

    default:
      return {
        handled: false,
        eventType,
        message: `Unhandled event type: ${eventType}`,
      };
  }
}

/**
 * Construct and verify a Stripe webhook event from raw body.
 */
export function constructWebhookEvent(
  rawBody: string,
  signature: string
): Stripe.Event | null {
  const s = getStripe();
  if (!s || !getWebhookSecret()) return null;

  try {
    return s.webhooks.constructEvent(rawBody, signature, getWebhookSecret());
  } catch {
    return null;
  }
}

/**
 * Get subscription status (real or dry-run).
 */
export async function getSubscriptionStatus(
  stripeSubscriptionId: string
): Promise<"active" | "past_due" | "cancelled"> {
  if (!isDryRun() && getStripe()) {
    try {
      const sub = await getStripe()!.subscriptions.retrieve(stripeSubscriptionId);
      if (sub.status === "active") return "active";
      if (sub.status === "past_due") return "past_due";
      return "cancelled";
    } catch {
      return "cancelled";
    }
  }

  // Dry-run: check DB
  const provider = await prisma.provider.findFirst({
    where: { stripeSubscriptionId },
    select: { subscriptionStatus: true },
  });

  if (provider?.subscriptionStatus === "active") return "active";
  if (provider?.subscriptionStatus === "past_due") return "past_due";
  return "cancelled";
}

/**
 * Get a checkout session by Stripe session ID.
 */
export async function getCheckoutSession(sessionId: string) {
  return prisma.checkoutSession.findFirst({
    where: { stripeSessionId: sessionId },
  });
}

/**
 * Check if Stripe is in dry-run mode.
 */
export function isStripeDryRun(): boolean {
  return isDryRun();
}

export { NICHE_PRICING };

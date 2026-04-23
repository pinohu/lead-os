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

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_URL ?? `https://${cityConfig.domain}`;

// Production guard: Stripe keys MUST be present when running in production.
// Dry-run mode is NEVER allowed in production — it would silently skip real payments.
if (process.env.NODE_ENV === "production" && !STRIPE_SECRET_KEY) {
  throw new Error(
    "[stripe-integration] STRIPE_SECRET_KEY is required in production. " +
    "Set the STRIPE_SECRET_KEY environment variable to your Stripe secret key."
  );
}

const isProduction = process.env.NODE_ENV === "production";
const isDryRun = isProduction ? false : !STRIPE_SECRET_KEY;

// Initialize Stripe SDK (only when key is set)
const stripe = isDryRun ? null : new Stripe(STRIPE_SECRET_KEY);

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

  if (!isDryRun && stripe) {
    // Production: Real Stripe Checkout
    const session = await stripe.checkout.sessions.create({
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
      success_url: `${APP_DOMAIN}/for-business/claim/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_DOMAIN}/for-business/claim?cancelled=true`,
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
      checkoutUrl: session.url ?? `${APP_DOMAIN}/for-business/claim/success?session_id=${session.id}`,
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
    checkoutUrl: `${APP_DOMAIN}/for-business/claim/success?session_id=${sessionId}&niche=${niche}&city=${city}`,
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

  if (!isDryRun && stripe) {
    const session = await stripe.checkout.sessions.create({
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
      success_url: `${APP_DOMAIN}/for-business/leads/success?session_id={CHECKOUT_SESSION_ID}&lead_id=${leadId}&niche=${niche}`,
      cancel_url: `${APP_DOMAIN}/for-business?cancelled=true&niche=${niche}`,
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
      checkoutUrl: session.url ?? `${APP_DOMAIN}/for-business/leads/success?session_id=${session.id}`,
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
    checkoutUrl: `${APP_DOMAIN}/for-business/leads/success?session_id=${sessionId}&lead_id=${leadId}&niche=${niche}`,
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

      if (session.id) {
        await prisma.checkoutSession.updateMany({
          where: { stripeSessionId: session.id },
          data: { status: "completed", completedAt: new Date() },
        });
      }

      const customerId = session.customer as string | null;
      if (customerId) {
        const provider = await prisma.provider.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (provider) {
          await prisma.provider.update({
            where: { id: provider.id },
            data: {
              subscriptionStatus: "active",
            },
          });

          if (provider.niche) {
            await prisma.territory.upsert({
              where: {
                niche_city: { niche: provider.niche, city: provider.city ?? "erie" },
              },
              update: {
                providerId: provider.id,
                activatedAt: new Date(),
                deactivatedAt: null,
              },
              create: {
                niche: provider.niche,
                city: provider.city ?? "erie",
                providerId: provider.id,
                activatedAt: new Date(),
              },
            });
          }
        }
      }

      return {
        handled: true,
        eventType,
        message: "Checkout completed — provider activated, territory assigned",
      };
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      if (customerId) {
        await prisma.provider.updateMany({
          where: { stripeCustomerId: customerId },
          data: { subscriptionStatus: "active" },
        });
      }

      return {
        handled: true,
        eventType,
        message: "Payment succeeded, provider status confirmed active",
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
  if (!stripe || !STRIPE_WEBHOOK_SECRET) return null;

  try {
    return stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
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
  if (!isDryRun && stripe) {
    try {
      const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
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
  return isDryRun;
}

// ── Requester upgrades: Concierge + Annual ─────────────────────────
// These are the only two paid offers on the requester side. Free
// matching remains the default.
//
// Concierge: one-time $29 per job. We call pros on the requester's
// behalf and text them the one to book.
//
// Annual: $199/yr subscription. Unlimited Concierge jobs for 12
// months + same-day priority.
//
// Price can be overridden with a real Stripe Price ID via env
// (STRIPE_PRICE_CONCIERGE / STRIPE_PRICE_ANNUAL). If not set, we
// use inline price_data so the flow works without Stripe dashboard
// setup — handy for the first 40 members.

export const CONCIERGE_PRICE_USD = 29;
export const ANNUAL_PRICE_USD = 199;

const CONCIERGE_STRIPE_PRICE_ID = process.env.STRIPE_PRICE_CONCIERGE ?? "";
const ANNUAL_STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ANNUAL ?? "";

export interface RequesterCheckout {
  plan: "concierge" | "annual";
  email: string;
  price: number;
  checkoutUrl: string;
  sessionId: string;
}

/**
 * One-time Concierge charge ($29) for white-glove matching on a
 * single job. `context` is a short description ("plumbing emergency",
 * "roof estimate") that we stash on the checkout session metadata so
 * the ops team has it when they pick up the request.
 */
export async function createConciergeCheckout(
  email: string,
  context: string,
): Promise<RequesterCheckout> {
  const price = CONCIERGE_PRICE_USD;
  const normalizedEmail = email.toLowerCase();

  if (!isDryRun && stripe) {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: CONCIERGE_STRIPE_PRICE_ID
        ? [{ price: CONCIERGE_STRIPE_PRICE_ID, quantity: 1 }]
        : [
            {
              price_data: {
                currency: "usd",
                unit_amount: price * 100,
                product_data: {
                  name: `${cityConfig.domain} — Concierge match`,
                  description:
                    "We call 2–3 local pros on your behalf and text you the one to book.",
                },
              },
              quantity: 1,
            },
          ],
      success_url: `${APP_DOMAIN}/concierge/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_DOMAIN}/#upgrade-heading?cancelled=true`,
      metadata: { plan: "concierge", context },
    });

    await prisma.checkoutSession.create({
      data: {
        sessionType: "concierge_job",
        stripeSessionId: session.id,
        niche: "concierge",
        city: cityConfig.slug,
        providerEmail: normalizedEmail,
        price,
        status: "pending",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return {
      plan: "concierge",
      email,
      price,
      checkoutUrl: session.url ?? `${APP_DOMAIN}/concierge/success?session_id=${session.id}`,
      sessionId: session.id,
    };
  }

  // Dry-run fallback
  const sessionId = `cs_mock_concierge_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .substring(2, 8)}`;

  await prisma.checkoutSession.create({
    data: {
      sessionType: "concierge_job",
      stripeSessionId: sessionId,
      niche: "concierge",
      city: cityConfig.slug,
      providerEmail: normalizedEmail,
      price,
      status: "pending",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  if (process.env.NODE_ENV === "development") {
    logger.info("stripe", `DRY-RUN Concierge session: ${sessionId}`);
  }

  return {
    plan: "concierge",
    email,
    price,
    checkoutUrl: `${APP_DOMAIN}/concierge/success?session_id=${sessionId}&dry_run=1`,
    sessionId,
  };
}

/**
 * Annual requester membership ($199/yr subscription). Unlimited
 * Concierge matches for 12 months + same-day priority.
 */
export async function createAnnualMembershipCheckout(
  email: string,
): Promise<RequesterCheckout> {
  const price = ANNUAL_PRICE_USD;
  const normalizedEmail = email.toLowerCase();

  if (!isDryRun && stripe) {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: ANNUAL_STRIPE_PRICE_ID
        ? [{ price: ANNUAL_STRIPE_PRICE_ID, quantity: 1 }]
        : [
            {
              price_data: {
                currency: "usd",
                unit_amount: price * 100,
                recurring: { interval: "year" },
                product_data: {
                  name: `${cityConfig.domain} — Annual Member`,
                  description:
                    "Unlimited Concierge matches for 12 months + same-day priority.",
                },
              },
              quantity: 1,
            },
          ],
      success_url: `${APP_DOMAIN}/concierge/success?session_id={CHECKOUT_SESSION_ID}&plan=annual`,
      cancel_url: `${APP_DOMAIN}/#upgrade-heading?cancelled=true`,
      metadata: { plan: "annual" },
    });

    await prisma.checkoutSession.create({
      data: {
        sessionType: "annual_membership",
        stripeSessionId: session.id,
        niche: "membership",
        city: cityConfig.slug,
        providerEmail: normalizedEmail,
        price,
        status: "pending",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return {
      plan: "annual",
      email,
      price,
      checkoutUrl: session.url ?? `${APP_DOMAIN}/concierge/success?session_id=${session.id}&plan=annual`,
      sessionId: session.id,
    };
  }

  // Dry-run fallback
  const sessionId = `cs_mock_annual_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .substring(2, 8)}`;

  await prisma.checkoutSession.create({
    data: {
      sessionType: "annual_membership",
      stripeSessionId: sessionId,
      niche: "membership",
      city: cityConfig.slug,
      providerEmail: normalizedEmail,
      price,
      status: "pending",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  if (process.env.NODE_ENV === "development") {
    logger.info("stripe", `DRY-RUN Annual membership session: ${sessionId}`);
  }

  return {
    plan: "annual",
    email,
    price,
    checkoutUrl: `${APP_DOMAIN}/concierge/success?session_id=${sessionId}&plan=annual&dry_run=1`,
    sessionId,
  };
}

export { STRIPE_WEBHOOK_SECRET, NICHE_PRICING };

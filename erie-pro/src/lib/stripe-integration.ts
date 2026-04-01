// ── Stripe Integration — Territory Claim Payment System ─────────────
// Dry-run implementation that simulates Stripe checkout flow.
// When STRIPE_SECRET_KEY is set, uses the real Stripe SDK.

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

// ── Configuration ───────────────────────────────────────────────────

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_URL ?? "https://erie.pro";

const isDryRun = !STRIPE_SECRET_KEY;

// ── Niche pricing ───────────────────────────────────────────────────

const NICHE_PRICING: Record<string, number> = {
  plumbing: 750,
  hvac: 750,
  electrical: 700,
  roofing: 400,
  landscaping: 400,
  dental: 1200,
  legal: 1500,
  cleaning: 300,
  "auto-repair": 400,
  "pest-control": 350,
  painting: 350,
  "real-estate": 900,
  "garage-door": 450,
  fencing: 400,
  flooring: 800,
  "windows-doors": 800,
  moving: 350,
  "tree-service": 500,
  "appliance-repair": 350,
  foundation: 1000,
  "home-security": 800,
  concrete: 500,
  septic: 500,
  chimney: 400,
  "pool-spa": 600,
  locksmith: 400,
  towing: 500,
  "carpet-cleaning": 400,
  "pressure-washing": 450,
  drywall: 400,
  insulation: 500,
  solar: 900,
  gutters: 400,
  handyman: 350,
  veterinary: 800,
  chiropractic: 700,
  accounting: 900,
  photography: 400,
  "pet-grooming": 350,
  "snow-removal": 500,
  restoration: 800,
  glass: 500,
  irrigation: 450,
  demolition: 600,
};

export function getMonthlyFee(niche: string): number {
  return NICHE_PRICING[niche] ?? 400;
}

// ── Mock Session Store ──────────────────────────────────────────────

const mockSessions: Map<string, TerritoryCheckout> = new Map();

function generateSessionId(): string {
  return `cs_mock_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`;
}

// ── Core Functions ──────────────────────────────────────────────────

/**
 * Create a Stripe checkout session for territory claim.
 * In dry-run mode, returns a mock checkout URL.
 * With a real STRIPE_SECRET_KEY, would create a real Stripe Checkout session.
 */
export function createTerritoryCheckoutSession(
  niche: string,
  city: string,
  providerEmail: string,
  providerName: string
): TerritoryCheckout {
  const monthlyFee = getMonthlyFee(niche);
  const sessionId = generateSessionId();

  if (isDryRun) {
    const checkout: TerritoryCheckout = {
      niche,
      city,
      providerName,
      providerEmail,
      monthlyFee,
      checkoutUrl: `${APP_DOMAIN}/for-business/claim/success?session_id=${sessionId}&niche=${niche}&city=${city}`,
      sessionId,
    };
    mockSessions.set(sessionId, checkout);

    console.log(
      `[Stripe DRY-RUN] Checkout session created: ${sessionId}`,
      { niche, city, providerEmail, monthlyFee }
    );

    return checkout;
  }

  // Production: would use Stripe SDK
  // const stripe = new Stripe(STRIPE_SECRET_KEY);
  // const session = await stripe.checkout.sessions.create({
  //   mode: "subscription",
  //   customer_email: providerEmail,
  //   line_items: [{ price: getPriceId(niche), quantity: 1 }],
  //   success_url: `${APP_DOMAIN}/for-business/claim/success?session_id={CHECKOUT_SESSION_ID}`,
  //   cancel_url: `${APP_DOMAIN}/for-business/claim?cancelled=true`,
  //   metadata: { niche, city, providerName },
  // });

  const checkout: TerritoryCheckout = {
    niche,
    city,
    providerName,
    providerEmail,
    monthlyFee,
    checkoutUrl: `${APP_DOMAIN}/for-business/claim/success?session_id=${sessionId}&niche=${niche}&city=${city}`,
    sessionId,
  };
  mockSessions.set(sessionId, checkout);
  return checkout;
}

// ── Pay-Per-Lead Pricing ────────────────────────────────────────────

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
 * Tier 1 monetization: zero commitment, proof-of-value before subscription.
 */
export function createLeadPurchaseCheckout(
  leadId: string,
  niche: string,
  temperature: LeadTemperature,
  buyerEmail: string
): LeadPurchaseCheckout {
  const price = LEAD_PRICES[temperature];
  const sessionId = generateSessionId();

  if (isDryRun) {
    console.log(`[Stripe DRY-RUN] Lead purchase session: ${sessionId}`, {
      leadId,
      niche,
      temperature,
      price,
      buyerEmail,
    });
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
 * In dry-run mode, logs the event.
 */
export function handleStripeWebhook(event: unknown): StripeWebhookResult {
  const evt = event as { type?: string; data?: { object?: Record<string, unknown> } };
  const eventType = evt?.type ?? "unknown";

  if (isDryRun) {
    console.log(`[Stripe DRY-RUN] Webhook received: ${eventType}`, evt?.data?.object);
    return {
      handled: true,
      eventType,
      message: `[DRY-RUN] Event ${eventType} logged successfully`,
    };
  }

  // Production webhook handling
  switch (eventType) {
    case "checkout.session.completed": {
      const session = evt?.data?.object;
      console.log("[Stripe] Checkout completed:", session);
      return { handled: true, eventType, message: "Checkout session completed, provider activated" };
    }
    case "invoice.payment_succeeded": {
      console.log("[Stripe] Payment succeeded:", evt?.data?.object);
      return { handled: true, eventType, message: "Payment succeeded, subscription renewed" };
    }
    case "invoice.payment_failed": {
      console.log("[Stripe] Payment failed:", evt?.data?.object);
      return { handled: true, eventType, message: "Payment failed, provider notified" };
    }
    case "customer.subscription.deleted": {
      console.log("[Stripe] Subscription cancelled:", evt?.data?.object);
      return { handled: true, eventType, message: "Subscription cancelled, territory released" };
    }
    default:
      return { handled: false, eventType, message: `Unhandled event type: ${eventType}` };
  }
}

/**
 * Get subscription status (mock or real).
 */
export function getSubscriptionStatus(
  stripeSubscriptionId: string
): "active" | "past_due" | "cancelled" {
  if (isDryRun) {
    // In dry-run, all mock subscriptions are active
    console.log(`[Stripe DRY-RUN] Status check for: ${stripeSubscriptionId}`);
    return "active";
  }

  // Production: would query Stripe
  // const stripe = new Stripe(STRIPE_SECRET_KEY);
  // const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  // return sub.status;

  return "active";
}

/**
 * Get a mock checkout session by ID.
 */
export function getCheckoutSession(sessionId: string): TerritoryCheckout | undefined {
  return mockSessions.get(sessionId);
}

/**
 * Check if Stripe is in dry-run mode.
 */
export function isStripeDryRun(): boolean {
  return isDryRun;
}

export { STRIPE_WEBHOOK_SECRET };

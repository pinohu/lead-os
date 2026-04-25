// ── Stripe Billing Portal ─────────────────────────────────────────────
// POST /api/billing/portal — Creates a Stripe Customer Portal session
// Providers can manage their subscription, update payment, cancel, etc.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { logger } from "@/lib/logger";
import { cityConfig } from "@/lib/city-config";

export async function POST(req: NextRequest) {
  if (!isFeatureEnabled("stripe_billing_portal")) {
    return NextResponse.json(
      { success: false, error: "Billing portal is not yet available" },
      { status: 503 }
    );
  }

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (!user?.providerId) {
      return NextResponse.json(
        { success: false, error: "No provider linked to this account" },
        { status: 403 }
      );
    }

    const provider = await prisma.provider.findUnique({
      where: { id: user.providerId },
    });
    if (!provider?.stripeCustomerId) {
      return NextResponse.json(
        { success: false, error: "No Stripe customer found. Contact support." },
        { status: 404 }
      );
    }

    // Dynamic import to avoid loading Stripe when not needed
    const stripe = (await import("stripe")).default;
    const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY!);

    // Use the server-configured canonical URL, NOT the incoming Host header.
    // The Host header is attacker-controlled (e.g. via a misconfigured proxy
    // or a crafted request) — reflecting it into Stripe's return_url would
    // let an attacker cause the billing portal to redirect users to a
    // phishing site after they finish managing their subscription.
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${cityConfig.domain}`;
    const portalSession = await stripeClient.billingPortal.sessions.create({
      customer: provider.stripeCustomerId,
      return_url: `${siteUrl}/dashboard/settings`,
    });

    return NextResponse.json({
      success: true,
      url: portalSession.url,
    });
  } catch (err) {
    logger.error("/api/billing/portal", "Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to create billing portal session" },
      { status: 500 }
    );
  }
}

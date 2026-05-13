import { NextRequest, NextResponse } from "next/server";
import { createProvider } from "@/lib/provider-store";
import {
  createTerritoryCheckoutSession,
  getTieredMonthlyFee,
} from "@/lib/stripe-integration";
import { getNicheBySlug } from "@/lib/niches";
import { cityConfig } from "@/lib/city-config";
import { ClaimRequestSchema, formatZodErrors, MAX_BODY_SIZE } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { recordRevenueActionPlan } from "@/lib/revenue-actions";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    // ── Rate limit: 3 claims per hour per IP ─────────────────────
    const rateLimited = await checkRateLimit(req, "claim");
    if (rateLimited) return rateLimited;

    // ── Body size check ──────────────────────────────────────────
    const contentLength = parseInt(req.headers.get("content-length") ?? "0", 10);
    if (contentLength > MAX_BODY_SIZE) {
      return NextResponse.json(
        { success: false, error: "Request body too large" },
        { status: 413 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    // ── Zod validation (sanitizes + normalizes) ──────────────────
    const parsed = ClaimRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: formatZodErrors(parsed.error) },
        { status: 400 }
      );
    }

    const { niche, tier, providerName, providerEmail, phone, password, description, license, listingId } = parsed.data;

    const nicheData = getNicheBySlug(niche);
    if (!nicheData) {
      return NextResponse.json(
        { success: false, error: `Invalid niche: ${niche}` },
        { status: 400 }
      );
    }

    // ── Check territory is not already claimed ───────────────────
    const existingTerritory = await prisma.territory.findFirst({
      where: { niche, city: cityConfig.slug, deactivatedAt: null },
    });
    if (existingTerritory) {
      return NextResponse.json(
        { success: false, error: "This territory is already claimed. Select a different category or contact us about waitlist options." },
        { status: 409 }
      );
    }

    const pendingClaim = await prisma.checkoutSession.findFirst({
      where: {
        sessionType: "territory_claim",
        niche,
        city: cityConfig.slug,
        status: "pending",
        expiresAt: { gt: new Date() },
        providerEmail: { not: providerEmail },
      },
    });
    if (pendingClaim) {
      return NextResponse.json(
        { success: false, error: "This territory is currently reserved by another checkout. Try again later or contact us about waitlist options." },
        { status: 409 }
      );
    }

    // ── If claiming a listing, validate it exists and isn't already claimed ──
    let listing: { id: string; email: string | null; website: string | null; phone: string | null } | null = null;
    if (listingId) {
      listing = await prisma.directoryListing.findUnique({
        where: { id: listingId },
        select: { id: true, email: true, website: true, phone: true },
      });
      if (!listing) {
        return NextResponse.json(
          { success: false, error: "Listing not found." },
          { status: 404 }
        );
      }
      // Check if listing is already claimed by a paid provider.
      // Unpaid checkout attempts must not lock the real owner out.
      const alreadyClaimed = await prisma.provider.findFirst({
        where: {
          claimedListingId: listingId,
          subscriptionStatus: { in: ["active", "past_due"] },
        },
      });
      if (alreadyClaimed) {
        return NextResponse.json(
          { success: false, error: "This listing has already been claimed." },
          { status: 409 }
        );
      }
    }

    // ── Determine initial verification status ────────────────────
    // Auto-verify if claimant's email domain matches listing's website domain
    let initialVerificationStatus: "unverified" | "auto_verified" = "unverified";
    if (listing?.website) {
      try {
        const listingDomain = new URL(listing.website).hostname.replace(/^www\./, "");
        const claimantDomain = providerEmail.split("@")[1]?.toLowerCase();
        if (listingDomain && claimantDomain && listingDomain === claimantDomain) {
          initialVerificationStatus = "auto_verified";
        }
      } catch {
        // Invalid URL, skip auto-verify
      }
    }

    // ── Hash password for dashboard login ────────────────────────
    const passwordHash = await bcrypt.hash(password, 12);

    // ── Create Provider Profile ───────────────────────────────────
    const provider = await createProvider({
      slug: "",
      businessName: providerName,
      niche,
      city: cityConfig.slug,
      phone,
      email: providerEmail,
      address: { street: "", city: cityConfig.name, state: cityConfig.stateCode, zip: "" },
      serviceAreas: cityConfig.serviceArea.slice(0, 5),
      description: description ?? `${providerName} provides ${nicheData.label} services in ${cityConfig.name}, PA.`,
      yearEstablished: new Date().getFullYear(),
      employeeCount: "1-5",
      license: license ?? undefined,
      insurance: true,
      serviceTier: tier,
      tier: tier === "elite" ? "primary" : tier === "premium" ? "primary" : "primary",
      subscriptionStatus: "trial",
      monthlyFee: getTieredMonthlyFee(niche, tier),
      totalLeads: 0,
      convertedLeads: 0,
      avgResponseTime: 0,
      avgRating: 0,
      reviewCount: 0,
      lastLeadAt: undefined,
    });

    // ── Store password hash, ToS, verification status, and listing link ──
    await prisma.provider.update({
      where: { id: provider.id },
      data: {
        passwordHash,
        tosAcceptedAt: new Date(),
        verificationStatus: initialVerificationStatus,
        claimedListingId: listing?.id ?? null,
      },
    });

    // ── Link the directory listing to this provider ──────────────
    // ── Create Stripe Checkout Session ────────────────────────────
    const checkout = await createTerritoryCheckoutSession(
      niche,
      cityConfig.slug,
      providerEmail,
      providerName,
      tier,
      provider.id
    );
    const actionPlanResult = await recordRevenueActionPlan({
      sourceSystem: "stripe",
      eventType: "stripe.checkout.started",
      offerSlug: "territory-claim",
      offerTitle: `${nicheData.label} territory claim`,
      customerId: provider.id,
      customerEmail: providerEmail,
      serviceSlug: niche,
      serviceLabel: nicheData.label,
      serviceFamily: "provider-territory",
      sourcePage: "/for-business/claim",
      sourcePageType: "provider_claim_checkout",
      orderId: checkout.sessionId,
      amountCents: checkout.monthlyFee * 100,
      metadata: {
        providerId: provider.id,
        providerSlug: provider.slug,
        providerName,
        city: cityConfig.slug,
        tier,
        listingId: listingId ?? null,
        checkoutEngine: "stripe_legacy",
      },
    }).catch((error) => {
      logger.error("/api/claim", "Failed to create revenue action plan for territory claim checkout", error);
      return null;
    });

    return NextResponse.json({
      success: true,
      providerId: provider.id,
      providerSlug: provider.slug,
      checkoutUrl: checkout.checkoutUrl,
      sessionId: checkout.sessionId,
      monthlyFee: checkout.monthlyFee,
      serviceTier: tier,
      actionPlan: actionPlanResult?.plan ?? null,
    });
  } catch (err) {
    logger.error("/api/claim", "Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

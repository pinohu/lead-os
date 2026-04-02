import { NextRequest, NextResponse } from "next/server";
import { createProvider } from "@/lib/provider-store";
import {
  createTerritoryCheckoutSession,
  getMonthlyFee,
} from "@/lib/stripe-integration";
import { getNicheBySlug } from "@/lib/niches";
import { cityConfig } from "@/lib/city-config";
import { ClaimRequestSchema, formatZodErrors, MAX_BODY_SIZE } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
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

    const { niche, tier, providerName, providerEmail, phone, password, description, license } = parsed.data;

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
      tier: tier === "elite" ? "primary" : tier === "premium" ? "primary" : "primary",
      subscriptionStatus: "trial",
      monthlyFee: getMonthlyFee(niche),
      totalLeads: 0,
      convertedLeads: 0,
      avgResponseTime: 0,
      avgRating: 0,
      reviewCount: 0,
      lastLeadAt: undefined,
    });

    // ── Store password hash + ToS acceptance on the provider profile ──
    await prisma.provider.update({
      where: { id: provider.id },
      data: { passwordHash, tosAcceptedAt: new Date() },
    });

    // ── Create Stripe Checkout Session ────────────────────────────
    const checkout = await createTerritoryCheckoutSession(
      niche,
      cityConfig.slug,
      providerEmail,
      providerName
    );

    return NextResponse.json({
      success: true,
      providerId: provider.id,
      providerSlug: provider.slug,
      checkoutUrl: checkout.checkoutUrl,
      sessionId: checkout.sessionId,
      monthlyFee: checkout.monthlyFee,
    });
  } catch (err) {
    logger.error("/api/claim", "Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

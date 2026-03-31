import { NextRequest, NextResponse } from "next/server";
import { createProvider } from "@/lib/provider-store";
import {
  createTerritoryCheckoutSession,
  getMonthlyFee,
} from "@/lib/stripe-integration";
import { getNicheBySlug } from "@/lib/niches";
import { cityConfig } from "@/lib/city-config";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { niche, providerName, providerEmail, phone, description, license } =
      body as {
        niche?: string;
        providerName?: string;
        providerEmail?: string;
        phone?: string;
        description?: string;
        license?: string;
      };

    // ── Validation ────────────────────────────────────────────────
    if (!niche || !providerName || !providerEmail || !phone) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: niche, providerName, providerEmail, phone",
        },
        { status: 400 }
      );
    }

    const nicheData = getNicheBySlug(niche);
    if (!nicheData) {
      return NextResponse.json(
        { success: false, error: `Invalid niche: ${niche}` },
        { status: 400 }
      );
    }

    // ── Create Provider Profile ───────────────────────────────────
    const provider = createProvider({
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
      tier: "primary",
      subscriptionStatus: "trial",
      monthlyFee: getMonthlyFee(niche),
      totalLeads: 0,
      convertedLeads: 0,
      avgResponseTime: 0,
      avgRating: 0,
      reviewCount: 0,
      lastLeadAt: undefined,
    });

    // ── Create Stripe Checkout Session ────────────────────────────
    const checkout = createTerritoryCheckoutSession(
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
    console.error("[/api/claim] Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

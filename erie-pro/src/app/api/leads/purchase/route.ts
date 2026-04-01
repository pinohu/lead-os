import { NextRequest, NextResponse } from "next/server";
import { getNicheBySlug } from "@/lib/niches";
import { getUnmatchedLeadsForNiche } from "@/lib/lead-routing";
import {
  createLeadPurchaseCheckout,
  LEAD_PRICES,
  type LeadTemperature,
} from "@/lib/stripe-integration";

/**
 * POST /api/leads/purchase
 *
 * Tier 1 monetization: sell a single banked lead to a buyer.
 * No subscription required — proof of value before commitment.
 *
 * Body:
 * {
 *   niche: string
 *   buyerEmail: string
 *   temperature?: LeadTemperature   // defaults to "warm"
 *   leadId?: string                 // specific lead, or we pick the newest
 * }
 *
 * Response:
 * {
 *   success: true
 *   checkoutUrl: string
 *   sessionId: string
 *   price: number
 *   leadId: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { niche, buyerEmail, temperature = "warm", leadId: requestedLeadId } =
      body as {
        niche?: string;
        buyerEmail?: string;
        temperature?: LeadTemperature;
        leadId?: string;
      };

    // ── Validation ────────────────────────────────────────────────
    if (!niche || !buyerEmail) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: niche, buyerEmail" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(buyerEmail)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (!getNicheBySlug(niche)) {
      return NextResponse.json(
        { success: false, error: `Unknown niche: ${niche}` },
        { status: 400 }
      );
    }

    const validTemperatures: LeadTemperature[] = ["cold", "warm", "hot", "burning"];
    if (!validTemperatures.includes(temperature)) {
      return NextResponse.json(
        { success: false, error: "temperature must be cold, warm, hot, or burning" },
        { status: 400 }
      );
    }

    // ── Find a banked lead to sell ────────────────────────────────
    const banked = getUnmatchedLeadsForNiche(niche);
    if (banked.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No banked leads available in this category right now. Check back soon or claim the territory for ongoing lead flow.",
        },
        { status: 404 }
      );
    }

    // Use the requested lead ID or pick the most recent
    const lead = requestedLeadId
      ? banked.find((l) => l.leadId === requestedLeadId) ?? banked[0]
      : banked[0];

    // ── Create checkout ───────────────────────────────────────────
    const checkout = createLeadPurchaseCheckout(
      lead.leadId,
      niche,
      temperature,
      buyerEmail
    );

    return NextResponse.json({
      success: true,
      checkoutUrl: checkout.checkoutUrl,
      sessionId: checkout.sessionId,
      price: checkout.price,
      leadId: checkout.leadId,
      temperature,
      remainingBanked: banked.length - 1,
      upgradeHint:
        banked.length >= 3
          ? `You have ${banked.length} leads waiting. Claiming the territory gives you all of them plus ongoing exclusivity from $${Math.round(LEAD_PRICES[temperature] * 4)}/mo.`
          : null,
    });
  } catch (err) {
    console.error("[/api/leads/purchase] Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/leads/purchase?niche=roofing
 *
 * Preview available lead counts and pricing without committing.
 * Used by the directory page to render the pay-per-lead CTA.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const niche = searchParams.get("niche");

  if (!niche || !getNicheBySlug(niche)) {
    return NextResponse.json(
      { success: false, error: "Missing or invalid niche" },
      { status: 400 }
    );
  }

  const banked = getUnmatchedLeadsForNiche(niche);

  return NextResponse.json({
    niche,
    availableLeads: banked.length,
    pricing: LEAD_PRICES,
    canPurchase: banked.length > 0,
  });
}

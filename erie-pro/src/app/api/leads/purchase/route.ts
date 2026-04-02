import { NextRequest, NextResponse } from "next/server";
import { getUnmatchedLeadsForNiche } from "@/lib/lead-routing";
import {
  createLeadPurchaseCheckout,
  LEAD_PRICES,
} from "@/lib/stripe-integration";
import { getNicheBySlug } from "@/lib/niches";
import { LeadPurchaseRequestSchema, formatZodErrors, MAX_BODY_SIZE } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

/**
 * POST /api/leads/purchase
 *
 * Tier 1 monetization: sell a single banked lead to a buyer.
 * No subscription required — proof of value before commitment.
 */
export async function POST(req: NextRequest) {
  try {
    // ── Rate limit: 10 purchases per minute per IP ───────────────
    const rateLimited = await checkRateLimit(req, "leadPurchase");
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

    // ── Zod validation (sanitizes + normalizes email) ────────────
    const parsed = LeadPurchaseRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: formatZodErrors(parsed.error) },
        { status: 400 }
      );
    }

    const { niche, buyerEmail, temperature, leadId: requestedLeadId } = parsed.data;

    // ── Find a banked lead to sell ────────────────────────────────
    const banked = await getUnmatchedLeadsForNiche(niche);
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
    const checkout = await createLeadPurchaseCheckout(
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
    logger.error("/api/leads/purchase", "Error:", err);
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
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const niche = searchParams.get("niche");

    if (!niche || !getNicheBySlug(niche)) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid niche" },
        { status: 400 }
      );
    }

    const banked = await getUnmatchedLeadsForNiche(niche);

    return NextResponse.json({
      success: true,
      niche,
      availableLeads: banked.length,
      pricing: LEAD_PRICES,
      canPurchase: banked.length > 0,
    });
  } catch (err) {
    logger.error("/api/leads/purchase GET", "Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

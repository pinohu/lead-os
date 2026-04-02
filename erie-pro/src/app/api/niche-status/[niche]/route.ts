import { NextRequest, NextResponse } from "next/server";
import { getNicheBySlug } from "@/lib/niches";
import { getProviderByNicheAndCity } from "@/lib/provider-store";
import { getBankedLeadsByNiche } from "@/lib/lead-routing";
import { getMonthlyFee } from "@/lib/stripe-integration";
import { cityConfig } from "@/lib/city-config";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

type Props = { params: Promise<{ niche: string }> };

/**
 * GET /api/niche-status/[niche]
 *
 * Returns territory claim status and banked lead count for a niche.
 * Used by the directory page and claim form to surface urgency.
 */
export async function GET(req: NextRequest, { params }: Props) {
  try {
    // Rate limit: 10 requests per minute per IP
    const rateLimited = await checkRateLimit(req, "leadPurchase");
    if (rateLimited) return rateLimited;

    const { niche: slug } = await params;

    const niche = getNicheBySlug(slug);
    if (!niche) {
      return NextResponse.json({ success: false, error: "Unknown niche" }, { status: 404 });
    }

    const provider = await getProviderByNicheAndCity(slug, cityConfig.slug);
    const bankedLeads = await getBankedLeadsByNiche(slug);
    const monthlyFee = getMonthlyFee(slug);

    const urgency =
      bankedLeads >= 10 ? "high" : bankedLeads >= 3 ? "medium" : "low";

    // Return limited info to unauthenticated callers (Phase 2.15 — reduce info leakage)
    return NextResponse.json({
      success: true,
      niche: slug,
      label: niche.label,
      claimed: provider !== undefined,
      bankedLeads,
      monthlyFee,
      urgency,
    });
  } catch (err) {
    logger.error("/api/niche-status", "Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

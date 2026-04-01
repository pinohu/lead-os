import { NextResponse } from "next/server";
import { getNicheBySlug } from "@/lib/niches";
import { getProviderByNicheAndCity } from "@/lib/provider-store";
import { getBankedLeadsByNiche } from "@/lib/lead-routing";
import { getMonthlyFee } from "@/lib/stripe-integration";
import { cityConfig } from "@/lib/city-config";

type Props = { params: Promise<{ niche: string }> };

/**
 * GET /api/niche-status/[niche]
 *
 * Returns territory claim status and banked lead count for a niche.
 * Used by the directory page and claim form to surface urgency.
 *
 * Response shape:
 * {
 *   niche: string
 *   claimed: boolean
 *   claimedBy: string | null       // business name if claimed
 *   bankedLeads: number            // unmatched leads waiting for a provider
 *   monthlyFee: number             // subscription price for this niche
 *   urgency: "high" | "medium" | "low"
 * }
 */
export async function GET(_req: Request, { params }: Props) {
  const { niche: slug } = await params;

  const niche = getNicheBySlug(slug);
  if (!niche) {
    return NextResponse.json({ error: "Unknown niche" }, { status: 404 });
  }

  const provider = getProviderByNicheAndCity(slug, cityConfig.slug);
  const bankedLeads = getBankedLeadsByNiche(slug);
  const monthlyFee = getMonthlyFee(slug);

  const urgency =
    bankedLeads >= 10 ? "high" : bankedLeads >= 3 ? "medium" : "low";

  return NextResponse.json({
    niche: slug,
    label: niche.label,
    claimed: provider !== undefined,
    claimedBy: provider?.businessName ?? null,
    bankedLeads,
    monthlyFee,
    urgency,
  });
}

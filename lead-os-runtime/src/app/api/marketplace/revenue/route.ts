import { NextResponse } from "next/server";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getRevenueByNiche, getMarketplaceStats } from "@/lib/marketplace";

export async function GET(request: Request) {
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const url = new URL(request.url);
    const since = url.searchParams.get("since") ?? undefined;
    const niche = url.searchParams.get("niche") ?? undefined;

    const byNiche = await getRevenueByNiche(since);
    const stats = await getMarketplaceStats();

    let filteredByNiche = byNiche;
    if (niche) {
      filteredByNiche = byNiche[niche] ? { [niche]: byNiche[niche] } : {};
    }

    let total = 0;
    let leadsSold = 0;
    for (const entry of Object.values(filteredByNiche)) {
      total += entry.revenue;
      leadsSold += entry.count;
    }

    return NextResponse.json({
      data: {
        byNiche: filteredByNiche,
        total,
        leadsSold,
        avgPrice: leadsSold > 0 ? Math.round(total / leadsSold) : 0,
      },
      error: null,
      meta: null,
    });
  } catch (error) {
    return NextResponse.json(
      { data: null, error: { code: "INTERNAL_ERROR", message: error instanceof Error ? error.message : "Failed to fetch revenue" }, meta: null },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { getNicheInsights, identifyBluOceanNiche } from "@/lib/data-moat";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(request.headers.get("origin")) });
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const url = new URL(request.url);
    const mode = url.searchParams.get("mode") ?? "insights";

    if (mode === "blue-ocean") {
      const nichesRaw = url.searchParams.get("niches");
      if (!nichesRaw) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "niches query parameter is required for blue-ocean mode" }, meta: null },
          { status: 400, headers },
        );
      }

      const niches = nichesRaw.split(",").map((n) => n.trim()).filter(Boolean);
      const nicheData = niches.map((niche) => {
        const insights = getNicheInsights(niche);
        return {
          niche,
          conversionRate: 0,
          tenantCount: insights.tenantCount,
          avgLeadValue: insights.avgLeadValue,
        };
      });

      const blueOcean = identifyBluOceanNiche(nicheData);
      return NextResponse.json({ data: blueOcean, error: null, meta: { nicheCount: niches.length } }, { headers });
    }

    const niche = url.searchParams.get("niche");
    if (!niche) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "niche query parameter is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const insights = getNicheInsights(niche);
    return NextResponse.json({ data: insights, error: null, meta: null }, { headers });
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "INSIGHTS_FAILED", message: "Failed to retrieve insights" }, meta: null },
      { status: 500, headers },
    );
  }
}

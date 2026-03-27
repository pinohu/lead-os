import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { getOfferTemplates, ALL_NICHES, type Niche } from "@/lib/offer-engine";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const url = new URL(request.url);
    const nicheParam = url.searchParams.get("niche");

    let filterNiche: Niche | undefined;
    if (nicheParam) {
      if (!ALL_NICHES.includes(nicheParam as Niche)) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: `niche must be one of: ${ALL_NICHES.join(", ")}` }, meta: null },
          { status: 400, headers },
        );
      }
      filterNiche = nicheParam as Niche;
    }

    const templates = getOfferTemplates(filterNiche);

    return NextResponse.json(
      {
        data: templates,
        error: null,
        meta: { count: templates.length, availableNiches: ALL_NICHES },
      },
      { headers },
    );
  } catch (err) {
    return NextResponse.json(
      {
        data: null,
        error: { code: "TEMPLATES_FETCH_FAILED", message: err instanceof Error ? err.message : "Failed to fetch templates" },
        meta: null,
      },
      { status: 500, headers },
    );
  }
}

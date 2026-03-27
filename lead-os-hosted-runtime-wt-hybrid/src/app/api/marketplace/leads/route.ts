import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { listMarketplaceLeads } from "@/lib/marketplace-store";
import { publishLeadToMarketplace } from "@/lib/marketplace";
import type { Temperature } from "@/lib/marketplace-store";

const VALID_TEMPERATURES = new Set<string>(["cold", "warm", "hot", "burning"]);
const VALID_STATUSES = new Set<string>(["available", "claimed", "sold", "expired"]);

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
    const niche = url.searchParams.get("niche") ?? undefined;
    const temperature = url.searchParams.get("temperature") ?? undefined;
    const status = url.searchParams.get("status") ?? undefined;
    const minPrice = url.searchParams.get("minPrice");
    const maxPrice = url.searchParams.get("maxPrice");
    const limit = url.searchParams.get("limit");
    const offset = url.searchParams.get("offset");

    if (temperature && !VALID_TEMPERATURES.has(temperature)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid temperature value" }, meta: null },
        { status: 400, headers },
      );
    }
    if (status && !VALID_STATUSES.has(status)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid status value" }, meta: null },
        { status: 400, headers },
      );
    }

    const { leads, total } = await listMarketplaceLeads({
      niche,
      temperature: temperature as Temperature | undefined,
      status: status as "available" | "claimed" | "sold" | "expired" | undefined,
      minPrice: minPrice ? parseInt(minPrice, 10) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : 20,
      offset: offset ? parseInt(offset, 10) : 0,
    });

    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;

    return NextResponse.json({
      data: leads,
      error: null,
      meta: {
        total,
        hasMore: parsedOffset + parsedLimit < total,
        limit: parsedLimit,
        offset: parsedOffset,
      },
    }, { headers });
  } catch (error) {
    return NextResponse.json(
      { data: null, error: { code: "INTERNAL_ERROR", message: error instanceof Error ? error.message : "Failed to list leads" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const body = await request.json();

    const { leadKey, tenantId, niche, score, temperature, city, state, industry, contactFields, firstName, service } = body;

    if (!leadKey || typeof leadKey !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "leadKey is required" }, meta: null },
        { status: 400, headers },
      );
    }
    if (!tenantId || typeof tenantId !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId is required" }, meta: null },
        { status: 400, headers },
      );
    }
    if (!niche || typeof niche !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "niche is required" }, meta: null },
        { status: 400, headers },
      );
    }
    if (typeof score !== "number" || score < 0 || score > 100) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "score must be a number between 0 and 100" }, meta: null },
        { status: 400, headers },
      );
    }
    if (!temperature || !VALID_TEMPERATURES.has(temperature)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "temperature must be cold, warm, hot, or burning" }, meta: null },
        { status: 400, headers },
      );
    }

    const lead = await publishLeadToMarketplace(leadKey, tenantId, {
      firstName,
      niche,
      score,
      temperature: temperature as Temperature,
      city,
      state,
      industry,
      service,
      contactFields,
    });

    return NextResponse.json({ data: lead, error: null, meta: null }, { status: 201, headers });
  } catch (error) {
    return NextResponse.json(
      { data: null, error: { code: "INTERNAL_ERROR", message: error instanceof Error ? error.message : "Failed to publish lead" }, meta: null },
      { status: 500, headers },
    );
  }
}

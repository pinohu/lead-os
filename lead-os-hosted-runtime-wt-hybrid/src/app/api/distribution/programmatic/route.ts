import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { generateProgrammaticPages, listProgrammaticPages } from "@/lib/distribution-engine";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const body = await request.json();
    const { niche, locations } = body as {
      niche?: string;
      locations?: string[];
    };

    if (!niche || !locations || !Array.isArray(locations) || locations.length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "niche and locations array are required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (locations.length > 100) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Maximum 100 locations per batch" }, meta: null },
        { status: 400, headers },
      );
    }

    const pages = await generateProgrammaticPages(niche, locations);

    return NextResponse.json(
      { data: pages, error: null, meta: { count: pages.length, niche } },
      { status: 201, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "GENERATION_FAILED", message: "Failed to generate programmatic pages" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? undefined;
    const pages = listProgrammaticPages(tenantId);

    return NextResponse.json(
      { data: pages, error: null, meta: { count: pages.length } },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to list programmatic pages" }, meta: null },
      { status: 500, headers },
    );
  }
}

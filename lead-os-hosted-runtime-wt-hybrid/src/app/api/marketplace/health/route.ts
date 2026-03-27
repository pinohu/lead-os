import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { getMarketplaceHealthScore } from "@/lib/marketplace-growth";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const health = getMarketplaceHealthScore();

    return NextResponse.json(
      {
        data: { health },
        error: null,
        meta: null,
      },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch marketplace health" }, meta: null },
      { status: 500, headers },
    );
  }
}

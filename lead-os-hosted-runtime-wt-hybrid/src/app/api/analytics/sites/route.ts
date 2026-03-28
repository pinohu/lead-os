import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { listSites } from "@/lib/integrations/umami-adapter";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const sites = await listSites(tenantId);

    return NextResponse.json(
      { data: { sites }, error: null, meta: { count: sites.length } },
      { status: 200, headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list sites";
    return NextResponse.json(
      { data: null, error: { code: "LIST_SITES_FAILED", message }, meta: null },
      { status: 500, headers },
    );
  }
}

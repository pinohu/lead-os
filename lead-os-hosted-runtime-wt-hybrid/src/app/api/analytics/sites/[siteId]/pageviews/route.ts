import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { getPageviews } from "@/lib/integrations/umami-adapter";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ siteId: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const { siteId } = await params;
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = searchParams.get("endDate") ?? new Date().toISOString();

    const data = await getPageviews(siteId, { startDate, endDate });

    return NextResponse.json(
      { data, error: null, meta: null },
      { status: 200, headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch pageviews";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json(
      { data: null, error: { code: status === 404 ? "NOT_FOUND" : "FETCH_FAILED", message }, meta: null },
      { status, headers },
    );
  }
}

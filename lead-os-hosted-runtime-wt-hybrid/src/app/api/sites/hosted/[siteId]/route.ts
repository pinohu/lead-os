import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { getSite } from "@/lib/integrations/hosted-runtime-adapter";

export const dynamic = "force-dynamic";

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
  const { siteId } = await params;

  try {
    const site = await getSite(siteId);
    return NextResponse.json(
      { data: site, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: err instanceof Error ? err.message : "Site not found" }, meta: null },
      { status: 404, headers },
    );
  }
}

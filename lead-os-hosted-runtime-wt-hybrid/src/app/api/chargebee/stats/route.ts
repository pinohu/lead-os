import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getMRRStats } from "@/lib/integrations/chargebee-adapter";

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? undefined;
    const stats = await getMRRStats(tenantId);

    return NextResponse.json(
      { data: stats, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch billing stats";
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message }, meta: null },
      { status: 500, headers },
    );
  }
}

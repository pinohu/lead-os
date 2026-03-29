import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getChannelPerformance } from "@/lib/integrations/owox-adapter";

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? undefined;

    const channels = await getChannelPerformance(tenantId);

    return NextResponse.json(
      { data: channels, error: null, meta: { count: channels.length } },
      { headers },
    );
  } catch (err) {
    console.error("[owox/channels GET]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch channel performance" }, meta: null },
      { status: 500, headers },
    );
  }
}

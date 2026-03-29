import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { generateTrackingCode } from "@/lib/integrations/plerdy-adapter";

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { session, response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const siteId = url.searchParams.get("siteId") ?? undefined;

    const code = generateTrackingCode(siteId);

    return NextResponse.json(
      { data: { trackingCode: code }, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    console.error("[plerdy/tracking GET]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to generate tracking code" }, meta: null },
      { status: 500, headers },
    );
  }
}

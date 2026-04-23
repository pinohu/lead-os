import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { generateTrackingSnippet } from "@/lib/integrations/happierleads-adapter";

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const siteId = url.searchParams.get("siteId") ?? undefined;

    const snippet = generateTrackingSnippet(siteId);

    return NextResponse.json(
      { data: snippet, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    logger.error("happierleads/tracking GET failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to generate tracking snippet" }, meta: null },
      { status: 500, headers },
    );
  }
}

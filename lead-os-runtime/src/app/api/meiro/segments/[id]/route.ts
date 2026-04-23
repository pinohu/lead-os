import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getSegmentProfiles } from "@/lib/integrations/meiro-cdp-adapter";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const profiles = await getSegmentProfiles(id);

    return NextResponse.json(
      { data: profiles, error: null, meta: { count: profiles.length } },
      { headers },
    );
  } catch (err) {
    logger.error("[meiro/segments/[id] GET]", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch segment profiles" }, meta: null },
      { status: 500, headers },
    );
  }
}

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
    console.error("[meiro/segments/[id] GET]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch segment profiles" }, meta: null },
      { status: 500, headers },
    );
  }
}

import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getProfile } from "@/lib/integrations/meiro-cdp-adapter";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const profile = await getProfile(id);

    if (!profile) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Profile not found" }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: profile, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    logger.error("[meiro/profiles/[id] GET]", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch profile" }, meta: null },
      { status: 500, headers },
    );
  }
}

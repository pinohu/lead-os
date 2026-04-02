import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getCall } from "@/lib/integrations/callscaler-adapter";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const call = await getCall(id);

    if (!call) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: `Call ${id} not found` }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: call, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    logger.error("[callscaler/calls/[id] GET]", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch call" }, meta: null },
      { status: 500, headers },
    );
  }
}

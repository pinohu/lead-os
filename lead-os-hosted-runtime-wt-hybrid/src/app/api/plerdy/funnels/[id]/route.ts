import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getFunnelAnalytics } from "@/lib/integrations/plerdy-adapter";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { session, response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const funnel = await getFunnelAnalytics(id);

    if (!funnel) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Funnel not found" }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: funnel, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    console.error("[plerdy/funnels/[id] GET]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch funnel analytics" }, meta: null },
      { status: 500, headers },
    );
  }
}

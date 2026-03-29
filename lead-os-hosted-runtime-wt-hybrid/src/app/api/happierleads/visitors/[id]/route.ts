import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getVisitorDetail } from "@/lib/integrations/happierleads-adapter";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const visitor = await getVisitorDetail(id);

    if (!visitor) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Visitor not found" }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: visitor, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    console.error("[happierleads/visitors/[id] GET]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch visitor" }, meta: null },
      { status: 500, headers },
    );
  }
}

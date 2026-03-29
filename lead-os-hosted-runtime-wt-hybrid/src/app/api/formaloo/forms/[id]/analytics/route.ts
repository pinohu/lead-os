import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { getFormAnalytics } from "@/lib/integrations/formaloo-adapter";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { id } = await params;

  try {
    const analytics = await getFormAnalytics(id);

    return NextResponse.json(
      { data: analytics, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch analytics";
    const isNotFound = message.includes("not found");

    return NextResponse.json(
      { data: null, error: { code: isNotFound ? "NOT_FOUND" : "ANALYTICS_FAILED", message }, meta: null },
      { status: isNotFound ? 404 : 500, headers },
    );
  }
}

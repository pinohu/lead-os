import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getOptimizationSuggestions } from "@/lib/integrations/markopolo-adapter";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const optimization = await getOptimizationSuggestions(id);

    return NextResponse.json(
      { data: optimization, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    console.error("[markopolo/campaigns/[id]/optimize GET]", err instanceof Error ? err.message : err);
    const message = err instanceof Error ? err.message : "Failed to get optimization suggestions";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json(
      { data: null, error: { code: "OPTIMIZE_FAILED", message }, meta: null },
      { status, headers },
    );
  }
}

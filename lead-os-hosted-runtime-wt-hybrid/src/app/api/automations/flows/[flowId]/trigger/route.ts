import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { triggerFlow } from "@/lib/integrations/activepieces-adapter";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ flowId: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { flowId } = await params;

  try {
    const body = await request.json().catch(() => ({}));
    const data = typeof body === "object" && body !== null ? body : {};
    const run = await triggerFlow(flowId, data as Record<string, unknown>);

    return NextResponse.json(
      { data: run, error: null, meta: null },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "TRIGGER_FAILED", message: `Failed to trigger flow ${flowId}` }, meta: null },
      { status: 500, headers },
    );
  }
}

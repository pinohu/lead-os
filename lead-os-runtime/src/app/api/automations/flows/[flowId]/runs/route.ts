import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { getFlowRuns } from "@/lib/integrations/activepieces-adapter";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ flowId: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { flowId } = await params;

  try {
    const runs = await getFlowRuns(flowId);

    return NextResponse.json(
      { data: runs, error: null, meta: { count: runs.length } },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "LIST_FAILED", message: `Failed to list runs for flow ${flowId}` }, meta: null },
      { status: 500, headers },
    );
  }
}

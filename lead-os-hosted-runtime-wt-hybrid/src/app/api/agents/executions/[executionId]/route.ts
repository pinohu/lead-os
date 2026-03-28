import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { getTaskExecution } from "@/lib/paperclip-orchestrator";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ executionId: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { executionId } = await params;

  try {
    const execution = await getTaskExecution(executionId);
    return NextResponse.json(
      { data: execution, error: null, meta: null },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: `Execution not found: ${executionId}` }, meta: null },
      { status: 404, headers },
    );
  }
}

import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { removeAgent } from "@/lib/paperclip-orchestrator";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ teamId: string; agentId: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { teamId, agentId } = await params;

  try {
    await removeAgent(teamId, agentId);
    return new NextResponse(null, { status: 204, headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to remove agent";
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message }, meta: null },
      { status: 404, headers },
    );
  }
}

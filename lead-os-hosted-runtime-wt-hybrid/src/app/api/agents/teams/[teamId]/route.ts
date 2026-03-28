import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { getAgentTeam, deleteAgentTeam } from "@/lib/paperclip-orchestrator";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { teamId } = await params;

  try {
    const team = await getAgentTeam(teamId);
    return NextResponse.json(
      { data: team, error: null, meta: null },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: `Agent team not found: ${teamId}` }, meta: null },
      { status: 404, headers },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { teamId } = await params;

  try {
    await deleteAgentTeam(teamId);
    return new NextResponse(null, { status: 204, headers });
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: `Agent team not found: ${teamId}` }, meta: null },
      { status: 404, headers },
    );
  }
}

import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { getAgentSpend, getTeamSpend } from "@/lib/paperclip-orchestrator";

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const url = new URL(request.url);
    const agentId = url.searchParams.get("agentId");
    const teamId = url.searchParams.get("teamId");
    const period = url.searchParams.get("period") ?? "30d";

    if (agentId) {
      const data = await getAgentSpend(agentId, period);
      return NextResponse.json({ data, error: null, meta: null }, { headers });
    }

    if (teamId) {
      const data = await getTeamSpend(teamId, period);
      return NextResponse.json({ data, error: null, meta: null }, { headers });
    }

    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: "Provide agentId or teamId" }, meta: null },
      { status: 400, headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch spend report";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json(
      { data: null, error: { code: status === 404 ? "NOT_FOUND" : "FETCH_FAILED", message }, meta: null },
      { status, headers },
    );
  }
}

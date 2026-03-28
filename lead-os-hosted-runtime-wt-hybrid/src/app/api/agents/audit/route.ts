import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import {
  getAuditLog,
  getTeamAuditLog,
  getTenantAuditLog,
  getAuditSummary,
} from "@/lib/agent-audit-log";

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId");
    const teamId = url.searchParams.get("teamId");
    const agentId = url.searchParams.get("agentId");
    const summary = url.searchParams.get("summary") === "true";
    const period = url.searchParams.get("period") ?? "30d";
    const limit = parseInt(url.searchParams.get("limit") ?? "100", 10);
    const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);

    const options = { limit, offset };

    if (summary && tenantId) {
      const data = await getAuditSummary(tenantId, period);
      return NextResponse.json({ data, error: null, meta: null }, { headers });
    }

    if (agentId) {
      const data = await getAuditLog(agentId, options);
      return NextResponse.json(
        { data, error: null, meta: { count: data.length } },
        { headers },
      );
    }

    if (teamId) {
      const data = await getTeamAuditLog(teamId, options);
      return NextResponse.json(
        { data, error: null, meta: { count: data.length } },
        { headers },
      );
    }

    if (tenantId) {
      const data = await getTenantAuditLog(tenantId, options);
      return NextResponse.json(
        { data, error: null, meta: { count: data.length } },
        { headers },
      );
    }

    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: "Provide tenantId, teamId, or agentId" }, meta: null },
      { status: 400, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch audit log" }, meta: null },
      { status: 500, headers },
    );
  }
}

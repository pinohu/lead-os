import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import {
  createAgentTeam,
  listAgentTeams,
} from "@/lib/paperclip-orchestrator";
import { z } from "zod";

const TeamCreateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  tenantId: z.string().min(1).max(100),
  maxBudgetPerDay: z.number().min(0),
  maxConcurrentTasks: z.number().int().min(1).max(100),
});

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId");
    if (!tenantId) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const teams = await listAgentTeams(tenantId);
    return NextResponse.json(
      { data: teams, error: null, meta: { count: teams.length } },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to list agent teams" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const raw = await request.json();
    const validation = TeamCreateSchema.safeParse(raw);
    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: null },
        { status: 422, headers },
      );
    }

    const { tenantId, ...config } = validation.data;
    const team = await createAgentTeam(tenantId, { ...config, tenantId });

    return NextResponse.json(
      { data: team, error: null, meta: null },
      { status: 201, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: "Failed to create agent team" }, meta: null },
      { status: 500, headers },
    );
  }
}

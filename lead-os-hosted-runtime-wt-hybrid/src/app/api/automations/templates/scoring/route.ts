import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { createLeadScoringWorkflow } from "@/lib/integrations/activepieces-adapter";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const body = await request.json();

    if (!body.tenantId || typeof body.tenantId !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const flow = await createLeadScoringWorkflow(body.tenantId);

    return NextResponse.json(
      { data: flow, error: null, meta: null },
      { status: 201, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: "Failed to create scoring workflow" }, meta: null },
      { status: 500, headers },
    );
  }
}

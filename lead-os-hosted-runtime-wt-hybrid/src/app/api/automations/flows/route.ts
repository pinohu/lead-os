import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { createFlow, listFlows } from "@/lib/integrations/activepieces-adapter";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId query parameter is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const flows = await listFlows(tenantId);

    return NextResponse.json(
      { data: flows, error: null, meta: { count: flows.length } },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "LIST_FAILED", message: "Failed to list flows" }, meta: null },
      { status: 500, headers },
    );
  }
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

    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "name is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (!body.trigger || typeof body.trigger !== "object") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "trigger is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (!Array.isArray(body.steps)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "steps array is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const flow = await createFlow(body.tenantId, {
      name: body.name,
      trigger: body.trigger,
      steps: body.steps,
    });

    return NextResponse.json(
      { data: flow, error: null, meta: null },
      { status: 201, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: "Failed to create flow" }, meta: null },
      { status: 500, headers },
    );
  }
}

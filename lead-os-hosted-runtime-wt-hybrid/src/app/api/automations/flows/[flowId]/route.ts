import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { getFlow, toggleFlow, deleteFlow } from "@/lib/integrations/activepieces-adapter";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ flowId: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { flowId } = await params;

  try {
    const flow = await getFlow(flowId);

    return NextResponse.json(
      { data: flow, error: null, meta: null },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: `Flow ${flowId} not found` }, meta: null },
      { status: 404, headers },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ flowId: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { flowId } = await params;

  try {
    const body = await request.json();

    if (typeof body.enabled !== "boolean") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "enabled (boolean) is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const flow = await toggleFlow(flowId, body.enabled);

    return NextResponse.json(
      { data: flow, error: null, meta: null },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "UPDATE_FAILED", message: `Failed to update flow ${flowId}` }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ flowId: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { flowId } = await params;

  try {
    await deleteFlow(flowId);

    return NextResponse.json(
      { data: { deleted: true, flowId }, error: null, meta: null },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "DELETE_FAILED", message: `Failed to delete flow ${flowId}` }, meta: null },
      { status: 500, headers },
    );
  }
}

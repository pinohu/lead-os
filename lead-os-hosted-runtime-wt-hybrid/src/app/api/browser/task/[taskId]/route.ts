import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { getTaskStatus } from "@/lib/integrations/skyvern-adapter";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { taskId } = await params;

  try {
    if (!taskId || taskId.length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "taskId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const task = await getTaskStatus(taskId);
    return NextResponse.json(
      { data: task, error: null, meta: { taskId } },
      { status: 200, headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get task status";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json(
      { data: null, error: { code: status === 404 ? "NOT_FOUND" : "TASK_STATUS_FAILED", message }, meta: null },
      { status, headers },
    );
  }
}

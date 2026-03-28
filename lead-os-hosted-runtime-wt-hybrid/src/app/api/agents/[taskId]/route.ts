import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { getAgentTask, cancelAgentTask } from "@/lib/agent-orchestrator";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { taskId } = await params;

  try {
    const task = getAgentTask(taskId);
    if (!task) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: `Agent task not found: ${taskId}` }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: task, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    console.error("[agents-taskId]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch agent task" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { taskId } = await params;

  try {
    const task = cancelAgentTask(taskId);
    if (!task) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: `Agent task not found: ${taskId}` }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: task, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    console.error("[agents-taskId]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "CANCEL_FAILED", message: "Failed to cancel agent task" }, meta: null },
      { status: 500, headers },
    );
  }
}

import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import {
  createAgentTask,
  runAgentTask,
  listAgentTasks,
  isValidAgentType,
  type AgentType,
} from "@/lib/agent-orchestrator";

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
    const tenantId = url.searchParams.get("tenantId") ?? undefined;
    const agentType = url.searchParams.get("agentType") ?? undefined;
    const status = url.searchParams.get("status") ?? undefined;

    if (agentType && !isValidAgentType(agentType)) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "VALIDATION_ERROR", message: `Invalid agentType: ${agentType}` },
          meta: null,
        },
        { status: 400, headers },
      );
    }

    const tasks = listAgentTasks({
      tenantId,
      agentType: agentType as AgentType | undefined,
      status: status as "pending" | "running" | "completed" | "failed" | "cancelled" | undefined,
    });

    return NextResponse.json(
      { data: tasks, error: null, meta: { count: tasks.length } },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to list agent tasks" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const body = await request.json();
    const { agentType, tenantId, nicheSlug, input } = body as {
      agentType?: string;
      tenantId?: string;
      nicheSlug?: string;
      input?: Record<string, unknown>;
    };

    if (!agentType || !tenantId || !nicheSlug) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: "agentType, tenantId, and nicheSlug are required",
          },
          meta: null,
        },
        { status: 400, headers },
      );
    }

    if (!isValidAgentType(agentType)) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: `Invalid agentType: ${agentType}. Must be one of: funnel-agent, creative-agent, optimization-agent, analytics-agent, onboarding-agent`,
          },
          meta: null,
        },
        { status: 400, headers },
      );
    }

    const task = createAgentTask(agentType, tenantId, nicheSlug, input ?? {});

    runAgentTask(task.id).catch(() => {
      // fire-and-forget: task status is updated in-memory
    });

    return NextResponse.json(
      { data: task, error: null, meta: null },
      { status: 201, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: "Failed to create agent task" }, meta: null },
      { status: 500, headers },
    );
  }
}

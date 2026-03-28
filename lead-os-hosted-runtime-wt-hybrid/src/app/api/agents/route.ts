import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import {
  createAgentTask,
  runAgentTask,
  listAgentTasks,
  isValidAgentType,
  type AgentType,
} from "@/lib/agent-orchestrator";
import { z } from "zod";

const AgentCreateSchema = z.object({
  agentType: z.string().min(1).max(100),
  tenantId: z.string().min(1).max(100),
  nicheSlug: z.string().min(1).max(100),
  input: z.record(z.string(), z.unknown()).optional(),
});

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
  } catch (err) {
    console.error("[agents]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to list agent tasks" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const raw = await request.json();

    const validation = AgentCreateSchema.safeParse(raw);
    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: {} },
        { status: 422, headers },
      );
    }
    const { agentType, tenantId, nicheSlug, input } = validation.data;

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
  } catch (err) {
    console.error("[agents]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: "Failed to create agent task" }, meta: null },
      { status: 500, headers },
    );
  }
}

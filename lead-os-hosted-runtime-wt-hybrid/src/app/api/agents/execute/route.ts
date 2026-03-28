import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { executeAgentTask } from "@/lib/paperclip-orchestrator";
import { z } from "zod";

const ExecuteSchema = z.object({
  agentId: z.string().min(1).max(100),
  task: z.object({
    type: z.string().min(1).max(200),
    input: z.record(z.string(), z.unknown()),
    priority: z.enum(["low", "normal", "high", "urgent"]),
    maxRetries: z.number().int().min(0).max(10).optional(),
  }),
});

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const raw = await request.json();
    const validation = ExecuteSchema.safeParse(raw);
    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: null },
        { status: 422, headers },
      );
    }

    const { agentId, task } = validation.data;
    const execution = await executeAgentTask(agentId, task);

    return NextResponse.json(
      { data: execution, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to execute task";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json(
      { data: null, error: { code: "EXECUTION_FAILED", message }, meta: null },
      { status, headers },
    );
  }
}

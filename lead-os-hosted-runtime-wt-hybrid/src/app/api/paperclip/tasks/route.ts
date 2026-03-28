import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { assignTask } from "@/lib/integrations/paperclip-connector";
import { z } from "zod";

const AssignTaskSchema = z.object({
  agentId: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  tools: z.array(z.string().max(200)).optional(),
  context: z.record(z.string(), z.unknown()).optional(),
  priority: z.enum(["low", "normal", "high"]).optional(),
  deadline: z.string().max(50).optional(),
});

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const raw = await request.json();
    const validation = AssignTaskSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: null },
        { status: 422, headers },
      );
    }

    const { agentId, ...task } = validation.data;
    const result = await assignTask(agentId, task);

    return NextResponse.json(
      { data: result, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    return NextResponse.json(
      { data: null, error: { code: "TASK_FAILED", message: err instanceof Error ? err.message : "Failed to assign task" }, meta: null },
      { status: 500, headers },
    );
  }
}

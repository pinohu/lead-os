import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { validateSafe } from "@/lib/canonical-schema";
import { createWorkflow } from "@/lib/integrations/flow-forge-adapter";

export const dynamic = "force-dynamic";

const WorkflowStepSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
  type: z.enum(["action", "condition", "delay", "split", "merge"]),
  action: z.string().optional(),
  config: z.record(z.string(), z.unknown()),
  next: z.union([
    z.string(),
    z.object({
      condition: z.string(),
      trueStep: z.string(),
      falseStep: z.string(),
    }),
  ]).optional(),
});

const CreateWorkflowSchema = z.object({
  tenantId: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  trigger: z.object({
    type: z.enum(["webhook", "schedule", "event", "manual"]),
    config: z.record(z.string(), z.unknown()),
  }),
  steps: z.array(WorkflowStepSchema).min(1),
  errorHandling: z.enum(["stop", "skip", "retry"]).default("stop"),
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
    const body = await request.json();
    const validation = validateSafe(CreateWorkflowSchema, body);
    if (!validation.valid) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Validation failed", details: validation.errors }, meta: null },
        { status: 422, headers },
      );
    }

    const { tenantId, name, description, trigger, steps, errorHandling } = validation.data!;
    const workflow = await createWorkflow(tenantId, { name, description, trigger, steps, errorHandling });

    return NextResponse.json(
      { data: workflow, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: err instanceof Error ? err.message : "Workflow creation failed" }, meta: null },
      { status: 500, headers },
    );
  }
}

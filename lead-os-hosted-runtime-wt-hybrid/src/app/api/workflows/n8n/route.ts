import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { validateSafe } from "@/lib/canonical-schema";
import { createN8NWorkflow } from "@/lib/integrations/n8n-enhanced-adapter";

export const dynamic = "force-dynamic";

const N8NNodeSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  position: z.tuple([z.number(), z.number()]),
  parameters: z.record(z.string(), z.unknown()),
});

const N8NConnectionSchema = z.object({
  sourceNode: z.string().min(1),
  sourceOutput: z.number().int().min(0),
  targetNode: z.string().min(1),
  targetInput: z.number().int().min(0),
});

const CreateN8NWorkflowSchema = z.object({
  tenantId: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  nodes: z.array(N8NNodeSchema).min(1),
  connections: z.array(N8NConnectionSchema),
  settings: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const body = await request.json();
    const validation = validateSafe(CreateN8NWorkflowSchema, body);
    if (!validation.valid) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Validation failed", details: validation.errors }, meta: null },
        { status: 422, headers },
      );
    }

    const { tenantId, name, nodes, connections, settings } = validation.data!;
    const workflow = await createN8NWorkflow(tenantId, { name, nodes, connections, settings });

    return NextResponse.json(
      { data: workflow, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: err instanceof Error ? err.message : "N8N workflow creation failed" }, meta: null },
      { status: 500, headers },
    );
  }
}

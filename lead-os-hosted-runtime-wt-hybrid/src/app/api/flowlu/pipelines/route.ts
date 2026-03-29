import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { createPipeline, listPipelines } from "@/lib/integrations/flowlu-adapter";

const CreatePipelineSchema = z.object({
  name: z.string().min(1),
  stages: z.array(
    z.object({
      name: z.string().min(1),
      order: z.number().int().min(0),
    }),
  ).min(1),
  tenantId: z.string().optional(),
});

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const raw = await request.json();
    const validation = CreatePipelineSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues },
          meta: null,
        },
        { status: 422, headers },
      );
    }

    const pipeline = await createPipeline(validation.data);

    return NextResponse.json(
      { data: pipeline, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    console.error("[flowlu/pipelines POST]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: "Failed to create pipeline" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? undefined;

    const pipelines = await listPipelines(tenantId);

    return NextResponse.json(
      { data: pipelines, error: null, meta: { count: pipelines.length } },
      { headers },
    );
  } catch (err) {
    console.error("[flowlu/pipelines GET]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "LIST_FAILED", message: "Failed to list pipelines" }, meta: null },
      { status: 500, headers },
    );
  }
}

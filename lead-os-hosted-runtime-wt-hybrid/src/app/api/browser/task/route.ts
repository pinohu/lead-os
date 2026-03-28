import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { createTask, type SkyvernTaskConfig } from "@/lib/integrations/skyvern-adapter";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const body = (await request.json()) as Record<string, unknown>;

    if (typeof body.tenantId !== "string" || body.tenantId.length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (typeof body.type !== "string" || body.type.length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "type is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (typeof body.url !== "string" || body.url.length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "url is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (typeof body.instructions !== "string" || body.instructions.length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "instructions is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const config: SkyvernTaskConfig = {
      tenantId: body.tenantId,
      type: body.type,
      url: body.url,
      instructions: body.instructions,
      extractSchema: typeof body.extractSchema === "object" && body.extractSchema !== null
        ? body.extractSchema as Record<string, unknown>
        : undefined,
      maxRetries: typeof body.maxRetries === "number" ? body.maxRetries : undefined,
      timeout: typeof body.timeout === "number" ? body.timeout : undefined,
    };

    const task = await createTask(config);
    return NextResponse.json(
      { data: task, error: null, meta: { taskId: task.id } },
      { status: 201, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "TASK_CREATION_FAILED", message: "Failed to create browser task" }, meta: null },
      { status: 500, headers },
    );
  }
}

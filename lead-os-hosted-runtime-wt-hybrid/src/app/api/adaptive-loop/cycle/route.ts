import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import {
  runAdaptiveCycle,
  getLoopState,
  getLoopHistory,
  isLoopHealthy,
} from "@/lib/adaptive-loop";
import { z } from "zod";

const CycleRequestSchema = z.object({
  tenantId: z.string().min(1).max(100),
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
    const parsed = CycleRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request body",
            details: parsed.error.issues,
          },
          meta: null,
        },
        { status: 400, headers },
      );
    }

    const { tenantId } = parsed.data;
    const state = await runAdaptiveCycle(tenantId);

    return NextResponse.json(
      {
        data: state,
        error: null,
        meta: { tenantId, cycleCount: state.cycleCount },
      },
      { status: 200, headers },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      {
        data: null,
        error: { code: "INTERNAL_ERROR", message },
        meta: null,
      },
      { status: 500, headers },
    );
  }
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "VALIDATION_ERROR", message: "tenantId query parameter is required" },
          meta: null,
        },
        { status: 400, headers },
      );
    }

    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    const state = getLoopState(tenantId);
    const history = getLoopHistory(tenantId, limit);
    const healthy = isLoopHealthy(tenantId);

    return NextResponse.json(
      {
        data: {
          currentState: state ?? null,
          history,
          healthy,
        },
        error: null,
        meta: { tenantId, historyCount: history.length },
      },
      { status: 200, headers },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      {
        data: null,
        error: { code: "INTERNAL_ERROR", message },
        meta: null,
      },
      { status: 500, headers },
    );
  }
}

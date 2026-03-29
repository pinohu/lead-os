import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getFunnelReport } from "@/lib/integrations/owox-adapter";

const FunnelSchema = z.object({
  name: z.string().min(1).max(200),
  steps: z.array(z.string().min(1)).min(2).max(20),
  tenantId: z.string().optional(),
});

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const raw = await request.json();
    const validation = FunnelSchema.safeParse(raw);

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

    const report = await getFunnelReport(
      validation.data.name,
      validation.data.steps,
      validation.data.tenantId,
    );

    return NextResponse.json(
      { data: report, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    console.error("[owox/funnels POST]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: "Failed to generate funnel report" }, meta: null },
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
    const name = url.searchParams.get("name") ?? "default";
    const stepsParam = url.searchParams.get("steps");
    const tenantId = url.searchParams.get("tenantId") ?? undefined;

    if (!stepsParam) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "VALIDATION_ERROR", message: "steps query parameter is required (comma-separated)" },
          meta: null,
        },
        { status: 422, headers },
      );
    }

    const steps = stepsParam.split(",").map((s) => s.trim()).filter(Boolean);
    if (steps.length < 2) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "VALIDATION_ERROR", message: "At least 2 steps are required" },
          meta: null,
        },
        { status: 422, headers },
      );
    }

    const report = await getFunnelReport(name, steps, tenantId);

    return NextResponse.json(
      { data: report, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    console.error("[owox/funnels GET]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch funnel report" }, meta: null },
      { status: 500, headers },
    );
  }
}

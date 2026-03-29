import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { createSegment, listSegments } from "@/lib/integrations/meiro-cdp-adapter";

const ConditionSchema = z.object({
  attribute: z.string().min(1),
  operator: z.enum(["equals", "contains", "gt", "lt", "exists"]),
  value: z.union([z.string(), z.number()]),
});

const CreateSegmentSchema = z.object({
  name: z.string().min(1).max(200),
  conditions: z.array(ConditionSchema),
  tenantId: z.string().min(1).optional(),
});

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? undefined;

    const segments = await listSegments(tenantId);

    return NextResponse.json(
      { data: segments, error: null, meta: { count: segments.length } },
      { headers },
    );
  } catch (err) {
    console.error("[meiro/segments GET]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to list segments" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const raw = await request.json();
    const validation = CreateSegmentSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: null },
        { status: 422, headers },
      );
    }

    const segment = await createSegment(validation.data);

    return NextResponse.json(
      { data: segment, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    console.error("[meiro/segments POST]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: "Failed to create segment" }, meta: null },
      { status: 500, headers },
    );
  }
}

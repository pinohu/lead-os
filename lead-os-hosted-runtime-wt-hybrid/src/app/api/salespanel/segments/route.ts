import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { createSegment } from "@/lib/integrations/salespanel-adapter";

const ConditionSchema = z.object({
  field: z.string().min(1),
  operator: z.enum(["equals", "contains", "greater_than", "less_than"]),
  value: z.union([z.string(), z.number()]),
});

const CreateSegmentSchema = z.object({
  name: z.string().min(1),
  conditions: z.array(ConditionSchema).min(1),
  tenantId: z.string().optional(),
});

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const raw = await request.json();
    const validation = CreateSegmentSchema.safeParse(raw);

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

    const segment = await createSegment(validation.data);

    return NextResponse.json(
      { data: segment, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    logger.error("salespanel/segments POST failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: "Failed to create segment" }, meta: null },
      { status: 500, headers },
    );
  }
}

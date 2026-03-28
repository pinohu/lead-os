import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { recordUsage, recordBulkUsage } from "@/lib/integrations/usage-billing";

const UsageEventSchema = z.object({
  tenantId: z.string().min(1),
  eventType: z.string().min(1),
  units: z.number().positive(),
  timestamp: z.string().optional(),
  metadata: z.record(z.string()).optional(),
});

const RecordUsageSchema = z.union([
  UsageEventSchema,
  z.object({ events: z.array(UsageEventSchema).min(1) }),
]);

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Content-Type must be application/json" }, meta: null },
        { status: 415, headers },
      );
    }

    const body = await request.json();
    const parsed = RecordUsageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request body",
            details: parsed.error.issues.map((i) => ({
              field: i.path.join("."),
              issue: i.message,
            })),
          },
          meta: null,
        },
        { status: 400, headers },
      );
    }

    if ("events" in parsed.data) {
      const ids = await recordBulkUsage(parsed.data.events);
      return NextResponse.json(
        { data: { ids }, error: null, meta: { count: ids.length } },
        { status: 201, headers },
      );
    }

    const id = await recordUsage(parsed.data);
    return NextResponse.json(
      { data: { id }, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to record usage";
    return NextResponse.json(
      { data: null, error: { code: "USAGE_RECORD_FAILED", message }, meta: null },
      { status: 500, headers },
    );
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { createQualificationSurvey } from "@/lib/integrations/formbricks-adapter";

const QualifySchema = z.object({
  tenantId: z.string().min(1),
  niche: z.string().min(1).max(100),
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
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Content-Type must be application/json" }, meta: null },
        { status: 415, headers },
      );
    }

    const body = await request.json();
    const parsed = QualifySchema.safeParse(body);

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

    const survey = await createQualificationSurvey(parsed.data.tenantId, parsed.data.niche);

    return NextResponse.json(
      { data: { survey }, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create qualification survey";
    return NextResponse.json(
      { data: null, error: { code: "CREATE_SURVEY_FAILED", message }, meta: null },
      { status: 500, headers },
    );
  }
}

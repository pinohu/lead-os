import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { createSurvey, listSurveys } from "@/lib/integrations/formbricks-adapter";

const QuestionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["rating", "text", "multiChoice", "nps", "consent"]),
  text: z.string().min(1),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
  scoreWeight: z.number().optional(),
});

const CreateSurveySchema = z.object({
  tenantId: z.string().min(1),
  name: z.string().min(1).max(200),
  type: z.enum(["qualification", "nps", "feedback", "custom"]),
  questions: z.array(QuestionSchema).min(1),
});

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const surveys = await listSurveys(tenantId);

    return NextResponse.json(
      { data: { surveys }, error: null, meta: { count: surveys.length } },
      { status: 200, headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list surveys";
    return NextResponse.json(
      { data: null, error: { code: "LIST_SURVEYS_FAILED", message }, meta: null },
      { status: 500, headers },
    );
  }
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
    const parsed = CreateSurveySchema.safeParse(body);

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

    const { tenantId, ...config } = parsed.data;
    const survey = await createSurvey(tenantId, config);

    return NextResponse.json(
      { data: { survey }, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create survey";
    return NextResponse.json(
      { data: null, error: { code: "CREATE_SURVEY_FAILED", message }, meta: null },
      { status: 500, headers },
    );
  }
}

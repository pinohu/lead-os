import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { generateAngles, storeAngles } from "@/lib/social-angle-generator";

const GenerateAnglesSchema = z.object({
  topic: z.string().min(1).max(500),
  niche: z.string().min(1).max(200),
  count: z.number().int().min(1).max(50).optional(),
  minControversy: z.number().min(0).max(1).optional(),
  maxControversy: z.number().min(0).max(1).optional(),
  tenantId: z.string().min(1).max(100).optional(),
});

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: "Content-Type must be application/json" }, meta: null },
      { status: 415, headers },
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "PARSE_ERROR", message: "Request body is not valid JSON" }, meta: null },
      { status: 400, headers },
    );
  }

  const parsed = GenerateAnglesSchema.safeParse(rawBody);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => ({
      field: issue.path.join("."),
      issue: issue.message,
    }));
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: "Request validation failed", details }, meta: null },
      { status: 400, headers },
    );
  }

  try {
    const { topic, niche, count, minControversy, maxControversy, tenantId } = parsed.data;
    const angles = generateAngles({ topic, niche, count, minControversy, maxControversy });

    if (tenantId) {
      storeAngles(tenantId, angles);
    }

    return NextResponse.json(
      {
        data: angles,
        error: null,
        meta: { topic, niche, count: angles.length },
      },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "GENERATION_FAILED", message: "Failed to generate content angles" }, meta: null },
      { status: 500, headers },
    );
  }
}

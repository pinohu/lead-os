import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { getPersona, applyPersonaToContent, getPersonaRecommendation } from "@/lib/persona-engine";

const ApplySchema = z.object({
  content: z.string().min(1).max(10000),
});

const RecommendSchema = z.object({
  recommend: z.literal(true),
  niche: z.string().min(1).max(128),
  platform: z.string().min(1).max(64),
  contentType: z.string().min(1).max(64),
});

const PostBodySchema = z.union([ApplySchema, RecommendSchema]);

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const { id } = await params;

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Content-Type must be application/json" }, meta: null },
        { status: 415, headers },
      );
    }

    const raw = await request.json();

    if (raw.recommend === true) {
      const parsed = RecommendSchema.safeParse(raw);
      if (!parsed.success) {
        return NextResponse.json(
          {
            data: null,
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid recommendation request",
              details: parsed.error.issues,
            },
            meta: null,
          },
          { status: 400, headers },
        );
      }
      const recommendation = getPersonaRecommendation(
        parsed.data.niche,
        parsed.data.platform,
        parsed.data.contentType,
      );
      return NextResponse.json({ data: recommendation, error: null, meta: null }, { headers });
    }

    const parsed = ApplySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: "content is required",
            details: parsed.error.issues,
          },
          meta: null,
        },
        { status: 400, headers },
      );
    }

    const persona = getPersona(id);
    if (!persona) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Persona not found" }, meta: null },
        { status: 404, headers },
      );
    }

    const result = applyPersonaToContent(persona, parsed.data.content);

    return NextResponse.json(
      { data: { rewritten: result, personaId: id, personaName: persona.name }, error: null, meta: null },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "APPLY_FAILED", message: "Failed to apply persona to content" }, meta: null },
      { status: 500, headers },
    );
  }
}

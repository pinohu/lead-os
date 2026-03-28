import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import {
  createPersona,
  listPersonas,
  generatePersona,
  type PersonaType,
} from "@/lib/persona-engine";

const PERSONA_TYPES: [PersonaType, ...PersonaType[]] = [
  "expert",
  "technician",
  "advisor",
  "educator",
  "storyteller",
  "local-authority",
];

const CreatePersonaSchema = z.object({
  action: z.literal("create"),
  name: z.string().min(1).max(128),
  type: z.enum(PERSONA_TYPES),
  niche: z.string().min(1).max(128),
  voiceTone: z.string().min(1).max(256),
  backstory: z.string().min(1).max(1000),
  expertise: z.array(z.string().max(128)).min(1).max(20),
  contentStyle: z.string().min(1).max(256),
  catchphrases: z.array(z.string().max(256)).max(10),
  avatarDescription: z.string().max(512),
  trustSignals: z.array(z.string().max(256)).max(10),
});

const GeneratePersonaSchema = z.object({
  action: z.literal("generate"),
  niche: z.string().min(1).max(128),
  type: z.enum(PERSONA_TYPES),
});

const PostBodySchema = z.discriminatedUnion("action", [CreatePersonaSchema, GeneratePersonaSchema]);

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const personas = listPersonas(tenantId);

    return NextResponse.json(
      { data: personas, error: null, meta: { count: personas.length } },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "LIST_FAILED", message: "Failed to list personas" }, meta: null },
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

    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId");
    if (!tenantId) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const raw = await request.json();
    const parsed = PostBodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid persona data",
            details: parsed.error.issues,
          },
          meta: null,
        },
        { status: 400, headers },
      );
    }

    const body = parsed.data;

    if (body.action === "generate") {
      const generated = generatePersona(body.niche, body.type);
      const saved = createPersona(tenantId, {
        name: generated.name,
        type: generated.type,
        niche: generated.niche,
        voiceTone: generated.voiceTone,
        backstory: generated.backstory,
        expertise: generated.expertise,
        contentStyle: generated.contentStyle,
        catchphrases: generated.catchphrases,
        avatarDescription: generated.avatarDescription,
        trustSignals: generated.trustSignals,
      });
      return NextResponse.json({ data: saved, error: null, meta: { generated: true } }, { status: 201, headers });
    }

    const persona = createPersona(tenantId, {
      name: body.name,
      type: body.type,
      niche: body.niche,
      voiceTone: body.voiceTone,
      backstory: body.backstory,
      expertise: body.expertise,
      contentStyle: body.contentStyle,
      catchphrases: body.catchphrases,
      avatarDescription: body.avatarDescription,
      trustSignals: body.trustSignals,
    });

    return NextResponse.json({ data: persona, error: null, meta: null }, { status: 201, headers });
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: "Failed to create persona" }, meta: null },
      { status: 500, headers },
    );
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { createBot, listBotConfigs } from "@/lib/integrations/chatbase-adapter";

const CreateBotSchema = z.object({
  botId: z.string().default(""),
  systemPrompt: z.string().min(1).max(10000),
  leadCaptureFields: z.array(z.string()).default([]),
  qualificationQuestions: z.array(z.string()).default([]),
  handoffThreshold: z.number().int().min(0).max(100).default(80),
  greeting: z.string().min(1).max(1000),
  tenantId: z.string().optional(),
});

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const raw = await request.json();
    const validation = CreateBotSchema.safeParse(raw);

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

    const bot = await createBot(validation.data);

    return NextResponse.json(
      { data: bot, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    console.error("[chatbase/bots POST]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: "Failed to create bot" }, meta: null },
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
    const tenantId = url.searchParams.get("tenantId") ?? undefined;

    const bots = listBotConfigs(tenantId);

    return NextResponse.json(
      { data: bots, error: null, meta: { count: bots.length } },
      { headers },
    );
  } catch (err) {
    console.error("[chatbase/bots GET]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to list bots" }, meta: null },
      { status: 500, headers },
    );
  }
}

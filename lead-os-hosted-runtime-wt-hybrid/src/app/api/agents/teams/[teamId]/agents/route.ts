import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { addAgent } from "@/lib/paperclip-orchestrator";
import { z } from "zod";

const AgentCreateSchema = z.object({
  name: z.string().min(1).max(200),
  role: z.enum([
    "prospector",
    "enricher",
    "content-creator",
    "outreach-manager",
    "analytics-reporter",
    "qualifier",
    "nurture-manager",
    "custom",
  ]),
  tools: z.array(z.string().min(1).max(100)),
  model: z.string().min(1).max(100),
  systemPrompt: z.string().min(1).max(10000),
  maxTokensPerTask: z.number().int().min(1),
  budgetPerDay: z.number().min(0),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { teamId } = await params;

  try {
    const raw = await request.json();
    const validation = AgentCreateSchema.safeParse(raw);
    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: null },
        { status: 422, headers },
      );
    }

    const agent = await addAgent(teamId, validation.data);
    return NextResponse.json(
      { data: agent, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to add agent";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json(
      { data: null, error: { code: status === 404 ? "NOT_FOUND" : "CREATE_FAILED", message }, meta: null },
      { status, headers },
    );
  }
}

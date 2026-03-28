import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { addAgentToCompany } from "@/lib/integrations/paperclip-connector";
import { z } from "zod";

const HeartbeatSchema = z.object({
  cronExpression: z.string().min(1).max(100),
  task: z.string().min(1).max(1000),
});

const AddAgentSchema = z.object({
  companyId: z.string().min(1).max(200),
  name: z.string().min(1).max(200),
  role: z.string().min(1).max(200),
  type: z.enum(["claude", "openai", "shell", "http", "custom"]),
  tools: z.array(z.string().max(200)),
  systemPrompt: z.string().min(1).max(10_000),
  heartbeat: HeartbeatSchema.optional(),
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
    const raw = await request.json();
    const validation = AddAgentSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: null },
        { status: 422, headers },
      );
    }

    const { companyId, ...agentConfig } = validation.data;
    const agent = await addAgentToCompany(companyId, agentConfig);

    return NextResponse.json(
      { data: agent, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: err instanceof Error ? err.message : "Failed to add agent" }, meta: null },
      { status: 500, headers },
    );
  }
}

import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { mcpAgent } from "@/lib/integrations/firecrawl-mcp-connector";
import { z } from "zod";

const AgentSchema = z.object({
  query: z.string().min(1).max(2000),
  maxSteps: z.number().int().min(1).max(50).optional(),
  extractSchema: z.record(z.string(), z.unknown()).optional(),
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
    const validation = AgentSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: null },
        { status: 422, headers },
      );
    }

    const { query, ...options } = validation.data;
    const result = await mcpAgent(query, options);

    return NextResponse.json(
      { data: result, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    return NextResponse.json(
      { data: null, error: { code: "AGENT_FAILED", message: err instanceof Error ? err.message : "MCP agent failed" }, meta: null },
      { status: 500, headers },
    );
  }
}

import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { discoverProspects } from "@/lib/integrations/firecrawl-mcp-connector";
import { z } from "zod";

const ProspectSchema = z.object({
  query: z.string().min(1).max(500),
  niche: z.string().min(1).max(200),
  limit: z.number().int().min(1).max(100).optional(),
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
    const validation = ProspectSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: null },
        { status: 422, headers },
      );
    }

    const { query, niche, limit } = validation.data;
    const prospects = await discoverProspects(query, niche, limit);

    return NextResponse.json(
      { data: prospects, error: null, meta: { count: prospects.length } },
      { headers },
    );
  } catch (err) {
    return NextResponse.json(
      { data: null, error: { code: "PROSPECT_DISCOVERY_FAILED", message: err instanceof Error ? err.message : "Prospect discovery failed" }, meta: null },
      { status: 500, headers },
    );
  }
}

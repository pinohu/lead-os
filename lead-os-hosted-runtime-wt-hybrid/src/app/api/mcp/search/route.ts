import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { mcpSearch } from "@/lib/integrations/firecrawl-mcp-connector";
import { z } from "zod";

const SearchSchema = z.object({
  query: z.string().min(1).max(500),
  limit: z.number().int().min(1).max(100).optional(),
  country: z.string().max(10).optional(),
  language: z.string().max(10).optional(),
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
    const validation = SearchSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: null },
        { status: 422, headers },
      );
    }

    const { query, ...options } = validation.data;
    const results = await mcpSearch(query, options);

    return NextResponse.json(
      { data: results, error: null, meta: { count: results.length } },
      { headers },
    );
  } catch (err) {
    return NextResponse.json(
      { data: null, error: { code: "SEARCH_FAILED", message: err instanceof Error ? err.message : "MCP search failed" }, meta: null },
      { status: 500, headers },
    );
  }
}

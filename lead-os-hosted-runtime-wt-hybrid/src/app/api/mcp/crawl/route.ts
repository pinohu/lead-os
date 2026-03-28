import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { mcpCrawl } from "@/lib/integrations/firecrawl-mcp-connector";
import { z } from "zod";

const CrawlSchema = z.object({
  url: z.string().url().max(2048),
  maxPages: z.number().int().min(1).max(1000).optional(),
  maxDepth: z.number().int().min(1).max(10).optional(),
  includePaths: z.array(z.string().max(200)).optional(),
  excludePaths: z.array(z.string().max(200)).optional(),
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
    const validation = CrawlSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: null },
        { status: 422, headers },
      );
    }

    const { url, ...options } = validation.data;
    const result = await mcpCrawl(url, options);

    return NextResponse.json(
      { data: result, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    return NextResponse.json(
      { data: null, error: { code: "CRAWL_FAILED", message: err instanceof Error ? err.message : "MCP crawl failed" }, meta: null },
      { status: 500, headers },
    );
  }
}

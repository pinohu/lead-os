import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { mcpScrape } from "@/lib/integrations/firecrawl-mcp-connector";
import { z } from "zod";

const ScrapeSchema = z.object({
  url: z.string().url().max(2048),
  formats: z.array(z.enum(["markdown", "html", "json"])).optional(),
  onlyMainContent: z.boolean().optional(),
  waitFor: z.number().int().min(0).max(30_000).optional(),
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
    const validation = ScrapeSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: null },
        { status: 422, headers },
      );
    }

    const { url, ...options } = validation.data;
    const result = await mcpScrape(url, options);

    return NextResponse.json(
      { data: result, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    return NextResponse.json(
      { data: null, error: { code: "SCRAPE_FAILED", message: err instanceof Error ? err.message : "MCP scrape failed" }, meta: null },
      { status: 500, headers },
    );
  }
}

import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { crawlSite } from "@/lib/integrations/firecrawl-adapter";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const body = await request.json();

    if (!body.url || typeof body.url !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "url is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const job = await crawlSite(body.url, body.options);

    return NextResponse.json(
      { data: job, error: null, meta: null },
      { status: 201, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "CRAWL_FAILED", message: "Failed to start crawl" }, meta: null },
      { status: 500, headers },
    );
  }
}

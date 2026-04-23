import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { validateExternalUrl } from "@/lib/validate-url";
import { scrapeUrl } from "@/lib/integrations/firecrawl-adapter";

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

    const urlCheck = validateExternalUrl(body.url);
    if (!urlCheck.valid) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: urlCheck.reason }, meta: null },
        { status: 400, headers },
      );
    }

    const page = await scrapeUrl(urlCheck.url.href, body.options);

    return NextResponse.json(
      { data: page, error: null, meta: null },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "SCRAPE_FAILED", message: "Failed to scrape URL" }, meta: null },
      { status: 500, headers },
    );
  }
}

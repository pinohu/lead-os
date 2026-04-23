import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { validateExternalUrl } from "@/lib/validate-url";
import { batchScrape } from "@/lib/integrations/firecrawl-adapter";

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const body = await request.json();

    if (!Array.isArray(body.urls) || body.urls.length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "urls array is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (body.urls.length > 100) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Maximum 100 URLs per batch" }, meta: null },
        { status: 400, headers },
      );
    }

    const validatedUrls: string[] = [];
    for (const rawUrl of body.urls) {
      if (typeof rawUrl !== "string") {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "All URLs must be strings" }, meta: null },
          { status: 400, headers },
        );
      }
      const check = validateExternalUrl(rawUrl);
      if (!check.valid) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: `Invalid URL "${rawUrl}": ${check.reason}` }, meta: null },
          { status: 400, headers },
        );
      }
      validatedUrls.push(check.url.href);
    }

    const pages = await batchScrape(validatedUrls);

    return NextResponse.json(
      { data: pages, error: null, meta: { count: pages.length } },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "BATCH_FAILED", message: "Failed to batch scrape" }, meta: null },
      { status: 500, headers },
    );
  }
}

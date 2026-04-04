import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { validateExternalUrl } from "@/lib/validate-url";
import { scrapePage } from "@/lib/integrations/web-scraper";

const ScrapePageSchema = z.object({
  url: z.string().url(),
});

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const raw = await request.json();
    const validation = ScrapePageSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: null },
        { status: 422, headers },
      );
    }

    const urlCheck = validateExternalUrl(validation.data.url);
    if (!urlCheck.valid) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: urlCheck.reason }, meta: null },
        { status: 400, headers },
      );
    }

    const result = await scrapePage(urlCheck.url.href);

    return NextResponse.json(
      { data: result, error: null, meta: { mode: result.mode } },
      { status: 200, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "SCRAPE_FAILED", message: "Failed to scrape page" }, meta: null },
      { status: 500, headers },
    );
  }
}

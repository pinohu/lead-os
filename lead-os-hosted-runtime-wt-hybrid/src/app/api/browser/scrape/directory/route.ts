import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { scrapeBusinessDirectory, type DirectoryFilters } from "@/lib/integrations/skyvern-adapter";

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const body = (await request.json()) as Record<string, unknown>;

    if (typeof body.url !== "string" || body.url.length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "url is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const filters: DirectoryFilters = {
      category: typeof body.category === "string" ? body.category : undefined,
      location: typeof body.location === "string" ? body.location : undefined,
      minRating: typeof body.minRating === "number" ? body.minRating : undefined,
      maxResults: typeof body.maxResults === "number" ? Math.min(body.maxResults, 100) : undefined,
    };

    const listings = await scrapeBusinessDirectory(body.url, filters);
    return NextResponse.json(
      { data: listings, error: null, meta: { count: listings.length } },
      { status: 200, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "SCRAPE_FAILED", message: "Failed to scrape directory" }, meta: null },
      { status: 500, headers },
    );
  }
}

import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { scrapeLinkedInProfile, scrapeLinkedInCompany } from "@/lib/integrations/skyvern-adapter";

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

    const isCompany = body.type === "company" || body.url.includes("/company/");

    if (isCompany) {
      const profile = await scrapeLinkedInCompany(body.url);
      return NextResponse.json(
        { data: profile, error: null, meta: { type: "company" } },
        { status: 200, headers },
      );
    }

    const profile = await scrapeLinkedInProfile(body.url);
    return NextResponse.json(
      { data: profile, error: null, meta: { type: "profile" } },
      { status: 200, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "SCRAPE_FAILED", message: "Failed to scrape LinkedIn" }, meta: null },
      { status: 500, headers },
    );
  }
}

import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { scrapePage } from "@/lib/integrations/web-scraper";
import { ingestDesignFromScrape } from "@/lib/design-ingestion";
import { convertIngestionToDesignSpec } from "@/lib/design-ingestion-to-spec";
import { generateNicheConfig } from "@/lib/niche-generator";

function isValidUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "INVALID_JSON", message: "Request body must be valid JSON" }, meta: null },
      { status: 400, headers },
    );
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: "Request body must be an object" }, meta: null },
      { status: 400, headers },
    );
  }

  const { url, nicheSlug } = body as Record<string, unknown>;

  if (typeof url !== "string" || !isValidUrl(url)) {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: "url must be a valid http/https URL" }, meta: null },
      { status: 400, headers },
    );
  }

  try {
    const scrapeResult = await scrapePage(url);
    const ingestion = ingestDesignFromScrape(scrapeResult);

    let suggestedSpec = undefined;
    if (typeof nicheSlug === "string" && nicheSlug.trim().length > 0) {
      const nicheConfig = generateNicheConfig({ name: nicheSlug });
      suggestedSpec = convertIngestionToDesignSpec(ingestion, nicheConfig);
    }

    return NextResponse.json(
      {
        data: {
          ingestion,
          suggestedSpec: suggestedSpec ?? null,
        },
        error: null,
        meta: null,
      },
      { headers },
    );
  } catch (err) {
    logger.error("ingest-competitor failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "INGEST_FAILED", message: "Failed to ingest competitor page" }, meta: null },
      { status: 500, headers },
    );
  }
}

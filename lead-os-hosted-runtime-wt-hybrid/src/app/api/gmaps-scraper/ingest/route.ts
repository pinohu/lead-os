import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { scrapeAndIngest } from "@/lib/integrations/gmaps-scraper-adapter";

export const dynamic = "force-dynamic";

const IngestQuerySchema = z.object({
  query: z.string().min(1).max(500),
  location: z.string().max(200).optional(),
  radius: z.number().int().min(1).max(50000).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  language: z.string().max(10).optional(),
  tenantId: z.string().optional(),
});

/**
 * POST /api/gmaps-scraper/ingest
 *
 * Scrapes Google Maps and auto-ingests the results as GMB listings
 * for landing page generation.
 */
export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const auth = await requireOperatorApiSession(request);
  if (auth.response) {
    return auth.response;
  }

  try {
    const raw = await request.json();
    const validation = IngestQuerySchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid ingest query",
            details: validation.error.issues,
          },
          meta: null,
        },
        { status: 400, headers },
      );
    }

    const { tenantId, ...query } = validation.data;
    const result = await scrapeAndIngest(query, tenantId);

    return NextResponse.json(
      {
        data: {
          scraped: result.scraped,
          ingested: result.ingested,
          creditsUsed: result.creditsUsed,
        },
        error: null,
        meta: { ingestedAt: new Date().toISOString() },
      },
      { status: 201, headers },
    );
  } catch (err) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "INGEST_FAILED",
          message: err instanceof Error ? err.message : "Failed to scrape and ingest",
        },
        meta: null,
      },
      { status: 500, headers },
    );
  }
}

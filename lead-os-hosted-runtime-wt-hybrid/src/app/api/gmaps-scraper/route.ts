import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  scrapeBusinesses,
  createScrapeJob,
  listScrapeJobs,
} from "@/lib/integrations/gmaps-scraper-adapter";

export const dynamic = "force-dynamic";

const ScrapeQuerySchema = z.object({
  query: z.string().min(1).max(500),
  location: z.string().max(200).optional(),
  radius: z.number().int().min(1).max(50000).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  language: z.string().max(10).optional(),
  async: z.boolean().optional(),
  tenantId: z.string().optional(),
});

/**
 * POST /api/gmaps-scraper
 *
 * Starts a Google Maps scrape. When `async: true` is provided, creates a
 * background job and returns the job record. Otherwise, scrapes synchronously
 * and returns the result immediately.
 */
export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const auth = await requireOperatorApiSession(request);
  if (auth.response) {
    return auth.response;
  }

  try {
    const raw = await request.json();
    const validation = ScrapeQuerySchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid scrape query",
            details: validation.error.issues,
          },
          meta: null,
        },
        { status: 400, headers },
      );
    }

    const { async: isAsync, tenantId, ...query } = validation.data;

    if (isAsync) {
      const job = await createScrapeJob(query, tenantId);
      return NextResponse.json(
        {
          data: { job },
          error: null,
          meta: { createdAt: job.createdAt },
        },
        { status: 201, headers },
      );
    }

    const result = await scrapeBusinesses(query);
    return NextResponse.json(
      {
        data: { result },
        error: null,
        meta: { scrapedAt: result.scrapedAt, total: result.total },
      },
      { status: 200, headers },
    );
  } catch (err) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "SCRAPE_FAILED",
          message: err instanceof Error ? err.message : "Failed to scrape Google Maps",
        },
        meta: null,
      },
      { status: 500, headers },
    );
  }
}

/**
 * GET /api/gmaps-scraper
 *
 * Lists scrape jobs, optionally filtered by tenantId.
 */
export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const auth = await requireOperatorApiSession(request);
  if (auth.response) {
    return auth.response;
  }

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? undefined;

    const jobs = listScrapeJobs(tenantId);

    const data = jobs.map((job) => ({
      id: job.id,
      query: job.query.query,
      location: job.query.location,
      status: job.status,
      businessCount: job.result?.total ?? 0,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
    }));

    return NextResponse.json(
      { data, error: null, meta: { count: data.length } },
      { headers },
    );
  } catch (err) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "FETCH_FAILED",
          message: err instanceof Error ? err.message : "Failed to list scrape jobs",
        },
        meta: null,
      },
      { status: 500, headers },
    );
  }
}

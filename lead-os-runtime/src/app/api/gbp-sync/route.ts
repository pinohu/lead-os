import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { createSyncJob, listSyncJobs } from "@/lib/gbp-sync-scheduler";

export const dynamic = "force-dynamic";

const CreateSyncJobSchema = z.object({
  tenantId: z.string().min(1).max(200),
  placeId: z.string().min(1).max(500),
  slug: z.string().min(1).max(200),
  cronExpression: z.string().min(1).max(100),
  enabled: z.boolean(),
});

/**
 * POST /api/gbp-sync
 *
 * Creates a new GBP sync job from a validated config payload.
 */
export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const auth = await requireOperatorApiSession(request);
  if (auth.response) {
    return auth.response;
  }

  try {
    const raw = await request.json();
    const validation = CreateSyncJobSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid sync job payload",
            details: validation.error.issues,
          },
          meta: null,
        },
        { status: 400, headers },
      );
    }

    const job = await createSyncJob(validation.data);

    return NextResponse.json(
      { data: job, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "CREATE_FAILED",
          message: err instanceof Error ? err.message : "Failed to create sync job",
        },
        meta: null,
      },
      { status: 500, headers },
    );
  }
}

/**
 * GET /api/gbp-sync
 *
 * Lists all sync jobs, optionally filtered by ?tenantId= query parameter.
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

    const jobs = listSyncJobs(tenantId);

    return NextResponse.json(
      { data: jobs, error: null, meta: { count: jobs.length } },
      { headers },
    );
  } catch (err) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "FETCH_FAILED",
          message: err instanceof Error ? err.message : "Failed to list sync jobs",
        },
        meta: null,
      },
      { status: 500, headers },
    );
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  getSyncJob,
  updateSyncJob,
  deleteSyncJob,
  executeSyncJob,
} from "@/lib/gbp-sync-scheduler";

export const dynamic = "force-dynamic";

const PatchSchema = z.object({
  cronExpression: z.string().min(1).max(100).optional(),
  enabled: z.boolean().optional(),
});

const ExecuteSchema = z.object({
  placeId: z.string().optional(),
  name: z.string().min(1).max(200),
  address: z.string().min(1).max(500),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  primaryCategory: z.string().optional(),
  additionalCategories: z.array(z.string()).optional(),
  description: z.string().max(2000).optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().min(0).optional(),
  reviews: z
    .array(
      z.object({
        author: z.string().optional(),
        rating: z.number().min(1).max(5),
        text: z.string().max(1000).optional(),
        relativeTime: z.string().optional(),
        publishedAt: z.string().optional(),
      }),
    )
    .optional(),
  photos: z
    .array(
      z.object({
        url: z.string().url(),
        width: z.number().optional(),
        height: z.number().optional(),
        category: z
          .enum(["cover", "interior", "exterior", "product", "team", "logo", "other"])
          .optional(),
      }),
    )
    .optional(),
  hours: z
    .array(
      z.object({
        day: z.enum([
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ]),
        open: z.string(),
        close: z.string(),
        closed: z.boolean().optional(),
      }),
    )
    .optional(),
  attributes: z
    .array(
      z.object({
        key: z.string(),
        label: z.string(),
        value: z.boolean(),
      }),
    )
    .optional(),
  qAndA: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string().optional(),
      }),
    )
    .optional(),
  geo: z.object({ lat: z.number(), lng: z.number() }).optional(),
  serviceArea: z.string().optional(),
});

/**
 * GET /api/gbp-sync/[jobId]
 *
 * Returns a single sync job by ID.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const auth = await requireOperatorApiSession(request);
  if (auth.response) {
    return auth.response;
  }

  try {
    const { jobId } = await params;
    const job = getSyncJob(jobId);

    if (!job) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "NOT_FOUND", message: `Sync job "${jobId}" not found` },
          meta: null,
        },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: job, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "FETCH_FAILED",
          message: err instanceof Error ? err.message : "Failed to fetch sync job",
        },
        meta: null,
      },
      { status: 500, headers },
    );
  }
}

/**
 * PATCH /api/gbp-sync/[jobId]
 *
 * Updates cronExpression and/or enabled flag on a sync job.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const auth = await requireOperatorApiSession(request);
  if (auth.response) {
    return auth.response;
  }

  try {
    const { jobId } = await params;

    const raw = await request.json();
    const validation = PatchSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid update payload",
            details: validation.error.issues,
          },
          meta: null,
        },
        { status: 400, headers },
      );
    }

    const updated = updateSyncJob(jobId, validation.data);

    if (!updated) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "NOT_FOUND", message: `Sync job "${jobId}" not found` },
          meta: null,
        },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: updated, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "UPDATE_FAILED",
          message: err instanceof Error ? err.message : "Failed to update sync job",
        },
        meta: null,
      },
      { status: 500, headers },
    );
  }
}

/**
 * DELETE /api/gbp-sync/[jobId]
 *
 * Removes a sync job. Returns 204 on success, 404 if not found.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const auth = await requireOperatorApiSession(request);
  if (auth.response) {
    return auth.response;
  }

  try {
    const { jobId } = await params;
    const deleted = deleteSyncJob(jobId);

    if (!deleted) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "NOT_FOUND", message: `Sync job "${jobId}" not found` },
          meta: null,
        },
        { status: 404, headers },
      );
    }

    return new NextResponse(null, { status: 204, headers });
  } catch (err) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "DELETE_FAILED",
          message: err instanceof Error ? err.message : "Failed to delete sync job",
        },
        meta: null,
      },
      { status: 500, headers },
    );
  }
}

/**
 * POST /api/gbp-sync/[jobId]
 *
 * Triggers an immediate sync execution for the given job.
 * Request body must contain GMBListingData.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const auth = await requireOperatorApiSession(request);
  if (auth.response) {
    return auth.response;
  }

  try {
    const { jobId } = await params;

    const raw = await request.json();
    const validation = ExecuteSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid listing data payload",
            details: validation.error.issues,
          },
          meta: null,
        },
        { status: 400, headers },
      );
    }

    const result = await executeSyncJob(jobId, validation.data);

    return NextResponse.json(
      { data: result, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to execute sync";
    const isNotFound = message.includes("not found");

    return NextResponse.json(
      {
        data: null,
        error: {
          code: isNotFound ? "NOT_FOUND" : "SYNC_FAILED",
          message,
        },
        meta: null,
      },
      { status: isNotFound ? 404 : 500, headers },
    );
  }
}

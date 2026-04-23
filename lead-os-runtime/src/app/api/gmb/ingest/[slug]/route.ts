import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  deleteLandingPage,
  getLandingPage,
  updateLandingPage,
} from "@/lib/landing-page-generator";

export const dynamic = "force-dynamic";

const PatchSchema = z.object({
  status: z.enum(["draft", "published", "archived"]).optional(),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
  accentColor: z.string().optional(),
  leadMagnetSlug: z.string().optional(),
});

/**
 * GET /api/gmb/ingest/[slug]
 *
 * Returns the full landing page record for the given slug.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const auth = await requireOperatorApiSession(request);
  if (auth.response) {
    return auth.response;
  }

  try {
    const { slug } = await params;
    const page = await getLandingPage(slug);

    if (!page) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "NOT_FOUND", message: `Landing page "${slug}" not found` },
          meta: null,
        },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: page, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "FETCH_FAILED",
          message: err instanceof Error ? err.message : "Failed to fetch landing page",
        },
        meta: null,
      },
      { status: 500, headers },
    );
  }
}

/**
 * PATCH /api/gmb/ingest/[slug]
 *
 * Applies partial updates to a landing page. Only the fields defined in
 * PatchSchema may be changed.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const auth = await requireOperatorApiSession(request);
  if (auth.response) {
    return auth.response;
  }

  try {
    const { slug } = await params;

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

    const updated = await updateLandingPage(slug, validation.data);

    if (!updated) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "NOT_FOUND", message: `Landing page "${slug}" not found` },
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
          message: err instanceof Error ? err.message : "Failed to update landing page",
        },
        meta: null,
      },
      { status: 500, headers },
    );
  }
}

/**
 * DELETE /api/gmb/ingest/[slug]
 *
 * Permanently removes a landing page. Returns 204 on success, 404 if the
 * slug does not exist.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const auth = await requireOperatorApiSession(request);
  if (auth.response) {
    return auth.response;
  }

  try {
    const { slug } = await params;
    const deleted = await deleteLandingPage(slug);

    if (!deleted) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "NOT_FOUND", message: `Landing page "${slug}" not found` },
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
          message: err instanceof Error ? err.message : "Failed to delete landing page",
        },
        meta: null,
      },
      { status: 500, headers },
    );
  }
}

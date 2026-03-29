import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  addReview,
  listReviews,
} from "@/lib/integrations/moregoodreviews-adapter";

const AddReviewSchema = z.object({
  platform: z.enum(["google", "yelp", "facebook", "trustpilot", "custom"]),
  author: z.string().min(1).max(200),
  rating: z.number().min(1).max(5),
  text: z.string().min(1).max(5000),
  date: z.string().min(1),
  verified: z.boolean(),
  responded: z.boolean().optional().default(false),
  response: z.string().optional(),
  businessId: z.string().optional(),
  tenantId: z.string().min(1).optional(),
});

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const platform = url.searchParams.get("platform") ?? undefined;
    const minRatingParam = url.searchParams.get("minRating");
    const minRating = minRatingParam ? Number(minRatingParam) : undefined;
    const tenantId = url.searchParams.get("tenantId") ?? undefined;

    const reviews = await listReviews({ platform, minRating, tenantId });

    return NextResponse.json(
      { data: reviews, error: null, meta: { count: reviews.length } },
      { headers },
    );
  } catch (err) {
    console.error("[reviews GET]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch reviews" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const raw = await request.json();
    const validation = AddReviewSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues },
          meta: null,
        },
        { status: 422, headers },
      );
    }

    const review = await addReview(validation.data);

    return NextResponse.json(
      { data: review, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    console.error("[reviews POST]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: "Failed to add review" }, meta: null },
      { status: 500, headers },
    );
  }
}

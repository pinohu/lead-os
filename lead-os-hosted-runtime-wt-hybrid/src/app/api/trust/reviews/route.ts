import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { recordReview, getReviewSummary } from "@/lib/trust-engine";
import { z } from "zod";

const ReviewSchema = z.object({
  tenantId: z.string().min(1).max(100),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(1).max(5000),
  source: z.enum(["google", "yelp", "internal", "manual"]),
  reviewerName: z.string().max(200).optional(),
  date: z.string().max(50).optional(),
  verified: z.boolean().optional(),
});

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(request.headers.get("origin")) });
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId");
    if (!tenantId) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId query parameter is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const summary = getReviewSummary(tenantId);
    return NextResponse.json({ data: summary, error: null, meta: null }, { headers });
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "REVIEW_SUMMARY_FAILED", message: "Failed to retrieve review summary" }, meta: null },
      { status: 500, headers },
    );
  }
}

const VALID_RATINGS = new Set([1, 2, 3, 4, 5]);
const VALID_SOURCES = new Set(["google", "yelp", "internal", "manual"]);

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Content-Type must be application/json" }, meta: null },
        { status: 415, headers },
      );
    }

    const raw = await request.json();

    const validation = ReviewSchema.safeParse(raw);
    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: {} },
        { status: 422, headers },
      );
    }
    const body = validation.data;

    const review = await recordReview(body.tenantId, {
      rating: body.rating as 1 | 2 | 3 | 4 | 5,
      text: body.text,
      source: body.source,
      reviewerName: body.reviewerName ?? "Anonymous",
      date: body.date ?? new Date().toISOString(),
      verified: body.verified ?? false,
    });

    return NextResponse.json(
      { data: review, error: null, meta: { recordedAt: new Date().toISOString() } },
      { status: 201, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "REVIEW_RECORD_FAILED", message: "Failed to record review" }, meta: null },
      { status: 500, headers },
    );
  }
}

import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { recordReview, getReviewSummary } from "@/lib/trust-engine";

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

    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Request body must be a JSON object" }, meta: null },
        { status: 400, headers },
      );
    }

    const { tenantId, rating, text, source, reviewerName, date, verified } = body;

    if (!tenantId || typeof tenantId !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId is required" }, meta: null },
        { status: 400, headers },
      );
    }
    if (!VALID_RATINGS.has(rating)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "rating must be 1-5" }, meta: null },
        { status: 400, headers },
      );
    }
    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "text is required" }, meta: null },
        { status: 400, headers },
      );
    }
    if (!VALID_SOURCES.has(source)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "source must be google, yelp, internal, or manual" }, meta: null },
        { status: 400, headers },
      );
    }

    const review = await recordReview(tenantId, {
      rating,
      text,
      source,
      reviewerName: reviewerName ?? "Anonymous",
      date: date ?? new Date().toISOString(),
      verified: typeof verified === "boolean" ? verified : false,
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

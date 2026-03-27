import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { startOnboarding, getOnboardingState } from "@/lib/onboarding";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

const MAX_EMAIL_LENGTH = 254;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

    if (!body.email || typeof body.email !== "string" || body.email.trim().length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "email is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (body.email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(body.email.trim())) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "email must be a valid email address" }, meta: null },
        { status: 400, headers },
      );
    }

    const state = await startOnboarding(body.email.trim());

    return NextResponse.json(
      { data: state, error: null, meta: null },
      { status: 201, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "ONBOARDING_FAILED", message: "Failed to start onboarding" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id || typeof id !== "string" || id.trim().length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "id query parameter is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const state = await getOnboardingState(id.trim());

    if (!state) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Onboarding session not found" }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: state, error: null, meta: null },
      { status: 200, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch onboarding state" }, meta: null },
      { status: 500, headers },
    );
  }
}

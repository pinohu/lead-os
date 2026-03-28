import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { startOnboarding, getOnboardingState } from "@/lib/onboarding";
import { z } from "zod";

const OnboardingSchema = z.object({
  email: z.string().min(1).max(254).email(),
});

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

    const raw = await request.json();

    const validation = OnboardingSchema.safeParse(raw);
    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: {} },
        { status: 422, headers },
      );
    }
    const validated = validation.data;

    const state = await startOnboarding(validated.email.trim());

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

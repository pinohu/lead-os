import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { advanceOnboarding, completeOnboarding, getOnboardingState, goBackOnboarding } from "@/lib/onboarding";

const MAX_ID_LENGTH = 200;
const VALID_ID_PATTERN = /^onb_[a-f0-9-]{36}$/;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const { id } = await params;

    if (!id || id.length > MAX_ID_LENGTH || !VALID_ID_PATTERN.test(id)) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Onboarding session not found" }, meta: null },
        { status: 404, headers },
      );
    }

    const state = await getOnboardingState(id);

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
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to retrieve onboarding state";
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const { id } = await params;

    if (!id || id.length > MAX_ID_LENGTH || !VALID_ID_PATTERN.test(id)) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Onboarding session not found" }, meta: null },
        { status: 404, headers },
      );
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Content-Type must be application/json" }, meta: null },
        { status: 415, headers },
      );
    }

    const body = await request.json();
    const state = await getOnboardingState(id);

    if (!state) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Onboarding session not found" }, meta: null },
        { status: 404, headers },
      );
    }

    if (state.currentStep === "complete") {
      return NextResponse.json(
        { data: null, error: { code: "ALREADY_COMPLETE", message: "Onboarding is already complete" }, meta: null },
        { status: 400, headers },
      );
    }

    let updated;
    if (state.currentStep === "review") {
      updated = await advanceOnboarding(id, body);
      updated = await completeOnboarding(id);
    } else {
      updated = await advanceOnboarding(id, body);
    }

    return NextResponse.json(
      { data: updated, error: null, meta: null },
      { status: 200, headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to advance onboarding step";
    const isValidation = message.includes("required") || message.includes("must be") || message.includes("Unknown plan");
    return NextResponse.json(
      { data: null, error: { code: isValidation ? "VALIDATION_ERROR" : "STEP_FAILED", message }, meta: null },
      { status: isValidation ? 400 : 500, headers },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const { id } = await params;

    if (!id || id.length > MAX_ID_LENGTH || !VALID_ID_PATTERN.test(id)) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Onboarding session not found" }, meta: null },
        { status: 404, headers },
      );
    }

    const state = await goBackOnboarding(id);

    return NextResponse.json(
      { data: state, error: null, meta: null },
      { status: 200, headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to go back in onboarding";
    const isNotFound = message.includes("not found");
    const isFirstStep = message.includes("first step");
    const isComplete = message.includes("completed onboarding");

    if (isNotFound) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message }, meta: null },
        { status: 404, headers },
      );
    }

    if (isFirstStep || isComplete) {
      return NextResponse.json(
        { data: null, error: { code: "INVALID_OPERATION", message }, meta: null },
        { status: 400, headers },
      );
    }

    return NextResponse.json(
      { data: null, error: { code: "STEP_BACK_FAILED", message }, meta: null },
      { status: 500, headers },
    );
  }
}

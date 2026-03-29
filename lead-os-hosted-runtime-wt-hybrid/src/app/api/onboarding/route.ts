import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { startOnboarding, getOnboardingState, getOnboardingByEmail, listOnboardingSessions } from "@/lib/onboarding";
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
    const email = url.searchParams.get("email");
    const status = url.searchParams.get("status") as "active" | "complete" | null;
    const list = url.searchParams.get("list");

    // List all sessions: GET /api/onboarding?list=true[&status=active|complete][&email=...]
    if (list === "true") {
      const filters: { status?: "active" | "complete"; email?: string } = {};
      if (status === "active" || status === "complete") filters.status = status;
      if (email && email.trim().length > 0) filters.email = email.trim();
      const sessions = await listOnboardingSessions(filters);
      return NextResponse.json(
        { data: sessions, error: null, meta: { count: sessions.length } },
        { status: 200, headers },
      );
    }

    // Session recovery by email: GET /api/onboarding?email=user@example.com
    if (email && !id) {
      const trimmedEmail = email.trim();
      if (trimmedEmail.length === 0 || trimmedEmail.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(trimmedEmail)) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid email address" }, meta: null },
          { status: 400, headers },
        );
      }

      const state = await getOnboardingByEmail(trimmedEmail);

      if (!state) {
        return NextResponse.json(
          { data: null, error: { code: "NOT_FOUND", message: "No active onboarding session found for this email" }, meta: null },
          { status: 404, headers },
        );
      }

      return NextResponse.json(
        { data: state, error: null, meta: null },
        { status: 200, headers },
      );
    }

    // Fetch by session id: GET /api/onboarding?id=onb_...
    if (!id || typeof id !== "string" || id.trim().length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "id or email query parameter is required" }, meta: null },
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

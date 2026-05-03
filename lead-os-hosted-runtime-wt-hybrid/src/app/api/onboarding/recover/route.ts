import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { advanceOnboarding, completeOnboarding, startOnboarding, type OnboardingState } from "@/lib/onboarding";
import { z } from "zod";

const TargetSchema = z.enum(["niche", "plan", "branding", "integrations", "review"]);

const RecoverSchema = z.object({
  email: z.string().min(1).max(254).email(),
  completeThrough: TargetSchema,
  niche: z.object({
    name: z.string().min(2).max(100),
    industry: z.string().optional(),
    keywords: z.array(z.string()).optional(),
  }),
  planId: z.string().min(1),
  branding: z.object({
    name: z.string().optional(),
    accent: z.string().optional(),
    logoUrl: z.string().optional(),
    siteUrl: z.string().optional(),
    supportEmail: z.string().optional(),
  }),
  enabledProviders: z.array(z.string()).min(1),
});

const STEP_ORDER = ["niche", "plan", "branding", "integrations", "review"] as const;

type RecoverStep = (typeof STEP_ORDER)[number];

function shouldCompleteStep(target: RecoverStep, step: RecoverStep): boolean {
  return STEP_ORDER.indexOf(step) <= STEP_ORDER.indexOf(target);
}

async function advanceIfNeeded(
  state: OnboardingState,
  expectedStep: OnboardingState["currentStep"],
  stepData: Record<string, unknown>,
): Promise<OnboardingState> {
  if (state.currentStep !== expectedStep) {
    return state;
  }

  return advanceOnboarding(state.id, stepData);
}

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
    const validation = RecoverSchema.safeParse(raw);
    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid recovery payload", details: validation.error.issues }, meta: null },
        { status: 422, headers },
      );
    }

    const data = validation.data;
    let state = await startOnboarding(data.email.trim());

    if (state.currentStep === "complete") {
      return NextResponse.json(
        { data: state, error: null, meta: { recovered: true, alreadyComplete: true } },
        { status: 200, headers },
      );
    }

    if (shouldCompleteStep(data.completeThrough, "niche")) {
      state = await advanceIfNeeded(state, "niche", data.niche);
    }

    if (shouldCompleteStep(data.completeThrough, "plan")) {
      state = await advanceIfNeeded(state, "plan", { planId: data.planId });
    }

    if (shouldCompleteStep(data.completeThrough, "branding")) {
      state = await advanceIfNeeded(state, "branding", data.branding);
    }

    if (shouldCompleteStep(data.completeThrough, "integrations")) {
      state = await advanceIfNeeded(state, "integrations", { enabledProviders: data.enabledProviders });
    }

    if (shouldCompleteStep(data.completeThrough, "review")) {
      state = await advanceIfNeeded(state, "review", {});
      state = await completeOnboarding(state.id);
    }

    return NextResponse.json(
      { data: state, error: null, meta: { recovered: true } },
      { status: 200, headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to recover onboarding session";
    const isValidation = message.includes("required") || message.includes("must be") || message.includes("Unknown plan");
    return NextResponse.json(
      { data: null, error: { code: isValidation ? "VALIDATION_ERROR" : "RECOVERY_FAILED", message }, meta: null },
      { status: isValidation ? 400 : 500, headers },
    );
  }
}

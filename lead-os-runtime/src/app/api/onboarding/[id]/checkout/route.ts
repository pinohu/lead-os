import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { getOnboardingState } from "@/lib/onboarding";
import { createCheckoutSession } from "@/lib/billing";
import { getPlanById } from "@/lib/plan-catalog";

const MAX_ID_LENGTH = 200;
const VALID_ID_PATTERN = /^onb_[a-f0-9-]{36}$/;

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

    const state = await getOnboardingState(id);

    if (!state) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Onboarding session not found" }, meta: null },
        { status: 404, headers },
      );
    }

    if (!state.tenantId) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_READY", message: "Onboarding must be completed before checkout" }, meta: null },
        { status: 400, headers },
      );
    }

    const planId = state.selectedPlan ?? "whitelabel-starter";
    const plan = getPlanById(planId);

    if (!plan) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `Unknown plan: ${planId}` }, meta: null },
        { status: 400, headers },
      );
    }

    if (plan.monthlyPrice === 0) {
      return NextResponse.json(
        { data: { checkoutUrl: null, free: true }, error: null, meta: null },
        { status: 200, headers },
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    const successUrl = `${baseUrl}/onboard?session_id={CHECKOUT_SESSION_ID}&step=complete&onboarding_id=${id}`;
    const cancelUrl = `${baseUrl}/onboard?step=plan&onboarding_id=${id}`;

    const result = await createCheckoutSession(
      state.tenantId,
      planId,
      successUrl,
      cancelUrl,
    );

    return NextResponse.json(
      { data: { checkoutUrl: result.url, sessionId: result.sessionId, dryRun: result.dryRun }, error: null, meta: null },
      { status: 200, headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create checkout session";
    return NextResponse.json(
      { data: null, error: { code: "CHECKOUT_FAILED", message }, meta: null },
      { status: 500, headers },
    );
  }
}

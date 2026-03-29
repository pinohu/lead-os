import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  getAffiliateProgram,
  listAffiliates,
  registerAffiliate,
  generateAffiliateSignupUrl,
} from "@/lib/integrations/groove-adapter";

const RegisterAffiliateSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(200),
});

export async function GET(
  request: Request,
  { params }: { params: { programId: string } },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const { programId } = params;
    const program = await getAffiliateProgram(programId);

    if (!program) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: `Program not found: ${programId}` }, meta: null },
        { status: 404, headers },
      );
    }

    const affiliates = await listAffiliates(programId);
    const signupUrl = generateAffiliateSignupUrl(programId);

    return NextResponse.json(
      { data: { program, affiliates, signupUrl }, error: null, meta: { affiliateCount: affiliates.length } },
      { headers },
    );
  } catch (err) {
    console.error("[groove/affiliate/[programId] GET]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch program details" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { programId: string } },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const { programId } = params;
    const raw = await request.json();
    const validation = RegisterAffiliateSchema.safeParse(raw);

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

    const { email, name } = validation.data;
    const affiliate = await registerAffiliate(programId, email, name);

    return NextResponse.json(
      { data: affiliate, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    console.error("[groove/affiliate/[programId] POST]", err instanceof Error ? err.message : err);
    const message = err instanceof Error ? err.message : "Failed to register affiliate";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json(
      { data: null, error: { code: "REGISTER_FAILED", message }, meta: null },
      { status, headers },
    );
  }
}

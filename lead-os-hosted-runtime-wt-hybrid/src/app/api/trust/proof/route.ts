import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { generateSocialProof } from "@/lib/trust-engine";
import type { SocialProofElement } from "@/lib/trust-engine";

const VALID_PROOF_TYPES = new Set<SocialProofElement["type"]>(["counter", "live-activity", "recommendation", "recent-activity"]);

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

    const typeParam = url.searchParams.get("type") as SocialProofElement["type"] | null;
    if (typeParam && !VALID_PROOF_TYPES.has(typeParam)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "type must be counter, live-activity, recommendation, or recent-activity" }, meta: null },
        { status: 400, headers },
      );
    }

    if (typeParam) {
      const proof = generateSocialProof(tenantId, typeParam);
      return NextResponse.json({ data: proof, error: null, meta: null }, { headers });
    }

    const allProof = Array.from(VALID_PROOF_TYPES).map((t) => generateSocialProof(tenantId, t));
    return NextResponse.json({ data: allProof, error: null, meta: { count: allProof.length } }, { headers });
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "PROOF_FAILED", message: "Failed to generate social proof" }, meta: null },
      { status: 500, headers },
    );
  }
}

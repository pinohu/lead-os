import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { detectIngressChannel, resolveIngressDecision } from "@/lib/ingress-engine";
import { tenantConfig } from "@/lib/tenant";

const MAX_STRING_LENGTH = 500;

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

    const source = typeof body.source === "string" ? body.source.slice(0, MAX_STRING_LENGTH) : "";
    const referrer = typeof body.referrer === "string" ? body.referrer.slice(0, MAX_STRING_LENGTH) : undefined;
    const utmSource = typeof body.utmSource === "string" ? body.utmSource.slice(0, MAX_STRING_LENGTH) : undefined;
    const utmMedium = typeof body.utmMedium === "string" ? body.utmMedium.slice(0, MAX_STRING_LENGTH) : undefined;
    const tenantId = typeof body.tenantId === "string" ? body.tenantId : tenantConfig.tenantId;

    const keywords = Array.isArray(body.keywords)
      ? body.keywords.filter((k: unknown): k is string => typeof k === "string").slice(0, 20)
      : undefined;

    const channel = detectIngressChannel(source, referrer, utmSource, utmMedium);
    const decision = resolveIngressDecision(channel, tenantId, keywords);

    return NextResponse.json(
      { data: decision, error: null, meta: { resolvedAt: new Date().toISOString() } },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "RESOLVE_FAILED", message: "Failed to resolve ingress channel" }, meta: null },
      { status: 400, headers },
    );
  }
}

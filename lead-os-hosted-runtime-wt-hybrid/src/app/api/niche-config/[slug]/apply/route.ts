import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { createRateLimiter } from "@/lib/rate-limiter";
import {
  resolveNicheConfig,
  applyNicheToScoring,
  applyNicheToOffers,
  applyNicheToPsychology,
  applyNicheToChannels,
} from "@/lib/niche-adapter";

const rateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 30 });

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { slug } = await params;

  const ip = getClientIp(request);
  const rateResult = rateLimiter.check(`niche-apply:${ip}`);
  if (!rateResult.allowed) {
    return NextResponse.json(
      { data: null, error: { code: "RATE_LIMITED", message: "Too many requests" }, meta: null },
      { status: 429, headers: { ...headers, "Retry-After": String(Math.ceil((rateResult.resetAt - Date.now()) / 1000)) } },
    );
  }

  const resolved = resolveNicheConfig(slug);
  if (!resolved) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: `Niche config "${slug}" not found` }, meta: null },
      { status: 404, headers },
    );
  }

  const applied = {
    slug: resolved.slug,
    name: resolved.name,
    industry: resolved.industry,
    scoring: applyNicheToScoring(resolved),
    offers: applyNicheToOffers(resolved),
    psychology: applyNicheToPsychology(resolved),
    channels: applyNicheToChannels(resolved),
  };

  return NextResponse.json(
    { data: applied, error: null, meta: { appliedAt: new Date().toISOString() } },
    { headers },
  );
}

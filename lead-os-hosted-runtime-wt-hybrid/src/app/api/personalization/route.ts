import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import {
  personalize,
  type PersonalizationContext,
} from "@/lib/personalization-engine";
import { createRateLimiter } from "@/lib/rate-limiter";

const rateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 60 });

const MAX_STRING_LENGTH = 200;
const MAX_ARRAY_LENGTH = 20;
const VALID_DEVICES = new Set(["desktop", "mobile", "tablet"]);
const VALID_ENGAGEMENT_LEVELS = new Set(["low", "medium", "high"]);
const VALID_TEMPERATURES = new Set(["cold", "warm", "hot", "burning"]);

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

function sanitizeString(value: unknown, maxLen: number = MAX_STRING_LENGTH): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > maxLen) return undefined;
  return trimmed;
}

function sanitizeStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const result: string[] = [];
  for (const item of value.slice(0, MAX_ARRAY_LENGTH)) {
    const s = sanitizeString(item);
    if (s) result.push(s);
  }
  return result.length > 0 ? result : undefined;
}

function sanitizeNumber(value: unknown, min: number, max: number): number | undefined {
  if (typeof value !== "number" || !isFinite(value)) return undefined;
  return Math.max(min, Math.min(max, value));
}

function buildContext(body: Record<string, unknown>): PersonalizationContext {
  const device = sanitizeString(body.device);
  const engagementLevel = sanitizeString(body.engagementLevel);
  const temperature = sanitizeString(body.temperature);

  return {
    visitorId: sanitizeString(body.visitorId),
    niche: sanitizeString(body.niche),
    funnelFamily: sanitizeString(body.funnelFamily),
    funnelStage: sanitizeString(body.funnelStage),
    source: sanitizeString(body.source),
    device: device && VALID_DEVICES.has(device) ? device : undefined,
    isReturning: typeof body.isReturning === "boolean" ? body.isReturning : undefined,
    sessionCount: sanitizeNumber(body.sessionCount, 0, 10000),
    score: sanitizeNumber(body.score, 0, 100),
    interests: sanitizeStringArray(body.interests),
    engagementLevel: engagementLevel && VALID_ENGAGEMENT_LEVELS.has(engagementLevel)
      ? engagementLevel as PersonalizationContext["engagementLevel"]
      : undefined,
    persona: sanitizeString(body.persona),
    objections: sanitizeStringArray(body.objections),
    temperature: temperature && VALID_TEMPERATURES.has(temperature)
      ? temperature as PersonalizationContext["temperature"]
      : undefined,
  };
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const ip = getClientIp(request);
  const rateResult = rateLimiter.check(`personalization:${ip}`);
  if (!rateResult.allowed) {
    return NextResponse.json(
      { data: null, error: { code: "RATE_LIMITED", message: "Too many requests" }, meta: null },
      { status: 429, headers },
    );
  }

  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Content-Type must be application/json" }, meta: null },
        { status: 415, headers },
      );
    }

    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Request body must be a JSON object" }, meta: null },
        { status: 400, headers },
      );
    }

    const context = buildContext(body as Record<string, unknown>);
    const experience = personalize(context);

    return NextResponse.json(
      { data: experience, error: null, meta: { personalizedAt: new Date().toISOString() } },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "PERSONALIZATION_FAILED", message: "Failed to generate personalized experience" }, meta: null },
      { status: 400, headers },
    );
  }
}

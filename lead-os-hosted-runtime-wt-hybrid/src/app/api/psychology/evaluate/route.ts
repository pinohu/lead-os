import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { evaluatePsychology, type PsychologyProfile } from "@/lib/psychology-engine";

const MAX_STAGE_LENGTH = 100;
const MAX_DEVICE_LENGTH = 50;
const MAX_OBJECTIONS_COUNT = 20;
const MAX_OBJECTION_LENGTH = 200;
const MAX_SCORE = 100;
const MAX_TIME = 86400;
const MAX_PAGES = 1000;

function safeNumber(value: unknown, max: number, min: number = 0): number {
  if (typeof value !== "number" || !isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
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

    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Request body must be a JSON object" }, meta: null },
        { status: 400, headers },
      );
    }

    const objections = Array.isArray(body.objections)
      ? body.objections
          .filter((o: unknown): o is string => typeof o === "string" && o.length <= MAX_OBJECTION_LENGTH)
          .slice(0, MAX_OBJECTIONS_COUNT)
      : [];

    const profile: PsychologyProfile = {
      leadScore: safeNumber(body.leadScore, MAX_SCORE),
      trustScore: safeNumber(body.trustScore, MAX_SCORE),
      urgencyScore: safeNumber(body.urgencyScore, MAX_SCORE),
      stage: typeof body.stage === "string" ? body.stage.slice(0, MAX_STAGE_LENGTH) : "awareness",
      returning: typeof body.returning === "boolean" ? body.returning : false,
      device: typeof body.device === "string" ? body.device.slice(0, MAX_DEVICE_LENGTH) : "desktop",
      objections,
      timeOnSite: safeNumber(body.timeOnSite, MAX_TIME),
      pagesViewed: safeNumber(body.pagesViewed, MAX_PAGES),
    };

    const directive = evaluatePsychology(profile);

    return NextResponse.json(
      { data: directive, error: null, meta: { evaluatedAt: new Date().toISOString() } },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "EVALUATE_FAILED", message: "Failed to evaluate psychology profile" }, meta: null },
      { status: 400, headers },
    );
  }
}

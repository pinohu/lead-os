import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import {
  listIngressRules,
  createIngressRule,
  type IngressChannel,
  type IntentLevel,
} from "@/lib/ingress-engine";
import { tenantConfig } from "@/lib/tenant";

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? tenantConfig.tenantId;

    const rules = await listIngressRules(tenantId);

    return NextResponse.json(
      { data: rules, error: null, meta: { count: rules.length } },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "LIST_FAILED", message: "Failed to list ingress rules" }, meta: null },
      { status: 500, headers },
    );
  }
}

const VALID_CHANNELS = new Set<IngressChannel>([
  "seo", "paid-search", "paid-social", "organic-social",
  "referral", "directory", "email", "partner", "direct",
]);

const VALID_INTENT_LEVELS = new Set<IntentLevel>(["high", "medium", "low"]);
const MAX_FUNNEL_TYPE_LENGTH = 100;
const MAX_KEYWORD_LENGTH = 200;
const MAX_KEYWORDS_COUNT = 50;
const MAX_PATTERN_LENGTH = 500;
const MAX_PATTERNS_COUNT = 20;
const MAX_SCORE_BOOST = 30;
const MAX_PRIORITY = 1000;

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

    if (!body.channel || !VALID_CHANNELS.has(body.channel)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `channel must be one of: ${[...VALID_CHANNELS].join(", ")}` }, meta: null },
        { status: 400, headers },
      );
    }

    if (!body.intentLevel || !VALID_INTENT_LEVELS.has(body.intentLevel)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "intentLevel must be high, medium, or low" }, meta: null },
        { status: 400, headers },
      );
    }

    if (!body.funnelType || typeof body.funnelType !== "string" || body.funnelType.length > MAX_FUNNEL_TYPE_LENGTH) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "funnelType is required and must be a string" }, meta: null },
        { status: 400, headers },
      );
    }

    const scoreBoost = typeof body.initialScoreBoost === "number"
      ? Math.max(0, Math.min(MAX_SCORE_BOOST, body.initialScoreBoost))
      : 0;

    const priority = typeof body.priority === "number"
      ? Math.max(0, Math.min(MAX_PRIORITY, body.priority))
      : 0;

    let keywords: string[] | undefined;
    if (Array.isArray(body.keywords)) {
      keywords = body.keywords
        .filter((k: unknown): k is string => typeof k === "string" && k.length <= MAX_KEYWORD_LENGTH)
        .slice(0, MAX_KEYWORDS_COUNT);
    }

    let sourcePatterns: string[] | undefined;
    if (Array.isArray(body.sourcePatterns)) {
      sourcePatterns = body.sourcePatterns
        .filter((p: unknown): p is string => typeof p === "string" && p.length <= MAX_PATTERN_LENGTH)
        .slice(0, MAX_PATTERNS_COUNT);
    }

    const tenantId = typeof body.tenantId === "string" ? body.tenantId : tenantConfig.tenantId;

    const rule = await createIngressRule({
      tenantId,
      channel: body.channel,
      intentLevel: body.intentLevel,
      funnelType: body.funnelType.trim(),
      keywords,
      sourcePatterns,
      initialScoreBoost: scoreBoost,
      priority,
      active: body.active !== false,
    });

    return NextResponse.json(
      { data: rule, error: null, meta: null },
      { status: 201, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: "Failed to create ingress rule" }, meta: null },
      { status: 400, headers },
    );
  }
}

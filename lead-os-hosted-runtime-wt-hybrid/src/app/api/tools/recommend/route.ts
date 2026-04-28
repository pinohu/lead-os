import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { buildCorsHeaders } from "@/lib/cors";
import { getRecommendedTools, getToolsByPriority } from "@/lib/tool-catalog";

const VALID_GOALS = [
  "increase-leads",
  "improve-conversion",
  "automate-followup",
  "manage-reputation",
  "scale-advertising",
  "content-marketing",
  "close-more-deals",
  "reduce-churn",
] as const;

const bodySchema = z.object({
  niche: z
    .string()
    .min(2, "Niche must be at least 2 characters.")
    .max(100, "Niche must be 100 characters or fewer."),
  goals: z
    .array(z.enum(VALID_GOALS))
    .max(8, "Provide at most 8 goals.")
    .default([]),
  limit: z.number().int().min(1).max(50).default(12),
  priorityFilter: z
    .enum(["critical", "high", "medium", "low"])
    .optional(),
});

export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(request.headers.get("origin")) });
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const corsHeaders = buildCorsHeaders(request.headers.get("origin"));

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "INVALID_JSON",
          message: "Request body must be valid JSON.",
          details: [],
        },
        meta: { requestId },
      },
      { status: 400, headers: corsHeaders }
    );
  }

  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "VALIDATION_FAILED",
          message: "Request body failed validation.",
          details: parsed.error.issues.map((e) => ({
            field: e.path.join("."),
            issue: e.message,
          })),
        },
        meta: { requestId },
      },
      { status: 422, headers: corsHeaders }
    );
  }

  const { niche, goals, limit, priorityFilter } = parsed.data;

  let recommended = getRecommendedTools(niche, goals);

  if (priorityFilter) {
    recommended = recommended.filter((t) => t.priority === priorityFilter);
  }

  const sliced = recommended.slice(0, limit);

  const criticalTools = getToolsByPriority("critical").map((t) => t.slug);
  const missingCritical = criticalTools.filter(
    (slug) => !sliced.some((t) => t.slug === slug)
  );

  return NextResponse.json(
    {
      data: {
        niche,
        goals,
        recommended: sliced,
        total: sliced.length,
        missingCriticalTools: missingCritical,
      },
      error: null,
      meta: {
        requestId,
        validGoals: VALID_GOALS,
      },
    },
    { status: 200, headers: corsHeaders }
  );
}

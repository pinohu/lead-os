import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { buildCorsHeaders } from "@/lib/cors";
import {
  getToolCatalog,
  getToolsByCategory,
  getToolsByMapping,
  getToolsByPriority,
  type ToolCategory,
  type LeadOsEngine,
  type ToolPriority,
} from "@/lib/tool-catalog";

const querySchema = z.object({
  category: z
    .enum([
      "crm",
      "communication",
      "capture",
      "tracking",
      "advertising",
      "seo",
      "automation",
      "billing",
      "content",
      "data",
      "booking",
      "reviews",
      "directories",
      "commerce",
      "builders",
    ])
    .optional(),
  priority: z.enum(["critical", "high", "medium", "low"]).optional(),
  mapping: z
    .enum([
      "ingress",
      "capture",
      "scoring",
      "distribution",
      "creative",
      "psychology",
      "monetization",
      "fulfillment",
      "analytics",
      "automation",
    ])
    .optional(),
});

export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(request.headers.get("origin")) });
}

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const corsHeaders = buildCorsHeaders(request.headers.get("origin"));

  const rawParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = querySchema.safeParse(rawParams);

  if (!parsed.success) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "INVALID_QUERY",
          message: "One or more query parameters are invalid.",
          details: parsed.error.issues.map((e) => ({
            field: e.path.join("."),
            issue: e.message,
          })),
        },
        meta: { requestId },
      },
      { status: 400, headers: corsHeaders }
    );
  }

  const { category, priority, mapping } = parsed.data;

  let tools = getToolCatalog().tools;

  if (category) {
    tools = getToolsByCategory(category as ToolCategory);
  }

  if (priority) {
    tools = tools.filter((t) => t.priority === (priority as ToolPriority));
  }

  if (mapping) {
    tools = tools.filter((t) => t.leadOsMapping === (mapping as LeadOsEngine));
  }

  const catalog = getToolCatalog();

  return NextResponse.json(
    {
      data: {
        version: catalog.version,
        updatedAt: catalog.updatedAt,
        tools,
        total: tools.length,
      },
      error: null,
      meta: {
        requestId,
        filters: { category: category ?? null, priority: priority ?? null, mapping: mapping ?? null },
      },
    },
    { status: 200, headers: corsHeaders }
  );
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  CANONICAL_NODE_LIBRARY,
  buildDefaultFunnelGraphs,
} from "@/lib/funnel-library";
import { logger } from "@/lib/logger";
import type { FunnelFamily, NodeType } from "@/lib/runtime-schema";

const FUNNEL_FAMILIES: FunnelFamily[] = [
  "lead-magnet",
  "qualification",
  "chat",
  "webinar",
  "authority",
  "checkout",
  "retention",
  "rescue",
  "referral",
  "continuity",
];

const CreateFunnelSchema = z.object({
  tenantId: z.string().min(1, "tenantId is required"),
  name: z.string().min(1, "name is required").max(200),
  nodes: z.array(z.tuple([z.string(), z.string()])).optional(),
});

export async function GET() {
  try {
    const nodeTypes = Object.entries(CANONICAL_NODE_LIBRARY).map(
      ([type, meta]) => ({
        type,
        channel: meta.channel,
        purpose: meta.purpose,
      }),
    );

    return NextResponse.json({
      data: {
        families: FUNNEL_FAMILIES,
        nodeTypes,
        totalNodeTypes: nodeTypes.length,
        totalFamilies: FUNNEL_FAMILIES.length,
      },
      error: null,
    });
  } catch (err) {
    logger.error("GET /api/funnel failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to retrieve funnel library" } },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid JSON body" } },
        { status: 400 },
      );
    }

    const parsed = CreateFunnelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues.map((e) => e.message).join("; "),
            details: parsed.error.issues,
          },
        },
        { status: 422 },
      );
    }

    const { tenantId, name, nodes } = parsed.data;

    // If nodes are provided, validate them; otherwise return all default graphs
    if (nodes && nodes.length > 0) {
      // Validate that all node types exist in the canonical library
      const validNodeTypes = new Set(Object.keys(CANONICAL_NODE_LIBRARY));
      const invalidNodes = nodes.filter(([type]) => !validNodeTypes.has(type));
      if (invalidNodes.length > 0) {
        return NextResponse.json(
          {
            data: null,
            error: {
              code: "VALIDATION_ERROR",
              message: `Invalid node types: ${invalidNodes.map(([t]) => t).join(", ")}`,
            },
          },
          { status: 400 },
        );
      }

      return NextResponse.json({
        data: {
          name,
          tenantId,
          nodes: nodes.map(([type, label]) => ({
            type,
            label,
            ...CANONICAL_NODE_LIBRARY[type as NodeType],
          })),
          createdAt: new Date().toISOString(),
        },
        error: null,
      });
    }

    // Default: return all pre-built funnel graphs for the tenant
    const graphs = buildDefaultFunnelGraphs(tenantId);

    return NextResponse.json({
      data: {
        tenantId,
        graphs,
        createdAt: new Date().toISOString(),
      },
      error: null,
    });
  } catch (err) {
    logger.error("POST /api/funnel failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { data: null, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 },
    );
  }
}

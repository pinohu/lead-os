import { NextRequest, NextResponse } from "next/server";
import {
  CANONICAL_NODE_LIBRARY,
  buildDefaultFunnelGraphs,
  getDefaultFunnelGraph,
} from "@/lib/funnel-library";
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
      success: true,
      data: {
        families: FUNNEL_FAMILIES,
        nodeTypes,
        totalNodeTypes: nodeTypes.length,
        totalFamilies: FUNNEL_FAMILIES.length,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to retrieve funnel library" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const { nodes, name, tenantId } = body as {
      nodes?: Array<[NodeType, string]>;
      name?: string;
      tenantId?: string;
    };

    if (!tenantId || typeof tenantId !== "string") {
      return NextResponse.json(
        { success: false, error: "tenantId is required" },
        { status: 400 },
      );
    }
    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { success: false, error: "name is required" },
        { status: 400 },
      );
    }

    // If nodes are provided, validate them; otherwise return all default graphs
    if (nodes && Array.isArray(nodes)) {
      // Validate that all node types exist in the canonical library
      const validNodeTypes = new Set(Object.keys(CANONICAL_NODE_LIBRARY));
      const invalidNodes = nodes.filter(([type]) => !validNodeTypes.has(type));
      if (invalidNodes.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid node types: ${invalidNodes.map(([t]) => t).join(", ")}`,
          },
          { status: 400 },
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          name,
          tenantId,
          nodes: nodes.map(([type, label]) => ({
            type,
            label,
            ...CANONICAL_NODE_LIBRARY[type],
          })),
          createdAt: new Date().toISOString(),
        },
      });
    }

    // Default: return all pre-built funnel graphs for the tenant
    const graphs = buildDefaultFunnelGraphs(tenantId);

    return NextResponse.json({
      success: true,
      data: {
        tenantId,
        graphs,
        createdAt: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { generateDesignMd, exportDesignMdForStitch, exportDesignMdForAgent } from "@/lib/design-md";

const VALID_FORMATS = new Set(["stitch", "agent", "raw"]);

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId");
    const format = url.searchParams.get("format") ?? "raw";

    if (!tenantId) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (!VALID_FORMATS.has(format)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "format must be stitch, agent, or raw" }, meta: null },
        { status: 400, headers },
      );
    }

    let markdown: string;
    switch (format) {
      case "stitch":
        markdown = await exportDesignMdForStitch(tenantId);
        break;
      case "agent":
        markdown = await exportDesignMdForAgent(tenantId);
        break;
      default:
        markdown = await generateDesignMd(tenantId);
        break;
    }

    return NextResponse.json(
      { data: { markdown, format }, error: null, meta: { tenantId } },
      { headers },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to export design.md";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json(
      { data: null, error: { code: "EXPORT_FAILED", message }, meta: null },
      { status, headers },
    );
  }
}

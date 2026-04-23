import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { getDesignForTenant, renderDesignPreviewHtml } from "@/lib/design-md";
import { getTenant } from "@/lib/tenant-store";

export async function GET(request: Request) {
  const corsHeaders = buildCorsHeaders(request.headers.get("origin"));

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId is required" }, meta: null },
        { status: 400, headers: corsHeaders },
      );
    }

    const tenant = await getTenant(tenantId);
    if (!tenant) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Tenant not found" }, meta: null },
        { status: 404, headers: corsHeaders },
      );
    }

    const design = getDesignForTenant(tenant);
    const html = renderDesignPreviewHtml(design);

    return new NextResponse(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "PREVIEW_FAILED", message: "Failed to generate design preview" }, meta: null },
      { status: 500, headers: corsHeaders },
    );
  }
}

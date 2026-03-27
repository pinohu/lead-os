import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { parseExternalDesignMd, mergeDesignSystems, getDesignForTenant } from "@/lib/design-md";
import { getTenant } from "@/lib/tenant-store";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const body = await request.json();

    if (!body.tenantId || typeof body.tenantId !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (!body.markdown || typeof body.markdown !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "markdown is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const tenant = await getTenant(body.tenantId);
    if (!tenant) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Tenant not found" }, meta: null },
        { status: 404, headers },
      );
    }

    const baseDesign = getDesignForTenant(tenant);
    const externalDesign = parseExternalDesignMd(body.markdown);
    const merged = mergeDesignSystems(baseDesign, externalDesign);

    return NextResponse.json(
      { data: { design: merged, importedFields: Object.keys(externalDesign) }, error: null, meta: { tenantId: body.tenantId } },
      { status: 200, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "IMPORT_FAILED", message: "Failed to import design.md" }, meta: null },
      { status: 500, headers },
    );
  }
}

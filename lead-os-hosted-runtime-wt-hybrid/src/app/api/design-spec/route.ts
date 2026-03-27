import { NextResponse } from "next/server";
import { parseDesignSpec, validateDesignSpec } from "@/lib/design-spec.ts";
import { createDesignSpec, listSpecs } from "@/lib/design-spec-store.ts";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");

  if (!tenantId) {
    return NextResponse.json(
      { error: { code: "MISSING_PARAM", message: "tenantId query parameter is required" } },
      { status: 400 },
    );
  }

  const specs = await listSpecs(tenantId);
  return NextResponse.json({ data: specs, meta: { count: specs.length } });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tenantId = body.tenantId as string | undefined;

    if (!tenantId) {
      return NextResponse.json(
        { error: { code: "MISSING_FIELD", message: "tenantId is required in the request body" } },
        { status: 400 },
      );
    }

    let spec;
    if (typeof body.markdown === "string") {
      spec = parseDesignSpec(body.markdown);
    } else if (body.spec && typeof body.spec === "object") {
      const validation = validateDesignSpec(body.spec);
      if (!validation.valid) {
        return NextResponse.json(
          { error: { code: "VALIDATION_FAILED", message: "Spec validation failed", details: validation.errors } },
          { status: 422 },
        );
      }
      spec = parseDesignSpec(JSON.stringify(body.spec));
    } else {
      return NextResponse.json(
        { error: { code: "INVALID_BODY", message: "Provide either 'markdown' (string) or 'spec' (object) in the request body" } },
        { status: 400 },
      );
    }

    const stored = await createDesignSpec(tenantId, spec);
    return NextResponse.json({ data: stored }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: { code: "PARSE_ERROR", message: error instanceof Error ? error.message : "Failed to parse design spec" } },
      { status: 400 },
    );
  }
}

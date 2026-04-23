import { NextResponse } from "next/server";
import { parseDesignSpec, validateDesignSpec } from "@/lib/design-spec.ts";
import { createDesignSpec, listSpecs } from "@/lib/design-spec-store.ts";
import { z } from "zod";

const DesignSpecSchema = z.object({
  tenantId: z.string().min(1).max(100),
  markdown: z.string().min(1).max(50_000).optional(),
  spec: z.record(z.string(), z.unknown()).optional(),
}).refine((data) => Boolean(data.markdown || data.spec), {
  message: "Provide either 'markdown' (string) or 'spec' (object)",
});

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
    const raw = await request.json();

    const zodValidation = DesignSpecSchema.safeParse(raw);
    if (!zodValidation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: zodValidation.error.issues }, meta: {} },
        { status: 422 },
      );
    }
    const body = zodValidation.data;

    let spec;
    if (body.markdown) {
      spec = parseDesignSpec(body.markdown);
    } else if (body.spec) {
      const specValidation = validateDesignSpec(body.spec);
      if (!specValidation.valid) {
        return NextResponse.json(
          { error: { code: "VALIDATION_FAILED", message: "Spec validation failed", details: specValidation.errors } },
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

    const stored = await createDesignSpec(body.tenantId, spec);
    return NextResponse.json({ data: stored }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: { code: "PARSE_ERROR", message: error instanceof Error ? error.message : "Failed to parse design spec" } },
      { status: 400 },
    );
  }
}

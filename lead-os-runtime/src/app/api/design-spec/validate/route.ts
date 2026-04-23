import { NextResponse } from "next/server";
import { validateDesignSpec } from "@/lib/design-spec.ts";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const spec = body.spec ?? body;

    const result = validateDesignSpec(spec);

    return NextResponse.json({
      data: {
        valid: result.valid,
        errors: result.errors,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: { code: "PARSE_ERROR", message: error instanceof Error ? error.message : "Invalid request body" } },
      { status: 400 },
    );
  }
}

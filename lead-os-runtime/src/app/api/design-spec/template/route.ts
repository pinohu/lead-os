import { NextResponse } from "next/server";
import { generateDesignSpecTemplate } from "@/lib/design-spec.ts";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const nicheName = body.nicheName as string | undefined;

    if (!nicheName || typeof nicheName !== "string" || nicheName.trim().length < 2) {
      return NextResponse.json(
        { error: { code: "MISSING_FIELD", message: "nicheName (min 2 chars) is required" } },
        { status: 400 },
      );
    }

    const industry = typeof body.industry === "string" ? body.industry : undefined;
    const markdown = generateDesignSpecTemplate(nicheName.trim(), industry);

    return NextResponse.json({ data: { markdown } });
  } catch (error) {
    return NextResponse.json(
      { error: { code: "TEMPLATE_ERROR", message: error instanceof Error ? error.message : "Failed to generate template" } },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";

const CaptureSchema = z.object({
  email: z.string().email("Valid email is required"),
  source: z.string().max(100).default("website"),
});

export async function POST(req: NextRequest) {
  try {
    // Try JSON body first, fall back to FormData
    let rawData: Record<string, unknown> | null = null;

    const body = await req.json().catch(() => null);
    if (body) {
      rawData = body;
    } else {
      const formData = await req.formData().catch(() => null);
      if (formData) {
        rawData = {
          email: formData.get("email") as string,
          source: (formData.get("source") as string) || "website",
        };
      }
    }

    if (!rawData) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "No data provided" } },
        { status: 400 },
      );
    }

    const parsed = CaptureSchema.safeParse(rawData);
    if (!parsed.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues.map((e) => e.message).join("; "),
          },
        },
        { status: 400 },
      );
    }

    const { email, source } = parsed.data;

    logger.info("Lead captured", { email, source });

    return NextResponse.json({
      data: { message: "Thanks! Check your inbox for next steps.", email, source },
      error: null,
    });
  } catch (err) {
    logger.error("POST /api/capture failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { data: null, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 },
    );
  }
}

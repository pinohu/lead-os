import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

const ConfigureSchema = z.object({
  brandName: z.string().min(1, "brandName is required").max(80, "brandName must be at most 80 characters").trim(),
  supportEmail: z.string().email("supportEmail must be a valid email address").trim(),
  defaultNiche: z.string().min(1, "defaultNiche is required").trim(),
  accent: z.string().regex(HEX_COLOR_RE, "accent must be a valid 6-digit hex colour (e.g. #14b8a6)").trim(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid JSON in request body" } },
        { status: 400 },
      );
    }

    const parsed = ConfigureSchema.safeParse(body);
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

    const payload = parsed.data;

    // Apply configuration to the running process. These values override the
    // module-level tenantConfig object for the lifetime of this process. In a
    // production deployment with a database, the operator should persist these
    // as environment variables or tenant-store records and redeploy.
    const { tenantConfig } = await import("@/lib/tenant");
    tenantConfig.brandName = payload.brandName;
    tenantConfig.supportEmail = payload.supportEmail;
    tenantConfig.defaultNiche = payload.defaultNiche;
    tenantConfig.accent = payload.accent;

    return NextResponse.json({
      data: {
        message: "Configuration applied to the running process. To persist these values across restarts, set the corresponding environment variables and redeploy.",
      },
      error: null,
    });
  } catch (err) {
    logger.error("POST /api/setup/configure failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "INTERNAL_ERROR",
          message: "Configuration could not be applied",
        },
      },
      { status: 500 },
    );
  }
}

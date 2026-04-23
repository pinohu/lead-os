import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { integrationMap, getAutomationHealth, runSmokeTest } from "@/lib/providers";

const ConfigureProviderSchema = z.object({
  provider: z.string().min(1, "provider name is required"),
  config: z.record(z.string(), z.unknown()).refine((v) => Object.keys(v).length > 0, {
    message: "config object must not be empty",
  }),
});

export async function GET() {
  try {
    const statuses = Object.entries(integrationMap).map(
      ([provider, config]) => ({
        provider,
        status: config.configured
          ? config.live
            ? ("configured" as const)
            : ("dry-run" as const)
          : ("missing" as const),
        owner: config.owner,
        responsibility: config.responsibility,
      }),
    );

    const health = getAutomationHealth();

    const configured = statuses.filter((s) => s.status === "configured").length;
    const dryRun = statuses.filter((s) => s.status === "dry-run").length;
    const missing = statuses.filter((s) => s.status === "missing").length;

    return NextResponse.json({
      data: {
        providers: statuses,
        summary: { configured, dryRun, missing, total: statuses.length },
        health,
        timestamp: new Date().toISOString(),
      },
      error: null,
    });
  } catch (err) {
    logger.error("GET /api/providers failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to retrieve provider statuses" } },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid JSON body" } },
        { status: 400 },
      );
    }

    const parsed = ConfigureProviderSchema.safeParse(body);
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

    const { provider, config } = parsed.data;

    // Validate the provider exists in the integration map
    const knownProviders = Object.keys(integrationMap);
    if (!knownProviders.includes(provider)) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: `Unknown provider "${provider}". Valid providers: ${knownProviders.join(", ")}`,
          },
        },
        { status: 400 },
      );
    }

    // Run a dry-run smoke test to validate connectivity
    const smokeResult = await runSmokeTest(true);

    return NextResponse.json({
      data: {
        provider,
        action: "configuration_validated",
        smokeTest: smokeResult,
        note: "Provider config accepted. Environment variables must be set at the deployment level for live mode.",
        updatedAt: new Date().toISOString(),
      },
      error: null,
    });
  } catch (err) {
    logger.error("POST /api/providers failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { data: null, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 },
    );
  }
}

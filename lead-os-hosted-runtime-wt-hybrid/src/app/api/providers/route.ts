import { NextRequest, NextResponse } from "next/server";
import { integrationMap, getAutomationHealth, runSmokeTest } from "@/lib/providers";

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
      success: true,
      data: {
        providers: statuses,
        summary: { configured, dryRun, missing, total: statuses.length },
        health,
        timestamp: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to retrieve provider statuses" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const { provider, config } = body as {
      provider?: string;
      config?: Record<string, unknown>;
    };

    if (!provider || typeof provider !== "string") {
      return NextResponse.json(
        { success: false, error: "provider name is required" },
        { status: 400 },
      );
    }

    // Validate the provider exists in the integration map
    const knownProviders = Object.keys(integrationMap);
    if (!knownProviders.includes(provider)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unknown provider "${provider}". Valid providers: ${knownProviders.join(", ")}`,
        },
        { status: 400 },
      );
    }

    if (!config || typeof config !== "object") {
      return NextResponse.json(
        { success: false, error: "config object is required" },
        { status: 400 },
      );
    }

    // Run a dry-run smoke test to validate connectivity
    const smokeResult = await runSmokeTest(true);

    return NextResponse.json({
      success: true,
      data: {
        provider,
        action: "configuration_validated",
        smokeTest: smokeResult,
        note: "Provider config accepted. Environment variables must be set at the deployment level for live mode.",
        updatedAt: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { listSmokeRoutes, runAutomationSmoke } from "@/lib/automation-smoke";

function getBaseUrl(request: Request) {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function GET() {
  return NextResponse.json({
    success: true,
    routes: listSmokeRoutes(),
  });
}

export async function POST(request: Request) {
  try {
    const baseUrl = getBaseUrl(request);
    const result = await runAutomationSmoke(baseUrl);
    return NextResponse.json(result, { status: result.success ? 200 : 502 });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Smoke test failed",
      },
      { status: 500 },
    );
  }
}

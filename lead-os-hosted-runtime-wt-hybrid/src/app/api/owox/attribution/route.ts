import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getAttributionReport } from "@/lib/integrations/owox-adapter";
import type { AttributionModel } from "@/lib/integrations/owox-adapter";

const VALID_MODELS: AttributionModel[] = [
  "last-click",
  "first-click",
  "linear",
  "time-decay",
  "position-based",
  "data-driven",
];

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const model = url.searchParams.get("model") ?? "last-click";
    const period = url.searchParams.get("period") ?? "current";
    const tenantId = url.searchParams.get("tenantId") ?? undefined;

    if (!VALID_MODELS.includes(model as AttributionModel)) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: `Invalid attribution model. Must be one of: ${VALID_MODELS.join(", ")}`,
          },
          meta: null,
        },
        { status: 422, headers },
      );
    }

    const report = await getAttributionReport(model as AttributionModel, period, tenantId);

    return NextResponse.json(
      { data: report, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    console.error("[owox/attribution GET]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to generate attribution report" }, meta: null },
      { status: 500, headers },
    );
  }
}

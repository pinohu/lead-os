import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getOrgChart } from "@/lib/integrations/clodura-adapter";

const OrgChartSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
});

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const raw = await request.json();
    const validation = OrgChartSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "VALIDATION_ERROR", message: "Invalid org chart parameters", details: validation.error.issues },
          meta: null,
        },
        { status: 422, headers },
      );
    }

    const orgChart = await getOrgChart(validation.data.companyName);
    const totalContacts = orgChart.departments.reduce((sum, d) => sum + d.contacts.length, 0);

    return NextResponse.json(
      {
        data: orgChart,
        error: null,
        meta: { departments: orgChart.departments.length, totalContacts },
      },
      { headers },
    );
  } catch (err) {
    logger.error("clodura/org-chart POST failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "ORG_CHART_FAILED", message: "Failed to retrieve org chart" }, meta: null },
      { status: 500, headers },
    );
  }
}

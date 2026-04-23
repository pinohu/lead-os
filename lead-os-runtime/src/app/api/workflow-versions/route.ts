import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  listTenantWorkflows,
  getWorkflowInvestmentReport,
} from "@/lib/workflow-versioning";

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { session, response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;
  void session;

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "VALIDATION_ERROR", message: "tenantId is required" },
          meta: null,
        },
        { status: 400, headers },
      );
    }

    const [workflows, report] = await Promise.all([
      listTenantWorkflows(tenantId),
      getWorkflowInvestmentReport(tenantId),
    ]);

    return NextResponse.json(
      { data: workflows, error: null, meta: report },
      { headers },
    );
  } catch {
    return NextResponse.json(
      {
        data: null,
        error: { code: "FETCH_FAILED", message: "Failed to list tenant workflows" },
        meta: null,
      },
      { status: 500, headers },
    );
  }
}

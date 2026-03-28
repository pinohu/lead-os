import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { getBudgetStatus } from "@/lib/integrations/paperclip-connector";
import { z } from "zod";

const BudgetQuerySchema = z.object({
  companyId: z.string().min(1).max(200),
});

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const url = new URL(request.url);
    const companyId = url.searchParams.get("companyId") ?? "";

    const validation = BudgetQuerySchema.safeParse({ companyId });
    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "companyId query parameter is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const status = await getBudgetStatus(validation.data.companyId);

    return NextResponse.json(
      { data: status, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: err instanceof Error ? err.message : "Failed to get budget status" }, meta: null },
      { status: 500, headers },
    );
  }
}

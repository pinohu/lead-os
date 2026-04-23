import { NextResponse } from "next/server";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getAutoboundStats } from "@/lib/integrations/autobound-adapter";

export async function GET(request: Request) {
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId") ?? undefined;

  const stats = getAutoboundStats(tenantId);

  return NextResponse.json({
    data: stats,
    error: null,
    meta: null,
  });
}

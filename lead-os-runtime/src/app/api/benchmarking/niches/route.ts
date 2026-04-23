import { NextResponse } from "next/server";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { listAvailableNiches } from "@/lib/niche-benchmarking";

export async function GET(request: Request) {
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  const niches = await listAvailableNiches();

  return NextResponse.json({
    data: niches,
    error: null,
    meta: { count: niches.length },
  });
}

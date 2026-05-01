import { NextResponse } from "next/server";
import { getPublicProductionStatus } from "@/lib/public-production-status";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    data: getPublicProductionStatus(),
    error: null,
  });
}

import { NextResponse } from "next/server";
import { simulatePricingDecision } from "@/lib/pricing/engine";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const result = simulatePricingDecision({
      leads: body.leads ?? 0,
      revenue: body.revenue ?? 0,
      roi: body.roi ?? 0,
      churnRisk: body.churnRisk ?? "LOW",
      currentPrice: body.currentPrice,
    });

    return NextResponse.json({ ok: true, result });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

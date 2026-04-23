import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import {
  generateIntelligenceNurtureSequence,
  getNurtureEmailForStage,
  getAllIntelligenceNurtureSequences,
} from "@/lib/intelligence-driven-nurture";

export async function GET(request: Request) {
  const { context, response } = await requireAuth(request, "read:leads");
  if (response) return response;

  const url = new URL(request.url);
  const niche = url.searchParams.get("niche");
  const stage = url.searchParams.get("stage");

  if (!niche) {
    const all = getAllIntelligenceNurtureSequences();
    const summary = Object.entries(all).map(([key, seq]) => ({
      niche: key,
      nicheLabel: seq.nicheLabel,
      totalEmails: seq.totalEmails,
      strategy: seq.strategy,
    }));
    return NextResponse.json({ data: summary, error: null, meta: { count: summary.length } });
  }

  if (stage) {
    const email = getNurtureEmailForStage(niche, Number(stage));
    if (!email) {
      return NextResponse.json({
        data: null,
        error: { code: "STAGE_NOT_FOUND", message: `Stage ${stage} not found for niche ${niche}. Valid: 1-7` },
        meta: null,
      }, { status: 404 });
    }
    return NextResponse.json({ data: email, error: null, meta: { niche, stage: Number(stage) } });
  }

  const sequence = generateIntelligenceNurtureSequence(niche);
  return NextResponse.json({ data: sequence, error: null, meta: { niche } });
}

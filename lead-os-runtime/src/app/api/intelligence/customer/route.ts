import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { getCustomerIntelligenceOrDefault, getAllIntelligenceNiches, CUSTOMER_INTELLIGENCE } from "@/lib/customer-intelligence";

export async function GET(request: Request) {
  const { context, response } = await requireAuth(request, "read:analytics");
  if (response) return response;

  const url = new URL(request.url);
  const niche = url.searchParams.get("niche");
  const section = url.searchParams.get("section");

  if (!niche) {
    return NextResponse.json({
      data: { niches: getAllIntelligenceNiches(), count: getAllIntelligenceNiches().length },
      error: null,
      meta: { usage: "GET /api/intelligence/customer?niche=legal&section=objections" },
    });
  }

  const intel = getCustomerIntelligenceOrDefault(niche);

  if (section) {
    const sectionData = {
      icp: intel.icp,
      triggers: intel.buyingTriggers,
      journey: intel.decisionJourney,
      objections: intel.objections,
      trust: intel.trustSignals,
      psychology: intel.conversionPsychology,
      competitors: intel.competitors,
      content: intel.contentMap,
    }[section];

    if (!sectionData) {
      return NextResponse.json({
        data: null,
        error: { code: "INVALID_SECTION", message: `Valid sections: icp, triggers, journey, objections, trust, psychology, competitors, content` },
        meta: null,
      }, { status: 400 });
    }

    return NextResponse.json({ data: sectionData, error: null, meta: { niche, section } });
  }

  return NextResponse.json({ data: intel, error: null, meta: { niche } });
}

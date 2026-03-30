import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import {
  getIntelligenceForAnyNiche,
  getEnrichedIntelligenceForAnyNiche,
  getCacheSize,
  getCachedNiches,
} from "@/lib/dynamic-intelligence";
import { generateIntelligenceNurtureSequence } from "@/lib/intelligence-driven-nurture";

export async function GET(request: Request) {
  const { context, response } = await requireAuth(request, "read:analytics");
  if (response) return response;

  const url = new URL(request.url);
  const niche = url.searchParams.get("niche");
  const enrich = url.searchParams.get("enrich") === "true";
  const keywords = url.searchParams.get("keywords")?.split(",").map((k) => k.trim()).filter(Boolean);
  const includeNurture = url.searchParams.get("nurture") === "true";

  if (!niche) {
    return NextResponse.json({
      data: {
        description: "Dynamic Customer Intelligence Generator. Pass any niche name and get a full buyer research profile.",
        usage: "GET /api/intelligence/dynamic?niche=mobile+dog+grooming&enrich=true&nurture=true",
        cacheSize: getCacheSize(),
        cachedNiches: getCachedNiches(),
      },
      error: null,
      meta: null,
    });
  }

  if (enrich) {
    const result = await getEnrichedIntelligenceForAnyNiche(niche, keywords);
    const data: Record<string, unknown> = {
      profile: result.profile,
      source: result.source,
      enriched: result.enriched,
    };
    if (includeNurture) {
      data.nurtureSequence = generateIntelligenceNurtureSequence(result.profile.niche);
    }
    return NextResponse.json({ data, error: null, meta: { niche, enrich: true } });
  }

  const profile = getIntelligenceForAnyNiche(niche, keywords);
  const data: Record<string, unknown> = { profile };
  if (includeNurture) {
    data.nurtureSequence = generateIntelligenceNurtureSequence(profile.niche);
  }

  return NextResponse.json({ data, error: null, meta: { niche, enrich: false } });
}

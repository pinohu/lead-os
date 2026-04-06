import { NextRequest, NextResponse } from "next/server";
import { isPlainObject, enforceRateLimit, getRequestIdentity } from "@/lib/request-guards";
import { buildHeroExperience, type ExperienceProfile } from "@/lib/experience-engine";
import { recommendBlueprintForVisitor } from "@/lib/funnel-blueprints";

export async function POST(request: NextRequest) {
  try {
    const identity = getRequestIdentity(request);
    const rateLimit = enforceRateLimit(`decision:${identity}`, 30, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429 },
      );
    }

    const body = (await request.json()) as ExperienceProfile;

    if (!isPlainObject(body) || !isPlainObject(body.scores)) {
      return NextResponse.json({ error: "Invalid decision payload" }, { status: 400 });
    }

    const safeProfile: ExperienceProfile = {
      visitorId: typeof body.visitorId === "string" ? body.visitorId : undefined,
      scores: {
        engagement: Number(body.scores.engagement ?? 0),
        intent: Number(body.scores.intent ?? 0),
        composite: Number(body.scores.composite ?? 0),
      },
      capturedEmail: typeof body.capturedEmail === "string" ? body.capturedEmail : undefined,
      capturedPhone: typeof body.capturedPhone === "string" ? body.capturedPhone : undefined,
      assessmentCompleted: Boolean(body.assessmentCompleted),
      roiCalculatorUsed: Boolean(body.roiCalculatorUsed),
      chatEngaged: Boolean(body.chatEngaged),
      whatsappOptIn: Boolean(body.whatsappOptIn),
      sessions: Number(body.sessions ?? 1),
      pagesViewed: Array.isArray(body.pagesViewed) ? body.pagesViewed.filter((item): item is string => typeof item === "string") : [],
      nicheInterest: typeof body.nicheInterest === "string" ? body.nicheInterest : undefined,
      funnelStage: typeof body.funnelStage === "string" ? body.funnelStage : undefined,
      referralSource: typeof body.referralSource === "string" ? body.referralSource : undefined,
      utmSource: typeof body.utmSource === "string" ? body.utmSource : undefined,
      utmMedium: typeof body.utmMedium === "string" ? body.utmMedium : undefined,
    };

    return NextResponse.json({
      success: true,
      hero: buildHeroExperience(safeProfile),
      blueprint: recommendBlueprintForVisitor(safeProfile),
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  getCompetitor,
  updateCompetitor,
  addSnapshot,
  generateSnapshotId,
  type CompetitorSnapshot,
} from "@/lib/competitor-store";
import { ingestDesignFromScrape } from "@/lib/design-ingestion";
import { convertIngestionToDesignSpec } from "@/lib/design-ingestion-to-spec";
import { scrapePage } from "@/lib/integrations/web-scraper";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireOperatorApiSession(request);
  if (auth.response) {
    return auth.response;
  }

  const { id } = await context.params;
  const competitor = await getCompetitor(id);

  if (!competitor) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "Competitor not found", details: [] }, meta: null },
      { status: 404 },
    );
  }

  let scrapeResult;
  try {
    scrapeResult = await scrapePage(competitor.url);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown scrape error";

    competitor.status = "error";
    competitor.lastError = errorMessage;
    await updateCompetitor(competitor);

    return NextResponse.json(
      { data: null, error: { code: "SCRAPE_FAILED", message: `Failed to scrape ${competitor.url}`, details: [{ field: "url", issue: errorMessage }] }, meta: null },
      { status: 502 },
    );
  }

  const ingestion = ingestDesignFromScrape(scrapeResult);

  const suggestedSpec = competitor.nicheSlug
    ? convertIngestionToDesignSpec(ingestion)
    : undefined;

  const now = new Date().toISOString();

  const snapshot: CompetitorSnapshot = {
    id: generateSnapshotId(),
    competitorId: competitor.id,
    tenantId: competitor.tenantId,
    scrapedAt: now,
    colorCount: ingestion.tokens.colors.all.length,
    sectionCount: ingestion.layout.sectionCount,
    headlineCount: ingestion.copy.headlines.length,
    ctaCount: ingestion.copy.ctaLabels.length,
    hasChat: ingestion.funnel.hasChat,
    hasBooking: ingestion.funnel.hasBooking,
    hasPricing: ingestion.funnel.hasPricing,
    hasTestimonials: ingestion.funnel.hasTestimonials,
    confidence: ingestion.confidence,
    summary: buildSummary(ingestion),
  };

  await addSnapshot(snapshot);

  competitor.lastScrapedAt = now;
  competitor.scrapeCount = (competitor.scrapeCount ?? 0) + 1;
  competitor.status = "active";
  competitor.lastError = undefined;
  const updatedCompetitor = await updateCompetitor(competitor);

  return NextResponse.json({
    data: { competitor: updatedCompetitor, snapshot, ingestion, suggestedSpec: suggestedSpec ?? null },
    error: null,
    meta: null,
  });
}

function buildSummary(ingestion: ReturnType<typeof ingestDesignFromScrape>): string {
  const features = [
    ingestion.funnel.hasChat && "live chat",
    ingestion.funnel.hasBooking && "booking",
    ingestion.funnel.hasPricing && "pricing",
    ingestion.funnel.hasTestimonials && "testimonials",
    ingestion.funnel.hasVideo && "video",
    ingestion.funnel.hasFaq && "FAQ",
  ].filter(Boolean);

  const featureSummary = features.length > 0 ? ` Features: ${features.join(", ")}.` : "";
  return `${ingestion.layout.sectionCount} sections, ${ingestion.copy.headlines.length} headlines, ${ingestion.copy.ctaLabels.length} CTAs, ${ingestion.tokens.colors.all.length} colors (confidence: ${ingestion.confidence}/100).${featureSummary}`;
}

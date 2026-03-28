import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { getRevenueReport, getRevenueByNiche } from "@/lib/monetization-engine";
import { getNicheInsights } from "@/lib/data-moat";
import {
  segmentByLTV,
  calculateLTV,
  getRevenuePathMetrics,
  type RevenueHistoryEntry,
} from "@/lib/revenue-engine";
import { analyzeChannelPerformance } from "@/lib/channel-domination";
import { getLeadRecords } from "@/lib/runtime-store";

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? "default";
    const period = url.searchParams.get("period") ?? new Date().toISOString().slice(0, 7);

    const [leads, revenuePathMetrics] = await Promise.all([
      getLeadRecords(),
      getRevenuePathMetrics(tenantId),
    ]);

    const revenueReport = getRevenueReport(tenantId, period);
    const previousPeriodDate = new Date(period + "-01");
    previousPeriodDate.setMonth(previousPeriodDate.getMonth() - 1);
    const previousPeriod = previousPeriodDate.toISOString().slice(0, 7);
    const previousReport = getRevenueReport(tenantId, previousPeriod);

    const revenueTrend = previousReport.totalRevenue > 0
      ? Math.round(((revenueReport.totalRevenue - previousReport.totalRevenue) / previousReport.totalRevenue) * 10000) / 100
      : revenueReport.totalRevenue > 0 ? 100 : 0;

    const revenueByNiche = getRevenueByNiche(period);

    const niches = Object.keys(revenueByNiche);
    const nicheInsightsMap: Record<string, ReturnType<typeof getNicheInsights>> = {};
    for (const niche of niches) {
      nicheInsightsMap[niche] = getNicheInsights(niche);
    }

    const channelAnalysis = analyzeChannelPerformance(tenantId, period);
    const revenueByChannel: Record<string, number> = {};
    for (const ch of channelAnalysis) {
      revenueByChannel[ch.channel] = ch.revenuePerLead * ch.leadVolume;
    }

    const revenueBySource = revenueReport.breakdown;

    const revenueByFunnel: Record<string, number> = {};
    for (const lead of leads) {
      if (!lead.family) continue;
      const eventRevenue = revenueReport.events
        .filter((e) => e.metadata.leadKey === lead.leadKey)
        .reduce((s, e) => s + e.amount, 0);
      revenueByFunnel[lead.family] = (revenueByFunnel[lead.family] ?? 0) + eventRevenue;
    }

    const revenueByOffer: Record<string, number> = {};
    for (const event of revenueReport.events) {
      const offer = (event.metadata.offer as string) ?? event.source;
      revenueByOffer[offer] = (revenueByOffer[offer] ?? 0) + event.amount;
    }

    const leadLtvData: Array<{ leadId: string; ltv: number }> = [];
    const scoreTierCounts: Record<string, { total: number; converted: number }> = {
      "0-39": { total: 0, converted: 0 },
      "40-64": { total: 0, converted: 0 },
      "65-84": { total: 0, converted: 0 },
      "85-100": { total: 0, converted: 0 },
    };

    for (const lead of leads) {
      const score = lead.score ?? 0;
      let tierKey: string;
      if (score < 40) tierKey = "0-39";
      else if (score < 65) tierKey = "40-64";
      else if (score < 85) tierKey = "65-84";
      else tierKey = "85-100";

      scoreTierCounts[tierKey].total += 1;
      if (lead.status === "converted") {
        scoreTierCounts[tierKey].converted += 1;
      }

      const ltvEstimate = calculateLTV(
        { leadId: lead.leadKey, score },
        lead.niche ?? "unknown",
        [],
      );
      leadLtvData.push({ leadId: lead.leadKey, ltv: ltvEstimate.estimatedLTV });
    }

    const conversionByTier: Record<string, number> = {};
    for (const [tier, counts] of Object.entries(scoreTierCounts)) {
      conversionByTier[tier] = counts.total > 0
        ? Math.round((counts.converted / counts.total) * 10000) / 100
        : 0;
    }

    const ltvSegments = segmentByLTV(leadLtvData);

    const avgLtv = leadLtvData.length > 0
      ? Math.round(leadLtvData.reduce((s, l) => s + l.ltv, 0) / leadLtvData.length * 100) / 100
      : 0;

    const totalChannelCost = channelAnalysis.reduce((s, ch) => s + ch.costPerLead * ch.leadVolume, 0);
    const avgCac = leads.length > 0
      ? Math.round((totalChannelCost / leads.length) * 100) / 100
      : 0;
    const ltvCacRatio = avgCac > 0
      ? Math.round((avgLtv / avgCac) * 100) / 100
      : avgLtv > 0 ? 999 : 0;

    const topLeadsByValue = [...leadLtvData]
      .sort((a, b) => b.ltv - a.ltv)
      .slice(0, 10);

    const dailyRevenues: number[] = [];
    const eventsByDay = new Map<string, number>();
    for (const event of revenueReport.events) {
      const day = event.recordedAt.slice(0, 10);
      eventsByDay.set(day, (eventsByDay.get(day) ?? 0) + event.amount);
    }
    const sortedDays = Array.from(eventsByDay.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    for (const [, amount] of sortedDays) {
      dailyRevenues.push(amount);
    }

    let forecast30d = 0;
    let forecast90d = 0;
    if (dailyRevenues.length >= 2) {
      const n = dailyRevenues.length;
      const avgDailyRevenue = dailyRevenues.reduce((s, v) => s + v, 0) / n;
      const recentAvg = dailyRevenues.slice(-Math.min(7, n)).reduce((s, v) => s + v, 0) / Math.min(7, n);
      const dailyTrend = recentAvg > 0 ? (recentAvg - avgDailyRevenue) / avgDailyRevenue : 0;

      forecast30d = Math.round(recentAvg * 30 * (1 + dailyTrend * 0.5) * 100) / 100;
      forecast90d = Math.round(recentAvg * 90 * (1 + dailyTrend * 1.0) * 100) / 100;
    } else if (revenueReport.totalRevenue > 0) {
      forecast30d = Math.round(revenueReport.totalRevenue * 1.0 * 100) / 100;
      forecast90d = Math.round(revenueReport.totalRevenue * 3.0 * 100) / 100;
    }

    return NextResponse.json(
      {
        data: {
          totalRevenue: revenueReport.totalRevenue,
          revenueTrend,
          previousRevenue: previousReport.totalRevenue,
          revenueByNiche,
          revenueBySource,
          revenueByChannel,
          revenueByFunnel,
          revenueByOffer,
          ltvCacRatio,
          avgLtv,
          avgCac,
          ltvSegments,
          conversionByTier,
          scoreTierCounts,
          topLeadsByValue,
          forecast: {
            forecast30d,
            forecast90d,
            dailyRevenues,
          },
          revenuePathMetrics,
          period,
        },
        error: null,
        meta: {
          totalLeads: leads.length,
          eventCount: revenueReport.eventCount,
          nicheCount: niches.length,
          channelCount: channelAnalysis.length,
        },
      },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to aggregate revenue command data" }, meta: null },
      { status: 500, headers },
    );
  }
}

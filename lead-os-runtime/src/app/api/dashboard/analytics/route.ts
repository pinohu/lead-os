import { NextResponse } from "next/server";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getCanonicalEvents, getLeadRecords } from "@/lib/runtime-store";
import type { StoredLeadRecord } from "@/lib/runtime-store";
import type { CanonicalEvent } from "@/lib/trace";

function ratio(value: number, total: number): number {
  if (total <= 0) return 0;
  return Number(((value / total) * 100).toFixed(1));
}

function countBy<T extends string>(values: T[]): Record<string, number> {
  return values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function topBreakdown(values: string[], limit = 10) {
  return Object.entries(countBy(values))
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

function buildFunnelStages(leads: StoredLeadRecord[]) {
  const stageCounts = countBy(leads.map((lead) => lead.stage));
  const orderedStages = [
    "anonymous",
    "engaged",
    "captured",
    "qualified",
    "nurturing",
    "booked",
    "offered",
    "converted",
    "onboarding",
    "active",
    "retention-risk",
    "referral-ready",
    "churned",
  ];

  const stages = orderedStages.map((stage) => ({
    stage,
    count: stageCounts[stage] ?? 0,
  }));

  return stages.map((item, index) => {
    const prevCount = index === 0 ? leads.length : stages[index - 1].count;
    return {
      ...item,
      conversionFromPrevious: ratio(item.count, prevCount),
    };
  });
}

function buildScoreDistribution(leads: StoredLeadRecord[]) {
  const buckets = [
    { label: "0-10", min: 0, max: 10 },
    { label: "11-20", min: 11, max: 20 },
    { label: "21-30", min: 21, max: 30 },
    { label: "31-40", min: 31, max: 40 },
    { label: "41-50", min: 41, max: 50 },
    { label: "51-60", min: 51, max: 60 },
    { label: "61-70", min: 61, max: 70 },
    { label: "71-80", min: 71, max: 80 },
    { label: "81-90", min: 81, max: 90 },
    { label: "91-100", min: 91, max: 100 },
  ];

  return buckets.map((bucket) => ({
    label: bucket.label,
    count: leads.filter((lead) => lead.score >= bucket.min && lead.score <= bucket.max).length,
  }));
}

function buildChannelPerformance(leads: StoredLeadRecord[]) {
  const bySource: Record<string, { leads: number; conversions: number }> = {};

  for (const lead of leads) {
    const source = lead.source || "direct";
    if (!bySource[source]) {
      bySource[source] = { leads: 0, conversions: 0 };
    }
    bySource[source].leads += 1;
    if (["converted", "onboarding", "active", "retention-risk", "referral-ready"].includes(lead.stage)) {
      bySource[source].conversions += 1;
    }
  }

  return Object.entries(bySource)
    .map(([source, data]) => ({
      source,
      leads: data.leads,
      conversions: data.conversions,
      conversionRate: ratio(data.conversions, data.leads),
    }))
    .sort((a, b) => b.leads - a.leads);
}

function buildWeeklyTimeSeries(leads: StoredLeadRecord[]) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const weeks: { weekStart: string; weekEnd: string; count: number }[] = [];

  for (let i = 0; i < 5; i++) {
    const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
    const count = leads.filter((lead) => {
      const created = new Date(lead.createdAt);
      return created >= weekStart && created < weekEnd;
    }).length;
    weeks.unshift({
      weekStart: weekStart.toISOString().split("T")[0],
      weekEnd: weekEnd.toISOString().split("T")[0],
      count,
    });
  }

  return weeks;
}

function buildNichePerformance(leads: StoredLeadRecord[]) {
  const byNiche: Record<string, { leads: number; conversions: number; hotLeads: number; avgScore: number; totalScore: number }> = {};

  for (const lead of leads) {
    const niche = lead.niche || "unknown";
    if (!byNiche[niche]) {
      byNiche[niche] = { leads: 0, conversions: 0, hotLeads: 0, avgScore: 0, totalScore: 0 };
    }
    byNiche[niche].leads += 1;
    byNiche[niche].totalScore += lead.score;
    if (lead.hot) byNiche[niche].hotLeads += 1;
    if (["converted", "onboarding", "active", "retention-risk", "referral-ready"].includes(lead.stage)) {
      byNiche[niche].conversions += 1;
    }
  }

  return Object.entries(byNiche)
    .map(([niche, data]) => ({
      niche,
      leads: data.leads,
      conversions: data.conversions,
      hotLeads: data.hotLeads,
      avgScore: data.leads > 0 ? Number((data.totalScore / data.leads).toFixed(1)) : 0,
      conversionRate: ratio(data.conversions, data.leads),
    }))
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 10);
}

function buildFunnelPerformance(leads: StoredLeadRecord[]) {
  const byFamily: Record<string, { leads: number; conversions: number; hotLeads: number }> = {};

  for (const lead of leads) {
    const family = lead.family || "unknown";
    if (!byFamily[family]) {
      byFamily[family] = { leads: 0, conversions: 0, hotLeads: 0 };
    }
    byFamily[family].leads += 1;
    if (lead.hot) byFamily[family].hotLeads += 1;
    if (["converted", "onboarding", "active", "retention-risk", "referral-ready"].includes(lead.stage)) {
      byFamily[family].conversions += 1;
    }
  }

  return Object.entries(byFamily)
    .map(([family, data]) => ({
      family,
      leads: data.leads,
      conversions: data.conversions,
      hotLeads: data.hotLeads,
      conversionRate: ratio(data.conversions, data.leads),
    }))
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 10);
}

export async function GET(request: Request) {
  const auth = await requireOperatorApiSession(request);
  if (auth.response) {
    return auth.response;
  }

  const leads = await getLeadRecords();
  const events = await getCanonicalEvents();

  const totalLeads = leads.length;
  const hotLeads = leads.filter((lead) => lead.hot).length;
  const convertedLeads = leads.filter((lead) =>
    ["converted", "onboarding", "active", "retention-risk", "referral-ready"].includes(lead.stage),
  ).length;
  const avgScore = totalLeads > 0
    ? Number((leads.reduce((sum, lead) => sum + lead.score, 0) / totalLeads).toFixed(1))
    : 0;

  return NextResponse.json({
    success: true,
    data: {
      metrics: {
        totalLeads,
        conversionRate: ratio(convertedLeads, totalLeads),
        avgScore,
        hotLeads,
      },
      funnelStages: buildFunnelStages(leads),
      scoreDistribution: buildScoreDistribution(leads),
      channelPerformance: buildChannelPerformance(leads),
      weeklyTimeSeries: buildWeeklyTimeSeries(leads),
      nichePerformance: buildNichePerformance(leads),
      funnelPerformance: buildFunnelPerformance(leads),
    },
  });
}

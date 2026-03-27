import { NextResponse } from "next/server";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getLeadRecords } from "@/lib/runtime-store";
import type { StoredLeadRecord } from "@/lib/runtime-store";

function ratio(value: number, total: number): number {
  if (total <= 0) return 0;
  return Number(((value / total) * 100).toFixed(1));
}

type Temperature = "cold" | "warm" | "hot" | "burning";

function getTemperature(score: number): Temperature {
  if (score >= 90) return "burning";
  if (score >= 75) return "hot";
  if (score >= 40) return "warm";
  return "cold";
}

function buildScoreBreakdown(lead: StoredLeadRecord) {
  const score = lead.score;
  const hasMilestoneM2 = lead.milestones.leadMilestones.includes("lead-m2-return-engaged");
  const hasMilestoneM3 = lead.milestones.leadMilestones.includes("lead-m3-booked-or-offered");
  const visitCount = lead.milestones.visitCount;

  const intentScore = Math.min(100, Math.round(score * 0.35 + (hasMilestoneM3 ? 20 : 0)));
  const fitScore = Math.min(100, Math.round(score * 0.25 + (lead.niche ? 10 : 0)));
  const engagementScore = Math.min(100, Math.round(
    Math.min(visitCount * 15, 50) + (hasMilestoneM2 ? 30 : 0) + (lead.sentNurtureStages.length * 5),
  ));
  const urgencyScore = Math.min(100, Math.round(
    (lead.hot ? 40 : 0) +
    (["booked", "offered"].includes(lead.stage) ? 30 : 0) +
    Math.min(score * 0.3, 30),
  ));

  return { intent: intentScore, fit: fitScore, engagement: engagementScore, urgency: urgencyScore };
}

function getRecommendedActions(lead: StoredLeadRecord): string[] {
  const actions: string[] = [];
  const temp = getTemperature(lead.score);

  if (temp === "burning") {
    actions.push("Schedule immediate call");
    actions.push("Send personalized proposal");
  } else if (temp === "hot") {
    actions.push("Send case study email");
    actions.push("Schedule discovery call");
  } else if (temp === "warm") {
    actions.push("Add to nurture sequence");
    actions.push("Send relevant content");
  } else {
    actions.push("Continue monitoring");
    actions.push("Add to awareness campaign");
  }

  if (!lead.milestones.leadMilestones.includes("lead-m2-return-engaged")) {
    actions.push("Send re-engagement email");
  }

  if (lead.stage === "qualified" || lead.stage === "nurturing") {
    actions.push("Review qualification criteria");
  }

  return actions.slice(0, 3);
}

export async function GET(request: Request) {
  const auth = await requireOperatorApiSession(request);
  if (auth.response) {
    return auth.response;
  }

  const leads = await getLeadRecords();

  const scoredLeads = leads
    .map((lead) => ({
      leadKey: lead.leadKey,
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      niche: lead.niche,
      source: lead.source,
      family: lead.family,
      stage: lead.stage,
      score: lead.score,
      hot: lead.hot,
      temperature: getTemperature(lead.score),
      breakdown: buildScoreBreakdown(lead),
      recommendedActions: getRecommendedActions(lead),
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
    }))
    .sort((a, b) => b.score - a.score);

  const temperatureDistribution = {
    cold: scoredLeads.filter((l) => l.temperature === "cold").length,
    warm: scoredLeads.filter((l) => l.temperature === "warm").length,
    hot: scoredLeads.filter((l) => l.temperature === "hot").length,
    burning: scoredLeads.filter((l) => l.temperature === "burning").length,
  };

  const nicheAverages: Record<string, { total: number; count: number }> = {};
  for (const lead of leads) {
    const niche = lead.niche || "unknown";
    if (!nicheAverages[niche]) {
      nicheAverages[niche] = { total: 0, count: 0 };
    }
    nicheAverages[niche].total += lead.score;
    nicheAverages[niche].count += 1;
  }

  const scoreByNiche = Object.entries(nicheAverages)
    .map(([niche, data]) => ({
      niche,
      avgScore: Number((data.total / data.count).toFixed(1)),
      count: data.count,
    }))
    .sort((a, b) => b.avgScore - a.avgScore);

  return NextResponse.json({
    success: true,
    data: {
      leads: scoredLeads,
      temperatureDistribution,
      scoreByNiche,
    },
  });
}

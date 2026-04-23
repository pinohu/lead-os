import { NextResponse } from "next/server";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getLeadRecords } from "@/lib/runtime-store";

type Temperature = "cold" | "warm" | "hot" | "burning";

function getTemperature(score: number): Temperature {
  if (score >= 90) return "burning";
  if (score >= 75) return "hot";
  if (score >= 40) return "warm";
  return "cold";
}

export async function GET(request: Request) {
  const auth = await requireOperatorApiSession(request);
  if (auth.response) {
    return auth.response;
  }

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get("pageSize") ?? "25", 10)));
  const temperatureParam = url.searchParams.get("temperature") ?? "all";
  const nicheParam = url.searchParams.get("niche") ?? "all";
  const stageParam = url.searchParams.get("stage") ?? "all";
  const searchParam = (url.searchParams.get("search") ?? "").toLowerCase().trim();

  const allLeads = await getLeadRecords();

  const sorted = [...allLeads].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const filtered = sorted.filter((lead) => {
    const temperature = getTemperature(lead.score);

    if (temperatureParam !== "all" && temperature !== temperatureParam) return false;
    if (nicheParam !== "all" && lead.niche !== nicheParam) return false;
    if (stageParam !== "all" && lead.stage !== stageParam) return false;

    if (searchParam) {
      const fullName = `${lead.firstName} ${lead.lastName}`.toLowerCase();
      const email = (lead.email ?? "").toLowerCase();
      if (!fullName.includes(searchParam) && !email.includes(searchParam)) return false;
    }

    return true;
  });

  const total = filtered.length;
  const offset = (page - 1) * pageSize;
  const paged = filtered.slice(offset, offset + pageSize);

  const leads = paged.map((lead) => ({
    leadKey: lead.leadKey,
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email ?? null,
    phone: lead.phone ?? null,
    company: lead.company ?? null,
    score: lead.score,
    temperature: getTemperature(lead.score),
    niche: lead.niche,
    stage: lead.stage,
    source: lead.source,
    capturedAt: lead.createdAt,
  }));

  return NextResponse.json({
    success: true,
    data: {
      leads,
      total,
      page,
      pageSize,
    },
  });
}

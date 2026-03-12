import { NextResponse } from "next/server";

const AITABLE = {
  apiToken: process.env.AITABLE_API_TOKEN ?? "",
  datasheetId: process.env.AITABLE_DATASHEET_ID ?? "dstBicDQKC6gpLAMYj",
  apiBase: "https://aitable.ai/fusion/v1",
};

interface AITableRecord {
  recordId: string;
  createdAt?: string;
  fields?: Record<string, string>;
}

async function fetchAllRecords(): Promise<AITableRecord[]> {
  const allRecords: AITableRecord[] = [];
  let pageNum = 1;
  let hasMore = true;

  while (hasMore) {
    const res = await fetch(
      `${AITABLE.apiBase}/datasheets/${AITABLE.datasheetId}/records?fieldKey=name&pageSize=1000&pageNum=${pageNum}`,
      { headers: { Authorization: `Bearer ${AITABLE.apiToken}` } },
    );

    if (!res.ok) break;
    const json = (await res.json()) as { data?: { records?: AITableRecord[] } };
    const records = json?.data?.records ?? [];
    allRecords.push(...records);
    hasMore = records.length === 1000;
    pageNum++;
  }

  return allRecords;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const dashboardSecret = process.env.DASHBOARD_SECRET;
  if (dashboardSecret && authHeader !== `Bearer ${dashboardSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const records = await fetchAllRecords();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Categorize records
    const statuses: Record<string, number> = {};
    const scenarios: Record<string, { total: number; converted: number; hotLeads: number }> = {};
    let leadsToday = 0;
    let leadsThisWeek = 0;
    let hotLeads = 0;
    let converted = 0;
    let errors = 0;
    let nurtureActive = 0;
    const stageCounts: Record<string, number> = {};

    for (const rec of records) {
      const f = rec.fields ?? {};
      const status = f["Status"] || "";
      const scenario = f["Scenario"] || "unknown";
      const createdAt = rec.createdAt ? new Date(rec.createdAt) : null;

      statuses[status] = (statuses[status] || 0) + 1;

      if (!scenarios[scenario]) {
        scenarios[scenario] = { total: 0, converted: 0, hotLeads: 0 };
      }
      scenarios[scenario].total++;

      if (createdAt && createdAt >= todayStart) leadsToday++;
      if (createdAt && createdAt >= weekStart) leadsThisWeek++;

      if (status === "CONVERTED") {
        converted++;
        scenarios[scenario].converted++;
      }
      if (status.startsWith("ERROR")) errors++;
      if (status.startsWith("NURTURE-")) {
        nurtureActive++;
        stageCounts[status] = (stageCounts[status] || 0) + 1;
      }

      // Approximate hot leads from status
      if (status === "EVENT-PHONE-CALL_RECEIVED" || status === "EVENT-WHATSAPP-REPLY") {
        hotLeads++;
        scenarios[scenario].hotLeads++;
      }
    }

    // Top performing niches (by conversion rate)
    const topNiches = Object.entries(scenarios)
      .filter(([, v]) => v.total >= 3)
      .map(([name, v]) => ({
        name,
        total: v.total,
        converted: v.converted,
        conversionRate: v.total > 0 ? Math.round((v.converted / v.total) * 100) : 0,
        hotLeads: v.hotLeads,
      }))
      .sort((a, b) => b.conversionRate - a.conversionRate)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      generatedAt: now.toISOString(),
      summary: {
        totalRecords: records.length,
        leadsToday,
        leadsThisWeek,
        hotLeads,
        converted,
        conversionRate: records.length > 0 ? Math.round((converted / records.length) * 100) : 0,
        nurtureActive,
        errors,
      },
      nurtureFunnel: stageCounts,
      topNiches,
      statusBreakdown: statuses,
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { embeddedSecrets } from "@/lib/embedded-secrets";

const AITABLE = {
  apiToken: process.env.AITABLE_API_TOKEN ?? embeddedSecrets.aitable.apiToken,
  datasheetId: process.env.AITABLE_DATASHEET_ID ?? embeddedSecrets.aitable.datasheetId,
  apiBase: "https://aitable.ai/fusion/v1",
};

interface AITableRecord {
  recordId: string;
  createdAt?: string;
  fields?: Record<string, string>;
}

function getHostname(value: string | null) {
  if (!value) return "";
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function isTrustedDashboardRequest(request: Request) {
  const requestUrl = new URL(request.url);
  const requestHost = requestUrl.hostname.toLowerCase();
  const originHost = getHostname(request.headers.get("origin"));
  const refererHost = getHostname(request.headers.get("referer"));
  const fetchSite = request.headers.get("sec-fetch-site");

  return (
    originHost === requestHost ||
    refererHost === requestHost ||
    fetchSite === "same-origin" ||
    fetchSite === "same-site"
  );
}

function extractBlueprint(value?: string) {
  if (!value) return "";
  const match = value.match(/"blueprint":"([^"]+)"/);
  return match?.[1] ?? "";
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
  const dashboardSecret = process.env.DASHBOARD_SECRET ?? embeddedSecrets.dashboard.secret;
  if (
    dashboardSecret &&
    authHeader !== `Bearer ${dashboardSecret}` &&
    !isTrustedDashboardRequest(request)
  ) {
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
    const intakeSources: Record<string, number> = {};
    const eventBreakdown: Record<string, number> = {};
    const blueprintBreakdown: Record<string, number> = {};
    const serviceBreakdown: Record<string, number> = {};

    for (const rec of records) {
      const f = rec.fields ?? {};
      const status = f["Status"] || "";
      const scenario = f["Scenario"] || "unknown";
      const touchpoint = f["Touchpoint"] || "unknown";
      const aiGenerated = f["AI Generated"] || "";
      const createdAt = rec.createdAt ? new Date(rec.createdAt) : null;

      statuses[status] = (statuses[status] || 0) + 1;
      serviceBreakdown[scenario] = (serviceBreakdown[scenario] || 0) + 1;

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

       if (status === "LEAD-CAPTURED") {
        intakeSources[touchpoint] = (intakeSources[touchpoint] || 0) + 1;
      }

      if (status.startsWith("EVENT-")) {
        eventBreakdown[touchpoint] = (eventBreakdown[touchpoint] || 0) + 1;
        const blueprint = extractBlueprint(aiGenerated);
        if (blueprint) {
          blueprintBreakdown[blueprint] = (blueprintBreakdown[blueprint] || 0) + 1;
        }
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

    const topIntakeSources = Object.entries(intakeSources)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topBehavioralSignals = Object.entries(eventBreakdown)
      .map(([event, count]) => ({ event, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topBlueprints = Object.entries(blueprintBreakdown)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topServices = Object.entries(serviceBreakdown)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
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
      topIntakeSources,
      topBehavioralSignals,
      topBlueprints,
      topServices,
      statusBreakdown: statuses,
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}

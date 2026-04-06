import { NextResponse } from "next/server";
import { embeddedSecrets } from "@/lib/embedded-secrets";
import { parseStructuredDetail } from "@/lib/trace";

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
    const experimentBreakdown: Record<string, number> = {};
    const variantBreakdown: Record<string, number> = {};
    const stepBreakdown: Record<string, number> = {};
    const sourceToBlueprint: Record<string, number> = {};
    const leadCoverage = { withSessionId: 0, withLeadKey: 0, withExperiment: 0, withBlueprint: 0 };

    for (const record of records) {
      const fields = record.fields ?? {};
      const status = fields["Status"] || "";
      const scenario = fields["Scenario"] || "unknown";
      const touchpoint = fields["Touchpoint"] || "unknown";
      const aiGenerated = fields["AI Generated"] || "";
      const createdAt = record.createdAt ? new Date(record.createdAt) : null;
      const detail = parseStructuredDetail(aiGenerated);
      const trace = detail?.trace as Record<string, unknown> | undefined;
      const traceService = typeof trace?.service === "string" ? trace.service : undefined;
      const traceBlueprint = typeof trace?.blueprintId === "string" ? trace.blueprintId : undefined;
      const traceStep = typeof trace?.stepId === "string" ? trace.stepId : undefined;
      const traceExperiment = typeof trace?.experimentId === "string" ? trace.experimentId : undefined;
      const traceVariant = typeof trace?.variantId === "string" ? trace.variantId : undefined;
      const traceSessionId = typeof trace?.sessionId === "string" ? trace.sessionId : undefined;
      const traceLeadKey = typeof trace?.leadKey === "string" ? trace.leadKey : undefined;

      statuses[status] = (statuses[status] || 0) + 1;
      serviceBreakdown[traceService ?? scenario] = (serviceBreakdown[traceService ?? scenario] || 0) + 1;

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
      }

      if (traceSessionId) leadCoverage.withSessionId++;
      if (traceLeadKey) leadCoverage.withLeadKey++;
      if (traceExperiment) leadCoverage.withExperiment++;
      if (traceBlueprint) leadCoverage.withBlueprint++;

      if (traceBlueprint) blueprintBreakdown[traceBlueprint] = (blueprintBreakdown[traceBlueprint] || 0) + 1;
      if (traceStep) stepBreakdown[traceStep] = (stepBreakdown[traceStep] || 0) + 1;
      if (traceExperiment) experimentBreakdown[traceExperiment] = (experimentBreakdown[traceExperiment] || 0) + 1;
      if (traceVariant) variantBreakdown[traceVariant] = (variantBreakdown[traceVariant] || 0) + 1;
      if (touchpoint && traceBlueprint) {
        const key = `${touchpoint} -> ${traceBlueprint}`;
        sourceToBlueprint[key] = (sourceToBlueprint[key] || 0) + 1;
      }

      if (status === "EVENT-PHONE-CALL_RECEIVED" || status === "EVENT-WHATSAPP-REPLY") {
        hotLeads++;
        scenarios[scenario].hotLeads++;
      }
    }

    const topNiches = Object.entries(scenarios)
      .filter(([, value]) => value.total >= 3)
      .map(([name, value]) => ({
        name,
        total: value.total,
        converted: value.converted,
        conversionRate: value.total > 0 ? Math.round((value.converted / value.total) * 100) : 0,
        hotLeads: value.hotLeads,
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

    const topExperiments = Object.entries(experimentBreakdown)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topVariants = Object.entries(variantBreakdown)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topFunnelSteps = Object.entries(stepBreakdown)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topSourceBlueprintPaths = Object.entries(sourceToBlueprint)
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
      topExperiments,
      topVariants,
      topFunnelSteps,
      topSourceBlueprintPaths,
      traceCoverage: {
        sessionRate: records.length > 0 ? Math.round((leadCoverage.withSessionId / records.length) * 100) : 0,
        leadKeyRate: records.length > 0 ? Math.round((leadCoverage.withLeadKey / records.length) * 100) : 0,
        experimentRate: records.length > 0 ? Math.round((leadCoverage.withExperiment / records.length) * 100) : 0,
        blueprintRate: records.length > 0 ? Math.round((leadCoverage.withBlueprint / records.length) * 100) : 0,
      },
      statusBreakdown: statuses,
    });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

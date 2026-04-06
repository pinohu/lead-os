import { NextResponse } from "next/server";
import { THREE_VISIT_FRAMEWORK } from "@/lib/automation";
import { buildDefaultFunnelGraphs } from "@/lib/funnel-library";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getAutomationHealth } from "@/lib/providers";
import { getCanonicalEvents, getLeadRecords, getRuntimePersistenceMode } from "@/lib/runtime-store";
import { tenantConfig } from "@/lib/tenant";

export async function GET(request: Request) {
  const auth = await requireOperatorApiSession(request);
  if (auth.response) {
    return NextResponse.json({ status: "ok" });
  }

  const graphs = buildDefaultFunnelGraphs(tenantConfig.tenantId);
  const health = getAutomationHealth();
  const events = await getCanonicalEvents();
  const leads = await getLeadRecords();
  return NextResponse.json({
    success: true,
    service: "lead-os-hosted-runtime",
    tenantId: tenantConfig.tenantId,
    brandName: tenantConfig.brandName,
    siteUrl: tenantConfig.siteUrl,
    widgetOrigins: tenantConfig.widgetOrigins,
    enabledFunnels: tenantConfig.enabledFunnels,
    funnelCount: Object.keys(graphs).length,
    persistenceMode: getRuntimePersistenceMode(),
    eventCount: events.length,
    leadCount: leads.length,
    milestoneFramework: THREE_VISIT_FRAMEWORK,
    health,
  });
}

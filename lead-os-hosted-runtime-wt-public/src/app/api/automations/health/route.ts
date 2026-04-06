import { NextResponse } from "next/server";
import { getRecipeForFamily } from "@/lib/automation";
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
  const leads = await getLeadRecords();
  const events = await getCanonicalEvents();
  return NextResponse.json({
    success: true,
    tenantId: tenantConfig.tenantId,
    liveMode: health.liveMode,
    persistenceMode: getRuntimePersistenceMode(),
    providers: health.providers,
    channels: health.channels,
    funnels: Object.values(graphs).map((graph) => ({
      id: graph.id,
      family: graph.family,
      recipe: getRecipeForFamily(graph.family),
      nodes: graph.nodes.length,
      edges: graph.edges.length,
    })),
    telemetry: {
      leads: leads.length,
      events: events.length,
    },
  });
}

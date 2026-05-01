import { NextResponse } from "next/server";
import { getUptimePercentage, getAllComponents, getRecentChecks } from "@/lib/uptime-tracker";
import { tenantConfig } from "@/lib/tenant";

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;

export async function GET() {
  const components = getAllComponents();
  const componentStatuses = components.map((name) => {
    const recent = getRecentChecks(name, 1);
    const current: string = recent[0]?.status ?? "unknown";
    return {
      name,
      status: current,
      uptime30d: getUptimePercentage(name, THIRTY_DAYS),
      uptime90d: getUptimePercentage(name, NINETY_DAYS),
    };
  });

  const overallHealthy = componentStatuses.every((c) => c.status === "healthy" || c.status === "unknown");

  return NextResponse.json({
    status: overallHealthy ? "operational" : "degraded",
    timestamp: new Date().toISOString(),
    components: componentStatuses.length > 0 ? componentStatuses : [
      { name: "api", status: "operational", uptime30d: 100, uptime90d: 100 },
      { name: "database", status: "unknown", uptime30d: 100, uptime90d: 100 },
    ],
    page: {
      name: "Lead OS Status",
      url: (process.env.NEXT_PUBLIC_SITE_URL ?? tenantConfig.siteUrl).replace(/\/$/, ""),
    },
  });
}

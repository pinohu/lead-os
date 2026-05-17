// ── GET /api/admin/analytics/experiments ────────────────────────────
// JSON version of /admin/experiments. Returns analytics for every
// experiment in the registry.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { EXPERIMENTS } from "@/lib/experiments/registry";
import { loadExperimentData } from "@/lib/experiments/runtime";
import { computeExperimentAnalytics } from "@/lib/experiments/analytics";

export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest, role?: string): boolean {
  if (role === "admin") return true;
  const auth = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && auth === `Bearer ${cronSecret}`) return true;
  return false;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!isAuthorized(req, role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const daysParam = parseInt(url.searchParams.get("days") ?? "30", 10);
  const days = Number.isFinite(daysParam) && daysParam > 0 && daysParam <= 365 ? daysParam : 30;
  const rangeEnd = new Date();
  const rangeStart = new Date(rangeEnd.getTime() - days * 86400000);

  const results = await Promise.all(
    EXPERIMENTS.map(async (exp) => {
      const data = await loadExperimentData(exp.key, rangeStart, rangeEnd);
      return computeExperimentAnalytics(exp, data.exposures, data.conversions);
    })
  );

  return NextResponse.json({
    range: { startISO: rangeStart.toISOString(), endISO: rangeEnd.toISOString(), days },
    experiments: results,
  });
}

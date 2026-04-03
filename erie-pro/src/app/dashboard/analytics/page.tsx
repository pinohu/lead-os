// ── Provider Analytics Dashboard ──────────────────────────────────────
// Shows lead stats, conversion rates, response times, and weekly trend.

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dashboard/analytics");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user?.providerId) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          No Territory Linked
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Claim a territory to start seeing analytics.
        </p>
        <Link
          href="/for-business/claim"
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          Claim a Territory
        </Link>
      </div>
    );
  }

  const providerId = user.providerId;
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  // Parallel queries
  const [
    provider,
    leadsThisMonth,
    leadsLastMonth,
    totalLeadsCount,
    outcomes,
    weeklyData,
  ] = await Promise.all([
    prisma.provider.findUnique({
      where: { id: providerId },
      select: {
        businessName: true,
        totalLeads: true,
        convertedLeads: true,
        avgResponseTime: true,
        avgRating: true,
      },
    }),
    prisma.lead.count({
      where: { routedToId: providerId, createdAt: { gte: thisMonthStart } },
    }),
    prisma.lead.count({
      where: {
        routedToId: providerId,
        createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
      },
    }),
    prisma.lead.count({ where: { routedToId: providerId } }),
    prisma.leadOutcome.findMany({
      where: { providerId },
      select: { outcome: true, responseTimeSeconds: true },
    }),
    // Leads per week for last 8 weeks
    getWeeklyLeads(providerId),
  ]);

  if (!provider) redirect("/dashboard");

  const conversions = outcomes.filter((o) => o.outcome === "converted").length;
  const conversionRate =
    totalLeadsCount > 0 ? Math.round((conversions / totalLeadsCount) * 100) : 0;

  const responseTimes = outcomes
    .filter((o) => o.responseTimeSeconds != null)
    .map((o) => o.responseTimeSeconds!);
  const avgResponseMin =
    responseTimes.length > 0
      ? Math.round(
          responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length / 60
        )
      : 0;

  const maxWeekly = Math.max(...weeklyData.map((w) => w.count), 1);

  const monthChange = leadsLastMonth > 0
    ? Math.round(((leadsThisMonth - leadsLastMonth) / leadsLastMonth) * 100)
    : leadsThisMonth > 0
    ? 100
    : 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
        Analytics
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        Performance overview for {provider.businessName}
      </p>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        <StatCard
          label="Leads This Month"
          value={leadsThisMonth.toString()}
          sub={
            monthChange !== 0
              ? `${monthChange > 0 ? "+" : ""}${monthChange}% vs last month`
              : "No change"
          }
          subColor={monthChange > 0 ? "text-green-600" : monthChange < 0 ? "text-red-600" : "text-gray-500"}
        />
        <StatCard
          label="Last Month"
          value={leadsLastMonth.toString()}
          sub="Leads received"
        />
        <StatCard
          label="Conversion Rate"
          value={`${conversionRate}%`}
          sub={`${conversions} of ${totalLeadsCount} leads`}
        />
        <StatCard
          label="Avg Response"
          value={avgResponseMin > 0 ? `${avgResponseMin}m` : "N/A"}
          sub="Average response time"
        />
      </div>

      {/* Weekly trend bar chart */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Weekly Lead Trend (Last 8 Weeks)
        </h2>
        <div className="space-y-3">
          {weeklyData.map((week) => {
            const widthPct = Math.max((week.count / maxWeekly) * 100, 2);
            return (
              <div key={week.label} className="flex items-center gap-3">
                <span className="w-24 text-xs text-gray-500 dark:text-gray-400 shrink-0">
                  {week.label}
                </span>
                <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded transition-all"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                <span className="w-8 text-right text-sm font-medium text-gray-900 dark:text-white">
                  {week.count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  subColor = "text-gray-500 dark:text-gray-400",
}: {
  label: string;
  value: string;
  sub: string;
  subColor?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {label}
      </p>
      <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
        {value}
      </p>
      <p className={`mt-1 text-xs ${subColor}`}>{sub}</p>
    </div>
  );
}

async function getWeeklyLeads(
  providerId: string
): Promise<{ label: string; count: number }[]> {
  const weeks: { label: string; count: number }[] = [];
  const now = new Date();

  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - i * 7);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const count = await prisma.lead.count({
      where: {
        routedToId: providerId,
        createdAt: { gte: weekStart, lt: weekEnd },
      },
    });

    weeks.push({
      label: weekStart.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      count,
    });
  }

  return weeks;
}

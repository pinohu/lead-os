// ── Admin · Intake Analytics ─────────────────────────────────────────
// Dashboard for the conversational intake widget. Reports funnel, niche
// distribution, did-you-mean usage, classifier confidence, and daily volume.

import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { cityConfig } from "@/lib/city-config";
import { computeIntakeAnalytics } from "@/lib/intake/analytics";
import { getNicheBySlug } from "@/lib/niches";
import IntakeDailyChart from "./intake-daily-chart";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Intake Analytics | ${cityConfig.domain}`,
  description: "Funnel, niche routing, and did-you-mean usage for the intake widget.",
  robots: { index: false, follow: false },
};

// ── Helpers ──────────────────────────────────────────────────────────

function pct(n: number, digits = 1): string {
  return `${(n * 100).toFixed(digits)}%`;
}

function nicheLabel(slug: string): string {
  if (slug === "(unrouted)") return "Unrouted";
  return getNicheBySlug(slug)?.label ?? slug;
}

// ── Page ─────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{ days?: string }>;
}

export default async function IntakeAnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const daysParam = parseInt(params.days ?? "30", 10);
  const days = Number.isFinite(daysParam) && daysParam > 0 && daysParam <= 365 ? daysParam : 30;

  const rangeEnd = new Date();
  const rangeStart = new Date(rangeEnd.getTime() - days * 86400000);

  const rows = await prisma.intakeConversation.findMany({
    where: {
      createdAt: { gte: rangeStart, lte: rangeEnd },
      variant: "intake", // exclude legacy form fallback
    },
    select: {
      id: true,
      currentStep: true,
      outcomeStatus: true,
      startedFromNicheSlug: true,
      leadId: true,
      messages: true,
      outcome: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const analytics = computeIntakeAnalytics(rows, rangeStart, rangeEnd);

  return (
    <div className="space-y-6 p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Intake Analytics
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Last {days} days &middot; {rows.length.toLocaleString()} conversations
          </p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <a
              key={d}
              href={`?days=${d}`}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                d === days
                  ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              {d}d
            </a>
          ))}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard
          label="Conversations"
          value={analytics.totals.conversations.toLocaleString()}
          tone="neutral"
        />
        <KpiCard
          label="Completed"
          value={analytics.totals.completed.toLocaleString()}
          tone="success"
        />
        <KpiCard
          label="Conversion Rate"
          value={pct(analytics.totals.conversionRate)}
          tone={
            analytics.totals.conversionRate >= 0.25
              ? "success"
              : analytics.totals.conversionRate >= 0.1
                ? "warning"
                : "danger"
          }
        />
        <KpiCard
          label="Abandoned"
          value={analytics.totals.abandoned.toLocaleString()}
          tone="warning"
        />
        <KpiCard
          label="Switch Rate"
          value={pct(analytics.routing.switchRate)}
          tone="neutral"
          subtext="Did-you-mean usage"
        />
      </div>

      {/* Orphan-completed warning */}
      {analytics.orphanCompleted > 0 && (
        <div
          role="alert"
          className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-900 dark:bg-red-950 dark:border-red-900 dark:text-red-200"
        >
          <strong>Warning:</strong> {analytics.orphanCompleted} conversation
          {analytics.orphanCompleted === 1 ? " is" : "s are"} marked
          &ldquo;completed&rdquo; but ha{analytics.orphanCompleted === 1 ? "s" : "ve"}{" "}
          no linked lead. Investigate — this usually indicates a Lead creation
          failure after the conversation finished.
        </div>
      )}

      {/* Funnel */}
      <Card title="Funnel" subtitle="Conversations that reached each step">
        <div className="space-y-2">
          {analytics.funnel.map((f) => (
            <div key={f.step} className="flex items-center gap-3">
              <div className="w-24 text-xs font-medium text-gray-600 dark:text-gray-400 capitalize">
                {f.step}
              </div>
              <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-6 overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all"
                  style={{ width: `${(f.pctOfStart * 100).toFixed(1)}%` }}
                  aria-hidden
                />
                <div className="absolute inset-0 flex items-center justify-between px-3 text-xs font-medium">
                  <span className="text-gray-900 dark:text-gray-100">
                    {f.reached.toLocaleString()}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {pct(f.pctOfStart, 0)}
                  </span>
                </div>
              </div>
              <div className="w-20 text-xs text-gray-500 dark:text-gray-400 text-right">
                {f.dropoffFromPrev > 0 ? `−${f.dropoffFromPrev} (${pct(f.dropoffPct, 0)})` : "—"}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Daily counts chart */}
      <Card title="Daily volume" subtitle="Conversations and completions per day">
        <IntakeDailyChart data={analytics.dailyCounts} />
      </Card>

      {/* Two columns: top niches + classifier confidence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Top niches by volume" subtitle="Top 10, by total conversations">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left py-2 pr-2">Niche</th>
                <th className="text-right py-2 px-2">Total</th>
                <th className="text-right py-2 px-2">Done</th>
                <th className="text-right py-2 pl-2">CR</th>
              </tr>
            </thead>
            <tbody>
              {analytics.topNiches.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-gray-500 dark:text-gray-400">
                    No conversations in range
                  </td>
                </tr>
              ) : (
                analytics.topNiches.map((n) => (
                  <tr
                    key={n.slug}
                    className="border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                  >
                    <td className="py-2 pr-2 text-gray-900 dark:text-gray-100">
                      {nicheLabel(n.slug)}
                    </td>
                    <td className="py-2 px-2 text-right text-gray-700 dark:text-gray-300">
                      {n.conversations.toLocaleString()}
                    </td>
                    <td className="py-2 px-2 text-right text-gray-700 dark:text-gray-300">
                      {n.completed.toLocaleString()}
                    </td>
                    <td className="py-2 pl-2 text-right text-gray-700 dark:text-gray-300">
                      {pct(n.conversionRate, 0)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>

        <Card title="Classifier confidence" subtitle={`Average ${analytics.classifierConfidence.avg.toFixed(2)} across conversations with classifier output`}>
          <div className="space-y-2">
            {analytics.classifierConfidence.buckets.map((b) => {
              const totalWithConf = analytics.classifierConfidence.buckets.reduce(
                (s, x) => s + x.count,
                0
              );
              const widthPct = totalWithConf > 0 ? (b.count / totalWithConf) * 100 : 0;
              return (
                <div key={b.label} className="flex items-center gap-2">
                  <div className="w-32 text-xs text-gray-600 dark:text-gray-400 font-mono">
                    {b.label}
                  </div>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 transition-all"
                      style={{ width: `${widthPct.toFixed(1)}%` }}
                      aria-hidden
                    />
                  </div>
                  <div className="w-12 text-xs text-right text-gray-700 dark:text-gray-300">
                    {b.count.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Top switch pairs */}
      {analytics.routing.topSwitchPairs.length > 0 && (
        <Card
          title="Top did-you-mean corrections"
          subtitle="What users actually switched to after starting on the wrong page"
        >
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left py-2 pr-2">Started on</th>
                <th className="text-left py-2 px-2">Switched to</th>
                <th className="text-right py-2 pl-2">Count</th>
              </tr>
            </thead>
            <tbody>
              {analytics.routing.topSwitchPairs.map((p, i) => (
                <tr
                  key={`${p.from}-${p.to}-${i}`}
                  className="border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                >
                  <td className="py-2 pr-2 text-gray-700 dark:text-gray-300">
                    {nicheLabel(p.from)}
                  </td>
                  <td className="py-2 px-2 text-gray-900 dark:text-gray-100 font-medium">
                    → {nicheLabel(p.to)}
                  </td>
                  <td className="py-2 pl-2 text-right text-gray-700 dark:text-gray-300">
                    {p.count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            High counts on a single pair (e.g. dental → plumbing) suggest the
            niche pages may be miscategorizing visitor intent. Consider adding
            navigation hints or related-niche cross-links.
          </p>
        </Card>
      )}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  subtext,
  tone,
}: {
  label: string;
  value: string;
  subtext?: string;
  tone: "neutral" | "success" | "warning" | "danger";
}) {
  const toneClasses: Record<typeof tone, string> = {
    neutral: "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700",
    success: "bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-900",
    warning: "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-900",
    danger: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-900",
  };
  return (
    <div className={`rounded-lg border p-4 ${toneClasses[tone]}`}>
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
        {value}
      </div>
      {subtext && (
        <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{subtext}</div>
      )}
    </div>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}

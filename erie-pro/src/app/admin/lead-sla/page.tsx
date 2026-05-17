// ── Admin · Lead SLA Performance ─────────────────────────────────────
// Visibility into the provider-response funnel: who's accepting,
// median response time, leads currently in-flight, expired-without-
// response, and failover behavior.

import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { cityConfig } from "@/lib/city-config";
import {
  computeSlaAnalytics,
  type LeadAnalyticsRow,
} from "@/lib/leads/sla-analytics";
import { slaSecondsRemaining } from "@/lib/leads/sla";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Lead SLA | ${cityConfig.domain}`,
  description: "Provider response funnel — acceptance rate, response times, failover.",
  robots: { index: false, follow: false },
};

function pct(n: number, digits = 1): string {
  return `${(n * 100).toFixed(digits)}%`;
}

function fmtDuration(sec: number): string {
  if (sec < 60) return `${Math.round(sec)}s`;
  if (sec < 3600) return `${Math.round(sec / 60)} min`;
  return `${(sec / 3600).toFixed(1)} hr`;
}

interface PageProps {
  searchParams: Promise<{ days?: string }>;
}

export default async function LeadSlaPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const daysParam = parseInt(params.days ?? "30", 10);
  const days = Number.isFinite(daysParam) && daysParam > 0 && daysParam <= 365 ? daysParam : 30;

  const rangeEnd = new Date();
  const rangeStart = new Date(rangeEnd.getTime() - days * 86400000);

  // Load leads + their outcomes + routed provider name
  const rawLeads = await prisma.lead.findMany({
    where: {
      createdAt: { gte: rangeStart, lte: rangeEnd },
    },
    select: {
      id: true,
      niche: true,
      city: true,
      routedToId: true,
      slaDeadline: true,
      createdAt: true,
      routedTo: { select: { businessName: true, id: true } },
      outcomes: {
        select: {
          outcome: true,
          responseTimeSeconds: true,
          createdAt: true,
          providerId: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 2000, // cap for performance; trim further with date filter
  });

  // Build a providerId → businessName map for any providers referenced
  // by outcomes but not by routedTo (failover history).
  const referencedProviderIds = new Set<string>();
  for (const l of rawLeads) {
    if (l.routedToId) referencedProviderIds.add(l.routedToId);
    for (const o of l.outcomes) {
      if (o.providerId) referencedProviderIds.add(o.providerId);
    }
  }
  const providers = await prisma.provider.findMany({
    where: { id: { in: Array.from(referencedProviderIds) } },
    select: { id: true, businessName: true },
  });
  const providerNames: Record<string, string> = {};
  for (const p of providers) providerNames[p.id] = p.businessName;

  // Map to analytics shape
  const rows: LeadAnalyticsRow[] = rawLeads.map((l) => ({
    id: l.id,
    niche: l.niche,
    city: l.city,
    routedToId: l.routedToId,
    routedToName: l.routedTo?.businessName ?? null,
    slaDeadline: l.slaDeadline,
    createdAt: l.createdAt,
    outcomes: l.outcomes.map((o) => ({
      outcome: o.outcome as "responded" | "converted" | "no_response" | "declined" | "cancelled",
      responseTimeSeconds: o.responseTimeSeconds,
      createdAt: o.createdAt,
    })),
  }));

  const analytics = computeSlaAnalytics(rows, rangeStart, rangeEnd, providerNames);

  // In-flight leads (awaiting): show their countdown
  const inFlight = rows
    .filter((r) => {
      const lastOutcome = r.outcomes[r.outcomes.length - 1] ?? null;
      return (
        !lastOutcome &&
        r.routedToId &&
        r.slaDeadline &&
        r.slaDeadline.getTime() > rangeEnd.getTime()
      );
    })
    .slice(0, 12);

  return (
    <div className="space-y-6 p-6 max-w-7xl">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Lead SLA Performance
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Last {days} days &middot; {rows.length.toLocaleString()} leads
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
          label="Leads"
          value={analytics.totals.leads.toLocaleString()}
          tone="neutral"
        />
        <KpiCard
          label="Accept Rate"
          value={pct(analytics.acceptRate)}
          tone={
            analytics.acceptRate >= 0.6
              ? "success"
              : analytics.acceptRate >= 0.3
                ? "warning"
                : "danger"
          }
          subtext={`${analytics.totals.accepted + analytics.totals.completed} / ${analytics.totals.leads}`}
        />
        <KpiCard
          label="Median Response"
          value={
            analytics.responseTime.sampleSize > 0
              ? fmtDuration(analytics.responseTime.medianSec)
              : "—"
          }
          tone={
            analytics.responseTime.sampleSize === 0
              ? "neutral"
              : analytics.responseTime.medianSec <= 600
                ? "success"
                : analytics.responseTime.medianSec <= 1800
                  ? "warning"
                  : "danger"
          }
          subtext={`n=${analytics.responseTime.sampleSize}`}
        />
        <KpiCard
          label="Expired"
          value={analytics.totals.expired.toLocaleString()}
          tone={analytics.totals.expired === 0 ? "neutral" : "warning"}
          subtext="SLA passed, no response"
        />
        <KpiCard
          label="Exhausted"
          value={analytics.totals.exhausted.toLocaleString()}
          tone={analytics.totals.exhausted === 0 ? "neutral" : "danger"}
          subtext="No taker after failover"
        />
      </div>

      {/* In-flight leads with countdown */}
      <Card
        title="In-flight leads"
        subtitle={`Leads currently routed to a provider with the SLA clock running (${inFlight.length})`}
      >
        {inFlight.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400 italic">
            No leads currently awaiting provider response.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left py-2 pr-2">Niche</th>
                <th className="text-left py-2 px-2">Provider</th>
                <th className="text-right py-2 px-2">Created</th>
                <th className="text-right py-2 pl-2">SLA remaining</th>
              </tr>
            </thead>
            <tbody>
              {inFlight.map((r) => {
                const remaining = slaSecondsRemaining(r.slaDeadline, rangeEnd);
                const tone =
                  remaining == null
                    ? "text-gray-500"
                    : remaining < 300
                      ? "text-red-700 dark:text-red-300 font-semibold"
                      : remaining < 900
                        ? "text-amber-700 dark:text-amber-300"
                        : "text-gray-700 dark:text-gray-300";
                return (
                  <tr
                    key={r.id}
                    className="border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                  >
                    <td className="py-2 pr-2 text-gray-900 dark:text-gray-100">
                      {r.niche}
                    </td>
                    <td className="py-2 px-2 text-gray-700 dark:text-gray-300">
                      {r.routedToName ?? "—"}
                    </td>
                    <td className="py-2 px-2 text-right text-gray-500 dark:text-gray-400">
                      {Math.round((rangeEnd.getTime() - r.createdAt.getTime()) / 60000)} min ago
                    </td>
                    <td className={`py-2 pl-2 text-right ${tone}`}>
                      {remaining != null ? fmtDuration(remaining) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {/* Two columns: state breakdown + response time stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Lead state breakdown" subtitle="Where leads are in the funnel">
          <div className="space-y-2">
            {[
              { key: "accepted", label: "Accepted", tone: "bg-emerald-500" },
              { key: "completed", label: "Completed (converted)", tone: "bg-emerald-600" },
              { key: "awaiting", label: "Awaiting provider", tone: "bg-sky-500" },
              { key: "declined", label: "Declined (pre-failover)", tone: "bg-amber-500" },
              { key: "expired", label: "SLA Expired", tone: "bg-orange-500" },
              { key: "exhausted", label: "Exhausted (no taker)", tone: "bg-red-600" },
              { key: "unrouted", label: "Unrouted", tone: "bg-gray-400" },
            ].map((s) => {
              const count = analytics.totals[s.key as keyof typeof analytics.totals];
              const width = analytics.totals.leads > 0 ? (count / analytics.totals.leads) * 100 : 0;
              return (
                <div key={s.key} className="flex items-center gap-2">
                  <div className="w-44 text-xs text-gray-600 dark:text-gray-400">
                    {s.label}
                  </div>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-5 overflow-hidden">
                    <div
                      className={`h-full ${s.tone} transition-all`}
                      style={{ width: `${width.toFixed(1)}%` }}
                      aria-hidden
                    />
                  </div>
                  <div className="w-16 text-xs text-right text-gray-700 dark:text-gray-300">
                    {count.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Response time stats" subtitle={`Across ${analytics.responseTime.sampleSize} responded/converted leads`}>
          {analytics.responseTime.sampleSize === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400 italic">
              No response time data in range.
            </div>
          ) : (
            <div className="space-y-3">
              <Stat label="Median" value={fmtDuration(analytics.responseTime.medianSec)} />
              <Stat label="P75 (75th percentile)" value={fmtDuration(analytics.responseTime.p75Sec)} />
              <Stat label="Mean" value={fmtDuration(analytics.responseTime.meanSec)} />
              <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                Median is the more honest single number; mean can be skewed by a small number of very slow responses.
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Recently expired leads */}
      {analytics.recentExpired.length > 0 && (
        <Card
          title="Recently expired leads"
          subtitle="SLA passed without a provider response. Use these to spot patterns (specific provider, niche, time of day)."
        >
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left py-2 pr-2">Niche</th>
                <th className="text-left py-2 px-2">Provider</th>
                <th className="text-right py-2 px-2">Expired</th>
                <th className="text-right py-2 pl-2">Lead</th>
              </tr>
            </thead>
            <tbody>
              {analytics.recentExpired.map((e) => (
                <tr
                  key={e.leadId}
                  className="border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                >
                  <td className="py-2 pr-2 text-gray-900 dark:text-gray-100">{e.niche}</td>
                  <td className="py-2 px-2 text-gray-700 dark:text-gray-300">
                    {e.routedToName ?? "—"}
                  </td>
                  <td className="py-2 px-2 text-right text-gray-500 dark:text-gray-400">
                    {Math.round((rangeEnd.getTime() - e.expiredAt.getTime()) / 60000)} min ago
                  </td>
                  <td className="py-2 pl-2 text-right">
                    <a
                      href={`/admin/leads?q=${e.leadId.slice(0, 8)}`}
                      className="text-xs text-sky-600 dark:text-sky-400 hover:underline"
                    >
                      {e.leadId.slice(0, 8)}…
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{value}</div>
    </div>
  );
}

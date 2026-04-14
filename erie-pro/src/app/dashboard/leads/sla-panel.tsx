// ── SLA Summary Panel ─────────────────────────────────────────────
// Top-of-leads-page strip that shows this provider's SLA posture:
//   - Active leads with a live ticking deadline
//   - Weekly compliance rate (responded before deadline)
//   - Average response time (from LeadOutcome.responseTimeSeconds)
//   - Count of leads that auto-failed-over (routeType = failover)
//
// Pure server component — hydrates a small client SlaCountdown
// per active lead. No polling; page refresh picks up new leads.

import Link from "next/link";
import { prisma } from "@/lib/db";
import { SlaCountdown } from "./sla-countdown";

interface SlaPanelProps {
  providerId: string;
}

function fmtSeconds(seconds: number): string {
  if (!seconds || !Number.isFinite(seconds)) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = seconds / 60;
  if (mins < 60) return `${mins.toFixed(1)}m`;
  return `${(mins / 60).toFixed(1)}h`;
}

export async function SlaPanel({ providerId }: SlaPanelProps) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [activeLeads, weekLeads, weekOutcomes, failovers] = await Promise.all([
    // Active = routed to me, no outcome yet, deadline in the future OR recently passed
    prisma.lead.findMany({
      where: {
        routedToId: providerId,
        slaDeadline: { not: null, gte: new Date(now.getTime() - 30 * 60_000) },
        outcomes: { none: {} },
      },
      orderBy: { slaDeadline: "asc" },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        niche: true,
        temperature: true,
        routeType: true,
        slaDeadline: true,
      },
    }),
    prisma.lead.count({
      where: { routedToId: providerId, createdAt: { gte: weekAgo } },
    }),
    prisma.leadOutcome.findMany({
      where: {
        providerId,
        createdAt: { gte: weekAgo },
        responseTimeSeconds: { not: null },
      },
      select: { responseTimeSeconds: true, lead: { select: { slaDeadline: true, createdAt: true } } },
    }),
    prisma.lead.count({
      where: {
        routedToId: providerId,
        routeType: "failover",
        createdAt: { gte: weekAgo },
      },
    }),
  ]);

  // SLA compliance: of leads responded this week, what % beat the deadline?
  const respondedWithDeadline = weekOutcomes.filter(
    (o) => o.responseTimeSeconds != null && o.lead?.slaDeadline && o.lead?.createdAt,
  );
  let onTime = 0;
  for (const o of respondedWithDeadline) {
    const windowMs =
      (o.lead!.slaDeadline!.getTime() - o.lead!.createdAt.getTime()) / 1000;
    if (windowMs > 0 && (o.responseTimeSeconds ?? Infinity) <= windowMs) {
      onTime += 1;
    }
  }
  const complianceRate =
    respondedWithDeadline.length > 0
      ? Math.round((onTime / respondedWithDeadline.length) * 100)
      : null;

  const avgResponse =
    weekOutcomes.length > 0
      ? weekOutcomes.reduce((sum, o) => sum + (o.responseTimeSeconds ?? 0), 0) /
        weekOutcomes.length
      : 0;

  return (
    <section
      aria-label="SLA status"
      className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950"
    >
      {/* ── Stats strip ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-800 sm:grid-cols-4">
        <Stat
          label="Active SLAs"
          value={String(activeLeads.length)}
          hint={activeLeads.length === 0 ? "all clear" : "ticking now"}
          accent={activeLeads.length > 0 ? "primary" : "muted"}
        />
        <Stat
          label="This week"
          value={String(weekLeads)}
          hint={`${weekLeads === 1 ? "lead" : "leads"} routed to you`}
        />
        <Stat
          label="Compliance"
          value={complianceRate == null ? "—" : `${complianceRate}%`}
          hint="responded before deadline"
          accent={
            complianceRate == null
              ? "muted"
              : complianceRate >= 90
              ? "ok"
              : complianceRate >= 70
              ? "warn"
              : "bad"
          }
        />
        <Stat
          label="Avg response"
          value={fmtSeconds(avgResponse)}
          hint={failovers > 0 ? `${failovers} failover${failovers === 1 ? "" : "s"}` : "no failovers"}
          accent={failovers > 0 ? "warn" : "ok"}
        />
      </div>

      {/* ── Active deadlines list ─────────────────────────────── */}
      {activeLeads.length > 0 && (
        <div className="border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            <span>Active deadlines</span>
            <span>Respond before the timer hits zero</span>
          </div>
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {activeLeads.map((lead) => (
              <li
                key={lead.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${
                      lead.routeType === "failover"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                        : lead.routeType === "overflow"
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                    }`}
                  >
                    {lead.routeType}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {lead.firstName ?? "New lead"} {lead.lastName ?? ""}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {lead.niche} · {lead.temperature}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {lead.slaDeadline && <SlaCountdown deadline={lead.slaDeadline} />}
                  <Link
                    href={`/dashboard/leads#${lead.id}`}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Respond
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  hint,
  accent = "muted",
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "primary" | "ok" | "warn" | "bad" | "muted";
}) {
  const tone = {
    primary: "text-blue-600 dark:text-blue-400",
    ok: "text-emerald-600 dark:text-emerald-400",
    warn: "text-amber-600 dark:text-amber-400",
    bad: "text-red-600 dark:text-red-400",
    muted: "text-gray-900 dark:text-white",
  }[accent];

  return (
    <div className="px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className={`mt-0.5 text-2xl font-bold tabular-nums ${tone}`}>{value}</p>
      {hint && <p className="text-[11px] text-gray-500 dark:text-gray-400">{hint}</p>}
    </div>
  );
}

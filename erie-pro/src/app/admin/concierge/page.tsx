// ── Admin — Concierge Inbox ───────────────────────────────────────
// Ops view of paid Concierge jobs + Annual members. The flow:
//
//   1. Requester pays $29 on /pros (Concierge) or $199/yr (Annual)
//   2. Stripe webhook marks the CheckoutSession `completed` and emails
//      ops via ADMIN_EMAIL
//   3. Ops loads this page, picks a pro, writes notes, marks fulfilled
//
// We show Open jobs first (completed + not fulfilled), then Fulfilled,
// plus a sidebar of Annual members so ops can call them directly.

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { verifyAdminRoleFresh } from "@/lib/require-admin"
import { prisma } from "@/lib/db"
import {
  assignConciergeJob,
  markConciergeFulfilled,
  reopenConciergeJob,
} from "./actions"

export const dynamic = "force-dynamic"

function formatDate(d: Date | null | undefined): string {
  if (!d) return "—"
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function formatPrice(n: number | null | undefined): string {
  if (n == null) return "—"
  return `$${n}`
}

export default async function ConciergeInboxPage() {
  const session = await auth()
  if (!session?.user) redirect("/login?callbackUrl=/admin/concierge")
  const role = (session.user as { role?: string }).role
  if (role !== "admin") redirect("/dashboard")
  // Fresh DB check — JWT role claim may be stale up to 30 days after demotion.
  const stillAdmin = await verifyAdminRoleFresh((session.user as { id?: string }).id)
  if (!stillAdmin) redirect("/dashboard")

  // Fetch everything in parallel.
  const [openJobs, recentFulfilled, annualMembers, pros] = await Promise.all([
    prisma.checkoutSession.findMany({
      where: {
        sessionType: "concierge_job",
        status: "completed",
        fulfilledAt: null,
      },
      orderBy: { completedAt: "asc" }, // oldest unfulfilled first
    }),
    prisma.checkoutSession.findMany({
      where: {
        sessionType: "concierge_job",
        fulfilledAt: { not: null },
      },
      orderBy: { fulfilledAt: "desc" },
      take: 10,
    }),
    prisma.checkoutSession.findMany({
      where: {
        sessionType: "annual_membership",
        status: "completed",
      },
      orderBy: { completedAt: "desc" },
      take: 25,
    }),
    prisma.provider.findMany({
      where: { subscriptionStatus: "active" },
      select: { id: true, businessName: true, niche: true, phone: true },
      orderBy: { businessName: "asc" },
    }),
  ])

  return (
    <div className="space-y-8">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Concierge Inbox
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Open jobs to work, recent fulfillments, and active Annual members.
          Newest first everywhere except the Open queue, where we show the
          oldest paid job first (SLA priority).
        </p>
      </div>

      {/* ── Stats row ──────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Open jobs" value={openJobs.length} tone="red" />
        <Stat
          label="Fulfilled (last 10)"
          value={recentFulfilled.length}
          tone="green"
        />
        <Stat label="Annual members" value={annualMembers.length} tone="blue" />
      </div>

      {/* ── Open jobs ──────────────────────────────────────────── */}
      <section className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Open jobs ({openJobs.length})
          </h2>
        </div>

        {openJobs.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
            Inbox zero — no open Concierge jobs right now.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            {openJobs.map((job) => {
              const assignedPro =
                job.assignedProviderId
                  ? pros.find((p) => p.id === job.assignedProviderId)
                  : null
              return (
                <li key={job.id} className="px-6 py-5">
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-2 sm:flex-nowrap sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="break-words font-medium text-gray-900 dark:text-white">
                        {job.providerEmail}
                      </p>
                      <p className="mt-0.5 break-words text-xs text-gray-500 dark:text-gray-400">
                        Paid {formatDate(job.completedAt)} ·{" "}
                        {formatPrice(job.price)} · Session{" "}
                        <code className="rounded bg-gray-100 px-1 py-0.5 text-[11px] dark:bg-gray-800">
                          {job.stripeSessionId?.slice(0, 18) ?? job.id.slice(0, 18)}
                        </code>
                      </p>
                    </div>
                    {assignedPro ? (
                      <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        assigned · {assignedPro.businessName}
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                        unassigned
                      </span>
                    )}
                  </div>

                  <form
                    action={assignConciergeJob}
                    className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]"
                  >
                    <input type="hidden" name="sessionId" value={job.id} />
                    <label className="text-xs">
                      <span className="mb-1 block text-gray-500 dark:text-gray-400">
                        Assign to pro
                      </span>
                      <select
                        name="providerId"
                        defaultValue={job.assignedProviderId ?? ""}
                        className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900"
                      >
                        <option value="">— unassigned —</option>
                        {pros.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.businessName} ({p.niche})
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs">
                      <span className="mb-1 block text-gray-500 dark:text-gray-400">
                        Ops notes
                      </span>
                      <input
                        type="text"
                        name="opsNotes"
                        defaultValue={job.opsNotes ?? ""}
                        placeholder="Called 2 pros, left vm with Joe's Plumbing…"
                        className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900"
                      />
                    </label>
                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full rounded-md bg-blue-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-blue-700 sm:w-auto sm:py-1.5"
                      >
                        Save
                      </button>
                    </div>
                  </form>

                  <form action={markConciergeFulfilled} className="mt-3">
                    <input type="hidden" name="sessionId" value={job.id} />
                    <button
                      type="submit"
                      className="inline-flex w-full items-center justify-center rounded-md border border-emerald-200 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/40 dark:text-emerald-400 dark:hover:bg-emerald-900/20 sm:w-auto"
                    >
                      ✓ Mark fulfilled
                    </button>
                  </form>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* ── Recently fulfilled ─────────────────────────────────── */}
      <section className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recently fulfilled
          </h2>
        </div>

        {recentFulfilled.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
            No fulfilled Concierge jobs yet.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            {recentFulfilled.map((job) => (
              <li
                key={job.id}
                className="flex items-center justify-between px-6 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {job.providerEmail}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Fulfilled {formatDate(job.fulfilledAt)}
                    {job.opsNotes ? ` · ${job.opsNotes}` : ""}
                  </p>
                </div>
                <form action={reopenConciergeJob}>
                  <input type="hidden" name="sessionId" value={job.id} />
                  <button
                    type="submit"
                    className="text-xs text-gray-500 hover:text-gray-900 hover:underline dark:text-gray-400 dark:hover:text-white"
                  >
                    Reopen
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Annual members ─────────────────────────────────────── */}
      <section className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Annual members ({annualMembers.length})
          </h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Unlimited Concierge matches + same-day priority. Renewal cron
            sends 30-day and 7-day reminders automatically — call any
            <span className="font-semibold text-amber-700 dark:text-amber-400"> Expiring soon </span>
            members below to save the renewal.
          </p>
        </div>

        {annualMembers.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
            No Annual members yet.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            {annualMembers.map((m) => {
              const completedAt = m.completedAt
                ? new Date(m.completedAt)
                : null
              const expiresOn = completedAt
                ? new Date(
                    completedAt.getTime() + 365 * 24 * 60 * 60 * 1000,
                  )
                : null
              const daysLeft = expiresOn
                ? Math.round(
                    (expiresOn.getTime() - Date.now()) /
                      (24 * 60 * 60 * 1000),
                  )
                : null

              const badge = m.expiredAt
                ? { label: "Expired", tone: "red" as const }
                : daysLeft != null && daysLeft <= 7
                  ? { label: `${daysLeft}d left`, tone: "red" as const }
                  : daysLeft != null && daysLeft <= 30
                    ? { label: `${daysLeft}d left`, tone: "amber" as const }
                    : null

              return (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-3 px-6 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {m.providerEmail}
                    </span>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      Joined {formatDate(m.completedAt)}
                      {expiresOn && !m.expiredAt
                        ? ` · renews ${expiresOn.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                        : ""}
                      {m.renewalReminder30SentAt
                        ? " · 30d reminder ✓"
                        : ""}
                      {m.renewalReminder7SentAt ? " · 7d reminder ✓" : ""}
                    </p>
                  </div>
                  {badge && (
                    <span
                      className={
                        badge.tone === "red"
                          ? "shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          : "shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                      }
                    >
                      {badge.label}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: number | string
  tone: "red" | "green" | "blue"
}) {
  const toneClass = {
    red: "text-red-600 dark:text-red-400",
    green: "text-emerald-600 dark:text-emerald-400",
    blue: "text-blue-600 dark:text-blue-400",
  }[tone]

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold ${toneClass}`}>{value}</p>
    </div>
  )
}

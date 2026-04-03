import { prisma } from "@/lib/db"
import { niches } from "@/lib/niches"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Lead Detail -- Admin",
  description: "Full lead details with routing, TCPA, outcomes, and disputes.",
  robots: { index: false, follow: false },
}

const TEMP_COLORS: Record<string, string> = {
  cold: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  warm: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  hot: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  burning: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

const ROUTE_COLORS: Record<string, string> = {
  primary: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  failover: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  overflow: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  unmatched: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

const DISPUTE_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  denied: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

function formatDateTime(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  })
}

function formatResponseTime(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return "--"
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  return `${(seconds / 3600).toFixed(1)}h`
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      routedTo: {
        select: { id: true, businessName: true, email: true, phone: true },
      },
      outcomes: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          outcome: true,
          responseTimeSeconds: true,
          satisfactionRating: true,
          createdAt: true,
        },
      },
      disputes: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          reason: true,
          description: true,
          status: true,
          creditAmount: true,
          createdAt: true,
        },
      },
    },
  })

  if (!lead) {
    notFound()
  }

  const nicheData = niches.find((n) => n.slug === lead.niche)
  const name =
    `${lead.firstName ?? ""} ${lead.lastName ?? ""}`.trim() || "Unknown"

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Back Link */}
      <Link
        href="/admin/leads"
        className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        &larr; Back to Lead Management
      </Link>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            {name}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Lead ID: {lead.id}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize ${
              TEMP_COLORS[lead.temperature] ?? ""
            }`}
          >
            {lead.temperature}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize ${
              ROUTE_COLORS[lead.routeType] ?? ""
            }`}
          >
            {lead.routeType}
          </span>
        </div>
      </div>

      {/* Lead Information */}
      <section className="mb-8 rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Lead Information
          </h2>
        </div>
        <div className="grid gap-4 p-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              First Name
            </p>
            <p className="mt-1 text-sm text-gray-900 dark:text-white">
              {lead.firstName ?? "--"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Last Name
            </p>
            <p className="mt-1 text-sm text-gray-900 dark:text-white">
              {lead.lastName ?? "--"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Email
            </p>
            <p className="mt-1 text-sm">
              <a
                href={`mailto:${lead.email}`}
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                {lead.email}
              </a>
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Phone
            </p>
            <p className="mt-1 text-sm">
              {lead.phone ? (
                <a
                  href={`tel:${lead.phone}`}
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  {lead.phone}
                </a>
              ) : (
                <span className="text-gray-400 dark:text-gray-500">--</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Niche
            </p>
            <p className="mt-1 text-sm text-gray-900 dark:text-white">
              {nicheData ? `${nicheData.icon} ${nicheData.label}` : lead.niche}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              City
            </p>
            <p className="mt-1 text-sm capitalize text-gray-900 dark:text-white">
              {lead.city}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Message
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
              {lead.message ?? "--"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Created At
            </p>
            <p className="mt-1 text-sm text-gray-900 dark:text-white">
              {formatDateTime(lead.createdAt)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Updated At
            </p>
            <p className="mt-1 text-sm text-gray-900 dark:text-white">
              {formatDateTime(lead.updatedAt)}
            </p>
          </div>
        </div>
      </section>

      {/* Routing Details */}
      <section className="mb-8 rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Routing Details
          </h2>
        </div>
        <div className="grid gap-4 p-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Route Type
            </p>
            <p className="mt-1">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                  ROUTE_COLORS[lead.routeType] ?? ""
                }`}
              >
                {lead.routeType}
              </span>
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Temperature
            </p>
            <p className="mt-1">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                  TEMP_COLORS[lead.temperature] ?? ""
                }`}
              >
                {lead.temperature}
              </span>
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Routed To
            </p>
            {lead.routedTo ? (
              <div className="mt-1">
                <Link
                  href={`/admin/providers/${lead.routedTo.id}`}
                  className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  {lead.routedTo.businessName}
                </Link>
                {lead.routedTo.email && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {lead.routedTo.email}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-1 text-sm font-medium text-red-600 dark:text-red-400">
                Unmatched
              </p>
            )}
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              SLA Deadline
            </p>
            <p className="mt-1 text-sm text-gray-900 dark:text-white">
              {lead.slaDeadline ? (
                <>
                  {formatDateTime(lead.slaDeadline)}
                  {lead.slaDeadline < new Date() && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
                      Expired
                    </span>
                  )}
                </>
              ) : (
                <span className="text-gray-400 dark:text-gray-500">--</span>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* TCPA Consent */}
      <section className="mb-8 rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            TCPA Consent
          </h2>
        </div>
        <div className="grid gap-4 p-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Consent Given
            </p>
            <p className="mt-1">
              {lead.tcpaConsent ? (
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                  Yes
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
                  No
                </span>
              )}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Consent At
            </p>
            <p className="mt-1 text-sm text-gray-900 dark:text-white">
              {lead.tcpaConsentAt
                ? formatDateTime(lead.tcpaConsentAt)
                : "--"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              IP Address
            </p>
            <p className="mt-1 font-mono text-sm text-gray-900 dark:text-white">
              {lead.tcpaIpAddress ?? "--"}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Consent Text
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
              {lead.tcpaConsentText ?? "--"}
            </p>
          </div>
        </div>
      </section>

      {/* Outcomes */}
      <section className="mb-8 rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Lead Outcomes
          </h2>
        </div>
        <div className="p-6">
          {lead.outcomes.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No outcomes recorded for this lead.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="pb-2 font-medium text-gray-500 dark:text-gray-400">
                    Outcome
                  </th>
                  <th className="pb-2 font-medium text-gray-500 dark:text-gray-400">
                    Response Time
                  </th>
                  <th className="pb-2 font-medium text-gray-500 dark:text-gray-400">
                    Satisfaction
                  </th>
                  <th className="pb-2 font-medium text-gray-500 dark:text-gray-400">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {lead.outcomes.map((outcome) => (
                  <tr key={outcome.id}>
                    <td className="py-3">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium capitalize text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                        {outcome.outcome.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 text-gray-700 dark:text-gray-300">
                      {formatResponseTime(outcome.responseTimeSeconds)}
                    </td>
                    <td className="py-3 text-gray-700 dark:text-gray-300">
                      {outcome.satisfactionRating !== null
                        ? `${outcome.satisfactionRating.toFixed(1)} / 5`
                        : "--"}
                    </td>
                    <td className="py-3 text-xs text-gray-500 dark:text-gray-400">
                      {formatDateTime(outcome.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Disputes */}
      <section className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Disputes
          </h2>
        </div>
        <div className="p-6">
          {lead.disputes.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No disputes filed for this lead.
            </p>
          ) : (
            <div className="space-y-4">
              {lead.disputes.map((dispute) => (
                <div
                  key={dispute.id}
                  className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium capitalize text-gray-900 dark:text-white">
                        {dispute.reason.replace("_", " ")}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                          DISPUTE_STATUS_COLORS[dispute.status] ?? ""
                        }`}
                      >
                        {dispute.status}
                      </span>
                    </div>
                    {dispute.creditAmount !== null && (
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        Credit: ${dispute.creditAmount.toFixed(2)}
                      </span>
                    )}
                  </div>
                  {dispute.description && (
                    <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                      {dispute.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Filed: {formatDateTime(dispute.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

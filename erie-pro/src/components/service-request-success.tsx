"use client"

import Link from "next/link"
import { CheckCircle2, AlertTriangle } from "lucide-react"
import type { ServiceRequestSubmitResponse } from "@/lib/service-requests/types"

export function ServiceRequestSuccess({ result }: { result: ServiceRequestSubmitResponse }) {
  const consumerLabel = result.notifications.consumerConfirmation.label
  const providerLabel = result.notifications.providerNotification.label
  const statusPath = result.statusUrl.replace(/^https?:\/\/[^/]+/, "")

  return (
    <div
      role="alert"
      aria-live="polite"
      className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-6"
    >
      <CheckCircle2 className="mx-auto h-10 w-10 text-green-600 dark:text-green-400" aria-hidden />
      <p className="mt-3 text-center text-lg font-bold text-green-800 dark:text-green-300">
        Request received
      </p>
      <p className="mt-2 text-center text-sm text-green-800 dark:text-green-300">{result.message}</p>
      <dl className="mt-4 space-y-2 text-sm text-green-900 dark:text-green-200">
        <div className="flex justify-between gap-4">
          <dt className="font-medium">Request ID</dt>
          <dd className="font-mono text-right">{result.requestId}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="font-medium">Confirmation email</dt>
          <dd className="capitalize">{consumerLabel}</dd>
        </div>
        {result.notifications.providerNotification.status !== "not_applicable" && (
          <div className="flex justify-between gap-4">
            <dt className="font-medium">Provider notified</dt>
            <dd>{result.providerNotified ? "Yes — email sent" : `No — ${providerLabel}`}</dd>
          </div>
        )}
        {result.routedTo && (
          <div className="flex justify-between gap-4">
            <dt className="font-medium">Routed to</dt>
            <dd className="text-right">{result.routedTo}</dd>
          </div>
        )}
      </dl>
      <p className="mt-4 text-center">
        <Link
          href={statusPath}
          className="text-sm font-semibold text-primary underline underline-offset-2"
        >
          Track request status
        </Link>
      </p>
      {result.partialFailures.length > 0 && (
        <div
          role="alert"
          className="mt-4 flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-900/20 dark:text-amber-100 dark:border-amber-800"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
          <ul className="list-disc pl-4 space-y-1">
            {result.partialFailures.map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

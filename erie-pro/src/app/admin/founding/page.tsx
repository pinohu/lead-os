// ── Admin — Founding Offer Control ────────────────────────────────
// Mutate the founding-seat counter (and price/total) without a
// redeploy. Server actions write to the Setting table; the /pros
// page's revalidation picks up the new values within the hour, or
// instantly if you click "Refresh /pros now" (which calls
// revalidatePath).

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { verifyAdminRoleFresh } from "@/lib/require-admin"
import { getFoundingOffer } from "@/lib/founding-offer"
import {
  incrementFoundingClaimed,
  saveFoundingOffer,
  resetFoundingOfferToEnv,
} from "./actions"

export const dynamic = "force-dynamic"

export default async function FoundingAdminPage() {
  const session = await auth()
  if (!session?.user) redirect("/login?callbackUrl=/admin/founding")
  const role = (session.user as { role?: string }).role
  if (role !== "admin") redirect("/dashboard")
  // Fresh DB check — JWT role claim may be stale up to 30 days after demotion.
  const stillAdmin = await verifyAdminRoleFresh((session.user as { id?: string }).id)
  if (!stillAdmin) redirect("/dashboard")

  const offer = await getFoundingOffer()
  const adminEmail = session.user.email ?? undefined
  const pct = Math.round(
    (offer.claimedSlots / Math.max(offer.totalSlots, 1)) * 100,
  )

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Founding Offer Control
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Adjust the founding-seat counter and pricing shown on{" "}
          <code className="rounded bg-gray-100 px-1 py-0.5 text-xs dark:bg-gray-800">
            /pros
          </code>
          . Changes write to the <code>settings</code> table and override
          the <code>NEXT_PUBLIC_FOUNDING_*</code> env vars.
        </p>
      </div>

      {/* ── Current state ──────────────────────────────────────── */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Live values
          </h2>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              offer.source === "db"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
            }`}
          >
            source: {offer.source}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Metric label="Claimed" value={`${offer.claimedSlots} / ${offer.totalSlots}`} />
          <Metric label="Remaining" value={String(offer.remainingSlots)} />
          <Metric label="Founding price" value={`$${offer.price}/mo`} />
          <Metric label="Normal price" value={`$${offer.normalPrice}/mo`} />
          <Metric label="Lock" value={`${offer.lockMonths} months`} />
          <Metric label="Status" value={offer.isSoldOut ? "SOLD OUT" : "Open"} />
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div
            className="h-full bg-blue-600 transition-[width]"
            style={{ width: `${pct}%` }}
          />
        </div>
      </section>

      {/* ── Quick action: +1 claimed ───────────────────────────── */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          A founding seat was just claimed
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Click the button after a new Pro signs up to bump the public
          counter immediately.
        </p>
        <form action={incrementFoundingClaimed} className="mt-4">
          <input type="hidden" name="updatedBy" value={adminEmail ?? ""} />
          <button
            type="submit"
            disabled={offer.isSoldOut}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-700"
          >
            +1 claimed → {Math.min(offer.claimedSlots + 1, offer.totalSlots)} /{" "}
            {offer.totalSlots}
          </button>
        </form>
      </section>

      {/* ── Full edit form ─────────────────────────────────────── */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Edit full offer
        </h2>
        <form action={saveFoundingOffer} className="mt-4 space-y-4">
          <input type="hidden" name="updatedBy" value={adminEmail ?? ""} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="claimedSlots"
              label="Claimed slots"
              defaultValue={offer.claimedSlots}
              min={0}
              max={offer.totalSlots}
            />
            <Field
              id="totalSlots"
              label="Total slots"
              defaultValue={offer.totalSlots}
              min={1}
            />
            <Field
              id="price"
              label="Founding price ($/mo)"
              defaultValue={offer.price}
              min={0}
            />
            <Field
              id="normalPrice"
              label="Normal price ($/mo)"
              defaultValue={offer.normalPrice}
              min={0}
            />
            <Field
              id="lockMonths"
              label="Lock period (months)"
              defaultValue={offer.lockMonths}
              min={1}
              max={60}
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              Save and refresh /pros
            </button>
            <button
              type="submit"
              formAction={resetFoundingOfferToEnv}
              className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Reset to env defaults
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
        {value}
      </p>
    </div>
  )
}

function Field({
  id,
  label,
  defaultValue,
  min,
  max,
}: {
  id: string
  label: string
  defaultValue: number
  min?: number
  max?: number
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
        {label}
      </span>
      <input
        id={id}
        name={id}
        type="number"
        defaultValue={defaultValue}
        min={min}
        max={max}
        required
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
      />
    </label>
  )
}

// ── Provider Dashboard — Billing & Invoice History ───────────────────
// Server component showing current plan, payment history, and billing management.

import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getNicheBySlug } from "@/lib/niches";
import BillingButton from "../settings/billing-button";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dashboard/billing");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user?.providerId) redirect("/dashboard");

  const provider = await prisma.provider.findUnique({
    where: { id: user.providerId },
  });
  if (!provider) redirect("/dashboard");

  const nicheData = getNicheBySlug(provider.niche);

  // Fetch payment history from CheckoutSession table
  const payments = await prisma.checkoutSession.findMany({
    where: { providerEmail: provider.email.toLowerCase() },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Calculate next billing date (approximate: 30 days from last payment or activation)
  const lastPayment = payments.find((p) => p.status === "completed");
  const nextBillingDate = lastPayment?.completedAt
    ? new Date(lastPayment.completedAt.getTime() + 30 * 24 * 60 * 60 * 1000)
    : null;

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    trial: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    past_due: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    expired: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-600",
    cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-600",
  };

  const sessionStatusColors: Record<string, string> = {
    completed: "text-green-700 dark:text-green-400",
    pending: "text-amber-700 dark:text-amber-400",
    expired: "text-gray-500 dark:text-gray-600",
    cancelled: "text-red-700 dark:text-red-400",
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Billing & Invoices
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-600">
            Manage your subscription and view payment history.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          &larr; Back to Dashboard
        </Link>
      </div>

      {/* ── Current Plan ──────────────────────────────────────── */}
      <section className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Current Plan
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-600">Plan</p>
            <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-white capitalize">
              {nicheData?.label ?? provider.niche} Territory &mdash; {provider.tier}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-600">Monthly Fee</p>
            <p className="mt-0.5 text-lg font-bold text-gray-900 dark:text-white">
              ${provider.monthlyFee}/mo
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-600">Status</p>
            <span
              className={`mt-0.5 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                statusColors[provider.subscriptionStatus] ?? statusColors.expired
              }`}
            >
              {provider.subscriptionStatus.replace("_", " ")}
            </span>
          </div>
        </div>

        {nextBillingDate && provider.subscriptionStatus === "active" && (
          <div className="rounded-md bg-gray-50 dark:bg-gray-900 px-4 py-3">
            <p className="text-sm text-gray-600 dark:text-gray-600">
              Next billing date:{" "}
              <span className="font-medium text-gray-900 dark:text-white">
                {nextBillingDate.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          {provider.stripeCustomerId ? (
            <BillingButton />
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-600">
              No billing account linked. Contact support to set up billing.
            </p>
          )}
          <Link
            href="/for-business/claim"
            className="inline-flex items-center rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900"
          >
            Upgrade Plan
          </Link>
        </div>
      </section>

      {/* ── Payment History ────────────────────────────────────── */}
      <section className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Payment History
        </h2>

        {payments.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-600">
            No payment records found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left px-3 py-2.5 font-medium text-gray-500 dark:text-gray-600">
                    Date
                  </th>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-500 dark:text-gray-600">
                    Type
                  </th>
                  <th className="text-right px-3 py-2.5 font-medium text-gray-500 dark:text-gray-600">
                    Amount
                  </th>
                  <th className="text-right px-3 py-2.5 font-medium text-gray-500 dark:text-gray-600">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-gray-100 dark:border-gray-800/50"
                  >
                    <td className="px-3 py-2.5 text-gray-900 dark:text-white">
                      {p.createdAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 dark:text-gray-600 capitalize">
                      {p.sessionType.replace("_", " ")}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-gray-900 dark:text-white">
                      ${(p.monthlyFee ?? p.price ?? 0).toFixed(2)}
                    </td>
                    <td
                      className={`px-3 py-2.5 text-right font-medium capitalize ${
                        sessionStatusColors[p.status] ?? "text-gray-500"
                      }`}
                    >
                      {p.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

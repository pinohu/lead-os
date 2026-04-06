// ── Provider Dashboard — Overview ─────────────────────────────────────
// Shows key metrics, recent leads, territory status, and quick actions.

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cityConfig } from "@/lib/city-config";
import { getNicheBySlug } from "@/lib/niches";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import VerificationCodeForm from "./verification-code-form";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dashboard");

  // Look up the provider linked to this user
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user?.providerId) {
    return (
      <div className="mx-auto max-w-2xl text-center py-16">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          No Territory Linked
        </h1>
        <p className="text-gray-600 dark:text-gray-600 mb-6">
          Your account isn&apos;t linked to a provider territory yet. Claim a territory to start receiving leads.
        </p>
        <Link
          href="/for-business/claim"
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-500"
        >
          Claim a Territory
        </Link>
      </div>
    );
  }

  const provider = await prisma.provider.findUnique({
    where: { id: user.providerId },
    include: {
      territories: { where: { deactivatedAt: null } },
    },
  });

  if (!provider) notFound();

  // Fetch recent leads (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [recentLeads, pendingDisputes, totalLeadsThisMonth] = await Promise.all([
    prisma.lead.findMany({
      where: { routedToId: provider.id, createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.leadDispute.count({
      where: { providerId: provider.id, status: "pending" },
    }),
    prisma.lead.count({
      where: { routedToId: provider.id, createdAt: { gte: thirtyDaysAgo } },
    }),
  ]);

  const nicheData = getNicheBySlug(provider.niche);
  const territory = provider.territories[0];

  return (
    <div className="space-y-8">
      {/* ── Verification Banner ──────────────────────────────────── */}
      {provider.verificationStatus === "unverified" && (
        <div className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 text-lg">!</span>
            <div>
              <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-200">Verify Your Business Ownership</h2>
              <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
                Leads are held until you verify ownership of your business. Click below to receive a verification code.
              </p>
              <form action="/api/verify-claim/send" method="POST" className="mt-3">
                <button
                  type="submit"
                  className="inline-flex items-center rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-amber-500"
                >
                  Send Verification Code
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {provider.verificationStatus === "pending" && (
        <div className="rounded-lg border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-lg">&#9993;</span>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-200">Enter Verification Code</h2>
              <p className="mt-1 text-sm text-blue-800 dark:text-blue-300">
                A 6-digit code was sent to the business email on file. Enter it below to verify ownership and start receiving leads.
              </p>
              <VerificationCodeForm />
              <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                Didn&apos;t receive it?{" "}
                <form action="/api/verify-claim/send" method="POST" className="inline">
                  <button type="submit" className="underline hover:no-underline">Resend code</button>
                </form>
              </p>
            </div>
          </div>
        </div>
      )}

      {provider.verificationStatus === "rejected" && (
        <div className="rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-6">
          <p className="text-sm text-red-800 dark:text-red-200">
            <strong>Claim rejected.</strong> Your ownership claim was not approved. Contact{" "}
            <a href={`mailto:hello@${cityConfig.domain}`} className="underline">hello@{cityConfig.domain}</a> for assistance.
          </p>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {provider.businessName}
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-600">
          {nicheData?.label ?? provider.niche} territory in {cityConfig.name}, {cityConfig.stateCode}
        </p>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Leads This Month"
          value={totalLeadsThisMonth}
          trend={provider.totalLeads > 0 ? `${provider.totalLeads} all-time` : undefined}
        />
        <StatCard
          label="Conversion Rate"
          value={
            provider.totalLeads > 0
              ? `${Math.round((provider.convertedLeads / provider.totalLeads) * 100)}%`
              : "N/A"
          }
          trend={`${provider.convertedLeads} converted`}
        />
        <StatCard
          label="Avg Response Time"
          value={
            provider.avgResponseTime > 0
              ? `${Math.round(provider.avgResponseTime / 60)}m`
              : "N/A"
          }
          trend={provider.avgResponseTime > 0 ? `${Math.round(provider.avgResponseTime)}s` : undefined}
        />
        <StatCard
          label="Rating"
          value={provider.avgRating > 0 ? `${provider.avgRating.toFixed(1)}/5` : "N/A"}
          trend={provider.reviewCount > 0 ? `${provider.reviewCount} reviews` : undefined}
        />
      </div>

      {/* ── Territory Status ──────────────────────────────────── */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Territory Status</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-600">Subscription</p>
            <p className="mt-1 font-medium text-gray-900 dark:text-white">
              <StatusBadge status={provider.subscriptionStatus} />
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-600">Monthly Fee</p>
            <p className="mt-1 font-medium text-gray-900 dark:text-white">
              ${provider.monthlyFee}/mo
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-600">Territory</p>
            <p className="mt-1 font-medium text-gray-900 dark:text-white">
              {territory
                ? territory.isPaused
                  ? "Paused"
                  : "Active"
                : "None"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Onboarding Checklist (shown when no leads yet) ──── */}
      {recentLeads.length === 0 && (
        <div className="rounded-lg border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/20 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Get started with your territory
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-600 mb-4">
            Complete these steps to start receiving leads.
          </p>
          <ul className="space-y-3">
            {[
              {
                label: "Complete your business profile",
                done: !!provider.description,
                href: "/dashboard/profile",
              },
              {
                label: "Verify your license",
                done: !!provider.license,
                href: "/dashboard/profile",
              },
              {
                label: "Set your service hours",
                done: false,
                href: "/dashboard/settings",
              },
              {
                label: "Review your territory listing",
                done: false,
                href: `/${provider.niche}/directory`,
              },
            ].map((step) => (
              <li key={step.label} className="flex items-center gap-3">
                {step.done ? (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
                    <svg className="h-3.5 w-3.5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                ) : (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-gray-300 dark:border-gray-600" />
                )}
                {step.done ? (
                  <span className="text-sm text-gray-500 dark:text-gray-600 line-through">{step.label}</span>
                ) : (
                  <Link
                    href={step.href}
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {step.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Recent Leads ──────────────────────────────────────── */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Leads</h2>
          <Link
            href="/dashboard/leads"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            View all
          </Link>
        </div>

        {recentLeads.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-600">
            No leads in the last 30 days. Leads will appear here as they come in.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left py-2 pr-4 font-medium text-gray-500 dark:text-gray-600">Name</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-500 dark:text-gray-600">Contact</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-500 dark:text-gray-600">Temp</th>
                  <th className="text-left py-2 font-medium text-gray-500 dark:text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead) => (
                  <tr key={lead.id} className="border-b border-gray-100 dark:border-gray-800/50">
                    <td className="py-3 pr-4 text-gray-900 dark:text-white">
                      {lead.firstName ?? "Unknown"} {lead.lastName ?? ""}
                    </td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-600">
                      {lead.email}
                    </td>
                    <td className="py-3 pr-4">
                      <TemperatureBadge temperature={lead.temperature} />
                    </td>
                    <td className="py-3 text-gray-600 dark:text-gray-600">
                      {lead.createdAt.toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Quick Actions ──────────────────────────────────────── */}
      {pendingDisputes > 0 && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 p-4">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            You have <strong>{pendingDisputes}</strong> pending lead dispute{pendingDisputes > 1 ? "s" : ""}.{" "}
            <Link href="/dashboard/disputes" className="underline hover:no-underline">
              Review now
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}

// ── Presentational Components ────────────────────────────────────────

function StatCard({
  label,
  value,
  trend,
}: {
  label: string;
  value: string | number;
  trend?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4">
      <p className="text-sm text-gray-500 dark:text-gray-600">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      {trend && (
        <p className="mt-1 text-xs text-gray-600 dark:text-gray-500">{trend}</p>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    trial: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    past_due: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    expired: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-600",
    cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-600",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] ?? colors.expired}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function TemperatureBadge({ temperature }: { temperature: string }) {
  const colors: Record<string, string> = {
    cold: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    warm: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    hot: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    burning: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[temperature] ?? colors.warm}`}
    >
      {temperature}
    </span>
  );
}

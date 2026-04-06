// ── Provider Dashboard — Settings ─────────────────────────────────────
// View and update provider profile, notification preferences, and account.

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cityConfig } from "@/lib/city-config";
import { getNicheBySlug } from "@/lib/niches";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import BillingButton from "./billing-button";
import TerritoryToggle from "./territory-toggle";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dashboard/settings");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user?.providerId) redirect("/dashboard");

  const provider = await prisma.provider.findUnique({
    where: { id: user.providerId },
    include: {
      territories: { where: { deactivatedAt: null } },
    },
  });
  if (!provider) notFound();

  const nicheData = getNicheBySlug(provider.niche);

  // Serialize territories for the client component
  const territoryData = provider.territories.map((t) => ({
    id: t.id,
    niche: t.niche,
    city: t.city,
    deactivatedAt: t.deactivatedAt,
  }));

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-600">
          Manage your provider profile and account preferences.
        </p>
      </div>

      {/* ── Business Profile ──────────────────────────────────── */}
      <section className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Business Profile</h2>
          <Link
            href="/dashboard/profile"
            className="inline-flex items-center gap-1 rounded-md bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Edit Profile
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldDisplay label="Business Name" value={provider.businessName} />
          <FieldDisplay label="Niche" value={nicheData?.label ?? provider.niche} />
          <FieldDisplay label="Email" value={provider.email} />
          <FieldDisplay label="Phone" value={provider.phone} />
          <FieldDisplay label="City" value={`${cityConfig.name}, ${cityConfig.stateCode}`} />
          <FieldDisplay label="Service Areas" value={provider.serviceAreas.join(", ") || "Not set"} />
          <FieldDisplay label="Year Established" value={provider.yearEstablished?.toString() ?? "Not set"} />
          <FieldDisplay label="Employees" value={provider.employeeCount ?? "Not set"} />
        </div>

        <div>
          <FieldDisplay label="Description" value={provider.description || "Not set"} />
        </div>

        {provider.license && (
          <FieldDisplay label="License" value={provider.license} />
        )}
      </section>

      {/* ── Territories ──────────────────────────────────────── */}
      <section className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Territories</h2>
        <p className="text-sm text-gray-600 dark:text-gray-600">
          Pause lead delivery for a territory when you are at capacity. Resume anytime.
        </p>
        <TerritoryToggle territories={territoryData} />
      </section>

      {/* ── Subscription Details ──────────────────────────────── */}
      <section className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Subscription</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldDisplay label="Status" value={provider.subscriptionStatus.replace("_", " ")} />
          <FieldDisplay label="Monthly Fee" value={`$${provider.monthlyFee}/mo`} />
          <FieldDisplay label="Tier" value={provider.tier} />
          <FieldDisplay label="Billing" value={provider.billingInterval} />
        </div>

        {provider.stripeCustomerId ? (
          <BillingButton />
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-600">
            No billing account linked. Contact support to set up billing.
          </p>
        )}
      </section>

      {/* ── Account ──────────────────────────────────────────── */}
      <section className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Account</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldDisplay label="Email Verified" value={provider.emailVerified ? "Yes" : "No"} />
          <FieldDisplay label="Member Since" value={provider.claimedAt.toLocaleDateString()} />
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex gap-4">
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="rounded-md bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              Sign Out
            </button>
          </form>
          <Link
            href="/api/privacy/delete-data"
            className="rounded-md border border-red-300 dark:border-red-800 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            Request Data Deletion
          </Link>
        </div>
      </section>
    </div>
  );
}

function FieldDisplay({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-600">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-white capitalize">{value}</p>
    </div>
  );
}

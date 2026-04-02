// -- Admin Claims Verification Queue -----------------------------------------
// Lists all providers pending ownership verification. Admins can approve or
// reject claims directly from this page.

import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminClaimsPage() {
  const pendingProviders = await prisma.provider.findMany({
    where: {
      verificationStatus: { in: ["unverified", "pending"] },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      businessName: true,
      email: true,
      niche: true,
      city: true,
      verificationStatus: true,
      verificationAttempts: true,
      claimedListingId: true,
      subscriptionStatus: true,
      createdAt: true,
    },
  });

  // Fetch linked listings in one query
  const listingIds = pendingProviders
    .map((p) => p.claimedListingId)
    .filter(Boolean) as string[];

  const listings =
    listingIds.length > 0
      ? await prisma.directoryListing.findMany({
          where: { id: { in: listingIds } },
          select: {
            id: true,
            businessName: true,
            email: true,
            phone: true,
            website: true,
          },
        })
      : [];

  const listingMap = new Map(listings.map((l) => [l.id, l]));

  // Also fetch recently resolved claims for context
  const recentResolved = await prisma.provider.findMany({
    where: {
      verificationStatus: { in: ["verified", "auto_verified", "admin_approved", "rejected"] },
    },
    orderBy: { updatedAt: "desc" },
    take: 10,
    select: {
      id: true,
      businessName: true,
      email: true,
      niche: true,
      verificationStatus: true,
      updatedAt: true,
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Claims Verification Queue
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {pendingProviders.length} claim{pendingProviders.length !== 1 ? "s" : ""} awaiting review
        </p>
      </div>

      {/* -- Pending Claims ------------------------------------------------- */}
      {pendingProviders.length === 0 ? (
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No pending verification claims. All clear!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingProviders.map((provider) => {
            const listing = provider.claimedListingId
              ? listingMap.get(provider.claimedListingId)
              : null;

            return (
              <div
                key={provider.id}
                className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                        {provider.businessName}
                      </h3>
                      <StatusBadge status={provider.verificationStatus} />
                    </div>

                    <div className="grid grid-cols-1 gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium text-gray-500 dark:text-gray-500">Email:</span>{" "}
                        {provider.email}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium text-gray-500 dark:text-gray-500">Niche:</span>{" "}
                        {provider.niche}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium text-gray-500 dark:text-gray-500">City:</span>{" "}
                        {provider.city}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium text-gray-500 dark:text-gray-500">Subscription:</span>{" "}
                        {provider.subscriptionStatus}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium text-gray-500 dark:text-gray-500">Claimed:</span>{" "}
                        {provider.createdAt.toLocaleDateString()}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium text-gray-500 dark:text-gray-500">Attempts:</span>{" "}
                        {provider.verificationAttempts}/10
                      </p>
                    </div>

                    {/* Linked listing details */}
                    {listing ? (
                      <div className="mt-3 rounded-md border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                          Claiming Listing
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white font-medium">
                          {listing.businessName}
                        </p>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 space-y-0.5">
                          {listing.email && <p>Listing email: {listing.email}</p>}
                          {listing.phone && <p>Listing phone: {listing.phone}</p>}
                          {listing.website && <p>Listing website: {listing.website}</p>}
                        </div>
                      </div>
                    ) : provider.claimedListingId ? (
                      <p className="mt-2 text-xs text-gray-400">
                        Linked listing ID: {provider.claimedListingId} (not found)
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-gray-400">
                        New business (not claiming an existing listing)
                      </p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 shrink-0">
                    <ClaimActionForm
                      providerId={provider.id}
                      action="admin_approved"
                      label="Approve"
                      className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-green-500"
                    />
                    <ClaimActionForm
                      providerId={provider.id}
                      action="rejected"
                      label="Reject"
                      className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-500"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* -- Recently Resolved ---------------------------------------------- */}
      {recentResolved.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Recently Resolved
          </h2>
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-400">Business</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-400">Niche</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-400">Resolved</th>
                </tr>
              </thead>
              <tbody>
                {recentResolved.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100 dark:border-gray-800/50">
                    <td className="py-2.5 px-4 text-gray-900 dark:text-white">
                      <Link href={`/admin/providers/${p.id}`} className="hover:underline">
                        {p.businessName}
                      </Link>
                    </td>
                    <td className="py-2.5 px-4 text-gray-600 dark:text-gray-400">{p.niche}</td>
                    <td className="py-2.5 px-4">
                      <StatusBadge status={p.verificationStatus} />
                    </td>
                    <td className="py-2.5 px-4 text-gray-600 dark:text-gray-400">
                      {p.updatedAt.toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// -- Presentational Components ------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    unverified: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    verified: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    auto_verified: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    admin_approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? styles.unverified}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function ClaimActionForm({
  providerId,
  action,
  label,
  className,
}: {
  providerId: string;
  action: string;
  label: string;
  className: string;
}) {
  return (
    <form action={`/api/admin/claims/resolve`} method="POST">
      <input type="hidden" name="providerId" value={providerId} />
      <input type="hidden" name="status" value={action} />
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );
}

// ── Provider Dashboard — Lead Disputes ────────────────────────────────
// View dispute history and create new disputes for bad leads.

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import DisputeForm from "./dispute-form";

export const dynamic = "force-dynamic";

export default async function DisputesPage({
  searchParams,
}: {
  searchParams: Promise<{ leadId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dashboard/disputes");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user?.providerId) redirect("/dashboard");

  const params = await searchParams;
  const prefilledLeadId = params.leadId;

  // Fetch existing disputes — pending first, then newest
  const disputes = await prisma.leadDispute.findMany({
    where: { providerId: user.providerId },
    orderBy: [
      { status: "asc" }, // "pending" sorts before "approved"/"denied" alphabetically
      { createdAt: "desc" },
    ],
    take: 50,
    include: {
      lead: { select: { id: true, firstName: true, lastName: true, email: true, niche: true, createdAt: true } },
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lead Disputes</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Report bad leads (wrong number, spam, out of area) for credit review.
        </p>
      </div>

      {/* ── New Dispute Form ──────────────────────────────────── */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">File a Dispute</h2>
        <DisputeForm providerId={user.providerId} prefilledLeadId={prefilledLeadId} />
      </div>

      {/* ── Dispute History ───────────────────────────────────── */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Dispute History</h2>

        {disputes.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">No disputes filed</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              All clear! If you receive a bad lead (wrong number, spam, or out of area),
              use the form above to file a dispute for credit review.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left py-2 pr-4 font-medium text-gray-500 dark:text-gray-400">Lead</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-500 dark:text-gray-400">Reason</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-500 dark:text-gray-400">Credit</th>
                  <th className="text-left py-2 font-medium text-gray-500 dark:text-gray-400">Filed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {disputes.map((d) => (
                  <tr key={d.id}>
                    <td className="py-3 pr-4 text-gray-900 dark:text-white">
                      {d.lead.firstName ?? "Unknown"} {d.lead.lastName ?? ""} — {d.lead.email}
                    </td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-400 capitalize">
                      {d.reason.replace("_", " ")}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          d.status === "approved"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : d.status === "denied"
                              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">
                      {d.creditAmount ? `$${d.creditAmount.toFixed(2)}` : "—"}
                    </td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">
                      {d.createdAt.toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

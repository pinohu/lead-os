// ── Provider Dashboard — Leads ────────────────────────────────────────
// Full lead history with filtering, temperature badges, and outcome recording.

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import LeadOutcomeButton from "./lead-outcome-button";

export const dynamic = "force-dynamic";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; temp?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dashboard/leads");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user?.providerId) redirect("/dashboard");

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const tempFilter = params.temp;
  const perPage = 20;

  const where = {
    routedToId: user.providerId,
    ...(tempFilter ? { temperature: tempFilter as "cold" | "warm" | "hot" | "burning" } : {}),
  };

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: perPage,
      skip: (page - 1) * perPage,
      include: {
        outcomes: { take: 1, orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.lead.count({ where }),
  ]);

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leads</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{total} total leads</p>
      </div>

      {/* ── Temperature Filter ──────────────────────────────────── */}
      <div className="flex gap-2">
        {["all", "cold", "warm", "hot", "burning"].map((temp) => (
          <Link
            key={temp}
            href={`/dashboard/leads${temp === "all" ? "" : `?temp=${temp}`}`}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              (temp === "all" && !tempFilter) || temp === tempFilter
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {temp.charAt(0).toUpperCase() + temp.slice(1)}
          </Link>
        ))}
      </div>

      {/* ── Leads Table ────────────────────────────────────────── */}
      {leads.length === 0 ? (
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {tempFilter
              ? `No ${tempFilter} leads found. Try a different filter.`
              : "No leads yet. They'll appear here as they come in."}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Phone</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Temp</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Outcome</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {leads.map((lead) => {
                  const outcome = lead.outcomes[0];
                  return (
                    <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                      <td className="py-3 px-4 text-gray-900 dark:text-white">
                        {lead.firstName ?? "—"} {lead.lastName ?? ""}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        <a href={`mailto:${lead.email}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                          {lead.email}
                        </a>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {lead.phone ? (
                          <a href={`tel:${lead.phone}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                            {lead.phone}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            {
                              cold: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
                              warm: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
                              hot: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
                              burning: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
                            }[lead.temperature]
                          }`}
                        >
                          {lead.temperature}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <LeadOutcomeButton
                          leadId={lead.id}
                          currentOutcome={outcome?.outcome ?? null}
                        />
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {lead.createdAt.toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/dashboard/disputes?leadId=${lead.id}`}
                          className="text-xs text-red-600 dark:text-red-400 hover:underline"
                          title="Dispute this lead"
                        >
                          Dispute
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ──────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 px-4 py-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={`/dashboard/leads?page=${page - 1}${tempFilter ? `&temp=${tempFilter}` : ""}`}
                    className="rounded-md bg-gray-100 dark:bg-gray-800 px-3 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    Previous
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={`/dashboard/leads?page=${page + 1}${tempFilter ? `&temp=${tempFilter}` : ""}`}
                    className="rounded-md bg-gray-100 dark:bg-gray-800 px-3 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    Next
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

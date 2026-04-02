// ── Admin Audit Log Viewer ────────────────────────────────────────────
// Searchable, filterable audit trail for all security-relevant events.

import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; entity?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const perPage = 50;

  const where = {
    ...(params.action ? { action: params.action } : {}),
    ...(params.entity ? { entityType: params.entity } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: perPage,
      skip: (page - 1) * perPage,
      include: {
        provider: { select: { businessName: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Log</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{total} total entries</p>
      </div>

      {/* ── Filters ───────────────────────────────────────────── */}
      <div className="flex gap-3 text-sm">
        {["all", "territory.claimed", "lead.routed", "lead.submitted", "lead.disputed", "subscription.cancelled", "provider.email_verified"].map((action) => (
          <a
            key={action}
            href={`/admin/audit-log${action === "all" ? "" : `?action=${action}`}`}
            className={`rounded-full px-3 py-1 font-medium transition-colors ${
              (action === "all" && !params.action) || action === params.action
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {action === "all" ? "All" : action.replace(".", " ")}
          </a>
        ))}
      </div>

      {/* ── Log Table ─────────────────────────────────────────── */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="text-left py-2 px-4 font-medium text-gray-500 dark:text-gray-400">Time</th>
                <th className="text-left py-2 px-4 font-medium text-gray-500 dark:text-gray-400">Action</th>
                <th className="text-left py-2 px-4 font-medium text-gray-500 dark:text-gray-400">Entity</th>
                <th className="text-left py-2 px-4 font-medium text-gray-500 dark:text-gray-400">Provider</th>
                <th className="text-left py-2 px-4 font-medium text-gray-500 dark:text-gray-400">IP</th>
                <th className="text-left py-2 px-4 font-medium text-gray-500 dark:text-gray-400">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                  <td className="py-2 px-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {log.createdAt.toLocaleString()}
                  </td>
                  <td className="py-2 px-4">
                    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2 px-4 text-gray-600 dark:text-gray-400">
                    {log.entityType}{log.entityId ? `:${log.entityId.slice(0, 8)}` : ""}
                  </td>
                  <td className="py-2 px-4 text-gray-900 dark:text-white">
                    {log.provider?.businessName ?? "—"}
                  </td>
                  <td className="py-2 px-4 font-mono text-xs text-gray-500 dark:text-gray-400">
                    {log.ipAddress ?? "—"}
                  </td>
                  <td className="py-2 px-4 text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">
                    {log.metadata ? JSON.stringify(log.metadata) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 px-4 py-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              {page > 1 && (
                <a
                  href={`/admin/audit-log?page=${page - 1}${params.action ? `&action=${params.action}` : ""}`}
                  className="rounded px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                >
                  Previous
                </a>
              )}
              {page < totalPages && (
                <a
                  href={`/admin/audit-log?page=${page + 1}${params.action ? `&action=${params.action}` : ""}`}
                  className="rounded px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                >
                  Next
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

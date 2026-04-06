// ── Dashboard Skeleton Loading UI ──────────────────────────────────────
// Matches the dashboard layout with animated pulse placeholders.

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* ── Header skeleton ────────────────────────────────────── */}
      <div>
        <div className="h-8 w-64 animate-pulse motion-reduce:animate-none rounded bg-muted" />
        <div className="mt-2 h-4 w-48 animate-pulse motion-reduce:animate-none rounded bg-muted" />
      </div>

      {/* ── Stat Cards skeleton ────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4"
          >
            <div className="h-4 w-24 animate-pulse motion-reduce:animate-none rounded bg-muted" />
            <div className="mt-2 h-8 w-16 animate-pulse motion-reduce:animate-none rounded bg-muted" />
            <div className="mt-2 h-3 w-20 animate-pulse motion-reduce:animate-none rounded bg-muted" />
          </div>
        ))}
      </div>

      {/* ── Territory Status skeleton ──────────────────────────── */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
        <div className="h-6 w-36 animate-pulse motion-reduce:animate-none rounded bg-muted mb-4" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <div className="h-4 w-20 animate-pulse motion-reduce:animate-none rounded bg-muted" />
              <div className="mt-2 h-5 w-24 animate-pulse motion-reduce:animate-none rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent Leads skeleton ──────────────────────────────── */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-28 animate-pulse motion-reduce:animate-none rounded bg-muted" />
          <div className="h-4 w-16 animate-pulse motion-reduce:animate-none rounded bg-muted" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 border-b border-gray-100 dark:border-gray-800/50 py-3"
            >
              <div className="h-4 w-28 animate-pulse motion-reduce:animate-none rounded bg-muted" />
              <div className="h-4 w-40 animate-pulse motion-reduce:animate-none rounded bg-muted" />
              <div className="h-5 w-14 animate-pulse motion-reduce:animate-none rounded-full bg-muted" />
              <div className="h-4 w-20 animate-pulse motion-reduce:animate-none rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

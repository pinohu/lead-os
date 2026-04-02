export default function NotificationsLoading() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading notifications" className="space-y-6">
      <div className="h-8 w-56 animate-pulse rounded-md bg-muted" />
      <div className="rounded-xl border border-border p-6 space-y-4">
        <div className="h-5 w-40 animate-pulse rounded bg-muted" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between py-3">
            <div className="space-y-1.5">
              <div className="h-4 w-28 animate-pulse rounded bg-muted" />
              <div className="h-3 w-48 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-6 w-11 animate-pulse rounded-full bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

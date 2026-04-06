export default function SettingsLoading() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading settings" className="space-y-6">
      <div className="h-8 w-40 animate-pulse motion-reduce:animate-none rounded-md bg-muted" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border p-6 space-y-3">
            <div className="h-5 w-32 animate-pulse motion-reduce:animate-none rounded bg-muted" />
            <div className="h-4 w-64 animate-pulse motion-reduce:animate-none rounded bg-muted" />
            <div className="h-10 w-full animate-pulse motion-reduce:animate-none rounded-md bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminLoading() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading admin panel" className="p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-8 w-64 animate-pulse motion-reduce:animate-none rounded-md bg-muted" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse motion-reduce:animate-none rounded-xl bg-muted" />
          ))}
        </div>
        <div className="h-96 animate-pulse motion-reduce:animate-none rounded-xl bg-muted" />
      </div>
    </div>
  );
}

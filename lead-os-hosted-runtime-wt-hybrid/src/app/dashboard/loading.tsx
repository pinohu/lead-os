export default function DashboardLoading() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading dashboard" className="p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 h-8 w-48 animate-pulse rounded-md bg-gray-200" />
        <div className="mb-8 grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg bg-gray-100"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-lg bg-gray-100" />
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );
}

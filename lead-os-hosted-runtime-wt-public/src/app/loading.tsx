export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center" aria-label="Loading content">
      <div className="space-y-6 w-full max-w-2xl px-4">
        <div className="h-8 w-3/4 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
      </div>
    </main>
  );
}

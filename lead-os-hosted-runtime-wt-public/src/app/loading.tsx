export default function Loading() {
  return (
    <div role="status" aria-label="Loading" className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-teal-600" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

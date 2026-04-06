export default function Loading() {
  return (
    <div role="status" aria-label="Loading" className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-600 border-t-cyan-400" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

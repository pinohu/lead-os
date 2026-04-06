export default function Loading() {
  return (
    <main aria-busy="true" role="status" className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-cyan" />
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    </main>
  )
}

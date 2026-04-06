export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mx-auto max-w-md">
        <div className="mb-6 text-6xl font-extrabold text-slate-200">404</div>
        <h1 className="mb-3 text-2xl font-bold">Page not found</h1>
        <p className="mb-8 text-slate-500">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href="/"
            className="rounded-lg bg-cyan px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-dark transition-colors"
          >
            Go home
          </a>
          <a
            href="/services"
            className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Browse services
          </a>
        </div>
      </div>
    </main>
  )
}

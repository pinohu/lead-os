"use client"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main role="alert" className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mx-auto max-w-md">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="mb-3 text-2xl font-bold">Something went wrong</h1>
        <p className="mb-8 text-slate-500">
          We encountered an unexpected error. Please try again or return to the homepage.
        </p>
        {process.env.NODE_ENV === "development" && error.message && (
          <pre className="mb-6 overflow-auto rounded-lg bg-slate-100 p-4 text-left text-xs">
            {error.message}
          </pre>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="rounded-lg bg-cyan px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-dark transition-colors"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Go home
          </a>
        </div>
      </div>
    </main>
  )
}

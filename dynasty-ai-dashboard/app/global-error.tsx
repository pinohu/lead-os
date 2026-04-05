"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-white">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold mb-4">Critical Error</h2>
            <p className="text-gray-400 mb-6">
              {error.message || "A critical error occurred."}
            </p>
            <button
              onClick={reset}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reload
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}

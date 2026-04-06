"use client"

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md" role="alert">
            <h2 className="text-2xl font-bold mb-4">Critical Error</h2>
            <p className="text-gray-300 mb-6">
              A critical error occurred. Please reload the page.
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

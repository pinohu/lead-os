"use client"

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
      <div className="text-center max-w-md" role="alert">
        <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
        <p className="text-gray-300 mb-6">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="bg-dynasty-blue text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}

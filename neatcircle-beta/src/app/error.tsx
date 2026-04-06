"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div className="mx-auto max-w-md">
        <h1 className="mb-4 text-4xl font-bold text-gray-900">Something went wrong</h1>
        <p className="mb-8 text-gray-600">
          We encountered an unexpected error. Please try again or contact support if the problem persists.
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-teal-500 px-6 py-3 font-semibold text-white transition hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

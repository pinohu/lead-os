"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy p-8">
      <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
        <h2 className="mb-4 text-2xl font-bold text-navy">Something went wrong</h2>
        <p className="mb-6 text-gray-600">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-cyan px-6 py-3 font-semibold text-white transition hover:bg-cyan-dark"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

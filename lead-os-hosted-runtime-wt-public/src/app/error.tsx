"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div role="alert" aria-live="assertive" className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-4 text-3xl font-bold">Something went wrong</h1>
      <p className="mb-6 max-w-md text-gray-600">
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-teal-600 px-6 py-3 font-semibold text-white hover:bg-teal-500"
      >
        Try again
      </button>
    </div>
  );
}

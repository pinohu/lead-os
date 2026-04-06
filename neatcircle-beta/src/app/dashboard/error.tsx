"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0f0f23] px-4 text-center text-white">
      <h1 className="mb-4 text-2xl font-bold">Dashboard Error</h1>
      <p className="mb-6 text-gray-400">Failed to load dashboard data. This may be a temporary issue.</p>
      <button
        onClick={reset}
        className="rounded-lg bg-teal-500 px-6 py-3 font-semibold text-white transition hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
      >
        Retry
      </button>
    </div>
  );
}

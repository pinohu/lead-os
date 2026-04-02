"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="mx-auto mt-16 max-w-lg p-8 text-center"
    >
      <h2 className="mb-2 text-xl font-semibold">
        Dashboard Error
      </h2>
      <p className="mb-4 text-muted-foreground">
        Something went wrong loading this dashboard section.
      </p>
      {process.env.NODE_ENV === "development" && error.message && (
        <pre className="mb-4 overflow-auto rounded-md bg-red-50 p-3 text-left text-xs text-red-800">
          {error.message}
        </pre>
      )}
      <div className="flex justify-center gap-3">
        <button
          onClick={reset}
          className="cursor-pointer rounded-md bg-primary px-4 py-2 text-primary-foreground"
        >
          Retry
        </button>
        <a
          href="/dashboard"
          className="rounded-md bg-muted px-4 py-2 text-foreground no-underline"
        >
          Return to Dashboard
        </a>
      </div>
    </div>
  );
}

"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      id="main-content"
      role="alert"
      aria-live="assertive"
      className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center"
    >
      <h1 className="text-2xl font-bold mb-3">
        Something went wrong
      </h1>
      <p className="text-muted-foreground mb-6 max-w-lg">
        An unexpected error occurred. Please try again or return to the home page.
      </p>
      {process.env.NODE_ENV === "development" && error.message && (
        <pre className="bg-red-50 text-red-800 p-4 rounded-lg text-xs max-w-2xl overflow-auto mb-6">
          {error.message}
        </pre>
      )}
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer font-medium"
        >
          Try again
        </button>
        <a
          href="/"
          className="px-6 py-2 bg-muted text-foreground rounded-md no-underline font-medium"
        >
          Go home
        </a>
      </div>
    </main>
  );
}

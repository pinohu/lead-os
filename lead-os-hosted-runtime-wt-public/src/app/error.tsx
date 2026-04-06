"use client";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ padding: "2rem", textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Something went wrong</h1>
      <p style={{ color: "#666", marginBottom: "1.5rem" }}>
        {error.digest ? `Error ID: ${error.digest}` : "An unexpected error occurred."}
      </p>
      <button
        onClick={reset}
        style={{
          padding: "0.5rem 1.25rem",
          borderRadius: "6px",
          border: "1px solid #ccc",
          background: "#111",
          color: "#fff",
          cursor: "pointer",
          fontSize: "0.875rem",
        }}
      >
        Try again
      </button>
    </div>
  );
}

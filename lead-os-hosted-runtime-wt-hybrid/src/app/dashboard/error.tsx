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
      style={{
        padding: "2rem",
        maxWidth: "32rem",
        margin: "4rem auto",
        textAlign: "center",
      }}
    >
      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>
        Dashboard Error
      </h2>
      <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
        Something went wrong loading this dashboard section.
      </p>
      {process.env.NODE_ENV === "development" && error.message && (
        <pre
          style={{
            background: "#fef2f2",
            color: "#991b1b",
            padding: "0.75rem",
            borderRadius: "0.375rem",
            fontSize: "0.75rem",
            overflow: "auto",
            marginBottom: "1rem",
            textAlign: "left",
          }}
        >
          {error.message}
        </pre>
      )}
      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
        <button
          onClick={reset}
          style={{
            padding: "0.5rem 1rem",
            background: "#4f46e5",
            color: "#fff",
            border: "none",
            borderRadius: "0.375rem",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
        <a
          href="/dashboard"
          style={{
            padding: "0.5rem 1rem",
            background: "#f3f4f6",
            color: "#374151",
            borderRadius: "0.375rem",
            textDecoration: "none",
          }}
        >
          Return to Dashboard
        </a>
      </div>
    </div>
  );
}

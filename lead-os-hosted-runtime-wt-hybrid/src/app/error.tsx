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
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.75rem" }}>
        Something went wrong
      </h1>
      <p style={{ color: "#6b7280", marginBottom: "1.5rem", maxWidth: "32rem" }}>
        An unexpected error occurred. Please try again or return to the home page.
      </p>
      {process.env.NODE_ENV === "development" && error.message && (
        <pre
          style={{
            background: "#fef2f2",
            color: "#991b1b",
            padding: "1rem",
            borderRadius: "0.5rem",
            fontSize: "0.75rem",
            maxWidth: "40rem",
            overflow: "auto",
            marginBottom: "1.5rem",
          }}
        >
          {error.message}
        </pre>
      )}
      <div style={{ display: "flex", gap: "1rem" }}>
        <button
          onClick={reset}
          style={{
            padding: "0.5rem 1.5rem",
            background: "#4f46e5",
            color: "#fff",
            border: "none",
            borderRadius: "0.375rem",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          Try again
        </button>
        <a
          href="/"
          style={{
            padding: "0.5rem 1.5rem",
            background: "#f3f4f6",
            color: "#374151",
            borderRadius: "0.375rem",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          Go home
        </a>
      </div>
    </main>
  );
}

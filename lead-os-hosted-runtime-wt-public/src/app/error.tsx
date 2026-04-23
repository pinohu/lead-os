"use client"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main role="alert" style={{ display: "flex", minHeight: "60vh", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.75rem" }}>Something went wrong</h1>
      <p className="muted" style={{ marginBottom: "2rem", maxWidth: "28rem" }}>
        We encountered an unexpected error. Please try again or return to the homepage.
      </p>
      {process.env.NODE_ENV === "development" && error.message && (
        <pre style={{ marginBottom: "1.5rem", overflow: "auto", borderRadius: "8px", background: "var(--secondary-soft)", padding: "1rem", textAlign: "left", fontSize: "0.75rem", maxWidth: "32rem", width: "100%" }}>
          {error.message}
        </pre>
      )}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
        <button onClick={reset} className="primary">Try again</button>
        <a href="/" className="secondary">Go home</a>
      </div>
    </main>
  )
}

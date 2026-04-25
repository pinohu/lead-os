"use client"

// ── Root-level error boundary ────────────────────────────────────────
// This handler catches errors thrown in the root layout itself (anything
// that runs BEFORE a nested error.tsx can take over — e.g. ThemeProvider,
// the navigation menu, or any top-level server render failure). It must
// render its own <html> + <body> because the layout has already failed.
//
// Plain inline styles only: if globals.css failed to load, we still want
// a readable page. Zero app imports: if any provider or util is what
// crashed, importing it here would crash again.

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          background: "#f9fafb",
          color: "#111827",
        }}
      >
        <main
          style={{
            maxWidth: 480,
            width: "100%",
            padding: "32px",
            textAlign: "center",
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            margin: "0 16px",
          }}
        >
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 12px" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#6b7280", margin: "0 0 24px", lineHeight: 1.5 }}>
            We hit an unexpected error loading this page. Try refreshing, or
            head back home and try again in a moment.
          </p>
          {error?.digest && (
            <p
              style={{
                fontSize: 12,
                color: "#9ca3af",
                margin: "0 0 20px",
                fontFamily: "ui-monospace, SFMono-Regular, monospace",
              }}
            >
              Reference: {error.digest}
            </p>
          )}
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => reset()}
              style={{
                padding: "10px 20px",
                background: "#111827",
                color: "#ffffff",
                border: "none",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                padding: "10px 20px",
                background: "#ffffff",
                color: "#111827",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Go home
            </a>
          </div>
        </main>
      </body>
    </html>
  )
}

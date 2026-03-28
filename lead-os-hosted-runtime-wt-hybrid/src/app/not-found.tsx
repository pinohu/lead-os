import Link from "next/link";

export default function NotFound() {
  return (
    <main aria-labelledby="not-found-heading">
      <div
        style={{
          maxWidth: "560px",
          margin: "0 auto",
          display: "grid",
          gap: "var(--space-5)",
          textAlign: "center",
        }}
      >
        <div className="hero" style={{ display: "grid", gap: "var(--space-4)" }}>
          <span
            aria-hidden="true"
            style={{
              display: "block",
              fontSize: "4rem",
              fontFamily: '"Palatino Linotype", "Book Antiqua", Georgia, serif',
              fontWeight: 700,
              color: "var(--accent)",
              lineHeight: 1,
              letterSpacing: "-0.04em",
            }}
          >
            404
          </span>
          <h1
            id="not-found-heading"
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)" }}
          >
            Page not found
          </h1>
          <p className="muted lede">
            The page you are looking for does not exist, was moved, or is no
            longer available.
          </p>
          <div className="cta-row" style={{ justifyContent: "center" }}>
            <Link href="/" className="primary" aria-label="Return to the home page">
              Back to home
            </Link>
            <Link href="/setup" className="secondary">
              Setup
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

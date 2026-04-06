export default function NotFound() {
  return (
    <main style={{ display: "flex", minHeight: "60vh", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center" }}>
      <div style={{ fontSize: "4rem", fontWeight: 800, color: "var(--text-soft)", opacity: 0.3, marginBottom: "1rem" }}>404</div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.75rem" }}>Page not found</h1>
      <p className="muted" style={{ marginBottom: "2rem" }}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <a href="/" className="primary">Go home</a>
    </main>
  )
}

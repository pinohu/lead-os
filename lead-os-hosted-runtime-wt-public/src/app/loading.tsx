export default function Loading() {
  return (
    <main aria-busy="true" role="status" style={{ display: "flex", minHeight: "60vh", alignItems: "center", justifyContent: "center" }}>
      <p className="muted">Loading…</p>
    </main>
  )
}

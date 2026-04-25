// src/app/page.tsx
export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui", padding: "2rem" }}>
      <h1>Lead OS Runtime</h1>
      <p>API is running. Check <a href="/api/health">/api/health</a> for status.</p>
    </main>
  );
}

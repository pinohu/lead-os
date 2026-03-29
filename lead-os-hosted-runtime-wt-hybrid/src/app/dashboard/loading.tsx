export default function DashboardLoading() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading dashboard" style={{ padding: "2rem" }}>
      <div style={{ maxWidth: "80rem", margin: "0 auto" }}>
        <div
          style={{
            height: "2rem",
            width: "12rem",
            background: "#e5e7eb",
            borderRadius: "0.375rem",
            marginBottom: "1.5rem",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(16rem, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                height: "6rem",
                background: "#f3f4f6",
                borderRadius: "0.5rem",
                animation: "pulse 1.5s ease-in-out infinite",
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
        <div
          style={{
            height: "20rem",
            background: "#f3f4f6",
            borderRadius: "0.5rem",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );
}

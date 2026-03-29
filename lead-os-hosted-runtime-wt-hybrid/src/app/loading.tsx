export default function GlobalLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        gap: "1rem",
      }}
    >
      <div
        style={{
          width: "2.5rem",
          height: "2.5rem",
          border: "3px solid #e5e7eb",
          borderTopColor: "#4f46e5",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>Loading&hellip;</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

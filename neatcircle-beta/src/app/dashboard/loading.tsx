export default function DashboardLoading() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[#0f0f23]"
      role="status"
      aria-label="Loading dashboard"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-700 border-t-teal-500" />
        <p className="text-sm text-gray-400">Loading Lead OS metrics...</p>
      </div>
    </div>
  );
}

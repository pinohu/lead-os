export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Loading page content">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-teal-500" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
}

export default function GlobalLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading"
      className="flex flex-col items-center justify-center min-h-[60vh] gap-4"
    >
      <div className="w-10 h-10 border-[3px] border-border border-t-primary rounded-full animate-spin" />
      <p className="text-muted-foreground text-sm">Loading&hellip;</p>
    </div>
  );
}

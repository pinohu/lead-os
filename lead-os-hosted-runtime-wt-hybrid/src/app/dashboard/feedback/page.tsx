import { Suspense } from "react";
import FeedbackPageClient from "./client";

export default function FeedbackPage() {
  return (
    <Suspense fallback={
      <div role="status" aria-label="Loading" className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <span className="sr-only">Loading…</span>
      </div>
    }>
      <FeedbackPageClient />
    </Suspense>
  );
}

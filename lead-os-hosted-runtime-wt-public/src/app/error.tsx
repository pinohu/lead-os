"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-deep)] px-6 py-12 text-[var(--text-inverse)]">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--text-inverse)]">
          Something went wrong
        </h1>
        <p className="mt-3 text-sm text-[color:rgba(247,243,234,0.78)]">
          We couldn&apos;t load this page. You can try again.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-[#fff9f2] shadow-[0_12px_24px_rgba(196,99,45,0.22)] transition-[transform,background-color] duration-150 ease-out hover:bg-[var(--accent-strong)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[var(--focus)] focus-visible:outline-offset-[3px] active:translate-y-px"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-navy px-6 py-12 text-white">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-white">
          Something went wrong
        </h1>
        <p className="mt-3 text-sm text-cyan-light/85">
          We couldn&apos;t load this page. You can try again.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-8 inline-flex min-h-11 items-center justify-center rounded-lg bg-cyan px-5 py-2.5 text-sm font-semibold text-navy-dark shadow-sm transition-colors hover:bg-cyan-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

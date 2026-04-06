"use client";

import { useState, useEffect } from "react";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!document.cookie.includes("cookie_consent=")) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  function accept() {
    document.cookie = "cookie_consent=accepted; path=/; max-age=31536000; SameSite=Lax";
    setVisible(false);
  }

  function decline() {
    document.cookie = "cookie_consent=declined; path=/; max-age=31536000; SameSite=Lax";
    setVisible(false);
  }

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-700 bg-slate-900 p-4 shadow-lg"
    >
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 sm:flex-row">
        <p className="flex-1 text-sm text-slate-300">
          We use cookies to improve your experience and analyze site usage.
        </p>
        <div className="flex gap-3">
          <button
            onClick={decline}
            className="rounded-md border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-400"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

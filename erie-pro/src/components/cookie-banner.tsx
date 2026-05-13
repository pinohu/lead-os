"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`;
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = getCookie("cookie_consent");
    if (!consent) {
      setVisible(true);
    }
  }, []);

  function handleAccept() {
    setCookie("cookie_consent", "accepted", 365);
    setVisible(false);
  }

  function handleDecline() {
    setCookie("cookie_consent", "declined", 365);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-4 left-3 right-3 z-[60] mx-auto max-w-2xl rounded-lg border bg-background/95 p-3 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-background/90 sm:left-4 sm:right-4 sm:p-4"
    >
      <div className="mx-auto flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-xs leading-5 text-muted-foreground text-center sm:text-left sm:text-sm">
          We use cookies to improve Erie.Pro and analyze traffic. See{" "}
          <a href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </a>{" "}
          for details.
        </p>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" className="h-11" onClick={handleDecline}>
            Decline
          </Button>
          <Button className="h-11" onClick={handleAccept}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}

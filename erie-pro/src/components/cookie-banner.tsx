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
      className="fixed bottom-2 left-2 right-2 z-[60] mx-auto max-w-xl rounded-md border bg-background/95 p-2 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-background/90 sm:bottom-4 sm:left-4 sm:right-4 sm:max-w-2xl sm:rounded-lg sm:p-4"
    >
      <div className="mx-auto grid gap-2 sm:flex sm:items-center sm:justify-between sm:gap-3">
        <p className="text-left text-xs leading-5 text-muted-foreground sm:text-sm">
          <span className="sm:hidden">Cookies help improve Erie.Pro. </span>
          <span className="hidden sm:inline">We use cookies to improve Erie.Pro and analyze traffic. </span>
          See{" "}
          <a href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </a>{" "}
          for details.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
          <Button variant="outline" className="h-9 sm:h-11" onClick={handleDecline}>
            Decline
          </Button>
          <Button className="h-9 sm:h-11" onClick={handleAccept}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}

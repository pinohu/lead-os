"use client";

// ── Mobile Sticky Intake CTA ──────────────────────────────────────────
// Pinned to the bottom of the viewport on mobile (hidden on md+) once the
// visitor scrolls past the hero. Always-reachable intake entry point.
// Hides on the success state to avoid double-CTA confusion.

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

interface Props {
  nicheLabel: string;
  /** Anchor href on the page to jump to the intake form */
  href?: string;
}

export default function NicheStickyCTA({
  nicheLabel,
  href = "#quote",
}: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show after the visitor scrolls past ~400px (roughly past the hero).
    const onScroll = () => {
      const past = window.scrollY > 400;
      // Hide once they're near the intake form so it doesn't double up
      const nearForm =
        document
          .getElementById("quote")
          ?.getBoundingClientRect()
          .top !== undefined &&
        document.getElementById("quote")!.getBoundingClientRect().top <
          window.innerHeight + 80;
      setVisible(past && !nearForm);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 md:hidden transition-transform duration-200 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      // Audit M7: respect iOS home-indicator safe area so the CTA isn't
      // partially obscured on iPhones.
      style={{ paddingBottom: "max(0px, env(safe-area-inset-bottom))" }}
    >
      <div className="border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        <a
          href={href}
          className="flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-[0.98]"
          aria-label={`Start a 90-second ${nicheLabel.toLowerCase()} intake`}
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Start your free {nicheLabel.toLowerCase()} quote
        </a>
        <p className="mt-1 text-center text-[10px] text-muted-foreground">
          90 seconds · no obligation · routed to one local pro
        </p>
      </div>
    </div>
  );
}
